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
import { WORKSPACE } from "../workspace";
import { FAQ } from "../marketing";

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

  /**
   * Writing an Amazon appeal is not practising law, because an Amazon appeal is a private
   * contractual dispute rather than a court or administrative proceeding. The edge is real,
   * though: Amazon's agreement ends its escalation path in arbitration, and a seller refused
   * twice is exactly who starts looking there. A non-lawyer cannot file an arbitration demand,
   * appear as counsel, or claim privilege — so the boundary has to be stated, not assumed.
   */
  it("says where the service stops, by name", () => {
    expect(terms).toMatch(/arbitration/i);
    expect(terms).toMatch(/demand letters?/i);
    expect(terms).toMatch(/court filings?/i);
  });

  /**
   * A seller may assume that telling a paid service what went wrong protects it the way telling a
   * lawyer would. It does not, and nobody would think to ask.
   */
  it("says nothing told to it is privileged", () => {
    expect(terms).toMatch(/privileged/i);
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

  /**
   * 7 Oct 2026, founder decision: the AI writes a Plan of Action's narrative sections. On 24 Sep this
   * test pinned the opposite (nothing sent to an AI provider), and was written to fail the day AI
   * drafting was switched on until the policy said so. It now pins what is true: the policy says
   * what is sent, that it is checked and discarded when it adds a detail, that files are never
   * sent, and that other response types are not written by AI.
   */
  it("says a Plan of Action is written by AI, what is sent, and what is not", () => {
    expect(privacy).toMatch(/written by AI/);
    expect(privacy).toMatch(/your three written answers/);
    expect(privacy).toMatch(/throws it away if it adds a date, number, name, document or action/);
    expect(privacy).toMatch(/Your files are never sent for this/);
    expect(privacy).toMatch(
      /section listing your supporting records is put together by our server/,
    );
    expect(privacy).toMatch(/is not written by AI/);
    expect(privacy).toMatch(/switch to your own wording/);
  });

  it("tells the seller in the terms that AI can misstate and that they are responsible", () => {
    expect(text("terms")).toMatch(/written by an AI model/);
    expect(text("terms")).toMatch(/you remain responsible for what you submit to Amazon/);
  });

  /**
   * 30 Sep 2026: a business document is now also read on the seller's own device, without AI, and
   * a signed-in check posts the file before it can fall back. The policy said only that a checked
   * document "is sent to AppealDeck and on to Google Gemini", which is false for a guest and
   * incomplete for the fallback. It must say where each check happens, that the device reading
   * does not upload, and that a refused signed-in check has already sent the file.
   */
  it("says where a business document is read: the AI, or the device without upload", () => {
    expect(privacy).toMatch(/one of two places/i);
    expect(privacy).toMatch(/read on your own device, without AI/i);
    expect(privacy).toMatch(/it is not uploaded/i);
    expect(privacy).toMatch(/file has already reached AppealDeck/i);
    // The old flat statement, true only of the AI reading.
    expect(privacy).not.toMatch(
      /that document is sent to AppealDeck and on to Google Gemini, so its contents/i,
    );
  });

  it("names the three things sent to an AI provider, and no others", () => {
    expect(privacy).toMatch(
      /things we send to an AI provider are therefore: that drafting, a business document you ask us to check, and a section you ask us to improve the wording of/i,
    );
  });

  /**
   * 24 Sep 2026: wording help. The policy must say what is sent, that it is sent only when the
   * seller asks, and that a suggestion changing a fact is discarded — the three things a seller
   * needs to weigh before pressing the button.
   */
  it("describes wording help: what is sent, when, and the fact lock", () => {
    expect(privacy).toMatch(/If you press "Improve the wording" on a section/);
    expect(privacy).toMatch(/nothing changes unless you choose it/);
    expect(privacy).toMatch(
      /Automated checks reject changes to recognized numbers, dates, identifiers/,
    );
    expect(privacy).toMatch(/cannot detect every invented claim or change in meaning/);
  });
});

/**
 * 6 Oct 2026 corrections, each made true to the code it describes.
 */
describe("privacy and terms corrections of 6 Oct 2026", () => {
  const privacy = text("privacy");
  const all = `${privacy}\n${text("terms")}\n${text("refund")}\n${JSON.stringify(LEGAL.consent)}`;

  it("does not say a no-Pass case's file is sent before the AI reading is refused", () => {
    // runCheck.ts asks /api/license/status first, so a case without a Pass is read on the device.
    expect(privacy).not.toMatch(/or the case has no Appeal Pass/i);
    expect(privacy).toMatch(/without one, the file is read on your device and is not sent/i);
  });

  it("limits the never-uploaded claim to documents filed under the matching type", () => {
    expect(privacy).toMatch(/never uploaded for checking when you file them under the matching/i);
    expect(privacy).toMatch(/Do not file them under any other type/);
  });

  it("refers to no licence key, which a buyer is never given", () => {
    expect(all).not.toMatch(/licen[cs]e key/i);
  });

  it("discloses outcome records, device records, rate-limit hashes and the providers", () => {
    expect(privacy).toMatch(/share an outcome/i);
    expect(privacy).toMatch(/hashed browser fingerprint[^.]*not your IP address/i);
    // The decoder's counter is keyed on the plain address, so the policy must say so (7 Oct 2026).
    expect(privacy).toMatch(/keep your IP address[^.]*in Upstash[^.]*only to count requests/i);
    for (const name of [
      "Vercel",
      "Supabase",
      "Upstash",
      "Resend",
      "Paddle",
      "Google Gemini",
      "Plausible",
    ]) {
      expect(privacy, name).toContain(name);
    }
  });

  it("says a refund removes access only once it is a full refund", () => {
    expect(text("refund")).toMatch(/Once a full refund is made/);
  });

  it("says Paddle sends the tax receipt, not AppealDeck", () => {
    expect(LEGAL.consent.deliveryNote).toMatch(/Paddle sends the tax receipt/);
  });

  it("says the service prepares a response rather than drafting an appeal", () => {
    expect(LEGAL.meta.descriptionTerms).not.toMatch(/drafts/i);
    expect(text("terms")).not.toMatch(/drafts a Plan of Action/i);
  });

  it("dates the changed documents (privacy and terms 2026-10-07)", () => {
    expect(LEGAL.lastUpdated.privacy).toBe("2026-10-07");
    expect(LEGAL.lastUpdated.terms).toBe("2026-10-07");
    expect(LEGAL.lastUpdated.refund).toBe("2026-10-06");
  });
});

/** The same claim, in the sentence a seller reads on the case screen itself. */
describe("the workspace's own privacy line", () => {
  it("does not say files never leave the device, and names the exception", () => {
    expect(WORKSPACE.privacy).not.toMatch(/Documents stay on this device\./);
    expect(WORKSPACE.privacy).toMatch(/business document you ask us to check/);
    expect(WORKSPACE.privacy).toMatch(/nothing is ever sent to Amazon/);
  });

  it("does not say document reading is unavailable, since it is available", () => {
    expect(WORKSPACE.manualReview).not.toMatch(/not available yet/i);
  });
});

/**
 * 24 Sep 2026: the FAQ's "What leaves my browser?" still named two features deleted on 22 Sep and
 * left out the one thing that does reach an AI provider, while the privacy policy had been fixed.
 */
describe("the FAQ says what the privacy policy says", () => {
  const faq = JSON.stringify(FAQ);

  it("describes no deleted feature", () => {
    expect(faq).not.toMatch(/AI suggestions|field suggestions|interview drafting/i);
  });

  it("names the same three things as what reaches an AI provider", () => {
    const processing = FAQ.items.find((i) => i.id === "processing");
    const text = `${processing?.a} ${processing?.detail}`;
    expect(text).toMatch(/write a Plan of Action/);
    expect(text).toMatch(/never the files/);
    expect(text).toMatch(/a business document you ask us to check/);
    expect(text).toMatch(/a section of your response you ask us to improve the wording of/);
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
