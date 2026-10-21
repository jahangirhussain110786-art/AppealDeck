/**
 * Copy for /changelog (P-01, released by the founder's exact phrase on 12 Oct 2026).
 *
 * A dated list of what changed, so a seller or a professional can see the product is looked after.
 * Rules, each there because the opposite would mislead:
 * - Every line is true and dated. Each was taken from the project's own commit history; nothing is
 *   invented, rounded up or written as a plan.
 * - It says what changed for the person using it. It never says what Amazon will decide, and it
 *   never uses a number as a success rate.
 * - Add a line in the same commit as the change. A line with no real date does not belong here.
 * - Newest first. Do not rewrite an old line: add a new one that corrects it.
 */

export type ChangelogEntry = { date: string; items: readonly string[] };

export const CHANGELOG = {
  metadata: {
    title: "What changed in AppealDeck",
    description:
      "A dated list of what changed in AppealDeck: new features, fixes and wording corrections, newest first.",
  },
  hero: {
    eyebrow: "Updated 20 Oct 2026",
    title: "What changed, and when.",
    accent: "and when.",
    lede: "A dated list of changes to AppealDeck, newest first. We add a line when something a seller can see changes, including fixes and corrections to our own wording.",
  },
  entries: [
    {
      date: "20 Oct 2026",
      items: [
        "Dex, a small guide character, now sits in the corner of every page with one short line about the page. Once you start using the page he becomes a 3D character who turns to look at your pointer, blinks, waves and hops. On a slow device, or if you ask your device for less motion, he stays a picture or holds still. You can hide him and he stays hidden.",
      ],
    },
    {
      date: "12 Oct 2026",
      items: [
        "The refund window is now 14 days, up from 7, on every page and in the purchase email.",
        "The Terms now say that Paddle is the Merchant of Record for every order, and the Refund page gives the Paddle receipt route.",
        "The checkout consent now asks you to confirm that you have read the Terms and the Refund policy, with both linked.",
        "The Copy button now copies plain headings, without the double hash marks that would have been pasted into Amazon's box.",
        "A notice that states no date and no appeal window now says so, instead of calling the window “ambiguous”.",
        "The sample notice on the decode page decodes in one tap and is labelled as a sample result.",
        "The free reply reader now shows Amazon's own sentence next to its plain-words reading.",
        "The invoice check now shows the two sums it works out.",
        "A case can be given a name, and all your cases can be saved to one spreadsheet file.",
        "A new page, How we test, shows where the decoder was wrong and lets you download the notices we test with.",
        "The “Amazon asked for nothing else” tick now changes the moment you click it.",
        "Product-safety wording now points to Amazon's Direct Validation process.",
        "The Terms and Privacy pages now call AppealDeck software and describe where your data is kept as your browser.",
      ],
    },
    {
      date: "10 Oct 2026",
      items: [
        "One download now gathers your reviewed documents into a single zip, numbered in order, with an index you can read. A picture over 5 MB is saved smaller; a PDF is included as it is.",
        "Invoices are now added up against the units you say you sold, and the page says how many are short or that the numbers add up.",
        "A new panel shows what changed since your last response: new sentences, documents added or removed, and open items closed.",
        "A root-cause helper asks five questions worded for your notice and puts your answers together as you typed them, adding nothing.",
      ],
    },
    {
      date: "9 Oct 2026",
      items: [
        "Keyboard-only and dark-mode checks were run on every page and every case view; the gaps they found were fixed.",
        "A case that needs professional review was shown a supplier invoice as a missing record. It no longer is.",
        "The app's error screen now says your saved work is kept in this browser and links back to your dashboard.",
      ],
    },
    {
      date: "8 Oct 2026",
      items: [
        "A free invoice check page works without an account and reads your invoice on your own device.",
        "A response is now flagged when it answers a different problem from the one the notice raised.",
      ],
    },
    {
      date: "7 Oct 2026",
      items: [
        "Your case dates can be saved to a calendar file, and the prepared response can be exported as a Word or PDF document.",
        "Purchases from the EU, EEA and UK are paused, and the pricing page and Terms say so.",
      ],
    },
    {
      date: "30 Sep 2026",
      items: [
        "Business documents can be read on your own device, without AI, when the AI reading cannot run. The result says which way it was read.",
      ],
    },
  ],
  footnote:
    "This list is written from our own change history. If something here looks wrong, tell us through the Support page.",
} as const;
