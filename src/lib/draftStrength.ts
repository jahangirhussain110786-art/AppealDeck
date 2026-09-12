import type { ComposerMode, CriticFinding } from "@/core";

/**
 * A visible signal for "is this draft actually any good", separate from the existing
 * evidence-completeness badge ("Full draft" / "Gap draft"). Founder feedback 12 Sep 2026: a
 * three-sentence, blame-shifting draft with no corrective actions was shown as "Full draft — all
 * required evidence is present", with nothing telling the seller the writing itself was thin.
 * Deterministic and cheap, like every other readiness/critic check — never an AI confidence score,
 * and never framed as a prediction of Amazon's decision (same constraint as READINESS_COPY).
 */
export type DraftStrength = "strong" | "needs_work" | "weak";

export function computeDraftStrength(
  mode: ComposerMode,
  findings: readonly CriticFinding[],
): DraftStrength {
  if (mode.mode === "gap-draft") return "weak";
  if (findings.some((f) => f.severity === "error")) return "weak";
  if (findings.some((f) => f.severity === "warning")) return "needs_work";
  return "strong";
}
