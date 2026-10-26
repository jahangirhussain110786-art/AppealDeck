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
  professionalsListed,
  renewalEnabled,
  reviewEnabled,
} from "@/lib/plans";
import { OPENS_SOON, PRODUCTS } from "./purchases";
import { SCOPE } from "./scope";

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

/**
 * The partner arithmetic, in one place. The Appeal Pass and Account Pass prices are the ones on
 * /pricing (a test checks they still are), the discount is the Paddle discount a partner's code
 * gives, and the rate is what a partner earns of what the seller then pays.
 */
const SALE = { passPrice: 249, accountPrice: 329, discount: 25, ratePercent: 30 } as const;
const dollars = (n: number) => `$${n.toFixed(2)}`;
function earning(price: number) {
  const pays = price - SALE.discount;
  return { pays: dollars(pays), earns: dollars((pays * SALE.ratePercent) / 100) };
}
export const PARTNER_SALES = {
  ...SALE,
  pass: earning(SALE.passPrice),
  account: earning(SALE.accountPrice),
};

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
    lede: "AppealDeck reads each client's documents against what Amazon asked, keeps every round in one place and writes only from facts you confirmed. Your client's Seller Central account stays theirs; we never sign in.",
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
        title: "The client's account stays theirs",
        body: "AppealDeck never signs in to Seller Central or reads it, so your client's account stays untouched.",
      },
    ],
  },
  /**
   * The cards of the writers' page, in the same design as the sellers' plan cards. Free tools first,
   * then the Appeal Pass (the price of one client case), then the two professional ways to pay less
   * per case, which are previewed as "Opens soon" until their Paddle prices are set.
   */
  cards: {
    title: "Prices for writers and VA teams",
    free: {
      name: "Free",
      note: "For every client case",
      price: "$0",
      // Two parts, as on the sellers' Free card (23 Oct 2026): what needs no account, then what a free
      // account adds. `features` is the two joined, for anything that wants one list.
      groups: [
        {
          label: "No account",
          features: [
            "Each client's notice decoded, with scam signals quoted",
            "Documents read against the notice, on your device",
            "The client's Amazon account stays theirs",
          ],
        },
        {
          label: "With a free account",
          features: [
            "One list for every client, saved to a spreadsheet",
            "Every round kept, Amazon's replies applied",
          ],
        },
      ],
      features: [
        "Each client's notice decoded, with scam signals quoted",
        "Documents read against the notice, on your device",
        "The client's Amazon account stays theirs",
        "One list for every client, saved to a spreadsheet",
        "Every round kept, Amazon's replies applied",
      ],
      cta: "Start with a free decode",
    },
    pass: {
      name: "Appeal Pass",
      note: "One client case, every round",
      price: "$249",
      unit: "a case",
      features: [
        "The response prepared from the facts you confirmed, every revision",
        "An upload-ready pack of the reviewed files",
        "The same 14-day refund, no questions asked",
      ],
      cta: "Get an Appeal Pass",
    },
    credits: {
      name: "Case credits",
      note: "For verified professionals",
      price: PRODUCTS.pack30.each,
      unit: "a case, from",
      features: [
        `${PRODUCTS.pack10.count} credits for ${PRODUCTS.pack10.price} (${PRODUCTS.pack10.each} a case)`,
        `${PRODUCTS.pack30.count} credits for ${PRODUCTS.pack30.price} (${PRODUCTS.pack30.each} a case)`,
        "A credit gives one case an Appeal Pass, every round included",
        "Credits last 12 months",
      ],
      cta: "Buy credits",
    },
    pro: {
      name: "Pro plan",
      note: "A monthly plan for teams",
      price: PRODUCTS.pro.price,
      unit: PRODUCTS.pro.per,
      features: [
        `${PRODUCTS.pro.credits} case credits every month (${PRODUCTS.pro.each} a case)`,
        "A credit you do not use lasts one more month",
        "Cancel any time in Billing",
        "Verified by hand, like the credits",
      ],
      cta: PRODUCTS.pro.cta,
    },
    welcome:
      "Writers, consultants, VA teams and agencies are welcome. Write to us with a link to your public profile and we will verify you.",
    note: "Without credits, each client case is its own Appeal Pass: $249 once, every round included.",
  },
  cost: {
    title: "What it costs today",
    body: "Everything above except the written response is free. The written response is the Appeal Pass: $249 once for one case, every round included. Each client case is its own case, so each has its own Pass.",
    // Said only while there is no professional price on sale; once there is, the prices are on the page.
    open: professionalsListed()
      ? null
      : "Professional pricing is being shaped with the first writers.",
    openBody: professionalsListed()
      ? null
      : "We would rather ask than guess. If you handle cases every week, write to us with how you work and what a case should cost you. The first writers help set the price and see it first.",
    // Said only once professional prices are on sale: what they are, in one sentence.
    pro: professionalsListed()
      ? `Verified professionals pay less per case: credits come in packs of 10 for ${PRODUCTS.pack10.price} and of 30 for ${PRODUCTS.pack30.price}, or as the Pro plan, ${PRODUCTS.pro.credits} credits a month for ${PRODUCTS.pro.price}. Each credit activates one case with an Appeal Pass.${professionalsEnabled() ? "" : ` ${OPENS_SOON.professionals}`}`
      : null,
  },
  partner: {
    title: "Prefer to keep your own service?",
    body: "Send a seller to AppealDeck and earn when they buy a Pass. You keep your fee and your client.",
    link: "See the partner program",
  },
  limits: {
    title: "What we promise, and what stays with you",
    items: [
      SCOPE.professional,
      "A case lives on the device it was made on. Hand it to a colleague with an export, and restore it where the work continues.",
      "You write to the person who builds it, normally with a reply within two business days.",
      "Amazon decides every outcome. The work here is to make the record complete before it does.",
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
  /** The cards of the partners' page, in the same design as the sellers' plan cards. */
  cards: {
    title: "What a partner earns",
    join: {
      name: "Join",
      note: "By application, issued by hand",
      price: "$0",
      unit: "to join",
      features: [
        "A code and a link that ends in ?ref=",
        "Your code stays on the seller's device for 60 days",
        "Paid once a month, by bank transfer or Payoneer",
        "No minimum, and either side can stop at any time",
      ],
      cta: "Write to us to apply",
    },
    pass: {
      name: "An Appeal Pass sale",
      note: "One seller, one case",
      price: PARTNER_SALES.pass.earns,
      unit: "per sale",
      features: [
        "Thirty percent of what the seller pays",
        `The seller pays ${PARTNER_SALES.pass.pays}: $${SALE.passPrice} less your $${SALE.discount} discount`,
        "Paid after the 14-day refund window",
        "Nothing if the Pass is refunded",
      ],
      cta: "Read the rules",
    },
    account: {
      name: "An Account Pass sale",
      note: "One seller, every case for 12 months",
      price: PARTNER_SALES.account.earns,
      unit: "per sale",
      features: [
        "The same thirty percent of what the seller pays",
        `The seller pays ${PARTNER_SALES.account.pays}: $${SALE.accountPrice} less your $${SALE.discount} discount`,
        "Paid after the 14-day refund window",
        "Nothing if the Pass is refunded",
      ],
      cta: "Read the rules",
    },
    welcome:
      "Teachers, advisors, agencies and communities are welcome. Write to us and tell us where you share with sellers.",
  },
  how: {
    title: "How it works",
    steps: [
      {
        title: "Write to us",
        body: "Tell us who you are and where you share with sellers. Codes and links are issued by hand while the program is small, so writing to us is the sign-up.",
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
        body: "After payment and the 14-day refund window, 30 percent of the discounted price before tax becomes eligible for payment. We pay once a month, by bank transfer or Payoneer.",
      },
    ],
  },
  earn: {
    title: "What you earn",
    body: "Thirty percent of the discounted price before tax, once, for each Pass. The Pass is $249 and a seller using a code pays $224 before tax, so a sale earns $67.20.",
    refunded:
      "Refunds reduce the commission by the refunded amount before tax. A fully refunded or charged-back Pass pays nothing. If commission was already paid out, the adjustment comes off your next payment.",
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
      process.env.NEXT_PUBLIC_REFERRALS_ENABLED === "true"
        ? "Sign in to your partner account to see your codes, refund-window holds, balance and payments. Buyer identities and case details stay private."
        : "Codes are issued individually. Contact us for a statement of your sales and balance.",
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
