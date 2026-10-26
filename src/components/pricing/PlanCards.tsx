import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FoundingNote } from "@/components/pricing/FoundingNote";
import { PlanCta } from "@/components/pricing/PlanCta";
import { PriceCardGrid, type PriceCardData } from "@/components/pricing/PriceCards";
import { OPENS_SOON, PRODUCTS } from "@/content/purchases";
import { HOME, PRICING } from "@/content/marketing";
import { SHARED } from "@/content/shared";
import {
  accountPassEnabled,
  foundingEnabled,
  listedPaidPlans,
  singleEnabled,
  type PassPlan,
} from "@/lib/plans";

/**
 * The sellers' plans, side by side (23 Oct 2026): Free, One Response (the smallest paid plan: one
 * case, one prepared response), the Appeal Pass and the Account Pass. The free account is a line on
 * the Free card, not a card of its own. The Account Pass is a card while it is listed: with a
 * working button once its Paddle price is configured, and a disabled "Opens soon" until then (see
 * `previewPlans()`). The Appeal Pass is the featured card and carries the Recommended pill: it is the
 * plan we recommend for one case and it is on sale. One Response is the same:
 * a working button once its Paddle price is configured (`singleEnabled()`), "Opens soon" until
 * then. Which Pass is chosen starts as the Appeal Pass and only a click changes it.
 *
 * `planCards()` is the one place the seller-facing cards are built. /pricing and the home page both
 * render it, so a price, a note, a feature or a plan's arrival on sale cannot be current on one page
 * and old on the other (26 Oct 2026). Only where a paid button points differs: the home page has no
 * purchase section of its own, and the plan it names must travel in the link, because the choice is
 * kept in memory and a page load would drop it (`?plan=`, read by src/lib/planChoice.ts).
 */
export function planCards(
  purchaseHrefFor: (plan: PassPlan) => string = () => "#purchase",
): PriceCardData[] {
  const [free, single, pass] = HOME.plans.items;
  // The same list the fit strip and the comparison columns read, so a plan cannot appear on one
  // surface and be missing from another (24 Oct 2026).
  const listed = listedPaidPlans();
  const soon = (
    <Button size="lg" variant="outline" disabled className="w-full">
      {OPENS_SOON.label}
    </Button>
  );
  const cards: PriceCardData[] = [
    {
      key: "free",
      ...free,
      // Name and note read like the other cards ("One Response" / "One case, one appeal"); the two
      // parts below say what needs an account and what does not.
      name: "Free",
      note: "For everyone",
      cta: (
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link href="/decode">{SHARED.nav.decodeCta}</Link>
        </Button>
      ),
    },
  ];
  if (listed.includes("single"))
    cards.push({
      key: "single",
      name: single.name,
      note: single.note,
      price: single.price,
      features: single.features,
      cta: singleEnabled() ? (
        <PlanCta plan="single" featured={false} href={purchaseHrefFor("single")}>
          {PRODUCTS.single.cta}
        </PlanCta>
      ) : (
        soon
      ),
    });
  cards.push({
    key: "case",
    ...pass,
    // Our recommendation for the commonest case, one notice and one case; said as advice, not as a count.
    badge: PRODUCTS.recommended,
    // The highlighted card is the one we recommend and that can be bought, whether or not the Account
    // Pass beside it is on sale yet (23 Oct 2026; it was the Account Pass, which is often the disabled one).
    featured: true,
    cta: (
      <PlanCta plan="case" featured href={purchaseHrefFor("case")}>
        {PRICING.jumpToPurchase}
      </PlanCta>
    ),
  });
  if (listed.includes("account"))
    cards.push({
      key: "account",
      name: PRICING.account.name,
      note: PRICING.account.note,
      price: PRICING.account.price,
      features: PRICING.account.features,
      extra: foundingEnabled() ? (
        <FoundingNote className="rounded-2xl bg-muted/60 p-4 ring-1 ring-inset ring-border" />
      ) : undefined,
      cta: accountPassEnabled() ? (
        <PlanCta plan="account" featured={false} href={purchaseHrefFor("account")}>
          {PRICING.account.cta}
        </PlanCta>
      ) : (
        soon
      ),
    });
  return cards;
}

export function PlanCards({
  purchaseHrefFor,
  titleAs,
}: {
  purchaseHrefFor?: (plan: PassPlan) => string;
  titleAs?: "h2" | "h3";
} = {}) {
  return (
    <PriceCardGrid
      cards={planCards(purchaseHrefFor)}
      titleAs={titleAs}
      aria-label="Plans for sellers"
    />
  );
}
