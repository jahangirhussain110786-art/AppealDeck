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
      <InsightsSection />
      <TrustSection />
      <PlansSection />
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
        <dl className="mt-14 grid border-t border-white/[0.08] sm:grid-cols-2 lg:grid-cols-4">
          {HOME.numbers.items.map((n, i) => (
            <div
              key={n.value + n.label}
              className={cn(
                "flex flex-col gap-3 border-b border-white/[0.08] py-8 sm:pr-8 lg:border-b-0",
                i > 0 && "lg:border-l lg:pl-8",
                i % 2 === 1 && "sm:border-l sm:pl-8",
              )}
            >
              <dd
                className="order-1 text-5xl font-semibold tracking-[-0.04em] tabular-nums"
                data-tn
              >
                {n.value}
                {"unit" in n && n.unit && (
                  <span className="ml-1.5 text-xl font-medium text-muted-foreground">{n.unit}</span>
                )}
              </dd>
              <dt className="order-2 text-base leading-relaxed text-muted-foreground">{n.label}</dt>
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

function InsightsSection() {
  return (
    <section className={cn(WRAP, "pt-28 sm:pt-32")}>
      <SectionTitle eyebrow={HOME.insights.eyebrow} title={HOME.insights.title} />
      <ol className="mt-12 grid gap-4 sm:grid-cols-2">
        {HOME.insights.items.map((item, i) => (
          <li
            key={item.title}
            className="flex flex-col gap-3 rounded-2xl border border-border/80 bg-card p-7 shadow-card"
          >
            <span className="font-mono text-sm text-primary">0{i + 1}</span>
            <h3 className="text-xl font-semibold tracking-tight text-foreground">{item.title}</h3>
            <p className="text-base leading-relaxed text-muted-foreground">{item.body}</p>
            <Link
              href={item.link.href}
              className="mt-auto inline-flex items-center gap-1 pt-2 text-sm font-medium text-link underline-offset-4 hover:underline"
            >
              {item.link.label}
              <ArrowRight aria-hidden className="size-3.5" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TrustSection() {
  return (
    <section className={cn(WRAP, "grid gap-10 pt-28 sm:pt-32 lg:grid-cols-[1fr_1.4fr] lg:gap-20")}>
      <div>
        <p className="text-sm font-semibold text-primary">{HOME.trust.eyebrow}</p>
        <h2 className="mt-3 max-w-[16ch] text-balance text-[clamp(1.9rem,1.3rem+2vw,2.9rem)] font-semibold leading-[1.05] tracking-[-0.035em] text-foreground">
          <Accented text={HOME.trust.title} accent={HOME.trust.accent} className="text-primary" />
        </h2>
      </div>
      <dl className="overflow-hidden rounded-2xl border border-border/80 bg-card shadow-card">
        {HOME.trust.items.map((item) => (
          <div
            key={item.label}
            className="grid gap-2 border-b border-border/70 px-6 py-5 last:border-b-0 sm:grid-cols-[13rem_1fr] sm:gap-8"
          >
            <dt className="text-base font-semibold text-foreground">{item.label}</dt>
            <dd className="text-base leading-relaxed text-muted-foreground">{item.desc}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function PlansSection() {
  return (
    <section className={cn(WRAP, "pb-28 pt-28 sm:pb-32 sm:pt-32")}>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <SectionTitle title={HOME.plans.title} />
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
