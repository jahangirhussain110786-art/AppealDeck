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
import { LEGAL, consentLabelFor } from "../legal";
import { WORKSPACE } from "../workspace";
import { DECODE, FAQ, HOME } from "../marketing";

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

  it("says where the Pass is not on sale", () => {
    expect(text("terms")).toMatch(
      /not currently offered to buyers in the European Union, the European Economic Area or the United Kingdom/,
    );
  });

  it("says translation happens on the device", () => {
    expect(privacy).toMatch(/translation happens on your device by your browser's own translator/);
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

  it("names the four things sent to an AI provider, and no others", () => {
    expect(privacy).toMatch(
      /things we send to an AI provider are therefore: that drafting, a business document you ask us to check, a section you ask us to improve the wording of, and the text of a notice the decoder cannot place/i,
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

  it("says what is kept for the second reading: a fingerprint, never the text (10 Oct 2026)", () => {
    expect(text("privacy")).toMatch(
      /seven days under a one-way fingerprint of the notice[^.]*never the notice or the sentence itself/,
    );
  });

  it("keeps the lines beside the paste boxes true to the privacy policy (G-51, 12 Oct 2026)", () => {
    // "Not stored" was untrue once a reading is remembered for seven days. The boxes now say what
    // the policy says: read on the server, no copy of the notice, Gemini only when rules cannot place it.
    expect(HOME.tool.note).not.toMatch(/not stored/i);
    expect(HOME.tool.note).toMatch(/no copy/i);
    expect(DECODE.privacyNote).toMatch(/keep no copy/i);
    expect(DECODE.privacyNote).toMatch(/only when our own rules cannot place it/i);
    expect(text("privacy")).toMatch(
      /only when our own rules cannot tell what kind of notice it is, on to Google Gemini/,
    );
  });

  it("calls the service software, not an independent service, everywhere it says what it is (G-93)", () => {
    expect(text("terms")).toMatch(/AppealDeck is software, operated by Jhangir Hussain/);
    expect(text("terms")).not.toMatch(/independent service/i);
    expect(JSON.stringify(FAQ.items)).not.toMatch(/independent service/i);
  });

  it("dates the changed documents (privacy 2026-10-22, terms 2026-10-23, refund 2026-10-12)", () => {
    // 9 Oct 2026: the AI now also writes document-request and questionnaire responses, and reads a
    // notice the decoder cannot place. 10 Oct 2026: privacy says what that reading keeps. 12 Oct
    // 2026: the Terms and privacy say "software" rather than "independent service" and count
    // browsers, not devices (G-93, G-71). 22 Oct 2026: privacy names the two things local storage
    // now also holds, a partner's code and the answer to "what brings you here".
    expect(LEGAL.lastUpdated.privacy).toBe("2026-10-22");
    expect(LEGAL.lastUpdated.terms).toBe("2026-10-23");
    expect(LEGAL.lastUpdated.refund).toBe("2026-10-12");
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
    expect(text).toMatch(/a notice our own rules cannot place/);
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

describe("what Paddle's reviewer and a buyer both read (12 Oct 2026)", () => {
  /**
   * Paddle is the only way this product takes payment, and its seller-policy guidance asks for a
   * Merchant-of-Record statement in the Terms and a refund window of at least 14 days. A refund
   * window quoted differently on two pages is what a refund analyst reads as a contradiction.
   */
  it("states in the Terms that Paddle is the Merchant of Record", () => {
    expect(text("terms")).toMatch(/Paddle\.com is the Merchant of Record for all our orders/);
    expect(text("terms")).toMatch(/Paddle's Buyer Terms/);
  });

  it("does not claim Pakistani law governs the purchase itself", () => {
    const terms = text("terms");
    expect(terms).not.toMatch(/exclusive jurisdiction of the courts of Pakistan/);
    expect(terms).toMatch(/Your purchase is governed by Paddle's Buyer Terms/);
  });

  it("gives the same 14-day refund window on every page that states one", () => {
    const everything = [
      text("terms"),
      text("refund"),
      JSON.stringify(LEGAL.consent),
      JSON.stringify(LEGAL.meta),
      JSON.stringify(HOME),
      JSON.stringify(FAQ),
    ].join("\n");
    expect(everything).toMatch(/14-day refund|within 14 days/);
    expect(everything).not.toMatch(/7-day|within 7 days|seven-day refund/i);
  });

  it("offers the Paddle receipt route and says what a refund does and does not remove", () => {
    expect(text("refund")).toMatch(/paddle\.net/);
    expect(text("refund")).toMatch(/Your case notes and files are on your device and stay yours/);
  });

  it("makes the buyer tick that they have read the Terms and the Refund policy", () => {
    expect(LEGAL.consent.withdrawalCheckbox.label).toMatch(
      /I have read the Terms and the Refund policy\.$/,
    );
  });
});

describe("the checkout consent names what is bought (22 Oct 2026)", () => {
  it("is the Appeal Pass sentence for the case plan, unchanged", () => {
    expect(consentLabelFor("case")).toBe(LEGAL.consent.withdrawalCheckbox.label);
    expect(consentLabelFor("case")).toContain("deliver the Appeal Pass immediately");
  });

  it("names the Account Pass for the account plan and keeps every other word", () => {
    const account = consentLabelFor("account");
    expect(account).toContain("deliver the Account Pass immediately");
    expect(account).not.toContain("Appeal Pass immediately");
    expect(account.replace("Account Pass", "Appeal Pass")).toBe(
      LEGAL.consent.withdrawalCheckbox.label,
    );
    // the 14-day refund and the read-the-Terms sentence are intact
    expect(account).toContain("statutory 14-day right of withdrawal");
    expect(account).toContain("voluntary 14-day refund still applies");
    expect(account.endsWith(LEGAL.consent.withdrawalCheckbox.label.slice(-60))).toBe(true);
  });
});
