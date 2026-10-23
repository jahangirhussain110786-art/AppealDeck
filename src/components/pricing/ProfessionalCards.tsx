import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PriceCardGrid, type PriceCardData } from "@/components/pricing/PriceCards";
import { PROS } from "@/content/audiences";
import { OPENS_SOON } from "@/content/purchases";
import {
  packsEnabled,
  pack10PriceId,
  pack30PriceId,
  proPlanEnabled,
  previewPlans,
} from "@/lib/plans";

/**
 * The writers' and VA teams' prices as cards, in the same design as the sellers' plan cards.
 * A professional product is a card while it is on sale or previewed; a product that is previewed
 * has a disabled "Opens soon" and cannot be bought (the buying controls are `ProPurchase`, which
 * the page mounts under the cards, and they need the Paddle price too).
 */
export function ProfessionalCards() {
  const c = PROS.cards;
  const creditsListed = packsEnabled() || previewPlans();
  const proListed = proPlanEnabled() || previewPlans();
  const soon = (
    <Button size="lg" variant="outline" disabled className="w-full">
      {OPENS_SOON.label}
    </Button>
  );
  const buy = (label: string, featured = false) => (
    <Button asChild size="lg" variant={featured ? "default" : "outline"} className="w-full">
      <a href="#buy">{label}</a>
    </Button>
  );
  const cards: PriceCardData[] = [
    {
      key: "free",
      ...c.free,
      cta: (
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link href="/decode">{c.free.cta}</Link>
        </Button>
      ),
    },
    {
      key: "pass",
      ...c.pass,
      cta: (
        <Button asChild size="lg" variant="outline" className="w-full">
          <Link href="/pricing#purchase">{c.pass.cta}</Link>
        </Button>
      ),
    },
  ];
  if (creditsListed)
    cards.push({
      key: "credits",
      ...c.credits,
      cta: pack10PriceId() || pack30PriceId() ? buy(c.credits.cta) : soon,
    });
  if (proListed)
    cards.push({
      key: "pro",
      ...c.pro,
      featured: true,
      cta: proPlanEnabled() ? buy(c.pro.cta, true) : soon,
    });
  return <PriceCardGrid cards={cards} aria-label="Prices for writers and VA teams" />;
}
