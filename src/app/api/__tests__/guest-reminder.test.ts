import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * The guest deadline reminder routes (23 Oct 2026): what the public form may send, that nothing from
 * the caller but the address, the kind and the day is stored or emailed, that it is rate limited and
 * fails closed, and how each outcome is told back.
 */
const requestMock = vi.fn();
const confirmMock = vi.fn();
const stopMock = vi.fn();
const rateMock = vi.fn();

vi.mock("@/lib/guestReminders", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/guestReminders")>()),
  requestGuestReminder: (...a: unknown[]) => requestMock(...a),
  confirmGuestReminder: (...a: unknown[]) => confirmMock(...a),
  stopGuestReminders: (...a: unknown[]) => stopMock(...a),
}));
vi.mock("@/lib/ratelimit", () => ({
  rateLimitGuestReminder: (...a: unknown[]) => rateMock(...a),
}));

import { POST as request } from "../guest-reminder/route";
import { POST as confirm } from "../guest-reminder/confirm/route";
import { POST as stop } from "../guest-reminder/stop/route";

const post = (url: string, body: unknown) =>
  new Request(`http://localhost:3000${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.9" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as NextRequest;

const good = { email: "seller@example.com", kind: "POLICY", dueOn: "2026-11-10", consent: true };
const TOKEN = "ab".repeat(24);

beforeEach(() => {
  requestMock.mockReset().mockResolvedValue({ status: "pending" });
  confirmMock.mockReset().mockResolvedValue("confirmed");
  stopMock.mockReset().mockResolvedValue(true);
  rateMock.mockReset().mockResolvedValue(true);
});

describe("POST /api/guest-reminder", () => {
  it("passes the address, kind and day on, with a label of ours, and nothing else from the caller", async () => {
    const res = await request(
      post("/api/guest-reminder", { ...good, label: "Buy pills at example.com", note: "x" }),
    );
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "pending" });
    expect(requestMock).toHaveBeenCalledWith({
      email: "seller@example.com",
      kind: "POLICY",
      dueOn: "2026-11-10",
      label: "The date your notice states",
    });
  });

  it("refuses without the consent, a bad address, an unknown kind or a day that is not a day", async () => {
    for (const bad of [
      { ...good, consent: false },
      { ...good, consent: undefined },
      { ...good, email: "not-an-address" },
      { ...good, kind: "NOT_A_KIND" },
      { ...good, dueOn: "2026-02-30" },
      { ...good, dueOn: "next week" },
    ])
      expect((await request(post("/api/guest-reminder", bad))).status, JSON.stringify(bad)).toBe(
        400,
      );
    expect((await request(post("/api/guest-reminder", "{not json"))).status).toBe(400);
    expect(requestMock).not.toHaveBeenCalled();
  });

  it("is refused, without sending anything, when the address has asked too often (it fails closed)", async () => {
    rateMock.mockResolvedValue(false);
    const res = await request(post("/api/guest-reminder", good));
    expect(res.status).toBe(429);
    expect(requestMock).not.toHaveBeenCalled();
    expect(rateMock).toHaveBeenCalledWith("203.0.113.9");
  });

  it.each([
    [{ status: "already_confirmed" }, 200, "already"],
    [{ status: "too_late" }, 422, undefined],
    [{ status: "limit" }, 409, undefined],
  ])("tells the visitor %j honestly", async (result, status, word) => {
    requestMock.mockResolvedValue(result);
    const res = await request(post("/api/guest-reminder", good));
    expect(res.status).toBe(status);
    if (word) expect((await res.json()).status).toBe(word);
  });

  it("says reminders are unavailable when the store or the email fails, and not that it worked", async () => {
    requestMock.mockRejectedValue(new Error("down"));
    const res = await request(post("/api/guest-reminder", good));
    expect(res.status).toBe(503);
    expect((await res.json()).error).toMatch(/not available/);
  });
});

describe("the confirm and stop routes", () => {
  it("confirm answers with the outcome and refuses a malformed token without looking it up", async () => {
    expect(
      await (await confirm(post("/api/guest-reminder/confirm", { token: TOKEN }))).json(),
    ).toEqual({
      status: "confirmed",
    });
    expect((await confirm(post("/api/guest-reminder/confirm", { token: "short" }))).status).toBe(
      400,
    );
    expect((await confirm(post("/api/guest-reminder/confirm", {}))).status).toBe(400);
    expect(confirmMock).toHaveBeenCalledTimes(1);
  });

  it("stop answers stopped, or unknown for a token that is not ours", async () => {
    expect(await (await stop(post("/api/guest-reminder/stop", { token: TOKEN }))).json()).toEqual({
      status: "stopped",
    });
    stopMock.mockResolvedValue(false);
    expect(await (await stop(post("/api/guest-reminder/stop", { token: TOKEN }))).json()).toEqual({
      status: "unknown",
    });
  });

  it("both say not available, not done, when the store fails", async () => {
    confirmMock.mockRejectedValue(new Error("down"));
    stopMock.mockRejectedValue(new Error("down"));
    expect((await confirm(post("/api/guest-reminder/confirm", { token: TOKEN }))).status).toBe(503);
    expect((await stop(post("/api/guest-reminder/stop", { token: TOKEN }))).status).toBe(503);
  });
});
