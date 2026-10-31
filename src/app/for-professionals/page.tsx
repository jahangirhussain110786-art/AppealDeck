import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Mail as MailIcon } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { PricingStage } from "@/components/pricing/PricingStage";
import { ProfessionalCards } from "@/components/pricing/ProfessionalCards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pageMetadata } from "@/content/pageMetadata";
import { PROS } from "@/content/audiences";
import { ProPurchase } from "@/components/ProPurchase";
import { professionalsListed } from "@/lib/plans";

export const metadata: Metadata = pageMetadata({
  title: PROS.metadata.title,
  description: PROS.metadata.description,
  canonical: "/for-professionals",
});

/**
 * The writers' and VA teams' pricing page (22 Oct 2026). It opens like the sellers' page, with the
 * same dark hero and the prices as cards under it, so the three audiences' pages read as one
 * pricing system; what a professional can use, the buying controls and the limits follow. A product
 * that is not on sale yet is shown as "Opens soon" and cannot be bought. See `src/content/audiences.ts`.
 */
export default function ForProfessionalsPage() {
  return (
    <MarketingShell bleed>
      <PricingStage title={PROS.hero.title} accent={PROS.hero.accent} subline={PROS.hero.lede}>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <a href={PROS.mailto}>
              <MailIcon aria-hidden />
              {PROS.hero.cta}
            </a>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/decode">{PROS.hero.ctaSecondary}</Link>
          </Button>
        </div>
      </PricingStage>

      <div className="mx-auto w-full max-w-marketing px-4 sm:px-8">
        <section className="relative -mt-28 pb-6">
          <ProfessionalCards />
          <p className="mx-auto mt-6 max-w-prose text-center text-base font-medium text-foreground">
            {PROS.cards.welcome}
          </p>
          <p className="mt-3 text-center text-sm text-muted-foreground">{PROS.cards.note}</p>
        </section>

        <div className="space-y-14 py-12 sm:py-16">
          <section aria-labelledby="pros-today">
            <h2
              id="pros-today"
              className="text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] font-semibold tracking-[-0.035em] text-foreground"
            >
              {PROS.today.title}
            </h2>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2">
              {PROS.today.items.map((item) => (
                <li key={item.title}>
                  <Card className="h-full space-y-2 p-5 sm:p-6">
                    <p className="flex items-start gap-2.5 text-base font-semibold text-foreground">
                      <span className="mt-1 grid size-4 shrink-0 place-items-center rounded-full bg-success/15">
                        <Check aria-hidden className="size-2.5 text-success" strokeWidth={3.5} />
                      </span>
                      {item.title}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{item.body}</p>
                  </Card>
                </li>
              ))}
            </ul>
          </section>

          {PROS.cost.open && (
            <section aria-labelledby="pros-cost" className="space-y-4">
              <h2
                id="pros-cost"
                className="text-lg font-semibold tracking-[-0.02em] text-foreground"
              >
                {PROS.cost.title}
              </h2>
              <p className="max-w-prose text-base leading-relaxed text-foreground/90">
                {PROS.cost.body}
              </p>
              <Card className="max-w-prose space-y-2 border-primary/30 p-5 sm:p-6">
                <p className="text-base font-semibold text-foreground">{PROS.cost.open}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {PROS.cost.openBody}
                </p>
                <Button asChild variant="outline" className="mt-2">
                  <a href={PROS.mailto}>
                    <MailIcon aria-hidden />
                    {PROS.hero.cta}
                  </a>
                </Button>
              </Card>
            </section>
          )}

          {professionalsListed() && <ProPurchase />}

          <section aria-labelledby="pros-partner" className="space-y-3">
            <h2
              id="pros-partner"
              className="text-lg font-semibold tracking-[-0.02em] text-foreground"
            >
              {PROS.partner.title}
            </h2>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {PROS.partner.body}
            </p>
            <Link
              href="/partners"
              className="inline-flex min-h-8 items-center gap-1 max-sm:min-h-11 [@media(pointer:coarse)]:min-h-11 text-sm font-medium text-link underline-offset-4 hover:underline"
            >
              {PROS.partner.link}
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </section>

          <section aria-labelledby="pros-limits" className="space-y-3">
            <h2
              id="pros-limits"
              className="text-lg font-semibold tracking-[-0.02em] text-foreground"
            >
              {PROS.limits.title}
            </h2>
            <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
              {PROS.limits.items.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </MarketingShell>
  );
}
