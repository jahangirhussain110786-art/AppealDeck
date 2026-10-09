import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

/**
 * 9 Oct 2026: the AI also writes a document-request explanation and questionnaire answers, behind
 * the same gates as a Plan of Action. The route is exercised with the drafter mocked: what matters
 * here is which protocols reach it, what it is shown, and how its text lands in the response.
 */
const draftOtherMock = vi.fn();
const configured = vi.hoisted(() => ({ on: true }));

vi.mock("@/lib/auth", () => ({
  getApiUser: () => Promise.resolve({ id: "u1", email: "seller@example.com" }),
  unauthorizedJsonResponse: () => new Response("no", { status: 401 }),
}));
vi.mock("@/lib/license", () => ({
  claimCasePass: () => Promise.resolve(true),
  isLicenseActive: () => Promise.resolve(true),
}));
vi.mock("@/lib/draftCache", () => ({
  draftCacheKey: () => "k",
  getCachedDraft: () => Promise.resolve(null),
  setCachedDraft: () => Promise.resolve(),
  otherDraftCacheKey: () => "k2",
  getCachedOtherDraft: () => Promise.resolve(null),
  setCachedOtherDraft: () => Promise.resolve(),
}));
vi.mock("@/lib/ratelimit", () => ({
  rateLimitDraft: () =>
    Promise.resolve({ success: true, limit: 20, remaining: 1, reset: Date.now() + 1000 }),
  rateLimitCompose: () =>
    Promise.resolve({ success: true, limit: 30, remaining: 30, reset: Date.now() + 60_000 }),
  tooManyRequestsResponse: () => new Response("rate limited", { status: 429 }),
}));
vi.mock("@/lib/supabase/server", () => ({ supabaseAdmin: null }));
vi.mock("@/lib/llm/gemini", () => ({ isGeminiConfigured: () => configured.on }));
vi.mock("@/lib/llm/draftOther", async (importActual) => ({
  ...(await importActual<typeof import("@/lib/llm/draftOther")>()),
  draftOther: (...args: unknown[]) => draftOtherMock(...args),
}));

import { POST } from "../compose/route";
import { newWorkspace, proposedRequirements } from "@/core/workspace";

const DOCUMENTS_NOTICE =
  "Customers reported that the charging cable overheated. Provide a test report from an accredited laboratory by 20 October 2026.";
const QUESTIONNAIRE_NOTICE =
  "Your late shipment rate did not meet the target. Answer each of the following questions:\n1. What caused the late shipments on your seller-fulfilled orders?\n2. What changes have you made to prevent late shipments in the future?";

function documentsBody() {
  const w0 = {
    ...newWorkspace(),
    notice: DOCUMENTS_NOTICE,
    confirmed: true,
    protocol: "documents" as const,
    requirementsConfirmed: true,
    explanation:
      "The charger was tested by Sentinel Labs on 3 Sep 2026 and passed UL 62368-1. We stopped selling it on 1 Oct 2026.",
  };
  const workspace = { ...w0, requirements: proposedRequirements(w0, "PRODUCT_SAFETY") };
  return { caseData: { id: "case-2", kind: "PRODUCT_SAFETY", workspace }, attemptNumber: 1 };
}

function questionnaireBody() {
  const w0 = {
    ...newWorkspace(),
    notice: QUESTIONNAIRE_NOTICE,
    confirmed: true,
    protocol: "questionnaire" as const,
    requirementsConfirmed: true,
    answers: [
      {
        question: "What caused the late shipments on your seller-fulfilled orders?",
        answer:
          "Our packer was on leave from 10 to 19 August and nobody else knew the label printer.",
      },
      {
        question: "What changes have you made to prevent late shipments in the future?",
        answer: "We trained Bilal on the label printer on 2 September.",
      },
    ],
  };
  const workspace = { ...w0, requirements: proposedRequirements(w0, "PERFORMANCE_METRIC") };
  return { caseData: { id: "case-3", kind: "PERFORMANCE_METRIC", workspace }, attemptNumber: 1 };
}

const post = (b: unknown) =>
  POST(
    new Request("http://x/api/compose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(b),
    }) as unknown as NextRequest,
  );

beforeEach(() => {
  draftOtherMock.mockReset();
  configured.on = true;
});

describe("/api/compose for a document request", () => {
  it("asks the drafter with the explanation, the records' positions and the issues, never a file", async () => {
    draftOtherMock.mockResolvedValue({
      ok: true,
      retried: false,
      texts: { explanation: "The test report is attached (AI).", answers: [] },
    });
    const res = await post(documentsBody());
    expect(res.status).toBe(200);
    const json = await res.json();
    const request = draftOtherMock.mock.calls[0]![0];
    expect(request.protocol).toBe("documents");
    expect(request.explanation).toContain("Sentinel Labs");
    expect(request.requested.length).toBeGreaterThan(0);
    for (const r of request.requested) expect(Object.keys(r).sort()).toEqual(["label", "status"]);
    expect(JSON.stringify(request)).not.toMatch(/recordId|hash|bytes/);
    expect(json.ai).toEqual({ status: "used", retried: false });
    const section = json.draft.sections.find(
      (s: { heading: string }) => s.heading === "Response to the document request",
    );
    expect(section.body).toBe("The test report is attached (AI).");
    expect(section.source).toBe("ai");
    // The seller's own wording is returned beside it, untouched.
    expect(json.ownWording.draft.sections[0].body).toContain("Sentinel Labs");
    // The records section is still assembled by code.
    expect(
      json.draft.sections.find((s: { heading: string }) => s.heading === "Supporting records")
        .source,
    ).toBeUndefined();
  });

  it("falls back to the seller's wording when the drafter refuses, and says why", async () => {
    draftOtherMock.mockResolvedValue({
      ok: false,
      reason: "fact_check_failed",
      detail: "added details that were not provided: 12 Oct 2026",
    });
    const json = await (await post(documentsBody())).json();
    expect(json.ai).toMatchObject({ status: "fallback", reason: "fact_check_failed" });
    expect(json.draft.sections[0].body).toContain("Sentinel Labs");
    expect(json.ownWording).toBeUndefined();
  });
});

describe("/api/compose for a questionnaire", () => {
  it("lands each AI answer under its own question, in Amazon's order", async () => {
    draftOtherMock.mockResolvedValue({
      ok: true,
      retried: true,
      texts: { explanation: "", answers: ["Answer one (AI).", "Answer two (AI)."] },
    });
    const json = await (await post(questionnaireBody())).json();
    const request = draftOtherMock.mock.calls[0]![0];
    expect(request.protocol).toBe("questionnaire");
    expect(request.questions.map((q: { question: string }) => q.question)).toEqual([
      "What caused the late shipments on your seller-fulfilled orders?",
      "What changes have you made to prevent late shipments in the future?",
    ]);
    expect(json.ai).toEqual({ status: "used", retried: true });
    const headings = json.draft.sections.map((s: { heading: string }) => s.heading);
    expect(headings[0]).toBe("What caused the late shipments on your seller-fulfilled orders?");
    expect(json.draft.sections[0].body).toBe("Answer one (AI).");
    expect(json.draft.sections[1].body).toBe("Answer two (AI).");
    expect(json.draft.sections[0].source).toBe("ai");
  });

  it("does not ask the drafter while a question is unanswered", async () => {
    const body = questionnaireBody();
    body.caseData.workspace.answers = body.caseData.workspace.answers.slice(0, 1);
    const json = await (await post(body)).json();
    expect(draftOtherMock).not.toHaveBeenCalled();
    expect(json.ai).toEqual({ status: "not_applicable" });
  });

  it("reports not_configured when the model is switched off", async () => {
    configured.on = false;
    const json = await (await post(questionnaireBody())).json();
    expect(draftOtherMock).not.toHaveBeenCalled();
    expect(json.ai).toEqual({ status: "fallback", reason: "not_configured" });
  });
});
