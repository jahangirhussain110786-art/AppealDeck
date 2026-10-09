import { describe, expect, it } from "vitest";
import {
  describeCheck,
  verifyAiDraft,
  verifyAiTexts,
  type DraftSections,
} from "./draftVerification";

const ANSWERS = {
  rootCause:
    "We listed returned items as new. Customer returns went back into our new-condition stock without anyone opening the packaging, so four customers received opened items between 12 and 28 September.",
  correctiveActions:
    "On 30 September we removed all 12 affected listings and relisted the returned units as Used - Like New.",
  preventiveMeasures:
    "Our warehouse lead opens and inspects every return before it can go back on sale and records the result in a returns log.",
};
const NOTICE =
  "We removed the listing for ASIN B09XK3J7QP because customers complained about item condition (Used Sold as New). Submit a plan of action.";
const RECORDS =
  "Records: Sales or performance record (returns-log-september.pdf), note: the log of returns.";
const sellerAnswers = Object.values(ANSWERS).join("\n\n");
const sources = { all: [NOTICE, sellerAnswers, RECORDS].join("\n\n"), sellerAnswers };

const faithful: DraftSections = {
  rootCause:
    "Customer returns were put back into our new-condition stock without anyone opening the packaging. As a result four customers received opened items between 12 and 28 September.",
  correctiveActions:
    "On 30 September we removed all 12 affected listings and relisted the returned units as Used - Like New.",
  preventiveMeasures:
    "Our warehouse lead now opens and inspects every return before it can go back on sale and records the result in a returns log.",
};

describe("verifyAiDraft", () => {
  it("accepts a draft that keeps to the seller's facts", () => {
    const check = verifyAiDraft(sources, faithful);
    expect(check.ok, describeCheck(check)).toBe(true);
  });

  it("rejects an invented date", () => {
    const check = verifyAiDraft(sources, {
      ...faithful,
      correctiveActions: faithful.correctiveActions + " We completed a full audit on 5 October.",
    });
    expect(check.ok).toBe(false);
    expect(check.added.join(" ")).toMatch(/october|5/i);
  });

  it("rejects an invented number, name or identifier", () => {
    for (const extra of [
      " We also retrained 8 employees.",
      " Our manager Daniel Reyes signs off the log.",
      " This affected order 114-3568329-9810617.",
    ]) {
      const check = verifyAiDraft(sources, {
        ...faithful,
        preventiveMeasures: faithful.preventiveMeasures + extra,
      });
      expect(check.ok, extra).toBe(false);
    }
  });

  it("rejects a document nobody supplied", () => {
    const check = verifyAiDraft(sources, {
      ...faithful,
      correctiveActions:
        faithful.correctiveActions + " The attached test report confirms the condition.",
    });
    expect(check.ok).toBe(false);
    expect(check.unsupportedEvidence).toContain("test report");
  });

  it("allows a document the seller did supply", () => {
    const check = verifyAiDraft(sources, {
      ...faithful,
      correctiveActions: faithful.correctiveActions + " The returns log is attached.",
    });
    expect(check.unsupportedEvidence).toEqual([]);
  });

  it("rejects a draft that drops a fact the seller gave", () => {
    const check = verifyAiDraft(sources, {
      ...faithful,
      correctiveActions: "We removed the affected listings and relisted the returned units.",
    });
    expect(check.ok).toBe(false);
    expect(check.dropped.length).toBeGreaterThan(0);
  });

  it("rejects wording that is never acceptable", () => {
    for (const bad of [
      "Amazon was wrong to remove our listings.",
      "We will be reinstated shortly, so please act quickly.",
      "We will take legal action if this is not resolved.",
    ]) {
      const check = verifyAiDraft(sources, {
        ...faithful,
        rootCause: faithful.rootCause + " " + bad,
      });
      expect(check.ok, bad).toBe(false);
    }
  });

  it("rejects padding well beyond what the facts support", () => {
    const filler = "We take quality very seriously and value every customer. ".repeat(40);
    const check = verifyAiDraft(sources, {
      ...faithful,
      rootCause: faithful.rootCause + " " + filler,
    });
    expect(check.padded).toBe(true);
    expect(check.ok).toBe(false);
  });

  it("rejects the overclaiming a real model produced on 7 Oct 2026", () => {
    // Taken from the first live run: no new number or name, but every action made to sound bigger.
    const check = verifyAiDraft(sources, {
      ...faithful,
      correctiveActions:
        "On 30 September we removed all 12 affected listings and relisted the returned units as Used - Like New. We completed a physical inspection of every unit and moved returns to a dedicated returns shelf.",
      preventiveMeasures:
        "We have implemented a strict return inspection process. Our warehouse lead physically opens every single return and records the result in a returns log.",
    });
    expect(check.ok).toBe(false);
    expect(check.inflated).toEqual(
      expect.arrayContaining(["physical", "dedicated", "strict", "physically", "single"]),
    );
    expect(describeCheck(check)).toMatch(/sound stronger than they said/);
  });

  it("allows a strong word the seller used themselves", () => {
    const withWord = {
      all: sources.all + " We run a strict returns process.",
      sellerAnswers: sources.sellerAnswers + " We run a strict returns process.",
    };
    const check = verifyAiDraft(withWord, {
      ...faithful,
      preventiveMeasures: faithful.preventiveMeasures + " We run a strict returns process.",
    });
    expect(check.inflated).toEqual([]);
  });

  it("turns a failure into one plain sentence for the retry", () => {
    const check = verifyAiDraft(sources, {
      ...faithful,
      correctiveActions: faithful.correctiveActions + " We completed a full audit on 5 October.",
    });
    expect(describeCheck(check)).toMatch(/added details that were not provided/);
  });
});

describe("re-pairing a number with a unit the seller already used (9 Oct 2026)", () => {
  const sources = {
    all: "our packer was on leave. 14 of 610 orders went late. we check orders every day.",
    sellerAnswers:
      "our packer was on leave. 14 of 610 orders went late. we check orders every day.",
  };
  it("accepts '14 orders out of 610' for '14 of 610 orders'", () => {
    const check = verifyAiTexts(sources, [
      "14 orders out of 610 went late while our packer was on leave. We check orders every day.",
    ]);
    expect(check.added).toEqual([]);
    expect(check.dropped).toEqual([]);
  });
  it("still reports a unit the seller never used, and a number they never gave", () => {
    const days = verifyAiTexts(sources, [
      "14 of 610 orders went late over 14 weeks. We check orders every day.",
    ]);
    expect(days.added).toContain("14 week");
    const number = verifyAiTexts(sources, [
      "15 of 610 orders went late. We check orders every day.",
    ]);
    expect(number.added).toContain("15");
  });
});
