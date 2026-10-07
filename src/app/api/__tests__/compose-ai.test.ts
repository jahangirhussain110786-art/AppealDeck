import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const draftResponseMock = vi.fn();
const configured = vi.hoisted(() => ({ on: true }));

vi.mock("@/lib/auth", () => ({
  getApiUser: () => Promise.resolve({ id: "u1", email: "seller@example.com" }),
  unauthorizedJsonResponse: () => new Response("no", { status: 401 }),
}));
vi.mock("@/lib/license", () => ({
  claimCasePass: () => Promise.resolve(true),
  isLicenseActive: () => Promise.resolve(true),
}));
vi.mock("@/lib/ratelimit", () => ({
  rateLimitCompose: () =>
    Promise.resolve({ success: true, limit: 30, remaining: 30, reset: Date.now() + 60_000 }),
  tooManyRequestsResponse: () => new Response("rate limited", { status: 429 }),
}));
vi.mock("@/lib/supabase/server", () => ({ supabaseAdmin: null }));
vi.mock("@/lib/llm/gemini", () => ({ isGeminiConfigured: () => configured.on }));
vi.mock("@/lib/llm/draftResponse", () => ({
  draftResponse: (...args: unknown[]) => draftResponseMock(...args),
}));

import { POST } from "../compose/route";
import { newWorkspace, proposedRequirements } from "@/core/workspace";

const NOTICE =
  "We removed the listing because customers complained about item condition (Used Sold as New). Submit a plan of action. You may appeal within 30 days.";
const ANSWERS = {
  explanation:
    "We listed returned items as new. Customer returns went back into our new-condition stock without anyone opening the packaging, so four customers received opened items in September.",
  correctiveActions:
    "On 30 September we removed all 12 affected listings and relisted the returned units as Used - Like New.",
  preventiveMeasures:
    "Our warehouse lead opens and inspects every return before it can go back on sale and records the result in a returns log.",
};

function body(over: Record<string, unknown> = {}) {
  const w0 = {
    ...newWorkspace(),
    notice: NOTICE,
    confirmed: true,
    protocol: "operational" as const,
    requirementsConfirmed: true,
    correctiveActionsAttested: { at: "2026-10-07T00:00:00.000Z" },
    ...ANSWERS,
    ...over,
  };
  const workspace = { ...w0, requirements: proposedRequirements(w0, "POLICY") };
  return { caseData: { id: "case-1", kind: "POLICY", workspace }, attemptNumber: 1 };
}
const post = (b: unknown) =>
  POST(
    new Request("http://x/api/compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    }) as unknown as NextRequest,
  );

const aiSections = {
  rootCause: "AI-WRITTEN root cause from the seller's facts.",
  correctiveActions: "AI-WRITTEN corrective actions from the seller's facts.",
  preventiveMeasures: "AI-WRITTEN preventive measures from the seller's facts.",
};

beforeEach(() => {
  draftResponseMock.mockReset();
  configured.on = true;
});

describe("/api/compose with AI drafting", () => {
  it("uses the AI's three sections, marks them, keeps the seller's own wording alongside", async () => {
    draftResponseMock.mockResolvedValue({ ok: true, sections: aiSections, retried: false });
    const res = await post(body());
    const json = await res.json();
    expect(json.ai).toEqual({ status: "used", retried: false });
    const bodyOf = (d: { sections: Array<{ heading: string; body: string }> }, h: string) =>
      d.sections.find((s) => s.heading === h)?.body;
    expect(bodyOf(json.draft, "Root Cause")).toBe(aiSections.rootCause);
    expect(bodyOf(json.draft, "Corrective Actions")).toBe(aiSections.correctiveActions);
    expect(
      json.draft.sections.find((s: { heading: string }) => s.heading === "Root Cause").source,
    ).toBe("ai");
    expect(json.draft.metadata.aiDrafted).toBe(true);
    expect(json.rendered).toContain("AI-WRITTEN root cause");
    // The seller's own text is what the other view is made from.
    expect(bodyOf(json.ownWording.draft, "Root Cause")).toContain(
      "We listed returned items as new",
    );
    expect(json.ownWording.rendered).not.toContain("AI-WRITTEN");
  });

  it("never lets the AI touch the records section", async () => {
    draftResponseMock.mockResolvedValue({ ok: true, sections: aiSections, retried: false });
    const json = await (await post(body())).json();
    const own = json.ownWording.draft.sections;
    const used = json.draft.sections;
    const record = (s: Array<{ heading: string; body: string }>) =>
      s.find((x) => x.heading === "Supporting records")?.body;
    expect(record(used)).toBe(record(own));
  });

  it("falls back to the seller's wording, and says why, when the draft fails the fact check", async () => {
    draftResponseMock.mockResolvedValue({
      ok: false,
      reason: "fact_check_failed",
      detail: "added details that were not provided: 5 october",
    });
    const json = await (await post(body())).json();
    expect(json.ai).toMatchObject({ status: "fallback", reason: "fact_check_failed" });
    expect(json.ownWording).toBeUndefined();
    expect(json.rendered).toContain("We listed returned items as new");
    expect(json.draft.metadata.aiDrafted).toBe(false);
  });

  it("does not call the model, and falls back, when AI is not configured", async () => {
    configured.on = false;
    const json = await (await post(body())).json();
    expect(draftResponseMock).not.toHaveBeenCalled();
    expect(json.ai).toEqual({ status: "fallback", reason: "not_configured" });
    expect(json.rendered).toContain("We listed returned items as new");
  });

  it("does not call the model when an answer is still missing", async () => {
    const json = await (await post(body({ preventiveMeasures: "" }))).json();
    expect(draftResponseMock).not.toHaveBeenCalled();
    expect(json.ai).toEqual({ status: "not_applicable" });
  });

  it("does not call the model for a document request", async () => {
    const json = await (
      await post(
        body({
          notice: "Please provide the supplier invoice for the affected product.",
          protocol: "documents",
        }),
      )
    ).json();
    expect(draftResponseMock).not.toHaveBeenCalled();
    expect(json.ai).toEqual({ status: "not_applicable" });
  });

  it("gives the model only the notice, the answers, record labels and reasons", async () => {
    draftResponseMock.mockResolvedValue({ ok: true, sections: aiSections, retried: false });
    await post(body());
    const request = draftResponseMock.mock.calls[0]![0];
    expect(Object.keys(request).sort()).toEqual(
      ["answers", "attempt", "declined", "kind", "notice", "records", "replyReasons"].sort(),
    );
    expect(request.notice).toContain("Used Sold as New");
    expect(request.answers.rootCause).toContain("We listed returned items as new");
  });
});
