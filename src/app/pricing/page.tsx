import type { Metadata } from "next";
import { pageMetadata } from "@/content/pageMetadata";
import Link from "next/link";
import { ArrowRight, Info } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { SectionHeading } from "@/components/SectionHeading";
import { FaqAccordion } from "@/components/pricing/FaqAccordion";
import { PurchaseSection } from "@/components/pricing/PurchaseSection";
import { PlanCards } from "@/components/pricing/PlanCards";
import { PlanComparison } from "@/components/pricing/PlanComparison";
import {
  accountPassEnabled,
  reviewEnabled,
  reviewListed,
  singleEnabled,
  upgradeEnabled,
} from "@/lib/plans";
import { ReviewTeaser } from "@/components/pricing/ReviewTeaser";
import { VersusSection } from "@/components/pricing/VersusSection";
import { PricingStage } from "@/components/pricing/PricingStage";
import { RoleNudge } from "@/components/RoleNudge";
import { PromiseBand } from "@/components/marketing/PromiseBand";
import { AccentWord } from "@/components/ui/accent-word";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { GLOBAL_EXPECTATIONS } from "@/core/guidance";
import { PRICING } from "@/content/marketing";
import { SHARED } from "@/content/shared";
import { splitAccent } from "@/lib/splitAccent";

export const metadata: Metadata = pageMetadata({
  title: SHARED.metadata.titlePricing,
  description: SHARED.metadata.descriptionPricing,
  canonical: "/pricing",
});

const READ_FIRST = splitAccent(PRICING.readFirstTitle, PRICING.readFirstAccent);

/**
 * 26 Sep 2026 (the prototype pass): the three plans lead, side by side, with the Pass on the
 * inverted panel; the grouped comparison follows for the detail (24 Oct 2026); the expectations
 * card and the checkout keep their order, because the consent spec
 * (legal/withdrawal-consent.md item 1) requires the expectations to be read before the pay button
 * is reached.
 */
export default function PricingPage() {
  return (
    <MarketingShell bleed>
      <PricingStage
        title={PRICING.headline}
        accent={PRICING.accent}
        subline={PRICING.subline}
        note={PRICING.currencyNote}
      >
        <RoleNudge />
      </PricingStage>

      <div className="mx-auto w-full max-w-marketing px-4 sm:px-8">
        <section className="relative -mt-28 pb-6">
          <PlanCards />
          {reviewListed() && <ReviewTeaser onSale={reviewEnabled()} />}
          <p className="mt-3 text-center text-sm text-muted-foreground">{PRICING.checkoutNote}</p>
        </section>

        {/* The promises are read before the pay button: each is a mechanism the buyer can check. */}
        <PromiseBand variant="inline" />

        <section
          id="purchase"
          aria-labelledby="pricing-read-first"
          className="grid gap-10 py-16 lg:grid-cols-2 lg:items-start lg:gap-12"
        >
          {/* The honest-expectations disclosure comes before the pay button, per the checkout-
            consent spec (legal/withdrawal-consent.md item 1) and D8: software and legal scope,
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
          <PurchaseSection
            accountEnabled={accountPassEnabled()}
            reviewEnabled={reviewEnabled()}
            singleEnabled={singleEnabled()}
            upgradeOn={upgradeEnabled()}
          />
        </section>

        <PlanComparison />

        <VersusSection />

        <section className="grid gap-8 pb-16 sm:pb-20 lg:grid-cols-[18rem_1fr] lg:gap-16">
          <SectionHeading title={PRICING.faqTitle} />
          <div>
            <FaqAccordion ids={PRICING.faqIds} />
            <Link
              href="/faq"
              className="mt-4 inline-flex min-h-8 items-center gap-1 max-sm:min-h-11 [@media(pointer:coarse)]:min-h-11 text-sm font-medium text-link underline-offset-4 hover:underline"
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
