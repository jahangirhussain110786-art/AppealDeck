import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Mail as MailIcon } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { PartnerCards } from "@/components/pricing/PartnerCards";
import { PricingStage } from "@/components/pricing/PricingStage";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pageMetadata } from "@/content/pageMetadata";
import { PARTNERS } from "@/content/audiences";

export const metadata: Metadata = pageMetadata({
  title: PARTNERS.metadata.title,
  description: PARTNERS.metadata.description,
  canonical: "/partners",
});

/**
 * The partner program (22 Oct 2026). It opens like the sellers' pricing page, with the same dark
 * hero and what a partner earns as cards under it. The commission, the discount, the payout and the
 * rules follow in full, because a partner who advises sellers has a duty to tell them about the fee
 * and should read ours before they say yes. Codes are Paddle discounts made by hand, so the page
 * says there is no sign-up form and no dashboard yet. See `src/content/audiences.ts`.
 */
export default function PartnersPage() {
  return (
    <MarketingShell bleed>
      <PricingStage
        title={PARTNERS.hero.title}
        accent={PARTNERS.hero.accent}
        subline={PARTNERS.hero.lede}
      >
        <div className="mt-8">
          <Button asChild size="lg">
            <a href={PARTNERS.mailto}>
              <MailIcon aria-hidden />
              {PARTNERS.hero.cta}
            </a>
          </Button>
        </div>
      </PricingStage>

      <div className="mx-auto w-full max-w-marketing px-4 sm:px-8">
        <section className="relative -mt-28 pb-6">
          <PartnerCards />
          <p className="mx-auto mt-6 max-w-prose text-center text-base font-medium text-foreground">
            {PARTNERS.cards.welcome}
          </p>
        </section>

        <div className="space-y-14 py-12 sm:py-16">
          <section aria-labelledby="partners-earn" className="space-y-3">
            <h2
              id="partners-earn"
              className="text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] font-semibold tracking-[-0.035em] text-foreground"
            >
              {PARTNERS.earn.title}
            </h2>
            <p className="max-w-prose text-base leading-relaxed text-foreground/90">
              {PARTNERS.earn.body}
            </p>
            {PARTNERS.earn.accountPass && (
              <p className="max-w-prose text-base leading-relaxed text-foreground/90">
                {PARTNERS.earn.accountPass}
              </p>
            )}
            {PARTNERS.earn.scope && (
              <p className="max-w-prose text-base leading-relaxed text-foreground/90">
                {PARTNERS.earn.scope}
              </p>
            )}
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {PARTNERS.earn.refunded}
            </p>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {PARTNERS.earn.noDashboard}
            </p>
          </section>

          <section aria-labelledby="partners-how">
            <h2
              id="partners-how"
              className="text-lg font-semibold tracking-[-0.02em] text-foreground"
            >
              {PARTNERS.how.title}
            </h2>
            <ol className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PARTNERS.how.steps.map((step, i) => (
                <li key={step.title}>
                  <Card className="h-full space-y-2 p-5 sm:p-6">
                    <p className="flex items-center gap-3 text-base font-semibold text-foreground">
                      <span
                        aria-hidden
                        className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-sm text-primary-ink tabular-nums"
                      >
                        {i + 1}
                      </span>
                      {step.title}
                    </p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
                  </Card>
                </li>
              ))}
            </ol>
          </section>

          <section
            id="partners-rules"
            aria-labelledby="partners-rules-title"
            className="scroll-mt-24 space-y-3"
          >
            <h2
              id="partners-rules-title"
              className="text-lg font-semibold tracking-[-0.02em] text-foreground"
            >
              {PARTNERS.rules.title}
            </h2>
            <ul className="space-y-2 text-sm leading-relaxed text-foreground/90">
              {PARTNERS.rules.items.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
              {PARTNERS.rules.review}
            </p>
          </section>

          <section aria-labelledby="partners-share" className="space-y-3">
            <h2
              id="partners-share"
              className="text-lg font-semibold tracking-[-0.02em] text-foreground"
            >
              {PARTNERS.share.title}
            </h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-2">
              {PARTNERS.share.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-8 items-center gap-1 max-sm:min-h-11 [@media(pointer:coarse)]:min-h-11 text-sm font-medium text-link underline-offset-4 hover:underline"
                  >
                    {item.label}
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </MarketingShell>
  );
}
