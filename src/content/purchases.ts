// Copy for the products beyond the Appeal Pass and the Account Pass (22 Oct 2026, stage 3 of the
// combined plan). One file, so the pricing screens, the checkout summary, the purchase email and the
// tests all say the same thing. Rules for this file:
// - Each price here must equal the Paddle price of the same product (docs/DEPLOYMENT.md section 5e).
//   `purchases.test.ts` recomputes every figure that is derived from another.
// - It states only what the product does. No outcome, no win rate, no comparison to a lawyer.
// - The banned-pattern and banned-number rules apply (scripts/lint-copy.mjs): no percent sign, no
//   "N hours".

export type PurchaseKind =
  | "appeal_pass"
  | "account_pass"
  | "document_review"
  | "account_renewal"
  | "pack_10"
  | "pack_30"
  | "pro_plan";

export const PRODUCTS = {
  /** The AI reading of one case's documents, credited toward the Appeal Pass. */
  review: {
    name: "AI document review",
    price: "$49",
    amount: "$49.00",
    /** What the Appeal Pass costs for a case that has a review: the review's price comes off. */
    creditedPassAmount: "$200.00",
    note: "One case, five documents",
    teaser:
      "Not ready for the whole Pass? Have the AI read up to five of one case's documents for $49. The $49 comes off the Appeal Pass if you buy it for that case.",
    summary:
      "The AI reads up to five of this case's documents against what Amazon asked, and the $49 comes off the Appeal Pass for the same case.",
    features: [
      "Up to five documents for this case read by the AI against the notice",
      "The same checks the Appeal Pass includes, for the same documents",
      "The $49 comes off the Appeal Pass for this case, which then costs $200",
      "The same 14-day refund, no questions asked",
    ],
    cta: "Get the AI reading",
    order: { title: "AI document review", line: "Five documents, one case", expires: "Never" },
    /** Shown on the Appeal Pass's order summary for a case that already has a review. */
    creditLine: "The review's $49 is already taken off",
    reading:
      "Your documents are read on your device for nothing. The review adds the AI reading for this case.",
  },
  /** Twelve more months on an Account Pass that is ending. */
  renewal: {
    name: "Account Pass renewal",
    price: "$99",
    amount: "$99.00",
    note: "12 more months",
    summary:
      "Twelve more months of cover for every case on your account, added to the end of your Account Pass.",
    cta: "Renew for 12 months",
    order: {
      title: "Account Pass renewal",
      line: "12 more months",
      expires: "12 months after your Account Pass ends",
    },
    /** On the billing page, with the date the cover ends. */
    ending: "Your Account Pass covers new cases until {date}. You can renew from {opens}.",
    open: "Your Account Pass ends on {date}. Renew now and the 12 months start when it ends.",
    ended: "Your Account Pass ended on {date}. You can still renew until {closes}.",
  },
  pack10: {
    name: "10 case credits",
    price: "$390",
    amount: "$390.00",
    each: "$39",
    count: 10,
    note: "For verified professionals",
    cta: "Buy 10 credits",
    order: {
      title: "10 case credits",
      line: "Ten cases, one credit each",
      expires: "12 months after you buy",
    },
  },
  pack30: {
    name: "30 case credits",
    price: "$870",
    amount: "$870.00",
    each: "$29",
    count: 30,
    note: "For verified professionals",
    cta: "Buy 30 credits",
    order: {
      title: "30 case credits",
      line: "Thirty cases, one credit each",
      expires: "12 months after you buy",
    },
  },
  pro: {
    name: "Pro plan",
    price: "$349",
    amount: "$349.00",
    per: "a month",
    credits: 10,
    /** What a case costs on the plan: it sits between the 10-pack and the 30-pack on purpose. */
    each: "$34.90",
    note: "For verified professionals",
    cta: "Start the Pro plan",
    order: { title: "Pro plan", line: "Every month, until you cancel", expires: "Renews monthly" },
    summary:
      "Ten case credits every month, $34.90 a case. A credit you do not use lasts one more month. Cancel any time in Billing.",
  },
  credits: {
    /** What a credit is, said once and used wherever credits are shown. */
    what: "A case credit activates one case: it gives that case an Appeal Pass, with every round included.",
    left: "{n} case credits left",
    leftOne: "1 case credit left",
    none: "No case credits left",
    endsOn: "The next ones to end do so on {date}.",
    use: "Use 1 case credit for this case",
    using: "Using a credit…",
    used: "Done. This case now has an Appeal Pass.",
    covered: "This case is already covered, so nothing was spent.",
    alreadyUsed: "A credit was already used on this case.",
    noCredit: "You have no case credits left. Buy a pack or wait for your next monthly credits.",
    notVerified: "Case credits are for professionals we have verified.",
    failed: "That did not work and nothing was spent. Try again in a moment.",
    page: "/for-professionals",
    buyMore: "Buy more credits",
  },
  /**
   * The $25 outcome-report rebate (migration 0019). Said plainly, because it is a money promise and
   * because the report is tied to the account, unlike the anonymous share beside it.
   */
  rebate: {
    amount: "$25",
    title: "Tell us how your case ended, and get $25 back",
    body: "Whatever the result, tell us within 120 days of paying and we refund $25 of that payment. We link the report to your account so we know whom to refund. It is not published, and it is separate from the anonymous share.",
    deadline: "You can report until {date}.",
    resultLabel: "How did it end?",
    results: {
      approved: "Amazon accepted it: my account or listing was reinstated",
      rejected: "Amazon refused",
      no_response: "No answer yet",
      withdrawn: "I withdrew or gave up",
    },
    days: "About how many days did it take? (optional)",
    submit: "Send my report",
    sending: "Sending…",
    done: "Thank you. We will refund $25 to the payment you made for this Pass. It shows on your receipt from Paddle.",
    already: "You have already reported on this payment.",
    notEligible: "There is no payment to refund a rebate on.",
    failed: "That did not send. Nothing was recorded. Try again in a moment.",
  },
  /** The professionals' part of the Billing page. */
  billing: {
    creditsTitle: "Case credits",
    manage: "Cancel or manage your Pro plan",
    managing: "Opening…",
    manageFallback:
      "The billing portal is not available right now. Write to billing@appealdeck.com and we will cancel your Pro plan the same day.",
    proActive: "Your Pro plan is active. It renews every month until you cancel it.",
    renewalTitle: "Renew your Account Pass",
  },
} as const;

export const PRO_VERIFICATION = {
  title: "Verified professionals",
  body: "Credit packs and the Pro plan are for appeal writers, consultants and VA teams who handle other sellers' cases. We verify each one by hand, from a public profile you give us (a Fiverr or Upwork page, LinkedIn, or your own site), so a seller cannot buy a professional price for their own case.",
  how: "Write to us with the email you signed up with and a link to your public profile. We reply when you are verified.",
  verified: "You are verified.",
  notVerified: "You are not verified yet.",
  signIn: "Sign in to buy",
} as const;

/** What the purchase confirmation email says each product is. */
export const EMAIL_PRODUCTS: Record<
  Exclude<PurchaseKind, "appeal_pass" | "account_pass">,
  { name: string; priceLine: string }
> = {
  document_review: {
    name: PRODUCTS.review.name,
    priceLine: `List price: ${PRODUCTS.review.price} (one-time; the AI reads up to five documents for one case, and the ${PRODUCTS.review.price} comes off the Appeal Pass price for that case)`,
  },
  account_renewal: {
    name: PRODUCTS.renewal.name,
    priceLine: `List price: ${PRODUCTS.renewal.price} (one-time; adds twelve months to your Account Pass)`,
  },
  pack_10: {
    name: `pack of ${PRODUCTS.pack10.count} case credits`,
    priceLine: `List price: ${PRODUCTS.pack10.price} (one-time; ten case credits, each of which activates one case; they last 12 months)`,
  },
  pack_30: {
    name: `pack of ${PRODUCTS.pack30.count} case credits`,
    priceLine: `List price: ${PRODUCTS.pack30.price} (one-time; thirty case credits, each of which activates one case; they last 12 months)`,
  },
  pro_plan: {
    name: PRODUCTS.pro.name,
    priceLine: `List price: ${PRODUCTS.pro.price} ${PRODUCTS.pro.per} (it renews every month until you cancel it in Billing, and adds ${PRODUCTS.pro.credits} case credits each month)`,
  },
};
