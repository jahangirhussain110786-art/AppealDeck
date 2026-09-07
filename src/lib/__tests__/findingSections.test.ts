import { describe, it, expect } from "vitest";
import { composePoa, critiquePoa, requiredKinds } from "@/core";
import type { CaseFileData, CriticFinding, PoaSection, ViolationKind } from "@/core";
import {
  attachFindingToSection,
  groupFindingsBySection,
  badgeSeverity,
  worstSeverity,
  GLOBAL_FINDING,
} from "@/lib/findingSections";

const SECTIONS: PoaSection[] = [
  { heading: "Root Cause", body: "We sourced from an unverified wholesaler." },
  { heading: "Corrective Actions", body: "We removed the affected ASINs." },
  { heading: "Preventive Measures", body: "We now require an invoice before listing." },
  { heading: "Evidence Gaps (Action Required)", body: "Obtain supplier invoice." },
];

function finding(
  code: string,
  message = "",
  severity: CriticFinding["severity"] = "warning",
): CriticFinding {
  return { code, message, severity };
}

describe("attachFindingToSection", () => {
  it("routes empty evidence slots to the evidence section", () => {
    expect(attachFindingToSection(finding("EMPTY_EVIDENCE_SLOTS"), SECTIONS)).toBe(3);
  });

  it("routes unattested claims to corrective actions", () => {
    expect(attachFindingToSection(finding("UNATTESTED_CLAIMS"), SECTIONS)).toBe(1);
  });

  it("routes the novelty reminder to root cause", () => {
    expect(attachFindingToSection(finding("NOVELTY_REMINDER"), SECTIONS)).toBe(0);
  });

  it("keeps the severity gate draft-wide", () => {
    expect(attachFindingToSection(finding("SEVERITY_GATE", "", "error"), SECTIONS)).toBe(
      GLOBAL_FINDING,
    );
  });

  it("maps by code, not by words in the message", () => {
    const misleading = finding(
      "EMPTY_EVIDENCE_SLOTS",
      "The root cause and corrective actions are fine; evidence is missing.",
    );
    expect(attachFindingToSection(misleading, SECTIONS)).toBe(3);
  });

  it("routes banned language to the section whose body contains the quoted phrase", () => {
    const banned = finding("BANNED_TIME_PROMISE", 'Remove "invoice before listing".', "error");
    expect(attachFindingToSection(banned, SECTIONS)).toBe(2);
  });

  it("falls back to the first section for banned language without a quoted phrase", () => {
    const banned = finding("BANNED_GUARANTEE", "Remove promise-of-success language.", "error");
    expect(attachFindingToSection(banned, SECTIONS)).toBe(0);
  });

  it("falls back to the first section when the quoted phrase is in no section", () => {
    const banned = finding("BANNED_BLAME", 'Remove "not present anywhere".', "error");
    expect(attachFindingToSection(banned, SECTIONS)).toBe(0);
  });

  it("sends unknown codes to the draft-wide list", () => {
    expect(attachFindingToSection(finding("SOMETHING_NEW"), SECTIONS)).toBe(GLOBAL_FINDING);
  });

  it("agrees with the engine: its gap finding lands on its gap section", () => {
    const kinds: ViolationKind[] = ["RELATED_ACCOUNT", "POLICY", "LISTING", "FUNDS", "UNKNOWN"];
    const kind = kinds.find((k) => requiredKinds(k).length > 0);
    expect(kind).toBeDefined();
    if (!kind) return;

    const data: CaseFileData = { kind, evidenceSlots: {}, actionItems: [] };
    const draft = composePoa(data);
    const critique = critiquePoa(draft, data);
    const gap = critique.findings.find((f) => f.code === "EMPTY_EVIDENCE_SLOTS");
    const gapIndex = draft.sections.findIndex((s) => /evidence/i.test(s.heading));

    expect(gap).toBeDefined();
    expect(gapIndex).toBeGreaterThanOrEqual(0);
    if (gap) expect(attachFindingToSection(gap, draft.sections)).toBe(gapIndex);
  });
});

describe("groupFindingsBySection", () => {
  it("buckets each finding exactly once and keeps draft-wide ones separate", () => {
    const findings = [
      finding("SEVERITY_GATE", "", "error"),
      finding("UNATTESTED_CLAIMS"),
      finding("EMPTY_EVIDENCE_SLOTS"),
    ];
    const { bySection, global } = groupFindingsBySection(findings, SECTIONS);

    expect(global.map((f) => f.code)).toEqual(["SEVERITY_GATE"]);
    expect(bySection[1]?.map((f) => f.code)).toEqual(["UNATTESTED_CLAIMS"]);
    expect(bySection[3]?.map((f) => f.code)).toEqual(["EMPTY_EVIDENCE_SLOTS"]);
    expect(bySection.flat()).toHaveLength(2);
  });

  it("returns one bucket per section even with no findings", () => {
    const { bySection, global } = groupFindingsBySection([], SECTIONS);
    expect(bySection).toHaveLength(SECTIONS.length);
    expect(bySection.every((b) => b.length === 0)).toBe(true);
    expect(global).toEqual([]);
  });
});

describe("severity mapping", () => {
  it("maps critic severities onto badge levels", () => {
    expect(badgeSeverity("error")).toBe("high");
    expect(badgeSeverity("warning")).toBe("medium");
    expect(badgeSeverity("info")).toBe("low");
  });

  it("reports the worst severity in a group", () => {
    expect(worstSeverity([finding("A", "", "info"), finding("B", "", "warning")])).toBe("medium");
    expect(worstSeverity([finding("A", "", "info"), finding("B", "", "error")])).toBe("high");
    expect(worstSeverity([finding("A", "", "info")])).toBe("low");
    expect(worstSeverity([])).toBe("low");
  });
});
