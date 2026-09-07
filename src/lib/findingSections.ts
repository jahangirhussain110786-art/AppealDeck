import type { CriticFinding, PoaSection } from "@/core";

/** Section index used for findings that belong to the whole draft rather than one section. */
export const GLOBAL_FINDING = -1;

export type BadgeSeverity = "high" | "medium" | "low";

export function badgeSeverity(severity: CriticFinding["severity"]): BadgeSeverity {
  if (severity === "error") return "high";
  if (severity === "warning") return "medium";
  return "low";
}

export function worstSeverity(findings: readonly CriticFinding[]): BadgeSeverity {
  if (findings.some((f) => f.severity === "error")) return "high";
  if (findings.some((f) => f.severity === "warning")) return "medium";
  return "low";
}

/** Finding code → the section heading it belongs under. Keyed by code, never by message text. */
const HEADING_BY_CODE: Readonly<Record<string, RegExp>> = {
  EMPTY_EVIDENCE_SLOTS: /evidence/i,
  UNATTESTED_CLAIMS: /corrective/i,
  NOVELTY_REMINDER: /root cause/i,
};

/**
 * Attach a critic finding to a section index.
 *
 * - `SEVERITY_GATE` and unknown codes are draft-wide (`GLOBAL_FINDING`).
 * - Evidence / attestation / novelty findings go to their section by heading.
 * - `BANNED_*` findings go to the section whose body contains the quoted phrase from the
 *   message, if the engine quoted one; otherwise to the first section.
 */
export function attachFindingToSection(
  finding: CriticFinding,
  sections: readonly PoaSection[],
): number {
  if (finding.code === "SEVERITY_GATE") return GLOBAL_FINDING;

  const headingRe = HEADING_BY_CODE[finding.code];
  if (headingRe) return sections.findIndex((s) => headingRe.test(s.heading));

  if (finding.code.startsWith("BANNED_")) {
    const quoted = finding.message.match(/"([^"]+)"/)?.[1];
    if (quoted) {
      const needle = quoted.toLowerCase();
      const hit = sections.findIndex((s) => s.body.toLowerCase().includes(needle));
      if (hit >= 0) return hit;
    }
    return sections.length > 0 ? 0 : GLOBAL_FINDING;
  }

  return GLOBAL_FINDING;
}

export interface GroupedFindings {
  /** One bucket per section, in section order. */
  bySection: CriticFinding[][];
  /** Draft-wide findings (severity gate, unmatched codes). */
  global: CriticFinding[];
}

export function groupFindingsBySection(
  findings: readonly CriticFinding[],
  sections: readonly PoaSection[],
): GroupedFindings {
  const bySection: CriticFinding[][] = sections.map(() => []);
  const global: CriticFinding[] = [];
  for (const finding of findings) {
    const index = attachFindingToSection(finding, sections);
    const bucket = index >= 0 ? bySection[index] : undefined;
    if (bucket) bucket.push(finding);
    else global.push(finding);
  }
  return { bySection, global };
}
