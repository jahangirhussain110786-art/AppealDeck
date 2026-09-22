/**
 * The disclosures that have to be on the page, not merely written down somewhere.
 *
 * These exist because of a specific failure. The sentence saying AppealDeck is not legal advice
 * was written in `legal/terms.md` on 25 August, that file carried a banner claiming the rendered
 * copy had been brought to "substantive parity" with it, and the sentence was never actually
 * carried across — so for weeks it existed in the repository and on no page a seller could read.
 * Nobody diffed the two. A test does.
 *
 * `legal/*.md` is the authoring record; `src/content/legal.ts` is what `/terms` and `/privacy`
 * render. Only the second one protects anybody, so only the second one is asserted here.
 */
import { describe, expect, it } from "vitest";
import { LEGAL } from "../legal";

function text(doc: "privacy" | "terms" | "refund"): string {
  return LEGAL[doc].sections.flatMap((s) => [s.title, ...s.body]).join("\n");
}

describe("the rendered Terms page", () => {
  const terms = text("terms");

  /**
   * FTC v. DoNotPay (final order 16 Jan 2025) turns on advertising that software performs like a
   * lawyer without evidence for it. The standard there is substantiation, not good intentions,
   * which makes saying the opposite plainly the cheapest protection available.
   */
  it("says this is not legal advice", () => {
    expect(terms).toMatch(/not legal advice|Nothing here is legal advice/i);
  });

  it("disclaims being a substitute for a professional", () => {
    expect(terms).toMatch(/not a substitute/i);
    expect(terms).toMatch(/lawyer/i);
  });

  it("still states the boundaries that keep the product outside Amazon's Agent Policy", () => {
    // In force 4 Mar 2026: automated access to Seller Central is what the policy restricts, and
    // the product's answer is that it has none. Losing these sentences would lose the answer.
    expect(terms).toMatch(/do not log in to Seller Central/i);
    expect(terms).toMatch(/do not submit on your behalf/i);
  });

  it("makes no promise about the outcome", () => {
    expect(terms).toMatch(/do not promise reinstatement/i);
  });
});

describe("the rendered Privacy page", () => {
  const privacy = text("privacy");

  /**
   * Verified against Google's own paid-tier documentation on 22 Sep 2026. Stated for opposite
   * reasons: the first is reassuring, the second is a real window during which a seller's invoice
   * exists on someone else's servers, and a seller cannot weigh a retention period we decline to
   * name.
   */
  it("says what Google does with what we send, in specifics", () => {
    expect(privacy).toMatch(/does not use prompts or responses to improve its products/i);
    expect(privacy).toMatch(/55 days/);
  });

  it("does not fall back on telling a seller to go and read the provider's terms", () => {
    expect(privacy).not.toMatch(/under their own retention terms/i);
    expect(privacy).not.toMatch(/depends on the provider's applicable terms/i);
  });

  /**
   * The policy described optional AI field suggestions and the guided-interview drafting flow
   * after both were deleted (22 Sep 2026). Overstating what leaves the device is not dangerous the
   * way understating would be, but accuracy is the whole basis on which this product asks to be
   * trusted with a supplier invoice.
   */
  it("describes only features that exist", () => {
    expect(privacy).not.toMatch(/Optional AI suggestions/i);
    expect(privacy).not.toMatch(/interview drafting flow/i);
    expect(privacy).not.toMatch(/interview drafts/i);
  });

  it("still says identity documents are never uploaded", () => {
    expect(privacy).toMatch(/never uploaded for checking/i);
  });
});

describe("last-updated stamps", () => {
  /**
   * A stamp that lags a real change is the same class of untruth as the copy it dates, and the
   * file's own header promises these are the real change dates.
   */
  it("are real dates, not placeholders", () => {
    for (const [doc, date] of Object.entries(LEGAL.lastUpdated)) {
      expect(date, doc).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(Date.parse(date)), doc).toBe(false);
    }
  });
});
