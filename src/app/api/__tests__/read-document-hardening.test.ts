import { describe, expect, it, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const getApiUserMock = vi.fn();
const isLicenseActiveMock = vi.fn();
const claimCasePassMock = vi.fn();
const rateLimitMock = vi.fn();
const callGeminiMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));
vi.mock("@/lib/license", () => ({
  isLicenseActive: (...args: unknown[]) => isLicenseActiveMock(...args),
  claimCasePass: (...args: unknown[]) => claimCasePassMock(...args),
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

import { handleReadDocument } from "../read-document/route";

const PIXEL = "iVBORw0KGgoAAAANSUhEUg==";
const valid = {
  caseId: "case-1",
  kind: "INAUTHENTIC_DOCUMENTS",
  evidenceKind: "supplier_invoice",
  mimeType: "image/png",
  data: PIXEL,
};

function makeReq(body: unknown): NextRequest {
  return new Request("http://localhost:3000/api/read-document", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

beforeEach(() => {
  for (const m of [getApiUserMock, isLicenseActiveMock, claimCasePassMock, rateLimitMock])
    m.mockReset();
  callGeminiMock.mockReset();
  getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
  isLicenseActiveMock.mockResolvedValue(true);
  claimCasePassMock.mockResolvedValue(true);
  rateLimitMock.mockResolvedValue({ success: true });
});

describe("/api/read-document hardening (6 Oct 2026)", () => {
  it("refuses a made-up evidence kind with a 400 before a Pass is bound", async () => {
    const res = await handleReadDocument(makeReq({ ...valid, evidenceKind: "garbage_kind" }));
    expect(res.status).toBe(400);
    expect(claimCasePassMock).not.toHaveBeenCalled();
    expect(callGeminiMock).not.toHaveBeenCalled();
  });

  it("keeps the good findings when one has a null observed and a note that is too long", async () => {
    let fields: string[] = [];
    callGeminiMock.mockImplementation(async (input: { responseJsonSchema: unknown }) => {
      const schema = input.responseJsonSchema as {
        properties: { findings: { items: { properties: { field: { enum: string[] } } } } };
      };
      fields = schema.properties.findings.items.properties.field.enum;
      return {
        ok: true,
        text: JSON.stringify({
          findings: [
            {
              field: fields[0],
              status: "present",
              observed: "Harbor Goods Ltd",
              note: "x".repeat(900),
            },
            { field: fields[1], status: "present", observed: null, note: null },
            { field: fields[2], status: "not-a-status", note: "bad" },
          ],
        }),
      };
    });
    const res = await handleReadDocument(makeReq(valid));
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(fields.length).toBeGreaterThan(3);
    expect(body.check.findings).toHaveLength(fields.length);
    expect(body.check.findings[0].observed).toBe("Harbor Goods Ltd");
    // The one with nothing quoted is not "present" with invented text.
    expect(body.check.findings[1].status).not.toBe("present");
    // The unusable one is simply not checked.
    expect(body.check.findings[2].status).toBe("not_assessed");
  });

  it("is still a failure when nothing in the reading is usable", async () => {
    callGeminiMock.mockResolvedValue({
      ok: true,
      text: JSON.stringify({ findings: [{ field: "", status: "nope" }] }),
    });
    const body = await (await handleReadDocument(makeReq(valid))).json();
    expect(body.ok).toBe(false);
  });

  it("reads the JSON even when trailing prose holds a closing brace", async () => {
    callGeminiMock.mockResolvedValue({
      ok: true,
      text: '{"findings":[]}\nI left out nothing {really}.',
    });
    const body = await (await handleReadDocument(makeReq(valid))).json();
    expect(body.ok).toBe(true);
  });

  it("limits `field` in the per-request schema to the fields it asked about", async () => {
    callGeminiMock.mockResolvedValue({ ok: true, text: '{"findings":[]}' });
    await handleReadDocument(makeReq(valid));
    const schema = callGeminiMock.mock.calls[0]![0].responseJsonSchema;
    const allowed = schema.properties.findings.items.properties.field.enum as string[];
    expect(allowed).toContain("supplier business name");
  });

  it("matches a paraphrase-cased field name instead of adding an extra row", async () => {
    callGeminiMock.mockResolvedValue({
      ok: true,
      text: JSON.stringify({
        findings: [
          {
            field: "SUPPLIER BUSINESS NAME.",
            status: "present",
            observed: "Acme Ltd",
            note: "Printed.",
          },
        ],
      }),
    });
    const body = await (await handleReadDocument(makeReq(valid))).json();
    const rows = body.check.findings.filter((f: { field: string }) =>
      /supplier business name/i.test(f.field),
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].field).toBe("supplier business name");
  });
});
