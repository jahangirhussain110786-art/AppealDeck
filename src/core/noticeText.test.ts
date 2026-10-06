import { describe, expect, it } from "vitest";
import { FIXTURES } from "./fixtures";
import { extractEntities } from "./entities";
import { parseNotice } from "./noticeParser";
import {
  assessGarbled,
  assessNotEnforcement,
  detectMultipleNotices,
  lastAmazonTurn,
  looksLikeSellerText,
  normalizeNoticeText,
  repairOcrText,
  splitNotices,
  splitSpeakerTurns,
} from "./noticeText";

describe("normalizeNoticeText", () => {
  it("decodes HTML entities, including numeric ones", () => {
    expect(
      normalizeNoticeText("Plan&nbsp;of&nbsp;Action &amp; &rsquo;x&rsquo; &#8217; &#x41;"),
    ).toBe("Plan of Action & 'x' ' A");
  });

  it("strips tags, turning breaks and paragraphs into line breaks, and keeps an email in angle brackets", () => {
    const out = normalizeNoticeText(
      "<p>Dear seller,</p><p>Your <b>account</b> was suspended.<br>From <seller-performance@amazon.com></p>",
    );
    expect(out.trim()).toBe(
      "Dear seller,\nYour account was suspended.\nFrom <seller-performance@amazon.com>",
    );
  });

  it("keeps the target of a link, because the authenticity check needs it", () => {
    expect(normalizeNoticeText('<a href="https://evil.example/x">Seller Central</a>')).toContain(
      "https://evil.example/x",
    );
  });

  it("maps tabs and non-breaking spaces to one space and collapses runs", () => {
    expect(normalizeNoticeText("Plan\tof   Action now")).toBe("Plan of Action now");
  });

  it("removes quote markers, markdown bold and underscores-emphasis but not a blank line", () => {
    expect(normalizeNoticeText("> > **Date:** 12 September 2026\n> __Subject:__ Policy")).toBe(
      "Date: 12 September 2026\nSubject: Policy",
    );
    expect(normalizeNoticeText("Laboratory: ______")).toBe("Laboratory: ______");
  });

  it("deletes soft hyphens, zero-width characters and the byte-order mark", () => {
    expect(normalizeNoticeText("﻿pol­icy vio​lation")).toBe("policy violation");
  });

  it("rejoins a word split by hyphenation across a line break", () => {
    expect(normalizeNoticeText("the cancel-\nlation rate is high")).toBe(
      "the cancellation rate is high",
    );
  });

  it("unwraps hard-wrapped lines but keeps paragraphs, headers and list items", () => {
    const wrapped = [
      "Date: 12 September 2026",
      "Subject: Policy",
      "",
      "We removed your listings for repeated policy violations. You may",
      "appeal within 90 days of this notice and submit a plan of",
      "action.",
      "",
      "Please provide:",
      "- a supplier invoice",
      "- a letter of authorisation",
    ].join("\n");
    expect(normalizeNoticeText(wrapped)).toBe(
      [
        "Date: 12 September 2026",
        "Subject: Policy",
        "",
        "We removed your listings for repeated policy violations. You may appeal within 90 days of this notice and submit a plan of action.",
        "",
        "Please provide:",
        "- a supplier invoice",
        "- a letter of authorisation",
      ].join("\n"),
    );
  });

  it("joins a wrapped number only after a long line, so a label above its value stays", () => {
    expect(normalizeNoticeText("Case ID\n8823471905")).toBe("Case ID\n8823471905");
    expect(
      normalizeNoticeText(
        "You must submit your appeal to Amazon within the next\n90 days or lose access.",
      ),
    ).toContain("next 90 days");
  });

  it("splits a header block that was flattened onto one line", () => {
    expect(normalizeNoticeText("From: Amazon Date: 12 September 2026 Subject: Account")).toBe(
      "From: Amazon\nDate: 12 September 2026\nSubject: Account",
    );
  });

  it("puts a lone Date header that lost its line break back on its own line", () => {
    const flat =
      "Hello seller Date: 12 September 2026 Your account was suspended for policy violations.";
    expect(parseNotice(flat).receivedOn).toBeNull();
    expect(parseNotice(normalizeNoticeText(flat)).receivedOn).toBe("2026-09-12");
    expect(normalizeNoticeText(flat).split("\n")[1]).toMatch(/^Date: 12 September 2026/);
    expect(normalizeNoticeText("Please update your Date: field today")).toBe(
      "Please update your Date: field today",
    );
  });

  it("normalises smart punctuation", () => {
    expect(normalizeNoticeText("“your account” — it’s 30–90 days")).toBe(
      // Quotes are straightened and a range dash between digits becomes a hyphen; the spaced em
      // dash is the writer's own punctuation and stays.
      '"your account" — it\'s 30-90 days',
    );
  });

  it("is idempotent over every notice in the corpus and over messy pastes", () => {
    const messy = [
      "> Plan&nbsp;of\tAction\n> is **required** within\n> 7 days.",
      "<p>Date: 1 Sep 2026</p>\n\n\n\n<p>x</p>",
    ];
    for (const raw of [...FIXTURES.map((f) => f.raw), ...messy]) {
      const once = normalizeNoticeText(raw);
      expect(normalizeNoticeText(once)).toBe(once);
    }
  });

  it("leaves typed text alone at the light level", () => {
    expect(normalizeNoticeText("line one\nline two\n  indented ", { level: "light" })).toBe(
      "line one\nline two\n  indented ",
    );
    expect(normalizeNoticeText("a b​c", { level: "light" })).toBe("a bc");
  });

  it("makes the extractors work on pastes that defeated them", () => {
    const wrapped =
      "Your account was suspended. Please submit your appeal for\nthis suspension within 90 days.";
    expect(parseNotice(wrapped).statedWindowDays).toBeNull();
    expect(parseNotice(normalizeNoticeText(wrapped)).statedWindowDays).toBe(90);

    const bold = "**Date:** 12 September 2026\nYour account was suspended.";
    expect(parseNotice(bold).receivedOn).toBeNull();
    expect(parseNotice(normalizeNoticeText(bold)).receivedOn).toBe("2026-09-12");
  });

  it("keeps raw.slice(start, end) === value on what it returns", () => {
    const text = normalizeNoticeText(
      "> Order 114-3941689-8772232 and ASIN&nbsp;B08N5WRWNW\n> Case ID: 8823471905",
    );
    for (const e of extractEntities(text)) {
      if (e.kind !== "requested_record") expect(text.slice(e.start, e.end)).toBe(e.value);
    }
  });
});

describe("several notices in one paste", () => {
  const two =
    "Date: 1 Sep 2026\nSubject: A\nFirst body of the first message here, long enough.\n\n-----Original Message-----\nDate: 2 Sep 2026\nSubject: B\nSecond body of the second message here.";

  it("detects two messages, by Date headers, by separators and by repeated subjects", () => {
    expect(detectMultipleNotices(two)).toBe(true);
    expect(detectMultipleNotices("Subject: A\nbody one\nSubject: B\nbody two")).toBe(true);
    expect(
      detectMultipleNotices("Hello\n-----Original Message-----\nx\n-----Original Message-----\ny"),
    ).toBe(true);
    expect(
      detectMultipleNotices(
        "Date: 1 Sep 2026\nHello\n---------- Forwarded message ---------\nFrom: Amazon",
      ),
    ).toBe(true);
  });

  it("does not take one forwarded message, or any corpus notice, for two", () => {
    expect(
      detectMultipleNotices(
        "---------- Forwarded message ---------\nFrom: Amazon\nDate: 1 Sep 2026\nSubject: A\n\nbody",
      ),
    ).toBe(false);
    expect(FIXTURES.filter((f) => detectMultipleNotices(f.raw)).map((f) => f.id)).toEqual([]);
  });

  it("cuts the segments with offsets into the original", () => {
    const parts = splitNotices(two);
    expect(parts).toHaveLength(2);
    for (const p of parts) expect(two.slice(p.start, p.end)).toBe(p.text);
    expect(parts[1]!.text).toContain("Second body");
  });
});

describe("the seller's own text", () => {
  it("recognises a pasted appeal", () => {
    expect(
      looksLikeSellerText(
        "I am writing to appeal the suspension. Please reinstate my account. I take full responsibility.\n\nSincerely, Jane",
      ),
    ).toBe(true);
  });

  it("stays silent on Amazon's own words, including every corpus notice", () => {
    expect(
      looksLikeSellerText(
        "We are writing to inform you that your account was suspended. Thank you for your appeal.",
      ),
    ).toBe(false);
    expect(FIXTURES.filter((f) => looksLikeSellerText(f.raw)).map((f) => f.id)).toEqual([]);
  });
});

describe("OCR damage", () => {
  const damaged = "Dat e: 12 Sep tember 2O26\nAmaz0n sell1ng privileges poIicy vi0lations account";

  it("is detected, and repaired only into words a notice uses", () => {
    expect(assessGarbled(damaged).garbled).toBe(true);
    const repaired = repairOcrText(damaged);
    expect(repaired).toContain("September 2026");
    expect(repaired).toContain("Amazon selling privileges policy violations");
    expect(repaired).toContain("Date:");
  });

  it("does not take ASINs, IDs or the corpus for damage", () => {
    expect(
      assessGarbled("ASINs B08N5WRWNW B0CZ7L9PQ2 B07I9AB1C2 and order 114-3941689-8772232").garbled,
    ).toBe(false);
    expect(FIXTURES.filter((f) => assessGarbled(f.raw).garbled).map((f) => f.id)).toEqual([]);
  });
});

describe("warnings that are not enforcement actions", () => {
  it("reads an at-risk banner and a one-line listing removal as warnings", () => {
    expect(
      assessNotEnforcement("Your account is at risk. Review your metrics in Account Health.").kind,
    ).toBe("warning");
    expect(assessNotEnforcement("Your listing for ASIN B08N5WRWNW has been removed.")).toEqual({
      notEnforcement: true,
      kind: "listing_removal",
    });
  });

  it("does not take a suspension, or a warning that asks for a plan, for one", () => {
    expect(
      assessNotEnforcement("Your selling account has been suspended. You may appeal.")
        .notEnforcement,
    ).toBe(false);
    expect(
      assessNotEnforcement(
        "Your account is at risk of deactivation. Submit a plan describing what changed.",
      ).notEnforcement,
    ).toBe(false);
    expect(
      FIXTURES.filter((f) => assessNotEnforcement(f.raw).notEnforcement).map((f) => f.id),
    ).toEqual([]);
  });
});

describe("Seller Support threads", () => {
  const thread = [
    "Please provide the supplier invoice for ASIN B08N5WRWNW.",
    "Seller (you): Attached the invoice.",
    "Amazon: We have reviewed your invoices. Your account is now active.",
  ].join("\n");

  it("splits the turns and finds the last Amazon message", () => {
    const turns = splitSpeakerTurns(thread);
    expect(turns.map((t) => t.speaker)).toEqual(["amazon", "seller", "amazon"]);
    const last = lastAmazonTurn(thread)!;
    expect(thread.slice(last.start, last.end)).toContain("Your account is now active");
  });

  it("is not a thread without a seller turn or two Amazon turns", () => {
    expect(
      lastAmazonTurn(
        "From: Amazon <x@amazon.com>\nDate: 1 Sep 2026\n\nYour account was suspended.",
      ),
    ).toBeNull();
    expect(lastAmazonTurn("just a notice")).toBeNull();
  });
});

describe("normalizeNoticeText keeps the seller's own dashes", () => {
  it("leaves a spaced em or en dash alone", () => {
    expect(normalizeNoticeText("Subject: Notice — action required")).toContain(
      "Notice — action required",
    );
    expect(normalizeNoticeText("Subject: Notice – action required")).toContain(
      "Notice – action required",
    );
  });

  it("still reads a dash between digits as a hyphen, so IDs match", () => {
    expect(normalizeNoticeText("Order 111–1234567–1234567")).toContain("111-1234567-1234567");
  });
});
