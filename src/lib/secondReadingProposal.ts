import type { ViolationKind } from "@/core/violationKinds";

/**
 * R-2 (10 Oct 2026): whether a seller kept the AI second reading or changed it, measured at the
 * moment they confirm the case ("Yes, this is right"), which is where the reading is judged.
 *
 * The proposal is noted when the seller takes it (on /decode by opening the case, on the case page
 * by pressing "Use this reading") and taken once at confirmation. Only the kind's name is kept, in
 * this tab's session storage, and for an hour, so a proposal the seller walked away from is not
 * counted against a case confirmed much later. Counting is all this is for: nothing here changes
 * what the case does.
 */
const KEY = "appealdeck:second-reading-proposal";
const MAX_AGE_MS = 60 * 60 * 1000;

export function noteProposal(kind: ViolationKind, now = Date.now()): void {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ kind, at: now }));
  } catch {
    // No storage: the outcome is simply not counted.
  }
}

/** The proposal still pending, if any; reading it clears it, so each is counted once. */
export function takeProposal(now = Date.now()): ViolationKind | null {
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    sessionStorage.removeItem(KEY);
    const value = JSON.parse(raw) as { kind?: unknown; at?: unknown };
    if (typeof value.kind !== "string" || typeof value.at !== "number") return null;
    if (now - value.at > MAX_AGE_MS || now < value.at) return null;
    return value.kind as ViolationKind;
  } catch {
    return null;
  }
}
