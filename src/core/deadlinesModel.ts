import type { ViolationKind } from "./index";
import type { ParsedNotice } from "./noticeParser";

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

export function isIndefiniteHold(kind: ViolationKind): boolean {
  return kind === "INAUTHENTIC_DOCUMENTS";
}
