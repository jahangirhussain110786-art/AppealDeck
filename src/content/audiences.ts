// Copy for the three audiences of /pricing (22 Oct 2026): sellers, appeal writers and VA teams, and
// partners. Rules for this file, each there because the opposite would mislead:
// - It states only what the product does today. A professional plan, packs, a partner dashboard or a
//   shared team case are not here because they do not exist; the pages say so in plain words.
// - Every commission and price is the real one. A partner code is a Paddle discount the founder
//   creates by hand, so "codes are issued by hand" is stated, not hidden.
// - No outcome, win rate or comparison to a lawyer. Banned-pattern and banned-number rules apply
//   (scripts/lint-copy.mjs): "30 percent" is written out because the gate rejects the percent sign.

import { SUPPORT_EMAIL } from "./support";
import {
  accountPassEnabled,
  professionalsEnabled,
  renewalEnabled,
  reviewEnabled,
} from "@/lib/plans";
import { PRODUCTS } from "./purchases";

export const AUDIENCE_SWITCH = {
  label: "Who is this for?",
  items: [
    { role: "seller", href: "/pricing", label: "Sellers" },
    { role: "pro", href: "/for-professionals", label: "Writers and VA teams" },
    { role: "partner", href: "/partners", label: "Partners" },
  ],
  /** On /pricing for someone who said they write appeals or send sellers. */
  nudge: {
    pro: {
      text: "You said you write appeals for clients.",
      link: "See what is here for writers and VA teams",
    },
    partner: {
      text: "You said you send sellers to good tools.",
      link: "See the partner program",
    },
  },
} as const;

/** The optional question at sign-up. Only changes which pricing page is shown first. */
export const ROLE_PICKER = {
  legend: "What brings you here? (optional)",
  hint: "This only changes which pricing page we show you first. It stays on this device.",
  options: [
    { value: "seller", label: "My Amazon account has a problem" },
    { value: "pro", label: "I write appeals for clients or run a VA team" },
    { value: "partner", label: "I send sellers to good tools" },
    { value: "none", label: "Just looking" },
  ],
} as const;

const WRITERS_SUBJECT = "Appeal writer: how I work";
const PARTNER_SUBJECT = "Partner program";

export const PROS = {
  metadata: {
    title: "For appeal writers and VA teams: check the proof on every client case",
    description:
      "Documents read against the notice, every round kept in one place, and a response built only from facts you confirmed. AppealDeck never logs in to a client's Amazon account.",
  },
  hero: {
    eyebrow: "For appeal writers, consultants and VA teams",
    title: "Check the proof on every client case.",
    accent: "every client case.",
    lede: "AppealDeck reads each client's documents against what Amazon asked, keeps every round in one place and writes only from facts you confirmed. It never logs in to a client's Amazon account.",
    cta: "Write to us about how you work",
    ctaSecondary: "Start with a free decode",
  },
  today: {
    title: "What you can use today",
    items: [
      {
        title: "One list for every client",
        body: "Name each case by client or store. See every case, what is due next and who you are waiting on, and save the whole list to one spreadsheet file.",
      },
      {
        title: "Each client's documents, checked",
        body: "Invoices are read against the notice: dates, ASINs, names and units. The reading runs on your device; a file leaves it only for an AI reading you ask for.",
      },
      {
        title: "Every round stays",
        body: "Paste Amazon's reply and see what it reopened, added or left outstanding. Work you finished is kept, not thrown away.",
      },
      {
        title: "Facts you confirmed, nothing else",
        body: "The response is built only from what you confirmed, and the page says so. A model does not rewrite your client's story.",
      },
      {
        title: "An upload-ready pack",
        body: "Reviewed files numbered and named by what they answer, with an index a reviewer can read.",
      },
      {
        title: "No access to the client's account",
        body: "AppealDeck never logs in to Seller Central and never reads it, so it cannot touch a client's account.",
      },
    ],
  },
  cost: {
    title: "What it costs today",
    body: "Everything above except the written response is free. The written response is the Appeal Pass: $249 once for one case, every round included. Each client case is its own case, so each has its own Pass.",
    // Said only while there is no professional price on sale; once there is, the prices are on the page.
    open: professionalsEnabled() ? null : "Professional pricing is not set yet.",
    openBody: professionalsEnabled()
      ? null
      : "We would rather ask than guess. If you handle cases every week, write to us with how you work and what a case should cost you. The first writers help set the price and see it first.",
    // Said only once professional prices are on sale: what they are, in one sentence.
    pro: professionalsEnabled()
      ? `Verified professionals pay less per case: credits come in packs of 10 for ${PRODUCTS.pack10.price} and of 30 for ${PRODUCTS.pack30.price}, or as the Pro plan, ${PRODUCTS.pro.credits} credits a month for ${PRODUCTS.pro.price}. Each credit activates one case with an Appeal Pass.`
      : null,
  },
  partner: {
    title: "Prefer to keep your own service?",
    body: "Send a seller to AppealDeck and earn when they buy a Pass. You keep your fee and your client.",
    link: "See the partner program",
  },
  limits: {
    title: "Limits, said plainly",
    items: [
      "AppealDeck is software, not a law firm. Nothing in it is legal advice, and nothing a client tells it is legally privileged.",
      "A case is kept on the device it was made on. It is not shared between team members yet; hand a case over with an export.",
      "One person answers support, normally within two business days.",
      "Amazon decides every outcome. Nothing here predicts one.",
    ],
  },
  mailto: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(WRITERS_SUBJECT)}`,
} as const;

export const PARTNERS = {
  metadata: {
    title: "Partner program: earn when a seller you send buys an Appeal Pass",
    description:
      "If you teach, advise or help Amazon sellers, earn 30 percent of what a seller you send pays for an Appeal Pass. The seller gets $25 off. The rules are on this page.",
  },
  hero: {
    eyebrow: "Partner program",
    title: "Send sellers to a tool that checks the proof.",
    accent: "checks the proof.",
    lede: "If you teach, advise or help Amazon sellers, you earn 30 percent of what a seller you send pays for an Appeal Pass, and the seller gets $25 off.",
    cta: "Write to us to apply",
  },
  how: {
    title: "How it works",
    steps: [
      {
        title: "Write to us",
        body: "Tell us who you are and where you share with sellers. Codes and links are issued by hand while the program is small, so there is no sign-up form.",
      },
      {
        title: "We reply and give you a code",
        body: "You get a code and a link that ends in ?ref= and your code. We reply ourselves, normally within two business days.",
      },
      {
        title: "A seller opens your link",
        body: "Their browser keeps your code for 60 days, and it goes to checkout as a $25 discount. The first partner a seller meets keeps the sale until the 60 days end.",
      },
      {
        title: "You are paid after the refund window",
        body: "When the Pass has been paid for and its 14-day refund window has passed, 30 percent of what the seller paid is added to your balance. We pay once a month, by bank transfer or Payoneer.",
      },
    ],
  },
  earn: {
    title: "What you earn",
    body: "Thirty percent of the price the seller pays, once, for each Pass. The Pass is $249 and a seller using a code pays $224, so a sale earns $67.20.",
    refunded:
      "A Pass that is refunded or charged back pays nothing. If it was already paid out, it comes off your next payment.",
    // 22 Oct 2026: only while the Account Pass is on sale, so the page names no price that cannot be paid.
    accountPass: accountPassEnabled()
      ? "The same 30 percent applies to the Account Pass. A seller using a code on its $329 price pays $304, so that sale earns $91.20."
      : null,
    // 22 Oct 2026: said only once something other than the two Passes is on sale, because only
    // then is there anything the code does not cover. The partner discount is made in Paddle for the
    // two Pass prices alone.
    scope:
      reviewEnabled() || renewalEnabled() || professionalsEnabled()
        ? "A partner's code applies to the Appeal Pass and the Account Pass only. It does not apply to the AI document review, to renewals, to case credits or the Pro plan, or to an Appeal Pass bought after a review, which already has the review's price taken off."
        : null,
    noDashboard:
      "There is no dashboard yet. Each month we send you a message with your sales and your balance.",
  },
  rules: {
    title: "What we ask of you",
    items: [
      "Say you earn a commission, next to the link: for example, “I earn a commission if you buy.”",
      "If you advise sellers, as a writer, accountant or consultant, tell the seller in writing that you earn it before they buy.",
      "Never promise that an appeal will succeed, say how often appeals succeed, or say AppealDeck is an Amazon partner or approved by Amazon.",
      "Never ask for a review in return for a sale, and never offer a reward that depends on a review being good.",
      "Never ask a seller for their Amazon login, and never use AppealDeck on an account you are not allowed to help with.",
      "No spam, and no paid search ads on the AppealDeck name.",
    ],
    review:
      "We read what partners publish about us every three months. Either side can end the partnership at any time; commission on sales already made is still paid.",
  },
  share: {
    title: "Free things you can share",
    items: [
      { label: "The notice decoder", href: "/decode" },
      { label: "The free invoice check", href: "/check-invoice" },
      { label: "The guides", href: "/guides" },
    ],
  },
  mailto: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(PARTNER_SUBJECT)}`,
} as const;

/** What a seller sees on the pricing page when they arrived with a partner's code. */
export const PARTNER_CODE_NOTE = {
  text: "Partner code {code} is added to your checkout. The discount shows in the payment window.",
  remove: "Remove the code",
} as const;
