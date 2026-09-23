import type { ViolationKind } from "./index";
import type { ParsedNotice } from "./noticeParser";
import { isSeverityGated } from "./violationKinds";

export type DeadlineKind =
  | "appeal_window"
  | "funds_appeal_eligible"
  | "funds_review"
  | "seller_challenge"
  | "aha_72h"
  | "indefinite_hold"
  | "custom";

export interface Deadline {
  kind: DeadlineKind;
  dueAt: Date | null;
  label: string;
  isIndefinite?: boolean;
}

export interface DeadlineInput {
  noticeReceivedAt: Date;
  deactivatedAt?: Date;
  parsed: ParsedNotice;
  kind: ViolationKind;
  aha?: boolean;
}

const DAY_MS = 86_400_000;

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * DAY_MS);
}

export function computeDeadlines(input: DeadlineInput): Deadline[] {
  const out: Deadline[] = [];

  /*
    There used to be a severity check here that `return`ed early, discarding everything below —
    including a window Amazon had stated in their own notice. A seller whose notice said "you may
    appeal within 30 days" was shown "No fixed appeal window — routed to professional help" and no
    date at all, on a case the product had also declined to help with. Being told there is no
    deadline when there is one is the most costly thing this file can do, because the window is the
    part of a deactivation that actually expires.

    Removed entirely on 23 Sep 2026 rather than narrowed. Whether AppealDeck will draft a response
    is a decision about us; when the seller must reply is a fact about their notice. Nothing about
    the second should depend on the first, so this function no longer takes severity into account
    at all — and where the notice states no window, the ambiguous entry below already says so
    honestly, for gated and ordinary cases alike. Gating is communicated where it belongs: the
    route, the case state, and the guidance for that kind.
  */

  if (input.parsed.legacySeventeenDay && input.parsed.statedWindowDays === 17) {
    out.push({
      kind: "appeal_window",
      dueAt: addDays(input.noticeReceivedAt, 17),
      label:
        "Stated 17-day window (LEGACY parse pattern — verify, never presented as current policy)",
    });
  } else if (input.parsed.statedWindowDays !== null) {
    out.push({
      kind: "appeal_window",
      dueAt: addDays(input.noticeReceivedAt, input.parsed.statedWindowDays),
      label: `Appeal window: ${input.parsed.statedWindowDays} days from notice`,
    });
  } else {
    out.push({
      kind: "appeal_window",
      dueAt: null,
      label: "Appeal window ambiguous — verify the exact date in your Account Health dashboard",
    });
  }

  if (input.kind === "FUNDS") {
    if (input.deactivatedAt) {
      out.push({
        kind: "funds_appeal_eligible",
        dueAt: addDays(input.deactivatedAt, 60),
        label: "Funds appeal becomes available (~60 days from deactivation)",
      });
      out.push({
        kind: "funds_review",
        dueAt: addDays(input.deactivatedAt, 90),
        label: "Funds review checkpoint (~90 days) — release is NEVER automatic",
      });
    } else {
      out.push({
        kind: "funds_review",
        dueAt: null,
        label: "Funds review checkpoint — provide deactivation date to compute",
      });
    }
  }

  if (input.kind === "LISTING" && input.aha) {
    out.push({
      kind: "seller_challenge",
      dueAt: null,
      label: "Seller Challenge available (AHA): 3 uses / 180 days, ~48h decision",
    });
  }

  return out;
}

/**
 * Whether this kind is one AppealDeck declines to draft a response for.
 *
 * It no longer affects any deadline — see `computeDeadlines`. Kept because callers legitimately ask
 * the question, but renamed in meaning rather than left as "indefinite hold", which was never true:
 * a gated notice can state a perfectly definite window, and one of the fixtures now does.
 */
export function isIndefiniteHold(kind: ViolationKind): boolean {
  return isSeverityGated(kind);
}

/**
 * JSON-safe shape of `Deadline` for persistence — `Date` does not survive a JSON round trip
 * (`JSON.stringify`/`parse`, or an API response, turns it into a string or drops it). Anything
 * written to the vault must use this shape instead. `DeadlineChip`'s own `DeadlineLike` type
 * already expects exactly this (`dueAt: Date | string | null`), so nothing on the read side
 * needs to change.
 */
export interface SerializedDeadline {
  kind: DeadlineKind;
  dueAt: string | null;
  label: string;
  isIndefinite?: boolean;
}

export function serializeDeadlines(deadlines: readonly Deadline[]): SerializedDeadline[] {
  return deadlines.map((d) => ({ ...d, dueAt: d.dueAt ? d.dueAt.toISOString() : null }));
}
