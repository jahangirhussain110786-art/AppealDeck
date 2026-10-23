import { Mail as MailIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceCardGrid, type PriceCardData } from "@/components/pricing/PriceCards";
import { PARTNERS } from "@/content/audiences";
import { OPENS_SOON } from "@/content/purchases";
import { accountPassEnabled, accountPassListed } from "@/lib/plans";

/**
 * What a partner earns, as cards in the same design as the sellers' plan cards: joining, then one
 * card per Pass a partner can earn on. The Account Pass card is previewed with a disabled "Opens
 * soon" until that Pass is on sale, since there is no commission to earn on a Pass nobody can buy.
 */
export function PartnerCards() {
  const c = PARTNERS.cards;
  const rules = (
    <Button asChild size="lg" variant="outline" className="w-full">
      <a href="#partners-rules">{c.pass.cta}</a>
    </Button>
  );
  const cards: PriceCardData[] = [
    {
      key: "join",
      ...c.join,
      featured: true,
      cta: (
        <Button asChild size="lg" className="w-full">
          <a href={PARTNERS.mailto}>
            <MailIcon aria-hidden />
            {c.join.cta}
          </a>
        </Button>
      ),
    },
    { key: "pass", ...c.pass, cta: rules },
  ];
  if (accountPassListed())
    cards.push({
      key: "account",
      ...c.account,
      cta: accountPassEnabled() ? (
        rules
      ) : (
        <Button size="lg" variant="outline" disabled className="w-full">
          {OPENS_SOON.label}
        </Button>
      ),
    });
  return <PriceCardGrid cards={cards} aria-label="What a partner earns" />;
}
