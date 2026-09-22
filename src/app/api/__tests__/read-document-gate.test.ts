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
  rateLimitExtractField: (...args: unknown[]) => rateLimitMock(...args),
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
    const res = await handleReadDocument(
      makeReq({ ...valid, kind: "UNKNOWN", evidenceKind: "supplier_invoice" }),
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
