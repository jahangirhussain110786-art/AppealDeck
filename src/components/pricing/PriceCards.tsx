import type { ReactNode } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * One card of a pricing page. Sellers, writers and VA teams, and partners all show their prices as
 * these cards, in the same place under the same dark hero, so the three pages read as one pricing
 * system instead of one pricing page and two guides (22 Oct 2026). The card only displays; what its
 * button does (open a purchase, mail us, or say "Opens soon") is the caller's `cta`.
 */
export type PriceCardData = {
  key: string;
  name: string;
  /** One line under the name: who it is for or how it is paid. */
  note: string;
  price: string;
  /** Small text beside the price: "a case", "a month", "per sale". */
  unit?: string;
  features: readonly string[];
  /** The card on the inverted panel. At most one per page. */
  featured?: boolean;
  /** Anything that belongs between the features and the button (the founding-offer counter). */
  extra?: ReactNode;
  cta: ReactNode;
};

/** The grid class for a row of this many cards: two or three sit in one row, four wrap to two by two. */
export function gridClassFor(count: number): string {
  if (count >= 4) return "sm:grid-cols-2 xl:grid-cols-4";
  return count <= 2 ? "sm:grid-cols-2" : "lg:grid-cols-3";
}

export function PriceCardGrid({
  cards,
  className,
  "aria-label": ariaLabel,
}: {
  cards: readonly PriceCardData[];
  className?: string;
  "aria-label"?: string;
}) {
  return (
    <ul aria-label={ariaLabel} className={cn("grid gap-4", gridClassFor(cards.length), className)}>
      {cards.map((card) => (
        <li
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
          <p className="flex items-baseline gap-2 text-foreground" data-tn>
            <span className="text-5xl font-semibold tracking-[-0.045em]">{card.price}</span>
            {card.unit && <span className="text-sm text-muted-foreground">{card.unit}</span>}
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
          {card.extra}
          {/* The action after the features, at the foot of every card, as in the prototype. */}
          <div className="mt-auto">{card.cta}</div>
        </li>
      ))}
    </ul>
  );
}
