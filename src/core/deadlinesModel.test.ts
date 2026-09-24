import { describe, it, expect } from "vitest";
import { computeDeadlines, serializeDeadlines, repairStoredDeadlines } from "./deadlinesModel";
import type { Deadline } from "./deadlinesModel";
import { parseNotice } from "./noticeParser";

describe("serializeDeadlines", () => {
  it("converts a real due date to an ISO string", () => {
    const dueAt = new Date("2026-09-20T00:00:00.000Z");
    const deadlines: Deadline[] = [
      { kind: "appeal_window", dueAt, label: "Appeal window: 3 days from notice" },
    ];
    const serialized = serializeDeadlines(deadlines);
    expect(serialized).toEqual([
      {
        kind: "appeal_window",
        dueAt: "2026-09-20T00:00:00.000Z",
        label: "Appeal window: 3 days from notice",
      },
    ]);
  });

  it("keeps a null due date as null rather than a string", () => {
    const deadlines: Deadline[] = [
      { kind: "appeal_window", dueAt: null, label: "Appeal window ambiguous" },
    ];
    expect(serializeDeadlines(deadlines)[0]!.dueAt).toBeNull();
  });

  it("carries isIndefinite through unchanged", () => {
    const deadlines: Deadline[] = [
      { kind: "indefinite_hold", dueAt: null, label: "No countdown", isIndefinite: true },
    ];
    expect(serializeDeadlines(deadlines)[0]!.isIndefinite).toBe(true);
  });

  it("returns an empty array for no deadlines", () => {
    expect(serializeDeadlines([])).toEqual([]);
  });
});

describe("computeDeadlines", () => {
  /**
   * The previous version of this test was called "replaces the stated appeal window with an
   * indefinite-hold entry", and its notice said *"some of your items are not authentic. Submit your
   * appeal within 17 days."* It asserted that the 17 days were thrown away and the seller shown
   * "No fixed appeal window" instead.
   *
   * Two errors in one: that notice is an ordinary authenticity complaint rather than an allegation
   * of falsified records, and even on a genuinely gated case the window is a fact stated in
   * Amazon's own notice. Deleting it is the one thing here that could actually cost someone their
   * account, because the window is the part of a deactivation that expires.
   *
   * `computeDeadlines` no longer consults severity at all.
   */
  it("keeps a stated appeal window whatever the violation kind", () => {
    const parsed = parseNotice(
      "Your account has been deactivated because we received a report that some of your items are not authentic. Submit your appeal within 17 days.",
    );
    for (const kind of ["INAUTHENTIC", "INAUTHENTIC_DOCUMENTS", "POLICY"] as const) {
      const deadlines = computeDeadlines({
        noticeReceivedAt: new Date("2026-09-19T00:00:00.000Z"),
        parsed,
        kind,
      });
      const window = deadlines.find((d) => d.kind === "appeal_window");
      expect(window?.dueAt?.toISOString().slice(0, 10), kind).toBe("2026-10-06");
      expect(
        deadlines.find((d) => d.kind === "indefinite_hold"),
        kind,
      ).toBeUndefined();
    }
  });

  it("still computes a normal appeal-window deadline for every other kind", () => {
    const parsed = parseNotice(
      "Your account has been deactivated. Submit your appeal within 17 days.",
    );
    const deadlines = computeDeadlines({
      noticeReceivedAt: new Date("2026-09-19T00:00:00.000Z"),
      parsed,
      kind: "POLICY",
    });
    expect(deadlines.some((d) => d.kind === "indefinite_hold")).toBe(false);
    expect(deadlines[0]!.kind).toBe("appeal_window");
  });
});

/**
 * 23 Sep 2026. Both production callers passed `new Date()` as the receipt date, so every stated
 * window was counted from the moment of the call. Founder direction: use the date only
 * when the notice itself carries it; otherwise say the window runs from the day it was received, and
 * never invent one.
 */
describe("where a window is counted from", () => {
  const NOW = new Date("2026-09-23T12:00:00.000Z");

  /**
   * The defect itself, in its own terms. The notice was sent on 3 September with thirty days to
   * appeal, so the deadline is 3 October — ten days away on the 23rd. Counting from the moment of
   * decoding would have said 23 October: twenty days later than the window really closes, which is
   * the direction in which a seller misses it.
   */
  it("counts from the notice's own date, not from the moment it is decoded", () => {
    const parsed = parseNotice(
      "Date: 3 Sep 2026\n\nYour account has been deactivated. You may appeal within 30 days.",
    );
    const [window] = computeDeadlines({ parsed, kind: "POLICY", now: NOW });
    expect(window!.dueAt?.toISOString().slice(0, 10)).toBe("2026-10-03");
    expect(window!.startsOn).toBe("2026-09-03");
    // The seller can check the start against their own email.
    expect(window!.label).toBe("Appeal window: 30 days from 3 Sep 2026");
  });

  it("gives no countdown when the notice does not carry its date, and says what it runs from", () => {
    const parsed = parseNotice("Your account has been deactivated. You may appeal within 30 days.");
    const [window] = computeDeadlines({ parsed, kind: "POLICY", now: NOW });
    expect(window!.dueAt).toBeNull();
    expect(window!.startsOnReceipt).toBe(true);
    // The length Amazon stated is still shown — only the start is unknown.
    expect(window!.label).toBe("Appeal window: 30 days");
  });

  it("refuses a header date in the future, which would push the deadline later than it is", () => {
    const parsed = parseNotice("Date: 1 Dec 2026\n\nYou may appeal within 30 days.");
    const [window] = computeDeadlines({ parsed, kind: "POLICY", now: NOW });
    expect(window!.dueAt).toBeNull();
    expect(window!.startsOnReceipt).toBe(true);
  });

  it("allows a header dated a day ahead, which is only a time zone", () => {
    const parsed = parseNotice("Date: 24 Sep 2026\n\nYou may appeal within 30 days.");
    const [window] = computeDeadlines({ parsed, kind: "POLICY", now: NOW });
    expect(window!.startsOn).toBe("2026-09-24");
  });

  it("prefers a receipt date the caller genuinely knows over the header", () => {
    const parsed = parseNotice("Date: 3 Sep 2026\n\nYou may appeal within 30 days.");
    const [window] = computeDeadlines({
      parsed,
      kind: "POLICY",
      noticeReceivedAt: new Date("2026-09-05T00:00:00.000Z"),
      now: NOW,
    });
    expect(window!.startsOn).toBe("2026-09-05");
  });

  it("treats the legacy 17-day wording the same way when the notice carries no date", () => {
    const parsed = parseNotice(
      "You have 17 days from the date of this notice to submit a Plan of Action.",
    );
    const [window] = computeDeadlines({ parsed, kind: "POLICY", now: NOW });
    expect(window!.dueAt).toBeNull();
    expect(window!.startsOnReceipt).toBe(true);
    expect(window!.label).toMatch(/LEGACY/);
  });

  it("keeps both new fields through serialisation, which is how they reach the vault", () => {
    const parsed = parseNotice("You may appeal within 30 days.");
    const [stored] = serializeDeadlines(computeDeadlines({ parsed, kind: "POLICY", now: NOW }));
    expect(stored).toMatchObject({ dueAt: null, startsOnReceipt: true });
  });

  it("records the calendar day a counted window closes", () => {
    const parsed = parseNotice("Date: 3 Sep 2026\n\nYou may appeal within 30 days.");
    const [window] = computeDeadlines({ parsed, kind: "POLICY", now: NOW });
    expect(window!.dueOn).toBe("2026-10-03");
  });
});

/**
 * 23 Sep 2026. A notice that named its last day ("submit your appeal by 1 October 2026") was shown
 * as having no fixed window at all, because only "within N days" was read.
 */
describe("a last day the notice states as a date", () => {
  const NOW = new Date("2026-09-23T12:00:00.000Z");

  it("becomes the deadline, with no start date needed", () => {
    const parsed = parseNotice(
      "Your account has been deactivated. Submit your appeal by 1 October 2026.",
    );
    const [window] = computeDeadlines({ parsed, kind: "POLICY", now: NOW });
    expect(window).toEqual({
      kind: "appeal_window",
      dueAt: new Date("2026-10-01T00:00:00.000Z"),
      label: "Appeal by 1 Oct 2026",
      dueOn: "2026-10-01",
    });
  });

  it("wins over a counted window, because it needs no arithmetic", () => {
    const parsed = parseNotice(
      "Date: 3 Sep 2026\n\nYou may appeal within 30 days. Submit your appeal no later than 1 October 2026.",
    );
    const [window] = computeDeadlines({ parsed, kind: "POLICY", now: NOW });
    expect(window!.dueOn).toBe("2026-10-01");
    expect(window!.startsOn).toBeUndefined();
  });

  it("is no longer described as an ambiguous window", () => {
    const parsed = parseNotice("Submit your appeal by 1 October 2026.");
    expect(parsed.windowAmbiguous).toBe(false);
    const [window] = computeDeadlines({ parsed, kind: "POLICY", now: NOW });
    expect(window!.label).not.toMatch(/ambiguous/i);
  });
});

/**
 * 23 Sep 2026. Every production caller before `c9bb022` counted a window from the moment of a
 * click, and the reply path saved the result. `repairStoredDeadlines` runs on every case as it is
 * read. Each of these was checked against the pre-fix shapes the old code actually wrote.
 */
describe("repairStoredDeadlines", () => {
  it("drops a date counted from a click and says the window runs from receipt", () => {
    expect(
      repairStoredDeadlines([
        {
          kind: "appeal_window",
          dueAt: "2026-10-23T09:14:02.511Z",
          label: "Appeal window: 30 days from notice",
        },
      ]),
    ).toEqual([
      {
        kind: "appeal_window",
        dueAt: null,
        label: "Appeal window: 30 days",
        startsOnReceipt: true,
      },
    ]);
  });

  it("does the same for the legacy 17-day label, keeping its warning", () => {
    const label =
      "Stated 17-day window (LEGACY parse pattern — verify, never presented as current policy)";
    expect(
      repairStoredDeadlines([{ kind: "appeal_window", dueAt: "2026-10-10T09:14:02.511Z", label }]),
    ).toEqual([{ kind: "appeal_window", dueAt: null, label, startsOnReceipt: true }]);
  });

  it("keeps a window counted from the notice's own date, and gives it its closing day", () => {
    expect(
      repairStoredDeadlines([
        {
          kind: "appeal_window",
          dueAt: "2026-10-03T00:00:00.000Z",
          label: "Appeal window: 30 days from 3 Sep 2026",
          startsOn: "2026-09-03",
        },
      ]),
    ).toEqual([
      {
        kind: "appeal_window",
        dueAt: "2026-10-03T00:00:00.000Z",
        label: "Appeal window: 30 days from 3 Sep 2026",
        startsOn: "2026-09-03",
        dueOn: "2026-10-03",
      },
    ]);
  });

  it("never touches a date the notice named, or a deadline of another kind", () => {
    const stored = [
      {
        kind: "appeal_window" as const,
        dueAt: "2026-10-01T00:00:00.000Z",
        label: "Appeal by 1 Oct 2026",
        dueOn: "2026-10-01",
      },
      {
        kind: "funds_review" as const,
        dueAt: "2026-12-01T00:00:00.000Z",
        label: "Funds review checkpoint (~90 days) — release is NEVER automatic",
      },
      {
        kind: "appeal_window" as const,
        dueAt: null,
        label: "Appeal window: 30 days",
        startsOnReceipt: true,
      },
    ];
    expect(repairStoredDeadlines(stored)).toEqual(stored);
  });

  it("passes a case with no deadlines through as it is", () => {
    expect(repairStoredDeadlines(undefined)).toBeUndefined();
  });
});
