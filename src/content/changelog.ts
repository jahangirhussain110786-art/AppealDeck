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

import {
  accountPassEnabled,
  previewPlans,
  professionalsEnabled,
  rebateEnabled,
  renewalEnabled,
  reviewEnabled,
  singleEnabled,
  singleListed,
  upgradeEnabled,
} from "@/lib/plans";

export type ChangelogEntry = { date: string; items: readonly string[] };

export const CHANGELOG = {
  metadata: {
    title: "What changed in AppealDeck",
    description:
      "A dated list of what changed in AppealDeck: new features, fixes and wording corrections, newest first.",
  },
  hero: {
    eyebrow: "Updated 23 Oct 2026",
    title: "What changed, and when.",
    accent: "and when.",
    lede: "A dated list of changes to AppealDeck, newest first. We add a line when something a seller can see changes, including fixes and corrections to our own wording.",
  },
  entries: [
    {
      date: "23 Oct 2026",
      items: [
        "Two new pages compare AppealDeck with a general chatbot such as ChatGPT and with AppealsPro, each written from the other side's own pages on 23 October 2026 and saying where the other option is enough.",
        "The pricing page shows the free plan in two parts: what you get with no account, and what a free account adds.",
        "When you are about to buy, the purchase screen now shows the deadline from your own notice, while it is still ahead, beside the button.",
        ...(singleListed()
          ? [
              "The pricing page now also shows One Response, $99 for one case and one response, and the purchase screen says which plan covers what your notice asks for.",
            ]
          : []),
        "A purchase confirmation email now ends with the next step and where to do it.",
        "The Appeal Pass card is now the highlighted one, with a Recommended note.",
        ...(singleEnabled()
          ? [
              "One Response is on sale: $99 for one case and the first response to Amazon, with every revision of it and your documents read against the notice. A further response, after Amazon replies, needs the Appeal Pass.",
            ]
          : []),
        ...(upgradeEnabled()
          ? [
              "A One Response now upgrades to the Appeal Pass at a credited price: the $99 you paid comes off, so a further response costs $150 for that case.",
            ]
          : []),
      ],
    },
    {
      date: "22 Oct 2026",
      items: [
        "Pricing now has a page for each kind of visitor: sellers, appeal writers and VA teams, and partners. All three are always one click apart.",
        "The pricing page now answers “Can I ask a chatbot instead?” with a plain comparison of what a general chatbot does for an appeal and what it leaves out, and shows what else people pay, read on 22 October 2026.",
        "A new page for appeal writers and VA teams lists what you can use today, what it costs and that professional pricing is not set yet.",
        "A new partner program: a partner earns 30 percent of what a seller they send pays for an Appeal Pass, and that seller gets $25 off. The rules, including how a partner must disclose the commission, are on the page.",
        "Sign-up now asks one optional question about what brings you here. It only decides which pricing page is shown first, and it stays on your device.",
        "Three new answers in the FAQ: using a chatbot instead, pricing for writers, and earning as a partner.",
        ...(previewPlans()
          ? [
              "The pricing page now also shows the Account Pass, the AI document review and the professional prices (credit packs and the Pro plan), each marked “Opens soon”. None of them can be bought yet.",
            ]
          : []),
        ...(accountPassEnabled()
          ? [
              "The Account Pass is on sale: one payment that covers every case on your account for 12 months, beside the one-case Appeal Pass. The first buyers may get it at the Appeal Pass price while the founding offer lasts.",
            ]
          : []),
        ...(reviewEnabled()
          ? [
              "A new AI document review: for $49 the AI reads up to five of one case's documents against what Amazon asked, and the $49 comes off the Appeal Pass for the same case.",
            ]
          : []),
        ...(renewalEnabled()
          ? [
              "The Account Pass can be renewed for $99, which adds 12 months to the end of the cover you already have.",
            ]
          : []),
        ...(professionalsEnabled()
          ? [
              "Case credits for verified professionals: packs of 10 and 30, and a monthly Pro plan. Each credit gives one case an Appeal Pass.",
            ]
          : []),
        ...(rebateEnabled()
          ? [
              "Tell us how your case ended, whatever the result, and we refund $25 of what you paid. The report is linked to your account so we know whom to refund, and it is not published.",
            ]
          : []),
        "The Privacy policy now says that your browser also holds a partner’s code for 60 days, if you arrive through one, and your answer to the question above.",
      ],
    },
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
