import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Mail as MailIcon } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHero } from "@/components/PageHero";
import { AudienceSwitch } from "@/components/AudienceSwitch";
import { AccentWord } from "@/components/ui/accent-word";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pageMetadata } from "@/content/pageMetadata";
import { PROS } from "@/content/audiences";
import { splitAccent } from "@/lib/splitAccent";

export const metadata: Metadata = pageMetadata({
  title: PROS.metadata.title,
  description: PROS.metadata.description,
  canonical: "/for-professionals",
});

const TITLE = splitAccent(PROS.hero.title, PROS.hero.accent);

/**
 * The writers' and VA teams' page of /pricing (22 Oct 2026). It says what a professional can use
 * today, what it costs today and that professional pricing is not set yet, because it is not: a
 * plan, packs or a shared team case are not here until they exist. See `src/content/audiences.ts`.
 */
export default function ForProfessionalsPage() {
  return (
    <MarketingShell
      className="max-w-app"
      hero={
        <PageHero
          eyebrow={PROS.hero.eyebrow}
          title={
            TITLE ? (
              <>
                {TITLE.pre}
                <AccentWord className="text-primary">{TITLE.accent}</AccentWord>
                {TITLE.post}
              </>
            ) : (
              PROS.hero.title
            )
          }
          intro={PROS.hero.lede}
        >
          <AudienceSwitch className="mt-8" />
          <div className="mt-8 flex flex-wrap gap-3">
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
        </PageHero>
      }
    >
      <div className="space-y-14 py-12 sm:py-16">
        <section aria-labelledby="pros-today">
          <h2 id="pros-today" className="text-lg font-semibold tracking-[-0.02em] text-foreground">
            {PROS.today.title}
          </h2>
          <ul className="mt-5 grid gap-4 sm:grid-cols-2">
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

        <section aria-labelledby="pros-cost" className="space-y-4">
          <h2 id="pros-cost" className="text-lg font-semibold tracking-[-0.02em] text-foreground">
            {PROS.cost.title}
          </h2>
          <p className="max-w-prose text-base leading-relaxed text-foreground/90">
            {PROS.cost.body}
          </p>
          <Card className="max-w-prose space-y-2 border-primary/30 p-5 sm:p-6">
            <p className="text-base font-semibold text-foreground">{PROS.cost.open}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">{PROS.cost.openBody}</p>
            <Button asChild variant="outline" className="mt-2">
              <a href={PROS.mailto}>
                <MailIcon aria-hidden />
                {PROS.hero.cta}
              </a>
            </Button>
          </Card>
        </section>

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
            className="inline-flex items-center gap-1 text-sm font-medium text-link underline-offset-4 hover:underline"
          >
            {PROS.partner.link}
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </section>

        <section aria-labelledby="pros-limits" className="space-y-3">
          <h2 id="pros-limits" className="text-lg font-semibold tracking-[-0.02em] text-foreground">
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
    </MarketingShell>
  );
}
