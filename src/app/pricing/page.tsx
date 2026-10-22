import type { Metadata } from "next";
import { pageMetadata } from "@/content/pageMetadata";
import Link from "next/link";
import { ArrowRight, Check, Info } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { SectionHeading } from "@/components/SectionHeading";
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
import { PurchaseSection } from "@/components/pricing/PurchaseSection";
import { PlanCards } from "@/components/pricing/PlanCards";
import { accountPassEnabled, reviewEnabled, reviewListed } from "@/lib/plans";
import { ReviewTeaser } from "@/components/pricing/ReviewTeaser";
import { VersusSection } from "@/components/pricing/VersusSection";
import { AudienceSwitch } from "@/components/AudienceSwitch";
import { RoleNudge } from "@/components/RoleNudge";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { GLOBAL_EXPECTATIONS } from "@/core/guidance";
import { AccentWord } from "@/components/ui/accent-word";
import { PRICING } from "@/content/marketing";
import { SHARED } from "@/content/shared";
import { splitAccent } from "@/lib/splitAccent";

export const metadata: Metadata = pageMetadata({
  title: SHARED.metadata.titlePricing,
  description: SHARED.metadata.descriptionPricing,
  canonical: "/pricing",
});

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
  return (
    <MarketingShell bleed>
      <section className="stage dark text-foreground">
        <div className="mx-auto flex max-w-[56rem] flex-col items-center px-4 pb-40 pt-16 text-center sm:px-8 sm:pt-20">
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
          <p className="mt-3 text-sm text-muted-foreground">{PRICING.currencyNote}</p>
          <AudienceSwitch className="mt-8 justify-center" />
          <RoleNudge />
        </div>
      </section>

      <div className="mx-auto w-full max-w-marketing px-4 sm:px-8">
        <section className="relative -mt-28 pb-6">
          <PlanCards />
          {reviewListed() && <ReviewTeaser onSale={reviewEnabled()} />}
          <p className="mx-auto mt-6 max-w-prose text-center text-base font-medium text-foreground">
            {PRICING.freeVersusPass}
          </p>
          <p className="mt-3 text-center text-sm text-muted-foreground">{PRICING.checkoutNote}</p>
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

        <VersusSection />

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
          <PurchaseSection accountEnabled={accountPassEnabled()} reviewEnabled={reviewEnabled()} />
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
