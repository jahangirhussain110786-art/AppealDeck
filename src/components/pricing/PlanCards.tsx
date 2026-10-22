import Link from "next/link";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FoundingNote } from "@/components/pricing/FoundingNote";
import { PlanCta } from "@/components/pricing/PlanCta";
import { HOME, PRICING } from "@/content/marketing";
import { SHARED } from "@/content/shared";
import { accountPassEnabled, foundingEnabled, type PassPlan } from "@/lib/plans";
import { cn } from "@/lib/utils";

type Card = {
  key: "free" | "free-account" | PassPlan;
  name: string;
  note: string;
  price: string;
  features: readonly string[];
  featured: boolean;
};

/**
 * The plans, side by side, as /pricing has shown them since 26 Sep 2026 (the last card is on the
 * inverted panel). The Account Pass is a fourth card only when its Paddle price is configured, and
 * then it is the featured one, because it is the one that covers the most; the Appeal Pass is
 * unchanged beside it. Which Pass is chosen starts as the Appeal Pass and only a click changes it.
 */
export function PlanCards() {
  const [free, freeAccount, pass] = HOME.plans.items;
  const withAccount = accountPassEnabled();
  const cards: Card[] = [
    { key: "free", ...free, featured: false },
    { key: "free-account", ...freeAccount, featured: false },
    { key: "case", ...pass, featured: !withAccount },
  ];
  if (withAccount)
    cards.push({
      key: "account",
      name: PRICING.account.name,
      note: PRICING.account.note,
      price: PRICING.account.price,
      features: PRICING.account.features,
      featured: true,
    });
  return (
    <div
      className={cn("grid gap-4", withAccount ? "sm:grid-cols-2 xl:grid-cols-4" : "lg:grid-cols-3")}
    >
      {cards.map((card) => (
        <div
          key={card.key}
          className={cn(
            "flex flex-col gap-6 rounded-[22px] p-7 sm:p-8",
            card.featured
              ? "stage stage-plain dark text-foreground shadow-stage"
              : "border border-border/80 bg-card shadow-lift",
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p
                className={cn(
                  "text-sm font-semibold",
                  card.featured ? "text-primary" : "text-muted-foreground",
                )}
              >
                {card.name}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{card.note}</p>
            </div>
          </div>
          <p className="text-5xl font-semibold tracking-[-0.045em] text-foreground" data-tn>
            {card.price}
          </p>
          <ul className="flex flex-col gap-2.5 text-[0.95rem] text-muted-foreground">
            {card.features.map((f) => (
              <li key={f} className="grid grid-cols-[1.25rem_1fr] gap-2.5">
                <span className="mt-1 grid size-4 place-items-center rounded-full bg-success/15">
                  <Check aria-hidden className="size-2.5 text-success" strokeWidth={3.5} />
                </span>
                {f}
              </li>
            ))}
          </ul>
          {card.key === "account" && foundingEnabled() && (
            <FoundingNote className="rounded-2xl bg-white/[0.06] p-4 ring-1 ring-inset ring-white/[0.1]" />
          )}
          {/* The action after the features, at the foot of every card, as in the prototype. */}
          <div className="mt-auto">
            {card.key === "case" || card.key === "account" ? (
              <PlanCta plan={card.key} featured={card.featured}>
                {card.key === "account" ? PRICING.account.cta : PRICING.jumpToPurchase}
              </PlanCta>
            ) : (
              <Button asChild size="lg" variant="outline" className="w-full">
                <Link href={card.key === "free" ? "/decode" : "/signup"}>
                  {card.key === "free" ? SHARED.nav.decodeCta : PRICING.createAccount}
                </Link>
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
