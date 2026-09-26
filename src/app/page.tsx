import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { HeroTool } from "@/components/marketing/HeroTool";
import { FeatureSwitcher } from "@/components/marketing/FeatureSwitcher";
import { DecodePanel } from "@/components/marketing/DecodePanel";
import {
  ChecklistPanel,
  DocumentPanel,
  HeroComposition,
  RepliesPanel,
} from "@/components/marketing/ProductPanels";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/JsonLd";
import { FaqAccordion } from "@/components/pricing/FaqAccordion";
import { HOME, FOUNDER_NOTE } from "@/content/marketing";
import { SHARED } from "@/content/shared";
import { SITE_URL } from "@/lib/urls";
import { AccentWord } from "@/components/ui/accent-word";
import { splitAccent } from "@/lib/splitAccent";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
  title: SHARED.metadata.titleDefault,
  description: SHARED.metadata.description,
  openGraph: {
    title: SHARED.metadata.titleDefault,
    description: SHARED.metadata.description,
  },
};

const STRUCTURED_DATA = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "AppealDeck",
    url: SITE_URL,
    logo: `${SITE_URL}/icon.svg`,
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "AppealDeck",
    url: SITE_URL,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    description: SHARED.metadata.description,
    offers: [
      { "@type": "Offer", name: "Notice decoder", price: "0", priceCurrency: "USD" },
      { "@type": "Offer", name: "Appeal Pass", price: "249", priceCurrency: "USD" },
    ],
  },
];

/** A headline with its one accent phrase set in the serif. */
function Accented({
  text,
  accent,
  className,
}: {
  text: string;
  accent: string;
  className?: string;
}) {
  const parts = splitAccent(text, accent);
  if (!parts) return <>{text}</>;
  return (
    <>
      {parts.pre}
      <AccentWord className={className}>{parts.accent}</AccentWord>
      {parts.post}
    </>
  );
}

/**
 * v5 (26 Sep 2026, the founder-approved prototype): the tool is the hero, beside a real-looking
 * view of the product; one switched visual carries the features; a navy band carries the facts;
 * each claim is made once. The copy is the SEO-tuned wording from 25 Sep, unchanged.
 */
export default function HomePage() {
  return (
    <MarketingShell bleed>
      <JsonLd data={STRUCTURED_DATA} />
      <HeroSection />
      <FeaturesSection />
      <BandSection />
      <PlansSection />
      <QuestionsSection />
      {FOUNDER_NOTE && <FounderNoteSection note={FOUNDER_NOTE} />}
    </MarketingShell>
  );
}

const WRAP = "mx-auto w-full max-w-marketing px-4 sm:px-8";

function HeroSection() {
  return (
    <section className="stage dark text-foreground">
      <div
        className={cn(
          WRAP,
          "grid items-start gap-12 pb-24 pt-14 sm:pt-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-14",
        )}
      >
        <div className="flex flex-col gap-7">
          <p className="inline-flex items-center gap-2.5 self-start rounded-full bg-white/[0.06] py-1.5 pl-1.5 pr-3.5 text-sm text-muted-foreground ring-1 ring-inset ring-white/[0.08]">
            <span className="rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {HOME.hero.badge}
            </span>
            {HOME.hero.eyebrow}
          </p>
          <h1 className="text-balance text-[clamp(2.5rem,1.3rem+3.4vw,4.35rem)] font-semibold leading-[1.0] tracking-[-0.045em] text-foreground">
            <Accented
              text={HOME.hero.headline}
              accent={HOME.hero.accent}
              className="text-primary"
            />
          </h1>
          <p className="max-w-[34rem] text-lg leading-relaxed text-muted-foreground sm:text-xl">
            {HOME.hero.subline}
          </p>
          <HeroTool />
          <p className="text-sm text-muted-foreground">{HOME.hero.reassuranceLine}</p>
        </div>
        <HeroComposition />
      </div>
    </section>
  );
}

function FeaturesSection() {
  const f = HOME.features;
  return (
    <section className={cn(WRAP, "pt-28 sm:pt-32")}>
      <p className="text-sm font-semibold text-primary">{f.eyebrow}</p>
      <h2 className="mt-3 max-w-[16ch] text-balance text-[clamp(2.1rem,1.4rem+2.4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-foreground">
        <Accented text={f.title} accent={f.accent} className="text-primary" />
      </h2>
      <FeatureSwitcher
        label={f.eyebrow}
        items={f.items}
        panels={[
          <DecodePanel key="decode" />,
          <ChecklistPanel key="checklist" />,
          <DocumentPanel key="document" />,
          <RepliesPanel key="replies" />,
        ]}
      />
    </section>
  );
}

function BandSection() {
  return (
    <section className="stage dark mt-28 text-foreground sm:mt-32">
      <div className={cn(WRAP, "pb-20 pt-24")}>
        <h2 className="max-w-[16ch] text-balance text-[clamp(2.1rem,1.4rem+2.4vw,3.4rem)] font-semibold leading-[1.02] tracking-[-0.04em]">
          <Accented text={HOME.band.title} accent={HOME.band.accent} className="text-primary" />
        </h2>
        <dl className="mt-14 grid border-t border-white/[0.08] md:grid-cols-3">
          {HOME.bandFacts.map((n, i) => (
            <div
              key={n.title}
              className={cn(
                "flex flex-col gap-2 border-b border-white/[0.08] py-8 md:border-b-0 md:pr-8",
                i > 0 && "md:border-l md:pl-8",
              )}
            >
              <dt className="order-2 text-lg font-semibold text-foreground">{n.title}</dt>
              <dd
                className="order-1 text-6xl font-semibold tracking-[-0.045em] tabular-nums"
                data-tn
              >
                {n.value}
              </dd>
              <dd className="order-3 text-base leading-relaxed text-muted-foreground">
                {n.body}{" "}
                {"link" in n && n.link && (
                  <Link href={n.link.href} className="text-primary underline underline-offset-4">
                    {n.link.label}
                  </Link>
                )}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

function SectionTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div>
      {eyebrow && <p className="text-sm font-semibold text-primary">{eyebrow}</p>}
      <h2 className="mt-3 max-w-[22ch] text-balance text-[clamp(1.9rem,1.3rem+2vw,2.9rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
        {title}
      </h2>
    </div>
  );
}

/**
 * The prototype's closing questions. They are the /faq page's own answers, shown here without their
 * structured data: one page owns each question for search (see `faqJsonLd`).
 */
function QuestionsSection() {
  return (
    <section className={cn(WRAP, "grid gap-8 pb-28 sm:pb-32 lg:grid-cols-[0.7fr_1.3fr] lg:gap-16")}>
      <SectionTitle title={HOME.questions.title} />
      <div>
        <FaqAccordion ids={HOME.questions.ids} />
        <Link
          href="/faq"
          className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-link underline-offset-4 hover:underline"
        >
          {SHARED.nav.faq}
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      </div>
    </section>
  );
}

function PlansSection() {
  return (
    <section className={cn(WRAP, "pb-24 pt-28 sm:pb-28 sm:pt-32")}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">{HOME.plans.eyebrow}</p>
          <h2 className="mt-3 text-balance text-[clamp(1.9rem,1.3rem+2vw,2.9rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
            <Accented text={HOME.plans.title} accent={HOME.plans.accent} className="text-primary" />
          </h2>
        </div>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1 text-base font-medium text-link underline-offset-4 hover:underline"
        >
          {HOME.plans.link}
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
      <ul className="mt-12 grid gap-4 md:grid-cols-3">
        {HOME.plans.items.map((plan, i) => {
          const featured = i === HOME.plans.items.length - 1;
          return (
            <li
              key={plan.name}
              className={cn(
                "flex flex-col gap-5 rounded-[22px] p-7",
                featured
                  ? "stage stage-plain dark text-foreground shadow-stage"
                  : "border border-border/80 bg-card shadow-card",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={cn(
                    "font-semibold",
                    featured ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {plan.name}
                </span>
                <span className="text-xs text-muted-foreground">{plan.note}</span>
              </div>
              <span className="text-5xl font-semibold tracking-[-0.045em] text-foreground" data-tn>
                {plan.price}
              </span>
              <ul className="flex flex-col gap-2.5 text-[0.95rem] text-muted-foreground">
                {plan.features.map((feature) => (
                  <li key={feature} className="grid grid-cols-[1.25rem_1fr] gap-2.5">
                    <span className="mt-1 grid size-4 place-items-center rounded-full bg-success/15">
                      <Check aria-hidden className="size-2.5 text-success" strokeWidth={3.5} />
                    </span>
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                asChild
                size="lg"
                variant={featured ? "default" : "outline"}
                className="mt-auto"
              >
                <Link href={featured ? "/pricing" : i === 0 ? "/decode" : "/signup"}>
                  {"cta" in plan && plan.cta
                    ? plan.cta
                    : i === 0
                      ? HOME.demo.primaryCta
                      : HOME.plans.accountCta}
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function FounderNoteSection({ note }: { note: NonNullable<typeof FOUNDER_NOTE> }) {
  return (
    <section className={cn(WRAP, "pb-20")}>
      <blockquote className="border-l-2 border-border pl-6">
        <p className="text-lg italic text-foreground">{note.text}</p>
        <footer className="mt-3 text-sm text-muted-foreground">
          — {note.name}, {note.location}
        </footer>
      </blockquote>
    </section>
  );
}
