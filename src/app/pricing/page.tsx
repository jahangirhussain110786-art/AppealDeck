import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, Info } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FaqAccordion } from "@/components/pricing/FaqAccordion";
import { PurchasePanel } from "@/components/pricing/PurchasePanel";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { GLOBAL_EXPECTATIONS } from "@/core/guidance";
import { AccentWord } from "@/components/ui/accent-word";
import { HOME, PRICING } from "@/content/marketing";
import { SHARED } from "@/content/shared";
import { splitAccent } from "@/lib/splitAccent";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: { canonical: "/pricing" },
  title: SHARED.metadata.titlePricing,
  description: SHARED.metadata.descriptionPricing,
  openGraph: {
    title: SHARED.metadata.titlePricing,
    description: SHARED.metadata.descriptionPricing,
  },
};

const HEADLINE = splitAccent(PRICING.headline, PRICING.accent);
const READ_FIRST = splitAccent(PRICING.readFirstTitle, PRICING.readFirstAccent);

function ValueCell({ value }: { value: string }) {
  // v5: a tick disc and a dash, each with its meaning spoken to a screen reader.
  if (value === "Yes") {
    return (
      <span className="inline-flex size-[22px] items-center justify-center rounded-full bg-success/15">
        <Check aria-hidden className="size-3 text-success" strokeWidth={3.5} />
        <span className="sr-only">{PRICING.included}</span>
      </span>
    );
  }
  if (value === "—") {
    return (
      <>
        <span aria-hidden className="text-muted-foreground/60">
          {value}
        </span>
        <span className="sr-only">{PRICING.notIncluded}</span>
      </>
    );
  }
  return <span className="text-sm text-foreground">{value}</span>;
}

/**
 * 26 Sep 2026 (the prototype pass): the three plans lead, side by side, with the Pass on the
 * inverted panel; the comparison table follows for the detail; the expectations card and the
 * checkout keep their order, because the consent spec (legal/withdrawal-consent.md item 1)
 * requires the expectations to be read before the pay button is reached.
 */
export default function PricingPage() {
  const plans = HOME.plans.items;
  return (
    <MarketingShell bleed>
      <section className="stage dark text-foreground">
        <div className="mx-auto flex max-w-[56rem] flex-col items-center px-4 pb-40 pt-16 text-center sm:px-8 sm:pt-20">
          <p className="mb-5 inline-flex h-8 items-center gap-2.5 rounded-full bg-white/[0.06] pl-1.5 pr-3.5 text-[0.84375rem] text-muted-foreground ring-1 ring-inset ring-white/[0.08]">
            <b className="rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {PRICING.currency}
            </b>
            {PRICING.currencyNote}
          </p>
          <h1 className="text-balance text-[clamp(2.4rem,1.3rem+3.6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.045em] text-foreground">
            {HEADLINE ? (
              <>
                {HEADLINE.pre}
                <AccentWord className="text-primary">{HEADLINE.accent}</AccentWord>
                {HEADLINE.post}
              </>
            ) : (
              PRICING.headline
            )}
          </h1>
          <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-muted-foreground">
            {PRICING.subline}
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-marketing px-4 sm:px-8">
        <section className="relative -mt-28 pb-6">
          <div className="grid gap-4 lg:grid-cols-3">
            {plans.map((plan, i) => {
              const pass = i === plans.length - 1;
              return (
                <div
                  key={plan.name}
                  className={cn(
                    "flex flex-col gap-6 rounded-[22px] p-7 sm:p-8",
                    pass
                      ? "stage stage-plain dark text-foreground shadow-stage"
                      : "border border-border/80 bg-card shadow-lift",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p
                        className={cn(
                          "text-sm font-semibold",
                          pass ? "text-primary" : "text-muted-foreground",
                        )}
                      >
                        {plan.name}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">{plan.note}</p>
                    </div>
                  </div>
                  <p className="text-5xl font-semibold tracking-[-0.045em] text-foreground" data-tn>
                    {plan.price}
                  </p>
                  <ul className="flex flex-col gap-2.5 text-[0.95rem] text-muted-foreground">
                    {plan.features.map((f) => (
                      <li key={f} className="grid grid-cols-[1.25rem_1fr] gap-2.5">
                        <span className="mt-1 grid size-4 place-items-center rounded-full bg-success/15">
                          <Check aria-hidden className="size-2.5 text-success" strokeWidth={3.5} />
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  {/* The action after the features, at the foot of every card, as in the prototype. */}
                  <div className="mt-auto">
                    {pass ? (
                      <Button asChild size="lg" className="w-full">
                        <a href="#purchase">{PRICING.jumpToPurchase}</a>
                      </Button>
                    ) : (
                      <Button asChild size="lg" variant="outline" className="w-full">
                        <Link href={i === 0 ? "/decode" : "/signup"}>
                          {i === 0 ? SHARED.nav.decodeCta : PRICING.createAccount}
                        </Link>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-5 text-center text-sm text-muted-foreground">{PRICING.checkoutNote}</p>
        </section>

        <section className="py-16">
          <h2 className="mb-6 text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] font-semibold tracking-[-0.035em] text-foreground">
            {PRICING.compareTitle}
          </h2>
          <div className="overflow-x-auto">
            <Card className="overflow-hidden rounded-[20px] p-0 shadow-lift">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{PRICING.tableHeadings.feature}</TableHead>
                    <TableHead className="text-center">{PRICING.tableHeadings.free}</TableHead>
                    <TableHead className="text-center">{PRICING.tableHeadings.account}</TableHead>
                    <TableHead className="bg-[hsl(var(--stage-2))] text-center text-white">
                      {PRICING.tableHeadings.pass}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.values(PRICING.rows).map((row) => (
                    <TableRow key={row.feature}>
                      <TableCell className="font-medium">{row.feature}</TableCell>
                      <TableCell className="text-center">
                        <ValueCell value={row.free} />
                      </TableCell>
                      <TableCell className="text-center">
                        <ValueCell value={row.account} />
                      </TableCell>
                      <TableCell className="bg-primary/[0.05] text-center">
                        <ValueCell value={row.pass} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        </section>

        <section
          id="purchase"
          aria-labelledby="pricing-read-first"
          className="grid gap-10 py-16 lg:grid-cols-2 lg:items-start lg:gap-12"
        >
          {/* The honest-expectations disclosure comes before the pay button, per the checkout-
            consent spec (legal/withdrawal-consent.md item 1) and D8: software and not legal advice,
            no promised outcome, here; the price once per case and the refund route on the order
            summary beside it. Order fixed 11 Sep 2026 (audit guidebook §F3); v5 look 26 Sep 2026. */}
          <div>
            <h2
              id="pricing-read-first"
              className="text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] font-semibold tracking-[-0.035em] text-foreground"
            >
              {READ_FIRST ? (
                <>
                  {READ_FIRST.pre}
                  <AccentWord className="text-primary-ink">{READ_FIRST.accent}</AccentWord>
                  {READ_FIRST.post}
                </>
              ) : (
                PRICING.readFirstTitle
              )}
            </h2>
            <ul className="mt-6 border-t border-border">
              {PRICING.limits.map((l) => (
                <li
                  key={l.title}
                  className="grid grid-cols-[1.75rem_minmax(0,1fr)] gap-3 border-b border-border py-4"
                >
                  <span
                    aria-hidden
                    className="mt-0.5 inline-flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary"
                  >
                    <Info className="size-3.5" />
                  </span>
                  <span>
                    <strong className="block font-semibold text-foreground">{l.title}</strong>
                    <span className="text-muted-foreground">{l.body}</span>
                  </span>
                </li>
              ))}
            </ul>
            {/* D6's honest-expectations card, before the pay button (faq.spec pins the order). */}
            <HonestExpectationsCard
              layout="rows"
              className="mt-8"
              summary={GLOBAL_EXPECTATIONS.typicalNote}
              weDo={GLOBAL_EXPECTATIONS.whatWeDo}
              weDoNot={GLOBAL_EXPECTATIONS.whatWeDoNot}
            />
          </div>
          <div className="space-y-4">
            <div className="rounded-[20px] bg-card p-6 shadow-lift ring-1 ring-inset ring-border">
              <p className="pb-3 text-lg font-semibold tracking-[-0.02em]">{PRICING.order.title}</p>
              <dl className="divide-y divide-border border-t border-border text-[0.9375rem]">
                {[
                  [PRICING.order.line, PRICING.order.amount, false],
                  [PRICING.order.tax, PRICING.order.taxValue, true],
                  [PRICING.order.expires, PRICING.order.expiresValue, true],
                ].map(([k, v, quiet]) => (
                  <div
                    key={String(k)}
                    className={cn(
                      "flex justify-between py-3",
                      quiet ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    <dt>{k}</dt>
                    <dd className="tabular-nums">{v}</dd>
                  </div>
                ))}
                <div className="flex justify-between py-3 text-lg font-semibold">
                  <dt>{PRICING.order.total}</dt>
                  <dd className="tabular-nums">{PRICING.order.amount}</dd>
                </div>
              </dl>
            </div>
            <PurchasePanel />
            <p className="text-center text-[0.84375rem] text-muted-foreground">
              {PRICING.order.paidThrough}
            </p>
          </div>
        </section>

        <section className="grid gap-8 pb-16 sm:pb-20 lg:grid-cols-[18rem_1fr] lg:gap-16">
          <SectionHeading title={PRICING.faqTitle} />
          <div>
            <FaqAccordion ids={PRICING.faqIds} />
            <Link
              href="/faq"
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-link underline-offset-4 hover:underline"
            >
              {SHARED.nav.faq}
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </MarketingShell>
  );
}
