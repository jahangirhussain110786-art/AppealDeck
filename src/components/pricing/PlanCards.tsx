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
  accountPassListed,
  foundingEnabled,
  singleEnabled,
  singleListed,
} from "@/lib/plans";

/**
 * The sellers' plans, side by side (23 Oct 2026): Free, One Response (the smallest paid plan: one
 * case, one prepared response), the Appeal Pass and the Account Pass. The free account is a line on
 * the Free card, not a card of its own. The Account Pass is a card while it is listed: with a
 * working button once its Paddle price is configured, and a disabled "Opens soon" until then (see
 * `previewPlans()`); it is the featured one, because it covers the most. One Response is the same:
 * a working button once its Paddle price is configured (`singleEnabled()`), "Opens soon" until
 * then. Which Pass is chosen starts as the Appeal Pass and only a click changes it.
 */
export function PlanCards() {
  const [free, single, pass] = HOME.plans.items;
  const withAccount = accountPassListed();
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
  if (singleListed())
    cards.push({
      key: "single",
      name: single.name,
      note: single.note,
      price: single.price,
      features: single.features,
      cta: singleEnabled() ? (
        <PlanCta plan="single" featured={false}>
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
    featured: !withAccount,
    cta: (
      <PlanCta plan="case" featured={!withAccount}>
        {PRICING.jumpToPurchase}
      </PlanCta>
    ),
  });
  if (withAccount)
    cards.push({
      key: "account",
      name: PRICING.account.name,
      note: PRICING.account.note,
      price: PRICING.account.price,
      features: PRICING.account.features,
      featured: true,
      extra: foundingEnabled() ? (
        <FoundingNote className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/[0.1]" />
      ) : undefined,
      cta: accountPassEnabled() ? (
        <PlanCta plan="account" featured>
          {PRICING.account.cta}
        </PlanCta>
      ) : (
        soon
      ),
    });
  return <PriceCardGrid cards={cards} aria-label="Plans for sellers" />;
}
