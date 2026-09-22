import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const upsertMock = vi.fn();
const deleteMock = vi.fn();
const rateLimitMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimitOutcome: (...args: unknown[]) => rateLimitMock(...args),
  tooManyRequestsResponse: () =>
    new Response(JSON.stringify({ error: "Slow down" }), { status: 429 }),
}));

vi.mock("@/lib/caseReminders", () => ({
  upsertCaseReminder: (...args: unknown[]) => upsertMock(...args),
  deleteCaseReminder: (...args: unknown[]) => deleteMock(...args),
  getCaseReminder: vi.fn(),
}));

import { POST, DELETE } from "../reminders/route";

function makeReq(body: unknown, method = "POST"): NextRequest {
  return new Request("http://localhost:3000/api/reminders", {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  getApiUserMock.mockReset();
  upsertMock.mockReset();
  deleteMock.mockReset();
  rateLimitMock.mockReset();
  rateLimitMock.mockResolvedValue({ success: true });
  getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
});

describe("/api/reminders", () => {
  it("returns 401 and writes nothing when unauthenticated", async () => {
    getApiUserMock.mockResolvedValue(null);
    const res = await POST(
      makeReq({ caseRef: "c1", kind: "POLICY", dueAt: "2026-10-01T00:00:00Z" }),
    );
    expect(res.status).toBe(401);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("rate-limits before touching the database", async () => {
    rateLimitMock.mockResolvedValue({ success: false });
    const res = await POST(
      makeReq({ caseRef: "c1", kind: "POLICY", dueAt: "2026-10-01T00:00:00Z" }),
    );
    expect(res.status).toBe(429);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("stores a reminder scoped to the authenticated user, never a user id from the body", async () => {
    upsertMock.mockResolvedValue(undefined);
    const res = await POST(
      makeReq({
        caseRef: "c1",
        kind: "POLICY",
        dueAt: "2026-10-01T00:00:00Z",
        // A caller trying to write a row for somebody else.
        userId: "someone-else",
      }),
    );
    expect(res.status).toBe(200);
    expect(upsertMock).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "u1", caseRef: "c1", kind: "POLICY" }),
    );
  });

  it("accepts the taxonomy-v2 kinds", async () => {
    upsertMock.mockResolvedValue(undefined);
    const res = await POST(
      makeReq({ caseRef: "c1", kind: "VERIFICATION", dueAt: "2026-10-01T00:00:00Z" }),
    );
    expect(res.status).toBe(200);
  });

  it("rejects an unknown kind", async () => {
    const res = await POST(
      makeReq({ caseRef: "c1", kind: "NOT_A_KIND", dueAt: "2026-10-01T00:00:00Z" }),
    );
    expect(res.status).toBe(400);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("rejects an unparseable date rather than coercing it", async () => {
    const res = await POST(makeReq({ caseRef: "c1", kind: "POLICY", dueAt: "next tuesday" }));
    expect(res.status).toBe(400);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("rejects a case reference that is not a plain vault id", async () => {
    const res = await POST(
      makeReq({ caseRef: "../../etc/passwd", kind: "POLICY", dueAt: "2026-10-01T00:00:00Z" }),
    );
    expect(res.status).toBe(400);
    expect(upsertMock).not.toHaveBeenCalled();
  });

  it("reports unavailability without claiming the case was harmed", async () => {
    upsertMock.mockRejectedValue(new Error("db down"));
    const res = await POST(
      makeReq({ caseRef: "c1", kind: "POLICY", dueAt: "2026-10-01T00:00:00Z" }),
    );
    expect(res.status).toBe(503);
  });

  it("deletes only the authenticated user's row", async () => {
    deleteMock.mockResolvedValue(undefined);
    const res = await DELETE(makeReq({ caseRef: "c1" }, "DELETE"));
    expect(res.status).toBe(200);
    expect(deleteMock).toHaveBeenCalledWith("u1", "c1");
  });

  it("requires auth to delete", async () => {
    getApiUserMock.mockResolvedValue(null);
    const res = await DELETE(makeReq({ caseRef: "c1" }, "DELETE"));
    expect(res.status).toBe(401);
    expect(deleteMock).not.toHaveBeenCalled();
  });
});
