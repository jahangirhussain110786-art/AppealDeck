import { describe, it, expect } from "vitest";
import { composePoa, critiquePoa, renderPoaText } from "./composer";
import type { PoaDraft } from "./composer";
import type { CaseFileData } from "./readiness";

function makeCase(overrides: Partial<CaseFileData> = {}): CaseFileData {
  return {
    kind: "POLICY",
    evidenceSlots: {},
    actionItems: [],
    ...overrides,
  };
}

describe("composePoa", () => {
  it("produces a draft with root cause, corrective, and preventive sections", () => {
    const draft = composePoa(makeCase());
    expect(draft.sections.length).toBeGreaterThanOrEqual(3);
    expect(draft.sections[0].heading).toBe("Root Cause");
    expect(draft.sections[1].heading).toBe("Corrective Actions");
    expect(draft.sections[2].heading).toBe("Preventive Measures");
  });

  it("marks mode as gap-draft when evidence incomplete", () => {
    const draft = composePoa(makeCase());
    expect(draft.mode.mode).toBe("gap-draft");
    expect(draft.watermark).toBeDefined();
  });

  it("marks mode as full-draft when evidence complete", () => {
    const draft = composePoa(
      makeCase({
        evidenceSlots: { metric_export: { present: true } },
      }),
    );
    expect(draft.mode.mode).toBe("full-draft");
    expect(draft.watermark).toBeUndefined();
  });

  it("includes gap section for gap draft", () => {
    const draft = composePoa(makeCase());
    const gapSection = draft.sections.find((s) => s.heading === "Evidence Gaps (Action Required)");
    expect(gapSection).toBeDefined();
    expect(gapSection?.body).toContain("metric export");
  });

  it("does not include gap section for full draft", () => {
    const draft = composePoa(
      makeCase({
        evidenceSlots: { metric_export: { present: true } },
      }),
    );
    const gapSection = draft.sections.find((s) => s.heading === "Evidence Gaps (Action Required)");
    expect(gapSection).toBeUndefined();
  });

  it("lists declined actions with reason", () => {
    const draft = composePoa(
      makeCase({
        actionItems: [
          {
            id: "test",
            label: "Obtain supplier invoice",
            evidenceSlots: ["supplier_invoice"],
            status: "todo",
            declined: { reason: "Supplier refuses", at: "2026-01-01T00:00:00Z" },
          },
        ],
      }),
    );
    const corrective = draft.sections.find((s) => s.heading === "Corrective Actions");
    expect(corrective?.body).toContain("Declined: Supplier refuses");
  });

  it("sets metadata correctly", () => {
    const draft = composePoa(makeCase(), 2);
    expect(draft.metadata.attemptNumber).toBe(2);
    expect(draft.metadata.kind).toBe("POLICY");
    expect(draft.metadata.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe("critiquePoa", () => {
  it("flags unattested completed actions", () => {
    const data = makeCase({
      actionItems: [
        {
          id: "test",
          label: "Obtain invoice",
          evidenceSlots: ["supplier_invoice"],
          status: "done",
        },
      ],
    });
    const draft = composePoa(data);
    const result = critiquePoa(draft, data);
    expect(result.findings.some((f) => f.code === "UNATTESTED_CLAIMS")).toBe(true);
  });

  it("flags empty required evidence slots", () => {
    const data = makeCase();
    const draft = composePoa(data);
    const result = critiquePoa(draft, data);
    expect(result.findings.some((f) => f.code === "EMPTY_EVIDENCE_SLOTS")).toBe(true);
  });

  it("passes when no errors (only warnings allowed)", () => {
    const data = makeCase({
      evidenceSlots: { metric_export: { present: true } },
      actionItems: [
        {
          id: "test",
          label: "Obtain invoice",
          evidenceSlots: ["supplier_invoice"],
          status: "done",
          attestation: { attestedAt: "2026-01-01T00:00:00Z", note: "Confirmed" },
        },
      ],
    });
    const draft = composePoa(data);
    const result = critiquePoa(draft, data);
    expect(result.findings.some((f) => f.severity === "error")).toBe(false);
  });

  it("flags banned promise-of-success language", () => {
    const data = makeCase({
      evidenceSlots: { metric_export: { present: true } },
    });
    const draft = composePoa(data);
    draft.sections[0].body = "We promise this will be fixed and you will be reinstated.";
    const result = critiquePoa(draft, data);
    expect(result.findings.some((f) => f.code === "BANNED_REINSTATEMENT_PROMISE")).toBe(true);
    expect(result.passed).toBe(false);
  });

  it("flags severity-gated inauthentic without invoice", () => {
    const data = makeCase({ kind: "INAUTHENTIC_DOCUMENTS" });
    const draft = composePoa(data);
    const result = critiquePoa(draft, data);
    expect(result.findings.some((f) => f.code === "SEVERITY_GATE")).toBe(true);
    expect(result.passed).toBe(false);
  });

  it("passes severity gate when invoice present", () => {
    const data = makeCase({
      kind: "INAUTHENTIC_DOCUMENTS",
      evidenceSlots: { supplier_invoice: { present: true } },
    });
    const draft = composePoa(data);
    const result = critiquePoa(draft, data);
    expect(result.findings.some((f) => f.code === "SEVERITY_GATE")).toBe(false);
  });

  it("warns about novelty on attempt > 1", () => {
    const data = makeCase({
      evidenceSlots: { metric_export: { present: true } },
    });
    const draft = composePoa(data, 2);
    const result = critiquePoa(draft, data);
    expect(result.findings.some((f) => f.code === "NOVELTY_REMINDER")).toBe(true);
  });
});

describe("renderPoaText", () => {
  it("renders sections with headings", () => {
    const draft = composePoa(makeCase());
    const text = renderPoaText(draft);
    expect(text).toContain("## Root Cause");
    expect(text).toContain("## Corrective Actions");
    expect(text).toContain("## Preventive Measures");
  });

  it("renders watermark for gap draft", () => {
    const draft = composePoa(makeCase());
    const text = renderPoaText(draft);
    expect(text).toContain("NOT READY TO SUBMIT");
  });

  it("omits watermark for full draft", () => {
    const draft = composePoa(
      makeCase({
        evidenceSlots: { metric_export: { present: true } },
      }),
    );
    const text = renderPoaText(draft);
    expect(text).not.toContain("NOT READY TO SUBMIT");
  });
});
