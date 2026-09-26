import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { AccentWord } from "@/components/ui/accent-word";
import { GLOBAL_EXPECTATIONS } from "@/core/guidance";
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

function ValueCell({ value }: { value: string }) {
  if (value === "Yes") {
    return (
      <span className="inline-flex items-center gap-1.5 text-foreground">
        <Check className="size-4 text-success" />
        {value}
      </span>
    );
  }
  if (value === "—") {
    return <span className="text-muted-foreground/60">{value}</span>;
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
    <MarketingShell>
      <section className="mx-auto flex max-w-[52rem] flex-col items-center pb-12 pt-16 text-center sm:pt-20">
        <h1 className="text-balance text-display text-foreground">
          {HEADLINE ? (
            <>
              {HEADLINE.pre}
              <AccentWord>{HEADLINE.accent}</AccentWord>
              {HEADLINE.post}
            </>
          ) : (
            PRICING.headline
          )}
        </h1>
        <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-muted-foreground">
          {PRICING.subline}
        </p>
      </section>

      <section className="pb-6">
        <div className="grid overflow-hidden rounded-xl border border-border bg-card md:grid-cols-3">
          {plans.map((plan, i) => {
            const pass = i === plans.length - 1;
            return (
              <div
                key={plan.name}
                className={cn(
                  "flex flex-col gap-6 p-7 sm:p-8",
                  pass
                    ? "dark bg-background text-foreground"
                    : "border-b border-border md:border-b-0 md:border-r",
                )}
              >
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
                <p className="text-5xl font-semibold tracking-tight text-foreground" data-tn>
                  {plan.price}
                </p>
                {pass ? (
                  <Button asChild size="lg">
                    <a href="#purchase">{PRICING.jumpToPurchase}</a>
                  </Button>
                ) : (
                  <Button asChild size="lg" variant="outline">
                    <Link href={i === 0 ? "/decode" : "/signup"}>
                      {i === 0 ? SHARED.nav.decodeCta : PRICING.createAccount}
                    </Link>
                  </Button>
                )}
                <ul className="hairline-rows text-sm text-foreground/90">
                  {plan.features.map((f) => (
                    <li key={f} className="py-2.5">
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">{PRICING.checkoutNote}</p>
      </section>

      <section className="py-16">
        <h2 className="mb-5 text-h3 text-foreground">{PRICING.compareTitle}</h2>
        <div className="overflow-x-auto">
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{PRICING.tableHeadings.feature}</TableHead>
                  <TableHead className="text-center">{PRICING.tableHeadings.free}</TableHead>
                  <TableHead className="text-center">{PRICING.tableHeadings.account}</TableHead>
                  <TableHead className="text-center">{PRICING.tableHeadings.pass}</TableHead>
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
                    <TableCell className="bg-primary/[0.04] text-center">
                      <ValueCell value={row.pass} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </section>

      <section id="purchase" className="grid gap-6 pb-16 lg:grid-cols-2 lg:items-start">
        {/* Honest-expectations card renders before the purchase panel, per the checkout-consent
            spec (legal/withdrawal-consent.md item 1) and D8's intent — a visitor must see the
            expectations disclosure before they reach the pay button, not after. Fixed 11 Sep 2026;
            see docs/handoffs/2026-09-11-full-repo-audit-guidebook.md Section F3. */}
        <HonestExpectationsCard
          summary={GLOBAL_EXPECTATIONS.typicalNote}
          weDo={GLOBAL_EXPECTATIONS.whatWeDo}
          weDoNot={GLOBAL_EXPECTATIONS.whatWeDoNot}
        />
        <Card>
          <CardHeader>
            <CardTitle as="h2" className="text-h3">
              {PRICING.purchaseTitle}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Start your case and confirm the request first. Your pass applies to that case.
            </p>
          </CardHeader>
          <CardContent>
            <PurchasePanel />
          </CardContent>
        </Card>
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
    </MarketingShell>
  );
}
