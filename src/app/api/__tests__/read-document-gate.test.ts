import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const isLicenseActiveMock = vi.fn();
const rateLimitMock = vi.fn();
const callGeminiMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/license", () => ({
  isLicenseActive: (...args: unknown[]) => isLicenseActiveMock(...args),
}));

vi.mock("@/lib/ratelimit", () => ({
  rateLimitDocumentRead: (...args: unknown[]) => rateLimitMock(...args),
  tooManyRequestsResponse: () =>
    new Response(JSON.stringify({ error: "Slow down" }), { status: 429 }),
}));

vi.mock("@/lib/llm/gemini", () => ({
  callGemini: (...args: unknown[]) => callGeminiMock(...args),
  withGeminiBreaker: (h: unknown) => h,
}));

import { handleReadDocument, BROWSER_ONLY_EVIDENCE_KINDS } from "../read-document/route";

const PIXEL = "iVBORw0KGgoAAAANSUhEUg==";

function makeReq(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/read-document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const valid = {
  kind: "INAUTHENTIC_DOCUMENTS",
  evidenceKind: "supplier_invoice",
  mimeType: "image/png",
  data: PIXEL,
};

beforeEach(() => {
  getApiUserMock.mockReset();
  isLicenseActiveMock.mockReset();
  rateLimitMock.mockReset();
  callGeminiMock.mockReset();
  getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
  isLicenseActiveMock.mockResolvedValue(true);
  rateLimitMock.mockResolvedValue({ success: true });
});

describe("/api/read-document gates", () => {
  it("requires sign-in before anything else", async () => {
    getApiUserMock.mockResolvedValue(null);
    const res = await handleReadDocument(makeReq(valid));
    expect(res.status).toBe(401);
    expect(callGeminiMock).not.toHaveBeenCalled();
  });

  it("requires an active Appeal Pass", async () => {
    isLicenseActiveMock.mockResolvedValue(false);
    const res = await handleReadDocument(makeReq(valid));
    expect(res.status).toBe(402);
    expect(callGeminiMock).not.toHaveBeenCalled();
  });

  it("rate-limits before calling the model", async () => {
    rateLimitMock.mockResolvedValue({ success: false });
    const res = await handleReadDocument(makeReq(valid));
    expect(res.status).toBe(429);
    expect(callGeminiMock).not.toHaveBeenCalled();
  });

  /**
   * The liability boundary. An identity document must never be sent to the server, so this refusal
   * is asserted per type rather than trusted to the client routing it correctly.
   */
  it.each(BROWSER_ONLY_EVIDENCE_KINDS)(
    "refuses to accept %s and says why",
    async (evidenceKind) => {
      const res = await handleReadDocument(makeReq({ ...valid, evidenceKind }));
      expect(res.status).toBe(422);
      const body = await res.json();
      expect(body.browserOnly).toBe(true);
      expect(body.error).toMatch(/never uploaded/i);
      expect(callGeminiMock).not.toHaveBeenCalled();
    },
  );

  it("rejects a document type Amazon does not ask for on this case", async () => {
    // Was `kind: "UNKNOWN"`, which made this test pin a defect rather than a rule: UNKNOWN does not
    // mean "Amazon does not ask for this", it means the case is not classified yet — and every case
    // started by typing a notice into /case is UNKNOWN, so this assertion was quietly requiring the
    // route to refuse the ordinary path. A classified violation whose matrix genuinely lacks the
    // record is the real case this rule is about.
    const res = await handleReadDocument(
      makeReq({ ...valid, kind: "PERFORMANCE_METRIC", evidenceKind: "supplier_invoice" }),
    );
    expect(res.status).toBe(400);
    expect(callGeminiMock).not.toHaveBeenCalled();
  });

  it("rejects a file type it cannot read", async () => {
    const res = await handleReadDocument(makeReq({ ...valid, mimeType: "application/zip" }));
    expect(res.status).toBe(400);
    expect(callGeminiMock).not.toHaveBeenCalled();
  });

  it("degrades to an honest failure rather than a fabricated reading", async () => {
    callGeminiMock.mockResolvedValue({ ok: false, reason: "upstream_error", message: "boom" });
    const res = await handleReadDocument(makeReq(valid));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.message).toMatch(/Nothing about your case has changed/i);
    expect(body.check).toBeUndefined();
  });

  it("degrades when the model returns something that is not the agreed shape", async () => {
    callGeminiMock.mockResolvedValue({ ok: true, text: "sorry, I cannot help", model: "m" });
    const res = await handleReadDocument(makeReq(valid));
    const body = await res.json();
    expect(body.ok).toBe(false);
  });

  it("returns a check whose notes carry no verdict, even when the model writes one", async () => {
    callGeminiMock.mockResolvedValue({
      ok: true,
      model: "m",
      text: JSON.stringify({
        findings: [
          {
            field: "supplier business name",
            status: "present",
            observed: "Acme Trading Ltd",
            // The model ignoring its instructions, which is the case that matters.
            note: "This invoice is authentic and will be accepted.",
          },
        ],
      }),
    });
    const res = await handleReadDocument(makeReq(valid));
    const body = await res.json();
    expect(body.ok).toBe(true);
    const note = body.check.findings[0].note as string;
    expect(note).not.toMatch(/authentic/i);
    expect(note).not.toMatch(/accepted/i);
  });

  it("sends the document inline and asks for the fields Amazon actually named", async () => {
    callGeminiMock.mockResolvedValue({
      ok: true,
      model: "m",
      text: JSON.stringify({ findings: [] }),
    });
    await handleReadDocument(makeReq(valid));
    const call = callGeminiMock.mock.calls[0]![0];
    expect(call.task).toBe("read-document");
    const userMessage = call.messages.find((m: { role: string }) => m.role === "user");
    expect(userMessage.documents).toEqual([{ data: PIXEL, mimeType: "image/png" }]);
    expect(userMessage.text).toMatch(/supplier physical address/);
  });
});

/**
 * A, 23 Sep 2026. This route's header claimed the client and server "agree by construction rather
 * than by convention", so a client bug could not cause a passport to be uploaded. Both halves were
 * false: the two read the same `evidenceKind` from the same request body, so the server restated
 * the client's claim instead of checking it — and the workspace was storing **every** upload as
 * `"other"`, hardcoded, so the claim it restated was wrong.
 *
 * On `RELATED_ACCOUNT` and `PRODUCT_SAFETY`, whose matrices define an `"other"` requirement, that
 * mislabelled document matched and was sent to the model.
 *
 * The rule below does not depend on the client being right: we do not read a document we cannot
 * name. `"other"` means exactly that we cannot name it, so we cannot promise it is not a passport.
 */
describe("the unnamed-document refusal", () => {
  it("refuses the catch-all kind on a violation whose matrix accepts it", async () => {
    // Establish the premise rather than asserting it from memory: this pairing really is one the
    // matrix matches, which is why it used to reach the model.
    const { requirementsFor } = await import("@/core/evidenceModel");
    expect(requirementsFor("PRODUCT_SAFETY").some((r) => r.kind === "other")).toBe(true);

    const res = await handleReadDocument(
      makeReq({ ...valid, kind: "PRODUCT_SAFETY", evidenceKind: "other" }),
    );
    expect(res.status).toBe(422);
    expect(callGeminiMock).not.toHaveBeenCalled();
    expect((await res.json()).error).toMatch(/only read documents we can identify/i);
  });

  it("refuses it on the other violation family that accepts it", async () => {
    const res = await handleReadDocument(
      makeReq({ ...valid, kind: "RELATED_ACCOUNT", evidenceKind: "other" }),
    );
    expect(res.status).toBe(422);
    expect(callGeminiMock).not.toHaveBeenCalled();
  });

  it("refuses before deciding whether any requirement matches", async () => {
    // A violation whose matrix has no "other" entry would have been refused anyway, with a message
    // about Amazon not asking for it — which is the wrong reason and tells the seller nothing true.
    const res = await handleReadDocument(
      makeReq({ ...valid, kind: "PERFORMANCE_METRIC", evidenceKind: "other" }),
    );
    expect((await res.json()).error).toMatch(/only read documents we can identify/i);
    expect(callGeminiMock).not.toHaveBeenCalled();
  });

  it("still reads a document it can name", async () => {
    callGeminiMock.mockResolvedValue({
      ok: true,
      text: JSON.stringify({ findings: [], summary: "" }),
    });
    const res = await handleReadDocument(makeReq(valid));
    expect(res.status).toBe(200);
    expect(callGeminiMock).toHaveBeenCalled();
  });

  it("still refuses every browser-only kind, whatever the violation", async () => {
    for (const evidenceKind of BROWSER_ONLY_EVIDENCE_KINDS) {
      callGeminiMock.mockReset();
      const res = await handleReadDocument(makeReq({ ...valid, evidenceKind }));
      expect(res.status, evidenceKind).toBe(422);
      expect(callGeminiMock, evidenceKind).not.toHaveBeenCalled();
    }
  });
});

/**
 * The second reason a workspace upload could never be checked, found while verifying the first.
 * `EVIDENCE_MATRIX.UNKNOWN` is an empty array and a case started by typing a notice into `/case` is
 * `UNKNOWN`, so this route refused every document on the most ordinary path into the product — and
 * refused it with "that document type is not one Amazon asks for on this case", about a record the
 * seller had been asked for by name.
 */
describe("unclassified cases", () => {
  it("reads a named record on an unclassified case instead of refusing it", async () => {
    const { requirementsFor } = await import("@/core/evidenceModel");
    // The premise, stated rather than assumed: there is nothing here to match against.
    expect(requirementsFor("UNKNOWN")).toHaveLength(0);

    callGeminiMock.mockResolvedValue({
      ok: true,
      text: JSON.stringify({ findings: [], summary: "" }),
    });
    const res = await handleReadDocument(makeReq({ ...valid, kind: "UNKNOWN" }));
    expect(res.status).toBe(200);
    expect(callGeminiMock).toHaveBeenCalled();
  });

  it("asks about the fields that record must show, borrowed from the record not the violation", async () => {
    const { canonicalRequirementFor } = await import("@/core/evidenceModel");
    callGeminiMock.mockResolvedValue({
      ok: true,
      text: JSON.stringify({ findings: [], summary: "" }),
    });
    await handleReadDocument(makeReq({ ...valid, kind: "UNKNOWN" }));
    const prompt = JSON.stringify(callGeminiMock.mock.calls[0]![0]);
    for (const field of canonicalRequirementFor("supplier_invoice")!.fields) {
      expect(prompt).toContain(field);
    }
  });

  it("still refuses an unnamed document on an unclassified case", async () => {
    callGeminiMock.mockReset();
    const res = await handleReadDocument(
      makeReq({ ...valid, kind: "UNKNOWN", evidenceKind: "other" }),
    );
    expect(res.status).toBe(422);
    expect(callGeminiMock).not.toHaveBeenCalled();
  });
});
