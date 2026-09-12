import { describe, it, expect } from "vitest";
import { composePoa, critiquePoa, renderPoaText } from "./composer";
import type { PoaDraft } from "./composer";
import type { CaseFileData } from "./readiness";

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

describe("composePoa", () => {
  it("produces a draft with root cause, corrective, and preventive sections", () => {
    const draft = composePoa(makeCase());
    expect(draft.sections.length).toBeGreaterThanOrEqual(3);
    expect(draft.sections[0].heading).toBe("Root Cause");
    expect(draft.sections[1].heading).toBe("Corrective Actions");
    expect(draft.sections[2].heading).toBe("Preventive Measures");
  });

  it("uses the seller's root-cause words verbatim", () => {
    const rootCause =
      "Our listing verification process did not check that the supplier invoice matched the ASIN before inventory was sent to Amazon.";
    const draft = composePoa(
      makeCase({
        rootCause,
        timelineEvents: [{ date: "2026-09-01", description: "Notice received" }],
        evidenceSlots: { metric_export: { present: true } },
      }),
    );
    expect(draft.sections[0].body).toBe(`On 2026-09-01: ${rootCause}`);
    expect(draft.mode.mode).toBe("full-draft");
  });

  it("uses a specific preventive-measures answer verbatim", () => {
    const preventiveMeasures =
      "We added a two-person invoice check and blocked new inventory until the ASIN and supplier details match.";
    const draft = composePoa(
      makeCase({
        rootCause:
          "Our listing verification process did not check that the supplier invoice matched the ASIN before inventory was sent to Amazon.",
        preventiveMeasures,
        evidenceSlots: { metric_export: { present: true } },
      }),
    );
    expect(draft.sections[2].body).toBe(preventiveMeasures);
  });

  it("creates a narrative gap instead of a bracketed placeholder", () => {
    const draft = composePoa(
      makeCase({
        rootCause: "idk",
        evidenceSlots: { metric_export: { present: true } },
      }),
    );
    expect(draft.mode.gapReason).toBe("narrative");
    expect(draft.sections[0].body).not.toMatch(/\[Describe/);
    expect(draft.sections[0].body).toContain("isn't enough detail");
    expect(draft.sections[3].body).toContain("root-cause narrative");
  });

  it("marks complete evidence as a gap when the narrative is thin", () => {
    const draft = composePoa(
      makeCase({
        rootCause: "idk",
        evidenceSlots: { metric_export: { present: true } },
      }),
    );
    expect(draft.mode.mode).toBe("gap-draft");
    expect(draft.mode.gapReason).toBe("narrative");
  });

  it("marks mode as full-draft when evidence complete", () => {
    const draft = composePoa(
      makeCase({
        rootCause:
          "Our listing verification process did not check that the supplier invoice matched the ASIN before inventory was sent to Amazon.",
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
    expect(draft.metadata.aiDrafted).toBe(false);
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

  // AA-31 deterministic critic rules (11 Sep 2026) — each is a warning or info finding, never an
  // error, per the amendment's own "warnings, never hard blocks" instruction.
  describe("AA-31 rules", () => {
    it("warns on future-tense corrective actions", () => {
      const data = makeCase({ evidenceSlots: { metric_export: { present: true } } });
      const draft = composePoa(data);
      const corrective = draft.sections.find((s) => s.heading === "Corrective Actions")!;
      corrective.body = "We will fix this issue and prevent it from happening again.";
      const result = critiquePoa(draft, data);
      const finding = result.findings.find((f) => f.code === "FUTURE_TENSE_CORRECTIVE_ACTION");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("warning");
    });

    it("does not flag past-tense corrective actions", () => {
      const data = makeCase({ evidenceSlots: { metric_export: { present: true } } });
      const draft = composePoa(data);
      const corrective = draft.sections.find((s) => s.heading === "Corrective Actions")!;
      corrective.body = "We removed the affected listing and retrained the QA team on 3 Sep 2026.";
      const result = critiquePoa(draft, data);
      expect(result.findings.some((f) => f.code === "FUTURE_TENSE_CORRECTIVE_ACTION")).toBe(false);
    });

    it("warns when Root Cause blames a supplier or employee instead of the seller's own process", () => {
      const data = makeCase({ evidenceSlots: { metric_export: { present: true } } });
      const draft = composePoa(data);
      const rootCause = draft.sections.find((s) => s.heading === "Root Cause")!;
      rootCause.body = "The supplier caused this by sending the wrong documentation.";
      const result = critiquePoa(draft, data);
      const finding = result.findings.find((f) => f.code === "BLAME_SHIFTING_LANGUAGE");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("warning");
    });

    it("warns on vague-time phrases anywhere in the draft", () => {
      const data = makeCase({ evidenceSlots: { metric_export: { present: true } } });
      const draft = composePoa(data);
      draft.sections[0].body = "We recently corrected the issue with our supplier.";
      const result = critiquePoa(draft, data);
      const finding = result.findings.find((f) => f.code === "VAGUE_TIME_PHRASE");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("warning");
    });

    it("warns when a dated required document is older than its freshness window", () => {
      const staleDate = new Date(Date.now() - 400 * 86_400_000).toISOString();
      const data = makeCase({
        kind: "INAUTHENTIC_DOCUMENTS",
        evidenceSlots: { supplier_invoice: { present: true, documentDate: staleDate } },
      });
      const draft = composePoa(data);
      const result = critiquePoa(draft, data);
      const finding = result.findings.find((f) => f.code === "DOCUMENT_STALE");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("warning");
    });

    it("does not flag a document within its freshness window", () => {
      const freshDate = new Date(Date.now() - 10 * 86_400_000).toISOString();
      const data = makeCase({
        kind: "INAUTHENTIC_DOCUMENTS",
        evidenceSlots: { supplier_invoice: { present: true, documentDate: freshDate } },
      });
      const draft = composePoa(data);
      const result = critiquePoa(draft, data);
      expect(result.findings.some((f) => f.code === "DOCUMENT_STALE")).toBe(false);
    });

    it("skips the freshness check when no document date was captured", () => {
      const data = makeCase({
        kind: "INAUTHENTIC_DOCUMENTS",
        evidenceSlots: { supplier_invoice: { present: true } },
      });
      const draft = composePoa(data);
      const result = critiquePoa(draft, data);
      expect(result.findings.some((f) => f.code === "DOCUMENT_STALE")).toBe(false);
    });

    it("nudges (info-level) when present evidence isn't referenced by name in the draft", () => {
      const data = makeCase({ evidenceSlots: { metric_export: { present: true } } });
      const draft = composePoa(data);
      const result = critiquePoa(draft, data);
      const finding = result.findings.find((f) => f.code === "EVIDENCE_NOT_REFERENCED_BY_NAME");
      expect(finding).toBeDefined();
      expect(finding?.severity).toBe("info");
    });

    it("does not nudge when the evidence kind is already mentioned by name", () => {
      const data = makeCase({ evidenceSlots: { metric_export: { present: true } } });
      const draft = composePoa(data);
      draft.sections[0].body = "See the attached metric export for supporting figures.";
      const result = critiquePoa(draft, data);
      expect(result.findings.some((f) => f.code === "EVIDENCE_NOT_REFERENCED_BY_NAME")).toBe(false);
    });

    it("none of the new rules ever produce an error-severity finding", () => {
      const data = makeCase({ evidenceSlots: { metric_export: { present: true } } });
      const draft = composePoa(data);
      draft.sections[0].body = "The supplier caused this. We recently fixed it and will monitor.";
      const result = critiquePoa(draft, data);
      const newCodes = [
        "FUTURE_TENSE_CORRECTIVE_ACTION",
        "BLAME_SHIFTING_LANGUAGE",
        "VAGUE_TIME_PHRASE",
        "DOCUMENT_STALE",
        "EVIDENCE_NOT_REFERENCED_BY_NAME",
      ];
      const newFindings = result.findings.filter((f) => newCodes.includes(f.code));
      expect(newFindings.length).toBeGreaterThan(0);
      expect(newFindings.every((f) => f.severity !== "error")).toBe(true);
    });
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
