/**
 * The case record itself — the thing the vault stores and every surface reads.
 *
 * Extracted from `interviewEngine.ts` on 23 Sep 2026 (A-04) when that module was deleted. The
 * step engine it lived beside — `nextStep`, `applyAnswer`, `interviewProgress` and the step and
 * answer types — had no caller after the classic interview was retired on 22 Sep (`d9cb847`), and
 * the workspace is the only journey now. But `CaseFile` and `createCaseFile()` were never part of
 * the interview: twenty-odd modules read them, which is why the dead file could not simply be
 * removed and why it survived the retirement in the first place.
 *
 * Deleted with the step engine, and recoverable from `git show 37d606b:src/core/interviewEngine.ts`
 * rather than parked here unreachable: `alternativesFor()`, the two consultant-reviewed answers to
 * "I can't get this document". The A-02 rebuild wants that content, and the pointer is recorded in
 * `docs/handoffs/2026-09-23-gap-classification.md` — keeping an uncalled copy in the tree would
 * have recreated the exact disease this pass exists to cure.
 */
import type { ViolationKind } from "./index";
import type { CaseState } from "./caseState";
import type { EvidenceKind } from "./evidenceModel";
import { generateActionItems } from "./readiness";
import type { ActionItem } from "./readiness";
import type { SerializedDeadline } from "./deadlinesModel";

export interface CaseFile {
  workspace?: import("./workspace").Workspace;
  /**
   * Real, permanent identifier for this case (14 Sep 2026 multi-case fix) — a vault can now hold
   * more than one case, so nothing may assume "the one case" implicitly by name anymore.
   * `caseStore.ts` uses this as the vault partition key. A vault created before this field
   * existed has cases without one; `caseStore.ts` self-heals those on first read rather than
   * requiring every seller's existing case to be rewritten.
   */
  id: string;
  kind: ViolationKind;
  state: CaseState;
  /** ISO timestamp this case was created — set once by `createCaseFile()`, never recomputed. */
  createdAt: string;
  rootCause?: string;
  timelineEvents: Array<{ date: string; description: string }>;
  priorAppealCount: number;
  priorAppealsAnswered?: boolean;
  preventiveMeasures?: string;
  preventiveMeasuresAsked?: boolean;
  evidenceSlots: Partial<Record<EvidenceKind, { present: boolean; disqualified?: boolean }>>;
  actionItems: ActionItem[];
  attemptCount: number;
  /**
   * The deadlines `computeDeadlines()` produced when this case's notice was decoded (14 Sep
   * 2026 fix) — real due dates, not recomputed. Before this field existed, a case carried no
   * memory of its decode result at all: `/decode` showed a real countdown, then Dashboard
   * rendered a permanently-`dueAt: null` stub the instant the case was created. Absent on cases
   * started without a prior decode, or created before this field existed — callers must degrade
   * honestly rather than assume it is always present.
   */
  deadlines?: SerializedDeadline[];
  /**
   * Set to `"seller"` when the seller chose `kind` themselves through the correction control.
   *
   * Added 23 Sep 2026 with the classification wire-up. A notice typed into `/case` is now
   * classified each time its route is confirmed, which would otherwise quietly overwrite a seller
   * who had already told us we read it wrong — making the correction mechanism undo itself on the
   * next save. A seller's own choice is the one reading this product never second-guesses.
   * Absent means the kind came from us (a decode, a classification, or the `?kind=` link).
   */
  kindSetBy?: "seller";
}

export function createCaseFile(kind: ViolationKind): CaseFile {
  return {
    id: crypto.randomUUID(),
    kind,
    state: "DECODED",
    createdAt: new Date().toISOString(),
    timelineEvents: [],
    priorAppealCount: 0,
    priorAppealsAnswered: false,
    preventiveMeasures: undefined,
    preventiveMeasuresAsked: false,
    evidenceSlots: {},
    actionItems: generateActionItems(kind),
    attemptCount: 0,
  };
}
