import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const isLicenseActiveMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));
vi.mock("@/lib/license", () => ({
  claimCasePass: () => Promise.resolve(true),
  isLicenseActive: (id: string) => isLicenseActiveMock(id),
}));
vi.mock("@/lib/ratelimit", () => ({
  rateLimitCompose: () =>
    Promise.resolve({ success: true, limit: 30, remaining: 30, reset: Date.now() + 60_000 }),
  tooManyRequestsResponse: () => new Response("rate limited", { status: 429 }),
}));
vi.mock("@/lib/supabase/server", () => ({ supabaseAdmin: null }));
vi.mock("@/core", () => ({
  isSeverityGated: () => false,
  composePoa: () => ({
    docType: "poa",
    mode: { mode: "full-draft", reason: "" },
    sections: [],
    metadata: { kind: "POLICY", attemptNumber: 1, evidenceComplete: true },
  }),
  critiquePoa: () => ({ findings: [], passed: true }),
  renderPoaText: () => "draft",
}));
vi.mock("@/lib/devices", () => ({
  recordActivation: () => Promise.resolve({ status: "ok" }),
  deviceErrorResponse: () => new Response("device", { status: 403 }),
  deriveFingerprintFromRequest: () => "fp",
}));

import { POST } from "../compose/route";
import {
  applyWorkspaceReply,
  composePayloadWorkspace,
  latchD6,
  newWorkspace,
  type Workspace,
} from "@/core/workspace";

function req(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/compose", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  getApiUserMock.mockReset();
  isLicenseActiveMock.mockReset();
  getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
  isLicenseActiveMock.mockResolvedValue(true);
});

const FORGED =
  "Your selling account has been deactivated because we found you submitted forged invoices. Please submit a plan of action describing the root cause, corrective actions and preventive measures.";

const operational = (notice: string): Workspace => ({
  ...newWorkspace(),
  notice,
  protocol: "operational",
  confirmed: true,
  requirementsConfirmed: true,
  explanation: "The accounts were linked because my brother used our shared address.",
});

describe("3. /api/compose refuses a gated case whatever the client sends", () => {
  it("refuses a latched case even though the posted notice is clean and the flag is false", async () => {
    const before = operational(FORGED);
    const latched = latchD6(before, {
      ...before,
      notice:
        "Your account is suspended. Please submit a plan of action describing the root cause.",
      professionalReviewRequired: false,
    });
    const res = await POST(
      req({ caseData: { id: "c", kind: "UNKNOWN", workspace: composePayloadWorkspace(latched) } }),
    );
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("professional_review");
    expect(isLicenseActiveMock).not.toHaveBeenCalled();
  });

  it("refuses an unapplied reply that carries an allegation, with no latch posted", async () => {
    const w = {
      ...operational("Please submit a plan of action describing the root cause."),
      replies: [
        {
          id: "r1",
          at: "2026-10-01T00:00:00.000Z",
          text: "The documents you provided were falsified.",
          applied: false,
        },
      ],
    };
    const res = await POST(req({ caseData: { id: "c", kind: "UNKNOWN", workspace: w } }));
    expect(res.status).toBe(422);
    expect((await res.json()).code).toBe("professional_review");
  });

  it("the old client payload (no previous requests, no latch) is what the bypass used", async () => {
    // A direct call with the allegation deleted and nothing else is an ordinary case: the latch is
    // the only thing that holds it, and the client now sends it.
    const clean = operational(
      "Your account is suspended. Please submit a plan of action describing the root cause.",
    );
    const res = await POST(req({ caseData: { id: "c", kind: "UNKNOWN", workspace: clean } }));
    expect(res.status).toBe(200);
  });
});

describe("4. the plan-faulted override composes on the server", () => {
  it("a Plan of Action that stays one after a reply is accepted from the exact posted object", async () => {
    const w = {
      ...operational(
        "Please submit a Plan of Action explaining the root cause, the corrective actions and the preventive measures for your account.",
      ),
      correctiveActions: "We removed the listing on 2 September and retrained the staff.",
      preventiveMeasures: "Every listing is checked weekly by the owner against the catalogue.",
      replies: [
        {
          id: "r1",
          at: "2026-10-01T00:00:00.000Z",
          text: "Your Plan of Action does not identify the root cause. Please also provide the supplier invoice for the affected product.",
          applied: false,
        },
      ],
    };
    const next = {
      ...applyWorkspaceReply(w, "r1"),
      protocol: "operational" as const,
      confirmed: true,
    };
    const res = await POST(
      req({ caseData: { id: "c", kind: "UNKNOWN", workspace: composePayloadWorkspace(next) } }),
    );
    expect(res.status).toBe(200);
  });
});
