import { describe, expect, it, vi, beforeEach } from "vitest";

const callGeminiMock = vi.fn();

vi.mock("@/lib/llm/gemini", async () => {
  const actual = await vi.importActual<typeof import("@/lib/llm/gemini")>("@/lib/llm/gemini");
  return {
    ...actual,
    callGemini: (...args: unknown[]) => callGeminiMock(...args),
  };
});

import { handleExtractField } from "../extract-field/route";

function makeReq(body: unknown): Request {
  return new Request("http://localhost/api/extract-field", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as Request;
}

beforeEach(() => {
  callGeminiMock.mockReset();
});

describe("handleExtractField", () => {
  it("returns rules_only when not configured", async () => {
    callGeminiMock.mockResolvedValue({
      ok: false,
      reason: "not_configured",
      message: "Gemini is not configured.",
    });
    const res = await handleExtractField(
      makeReq({ stepId: "intake_root_cause", text: "Amazon deactivated my account." }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.reason).toBe("rules_only");
  });

  it("returns suggestions when Gemini returns valid JSON", async () => {
    callGeminiMock.mockResolvedValue({
      ok: true,
      text: JSON.stringify({
        suggestedKind: "POLICY",
        suggestedSeverity: "high",
        suggestedTimelineSummary: "Account deactivated for policy violation on 2026-08-15.",
      }),
      model: "gemini-3.5-flash",
    });
    const res = await handleExtractField(
      makeReq({
        stepId: "intake_root_cause",
        text: "Amazon deactivated my account on 2026-08-15 for late shipment policy.",
      }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.suggestions.suggestedKind).toBe("POLICY");
    expect(body.suggestions.suggestedSeverity).toBe("high");
  });

  it("strips code fences and parses JSON", async () => {
    callGeminiMock.mockResolvedValue({
      ok: true,
      text: '```json\n{"suggestedSeverity":"medium"}\n```',
      model: "gemini-3.5-flash",
    });
    const res = await handleExtractField(
      makeReq({
        stepId: "intake_root_cause",
        text: "I think my account was suspended for late shipping.",
      }),
    );
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.suggestions.suggestedSeverity).toBe("medium");
  });

  it("falls back to rules_only on malformed JSON", async () => {
    callGeminiMock.mockResolvedValue({
      ok: true,
      text: "not json at all",
      model: "gemini-3.5-flash",
    });
    const res = await handleExtractField(
      makeReq({ stepId: "intake_root_cause", text: "Some seller text." }),
    );
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.reason).toBe("rules_only");
  });

  it("falls back to rules_only when JSON does not match schema", async () => {
    callGeminiMock.mockResolvedValue({
      ok: true,
      text: JSON.stringify({ suggestedKind: "BOGUS_KIND", madeUpField: 42 }),
      model: "gemini-3.5-flash",
    });
    const res = await handleExtractField(
      makeReq({ stepId: "intake_root_cause", text: "Some seller text." }),
    );
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.reason).toBe("rules_only");
  });

  it("rejects text over 2000 chars with 400", async () => {
    const res = await handleExtractField(
      makeReq({ stepId: "intake_root_cause", text: "a".repeat(2001) }),
    );
    expect(res.status).toBe(400);
  });

  it("rejects empty text with 400", async () => {
    const res = await handleExtractField(makeReq({ stepId: "intake_root_cause", text: "" }));
    expect(res.status).toBe(400);
  });

  it("rejects stepId over 64 chars with 400", async () => {
    const res = await handleExtractField(makeReq({ stepId: "a".repeat(65), text: "hi" }));
    expect(res.status).toBe(400);
  });

  it("rejects invalid JSON body with 400", async () => {
    const req = new Request("http://localhost/api/extract-field", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json",
    }) as unknown as Request;
    const res = await handleExtractField(req);
    expect(res.status).toBe(400);
  });

  it("returns rules_only on Gemini upstream_error", async () => {
    callGeminiMock.mockResolvedValue({
      ok: false,
      reason: "upstream_error",
      message: "Gemini returned 503: overloaded",
    });
    const res = await handleExtractField(
      makeReq({ stepId: "intake_root_cause", text: "Account suspended" }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(false);
    expect(body.reason).toBe("rules_only");
  });

  it("returns rules_only on Gemini timeout", async () => {
    callGeminiMock.mockResolvedValue({ ok: false, reason: "timeout", message: "Timed out" });
    const res = await handleExtractField(
      makeReq({ stepId: "intake_root_cause", text: "Account suspended" }),
    );
    const body = await res.json();
    expect(body.reason).toBe("rules_only");
  });
});
