import { describe, it, expect } from "vitest";
import {
  computeReadiness,
  isRequiredComplete,
  generateActionItems,
  documentTypesFor,
  defaultDocumentType,
  composerModeFor,
  toneProfileFor,
  READINESS_COPY,
  readinessLabel,
} from "./readiness";
import type { CaseFileData } from "./readiness";

const baseCase = (overrides: Partial<CaseFileData> = {}): CaseFileData => ({
  kind: "POLICY",
  evidenceSlots: {},
  actionItems: [],
  ...overrides,
});

describe("computeReadiness", () => {
  it("returns score 1 when all required evidence present", () => {
    const data = baseCase({
      kind: "POLICY",
      evidenceSlots: { metric_export: { present: true } },
    });
    const result = computeReadiness(data);
    expect(result.score).toBe(1);
    expect(result.missing).toEqual([]);
  });

  it("returns score 0 when no required evidence present", () => {
    const data = baseCase({ kind: "POLICY" });
    const result = computeReadiness(data);
    expect(result.score).toBe(0);
    expect(result.missing.length).toBeGreaterThan(0);
  });

  it("flags disqualified evidence", () => {
    const data = baseCase({
      kind: "POLICY",
      evidenceSlots: { metric_export: { present: true, disqualified: true } },
    });
    const result = computeReadiness(data);
    expect(result.disqualifiedPresent).toContain("metric_export");
    expect(result.score).toBe(0);
  });

  it("flags unattested completed actions", () => {
    const data = baseCase({
      actionItems: [
        {
          id: "obtain_metric_export",
          label: "Obtain metric export",
          evidenceSlots: ["metric_export"],
          status: "done",
        },
      ],
    });
    const result = computeReadiness(data);
    expect(result.unattestedActions).toHaveLength(1);
  });

  it("does not flag attested actions", () => {
    const data = baseCase({
      actionItems: [
        {
          id: "obtain_metric_export",
          label: "Obtain metric export",
          evidenceSlots: ["metric_export"],
          status: "done",
          attestation: { attestedAt: new Date().toISOString(), note: "done" },
        },
      ],
    });
    const result = computeReadiness(data);
    expect(result.unattestedActions).toHaveLength(0);
  });

  it("UNKNOWN kind yields score 1 (no requirements)", () => {
    const data = baseCase({ kind: "UNKNOWN" });
    expect(computeReadiness(data).score).toBe(1);
  });
});

describe("isRequiredComplete", () => {
  it("true when satisfied", () => {
    const data = baseCase({
      kind: "POLICY",
      evidenceSlots: { metric_export: { present: true } },
    });
    expect(isRequiredComplete(data)).toBe(true);
  });

  it("false when missing", () => {
    expect(isRequiredComplete(baseCase({ kind: "POLICY" }))).toBe(false);
  });
});

describe("generateActionItems", () => {
  it("creates one item per required evidence kind", () => {
    const items = generateActionItems("FUNDS");
    expect(items.length).toBeGreaterThan(0);
    expect(items.every((i) => i.status === "todo")).toBe(true);
  });

  it("returns empty for UNKNOWN", () => {
    expect(generateActionItems("UNKNOWN")).toEqual([]);
  });
});

describe("document type router", () => {
  it("maps IP to ip_dispute", () => {
    expect(documentTypesFor("INTELLECTUAL_PROPERTY")).toContain("ip_dispute");
  });

  it("maps FUNDS to funds_appeal", () => {
    expect(documentTypesFor("FUNDS")).toContain("funds_appeal");
  });

  it("maps LISTING to listing_appeal", () => {
    expect(documentTypesFor("LISTING")).toContain("listing_appeal");
  });

  it("maps RELATED_ACCOUNT to poa", () => {
    expect(documentTypesFor("RELATED_ACCOUNT")).toContain("poa");
  });

  it("defaultDocumentType returns first match", () => {
    expect(defaultDocumentType("INTELLECTUAL_PROPERTY")).toBe("ip_dispute");
    expect(defaultDocumentType("FUNDS")).toBe("funds_appeal");
  });
});

describe("composer mode", () => {
  it("full-draft when complete", () => {
    const data = baseCase({
      kind: "POLICY",
      evidenceSlots: { metric_export: { present: true } },
    });
    expect(composerModeFor(data).mode).toBe("full-draft");
  });

  it("gap-draft when incomplete", () => {
    const mode = composerModeFor(baseCase({ kind: "POLICY" }));
    expect(mode.mode).toBe("gap-draft");
    expect(mode.reason).toMatch(/incomplete/i);
  });
});

describe("tone profiles", () => {
  it("ip_dispute uses factual-rebuttal", () => {
    expect(toneProfileFor("ip_dispute")).toBe("factual-rebuttal");
  });

  it("poa uses ownership", () => {
    expect(toneProfileFor("poa")).toBe("ownership");
  });
});

describe("readiness copy", () => {
  it("copy never implies a prediction with probability words", () => {
    expect(READINESS_COPY).not.toMatch(
      /\bchance\b|\bodds\b|\bprobability\b|\blikely\b|\bunlikely\b/i,
    );
  });

  it("copy explicitly disclaims being a prediction", () => {
    expect(READINESS_COPY).toContain("not a prediction");
  });

  it("label includes the fixed wording", () => {
    expect(readinessLabel(0.75)).toContain("not a prediction");
  });
});
