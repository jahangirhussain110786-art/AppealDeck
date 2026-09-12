import { describe, it, expect, vi } from "vitest";
import { composePoaWithLlm, applyLlmSections } from "./composePoaLlm";
import { composePoa } from "@/core";
import type { CaseFileData } from "@/core";
import type { GeminiCallResult } from "./gemini";

function makeCase(overrides: Partial<CaseFileData> = {}): CaseFileData {
  return {
    kind: "POLICY",
    rootCause:
      "Our listing verification process did not check that the supplier invoice matched the ASIN before inventory was sent to Amazon.",
    evidenceSlots: {},
    actionItems: [],
    ...overrides,
  };
}

function okResult(text: string): GeminiCallResult {
  return { ok: true, text, model: "gemini-3.5-flash" };
}

describe("composePoaWithLlm", () => {
  it("returns not-ok without calling Gemini when the narrative is too thin", async () => {
    const callGemini = vi.fn();
    const result = await composePoaWithLlm(makeCase({ rootCause: "idk" }), { callGemini });
    expect(result.ok).toBe(false);
    expect(callGemini).not.toHaveBeenCalled();
  });

  it("returns not-ok when Gemini call fails", async () => {
    const callGemini = vi.fn().mockResolvedValue({
      ok: false,
      reason: "upstream_error",
      message: "boom",
    } satisfies GeminiCallResult);
    const result = await composePoaWithLlm(makeCase(), { callGemini });
    expect(result.ok).toBe(false);
  });

  it("returns not-ok when the response is not valid JSON", async () => {
    const callGemini = vi.fn().mockResolvedValue(okResult("not json at all"));
    const result = await composePoaWithLlm(makeCase(), { callGemini });
    expect(result.ok).toBe(false);
  });

  it("returns not-ok when the JSON doesn't match the schema", async () => {
    const callGemini = vi.fn().mockResolvedValue(okResult(JSON.stringify({ somethingElse: 1 })));
    const result = await composePoaWithLlm(makeCase(), { callGemini });
    expect(result.ok).toBe(false);
  });

  it("rejects output containing a banned phrase, even if otherwise well-formed", async () => {
    const callGemini = vi.fn().mockResolvedValue(
      okResult(
        JSON.stringify({
          rootCause: "We guarantee this will never happen again.",
        }),
      ),
    );
    const result = await composePoaWithLlm(makeCase(), { callGemini });
    expect(result.ok).toBe(false);
  });

  it("accepts a well-formed, grounded response", async () => {
    const callGemini = vi.fn().mockResolvedValue(
      okResult(
        JSON.stringify({
          rootCause: "Our invoice-matching step did not run before this inventory shipped.",
          preventiveMeasures: "We added a mandatory two-person invoice check before shipment.",
        }),
      ),
    );
    const result = await composePoaWithLlm(
      makeCase({
        preventiveMeasures:
          "We added a mandatory two-person invoice check before any new inventory ships.",
      }),
      { callGemini },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sections.rootCause).toContain("invoice-matching");
      expect(result.sections.preventiveMeasures).toContain("two-person");
    }
  });

  it("never invents preventive measures the seller never provided, even if the model returns one", async () => {
    const callGemini = vi.fn().mockResolvedValue(
      okResult(
        JSON.stringify({
          rootCause: "Our invoice-matching step did not run before this inventory shipped.",
          preventiveMeasures: "Invented text the model should not have produced.",
        }),
      ),
    );
    const result = await composePoaWithLlm(makeCase({ preventiveMeasures: undefined }), {
      callGemini,
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.sections.preventiveMeasures).toBeUndefined();
    }
  });
});

describe("applyLlmSections", () => {
  it("replaces Root Cause and tags it as ai-sourced, leaves other sections untouched", () => {
    const data = makeCase({ evidenceSlots: { metric_export: { present: true } } });
    const deterministic = composePoa(data);
    const merged = applyLlmSections(deterministic, data, {
      rootCause: "A professionally drafted root cause paragraph.",
    });
    const rootCause = merged.sections.find((s) => s.heading === "Root Cause")!;
    expect(rootCause.body).toBe("A professionally drafted root cause paragraph.");
    expect(rootCause.source).toBe("ai");
    expect(merged.metadata.aiDrafted).toBe(true);

    const corrective = merged.sections.find((s) => s.heading === "Corrective Actions")!;
    expect(corrective.body).toBe(
      deterministic.sections.find((s) => s.heading === "Corrective Actions")!.body,
    );
    expect(corrective.source).toBeUndefined();
  });

  it("does not apply preventiveMeasures when the seller's own answer was insufficient", () => {
    const data = makeCase({
      evidenceSlots: { metric_export: { present: true } },
      preventiveMeasures: "idk",
    });
    const deterministic = composePoa(data);
    const merged = applyLlmSections(deterministic, data, {
      rootCause: "A professionally drafted root cause paragraph.",
      preventiveMeasures: "Invented preventive measures.",
    });
    const preventive = merged.sections.find((s) => s.heading === "Preventive Measures")!;
    expect(preventive.body).not.toBe("Invented preventive measures.");
    expect(preventive.source).toBeUndefined();
  });
});
