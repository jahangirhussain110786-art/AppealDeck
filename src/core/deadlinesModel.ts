import type { ViolationKind } from "./index";
import type { ParsedNotice } from "./noticeParser";
import { isSeverityGated } from "./violationKinds";
import { formatDay } from "./noticeDate";

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
  /**
   * The calendar day this window is counted from (YYYY-MM-DD), when we actually know it — shown to
   * the seller so they can check it against the date on their own email.
   */
  startsOn?: string;
  /**
   * The notice states how long the window is but not when it began. The window runs from the day
   * the seller received the notice, and we say exactly that instead of inventing a date.
   */
  startsOnReceipt?: boolean;
  /**
   * The calendar day the window closes (YYYY-MM-DD), set only when that day comes from the notice
   * itself: a date it states outright, or a stated length counted from its own header date. Absent
   * means `dueAt` is not grounded in the notice.
   *
   * Displayed in place of `dueAt`, which is midnight UTC on this day: formatted in the seller's own
   * time zone that instant is the day before anywhere west of Greenwich, so a notice saying "by
   * 1 October 2026" would have been shown to a US seller as 30 September.
   */
  dueOn?: string;
}

export interface DeadlineInput {
  /**
   * The day the notice arrived, when the caller genuinely knows it. Optional since 23 Sep 2026:
   * both production callers used to pass `new Date()`, which counted every window from the moment
   * of decoding. Omit it unless it is known; the notice's own header date is used next, and failing
   * that the window is described relative to receipt.
   */
  noticeReceivedAt?: Date;
  deactivatedAt?: Date;
  parsed: ParsedNotice;
  kind: ViolationKind;
  aha?: boolean;
  /** Used only to reject a header date in the future, which no real notice has. */
  now?: Date;
}

const DAY_MS = 86_400_000;

function addDays(from: Date, days: number): Date {
  return new Date(from.getTime() + days * DAY_MS);
}

/** Midnight UTC on a YYYY-MM-DD calendar day. */
function dayStart(isoDay: string): Date {
  return new Date(`${isoDay}T00:00:00.000Z`);
}

function isoDayOf(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * The day a window is counted from, or null when we do not actually know it.
 *
 * A header date more than two days in the future is refused: no real notice is dated ahead, and
 * accepting one would push the deadline later than it really is — the dangerous direction. Two days
 * leaves room for time zones and nothing more.
 */
function windowStart(input: DeadlineInput): string | null {
  if (input.noticeReceivedAt) return isoDayOf(input.noticeReceivedAt);
  const stated = input.parsed.receivedOn;
  if (!stated) return null;
  const latest = addDays(input.now ?? new Date(), 2);
  return dayStart(stated) > latest ? null : stated;
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

  /*
    When the window started. Corrected 23 Sep 2026: this was always `noticeReceivedAt`, and both
    production callers passed `new Date()` — so every window was counted from the moment of the
    call, which for a notice received twenty days ago ends twenty days late. `/api/decode` already
    discarded those dates, so the decoder never showed one; applying an Amazon reply did not, and
    stored a window counted from the click that the workspace then displayed as real. That is the
    most expensive mistake this file can make, because the window is the part of a deactivation
    that actually expires.

    Founder direction the same day: use the date only if the notice itself carries it; otherwise say
    the window runs from the day it was received, and never invent one. So: a date the caller really
    knows, then the notice's own header date, then nothing — and "nothing" is stated plainly rather
    than papered over with a countdown.
  */
  const start = windowStart(input);
  const days = input.parsed.statedWindowDays;
  const legacy = input.parsed.legacySeventeenDay && days === 17;
  const stated = input.parsed.statedDeadline;

  /*
    A notice that names its last day outright ("submit your appeal by 1 October 2026") is taken at
    its word, ahead of any counted window: it needs no start date and no arithmetic, so it is the
    most reliable deadline a notice can carry. Added 23 Sep 2026 — before this, such a notice was
    shown as having no fixed window at all.
  */
  if (stated) {
    out.push({
      kind: "appeal_window",
      dueAt: dayStart(stated.day),
      label: `Appeal by ${formatDay(stated.day)}`,
      dueOn: stated.day,
    });
  } else if (days !== null) {
    const label = legacy
      ? "Stated 17-day window (LEGACY parse pattern — verify, never presented as current policy)"
      : start
        ? `Appeal window: ${days} days from ${formatDay(start)}`
        : `Appeal window: ${days} days`;
    if (start) {
      const dueAt = addDays(dayStart(start), days);
      out.push({ kind: "appeal_window", dueAt, label, startsOn: start, dueOn: isoDayOf(dueAt) });
    } else {
      out.push({ kind: "appeal_window", dueAt: null, label, startsOnReceipt: true });
    }
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
  startsOn?: string;
  startsOnReceipt?: boolean;
  dueOn?: string;
}

export function serializeDeadlines(deadlines: readonly Deadline[]): SerializedDeadline[] {
  return deadlines.map((d) => ({ ...d, dueAt: d.dueAt ? d.dueAt.toISOString() : null }));
}

/**
 * Corrects appeal-window dates a case saved before 23 Sep 2026 may still hold. Run on every case
 * file as it is read, so no screen and no reminder sees the old value.
 *
 * Until `c9bb022` every production caller passed `new Date()` as the day a notice arrived, so a
 * stored window was counted from the moment of a click — for a notice received twenty days
 * earlier, twenty days late. `/api/decode` discarded those dates before they reached anyone;
 * applying an Amazon reply did not, and saved one that the workspace showed as the seller's real
 * deadline. The history of every caller was checked: none ever passed a date the seller gave.
 *
 * They are recognisable without guessing. Since that commit an appeal-window date is only ever
 * stored with the day it was counted from (`startsOn`) or the day the notice names (`dueOn`); a
 * date with neither was counted from a click. The true start cannot be recovered, so the date is
 * dropped and the window described the way an undated notice's is — its length, running from the
 * day the seller received the notice. The next confirmation of the case recomputes it from the
 * notice text, header date and all.
 *
 * Windows saved between `c9bb022` and the day `dueOn` was added carry `startsOn`, and are genuine;
 * they get the `dueOn` their `dueAt` already encodes, so they display on the right calendar day.
 */
export function repairStoredDeadlines(
  deadlines: readonly SerializedDeadline[] | undefined,
): SerializedDeadline[] | undefined {
  if (!deadlines) return deadlines;
  return deadlines.map((d) => {
    if (d.kind !== "appeal_window" || !d.dueAt || d.dueOn) return d;
    if (d.startsOn) return { ...d, dueOn: d.dueAt.slice(0, 10) };
    // "Appeal window: 30 days from notice" — the old label, written when the start was assumed.
    const label = d.label.replace(/ from notice$/, "");
    const statesLength = /\b\d{1,3}[\s-]days?\b/i.test(label);
    return { ...d, dueAt: null, label, ...(statesLength ? { startsOnReceipt: true } : {}) };
  });
}
