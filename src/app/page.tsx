import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { HeroDecoderDemo } from "@/components/marketing/HeroDecoderDemo";
import { WorkspacePreview } from "@/components/marketing/WorkspacePreview";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/JsonLd";
import { VerifiedStamp } from "@/components/VerifiedStamp";
import { HOME, FOUNDER_NOTE, DECODE } from "@/content/marketing";
import { GUIDES } from "@/content/guides";
import { SHARED } from "@/content/shared";
import { SITE_URL } from "@/lib/urls";
import { AccentWord } from "@/components/ui/accent-word";
import { splitAccent } from "@/lib/splitAccent";
import { cn } from "@/lib/utils";

const HERO_ACCENT = splitAccent(HOME.hero.headline, HOME.hero.accent);
const TRUST_ACCENT = splitAccent(HOME.trust.title, HOME.trust.accent);

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

/**
 * 26 Sep 2026, the prototype pass: the decoder is the hero rather than a picture of it; numbers
 * come before adjectives; sections are separated by hairlines rather than boxed in cards; one
 * inverted band shows the workspace; the expectations read as a table. The story order from
 * 25 Sep is kept: problem → what the notice does not say → how the work goes → what happens to
 * the case → start.
 */
export default function HomePage() {
  return (
    <MarketingShell>
      <JsonLd data={STRUCTURED_DATA} />
      <HeroSection />
      <NumbersSection />
      <HowItWorksSection />
      <WorkspaceSection />
      <InsightsSection />
      <TrustSection />
      <PlansSection />
      <GuidesSection />
      <ClosingSection />
      {FOUNDER_NOTE && <FounderNoteSection note={FOUNDER_NOTE} />}
    </MarketingShell>
  );
}

function SectionTitle({
  title,
  desc,
  action,
  className,
}: {
  title: React.ReactNode;
  desc?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("flex flex-col gap-4 md:flex-row md:items-end md:justify-between", className)}
    >
      <h2 className="max-w-[22ch] text-balance text-h2 text-foreground">{title}</h2>
      {desc && !action && (
        <p className="max-w-[44ch] text-base leading-relaxed text-muted-foreground md:text-right">
          {desc}
        </p>
      )}
      {action}
    </div>
  );
}

function HeroSection() {
  return (
    <section className="marketing-surface-aurora pb-10 pt-16 sm:pt-20 lg:pt-24">
      <div className="mx-auto flex max-w-[60rem] flex-col items-center text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
          <span aria-hidden className="size-1.5 rounded-full bg-success" />
          {HOME.hero.eyebrow}
        </p>
        <h1 className="mt-6 text-balance text-display text-foreground">
          {HERO_ACCENT ? (
            <>
              {HERO_ACCENT.pre}
              <AccentWord>{HERO_ACCENT.accent}</AccentWord>
              {HERO_ACCENT.post}
            </>
          ) : (
            HOME.hero.headline
          )}
        </h1>
        <p className="mt-6 max-w-[54ch] text-lg leading-relaxed text-muted-foreground sm:text-xl">
          {HOME.hero.subline}
        </p>
      </div>
      <div className="mt-12">
        <HeroDecoderDemo />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          {DECODE.privacyNote} {HOME.hero.reassuranceLine}
        </p>
      </div>
    </section>
  );
}

function NumbersSection() {
  return (
    <section className="py-16 sm:py-20">
      <dl className="grid grid-cols-2 border-y border-border lg:grid-cols-4">
        {HOME.numbers.items.map((n, i) => (
          <div
            key={n.value + n.label}
            className={cn(
              "flex flex-col gap-3 py-8 pr-6",
              i > 0 && "pl-6 lg:border-l lg:border-border",
              i % 2 === 1 && "border-l border-border lg:border-l",
              i >= 2 && "border-t border-border lg:border-t-0",
            )}
          >
            <dd
              className="order-1 text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl"
              data-tn
            >
              {n.value}
              {"unit" in n && n.unit && (
                <span className="ml-1 text-xl font-medium text-muted-foreground">{n.unit}</span>
              )}
            </dd>
            <dt className="order-2 text-sm leading-relaxed text-muted-foreground">{n.label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-20">
      <SectionTitle title={HOME.howItWorks.title} desc={HOME.hero.reassuranceLine} />
      <ol className="mt-12 grid gap-10 md:grid-cols-3">
        {HOME.howItWorks.steps.map((step, i) => {
          const link = "link" in step ? step.link : undefined;
          return (
            <li
              key={step.title}
              className={cn(
                "flex flex-col gap-3 border-t-2 pt-6",
                i === 0 ? "border-foreground" : "border-border",
              )}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
                <span className="text-xs font-medium text-muted-foreground">{step.tag}</span>
              </div>
              <h3 className="text-h3 text-foreground">{step.title}</h3>
              <p className="text-base leading-relaxed text-muted-foreground">{step.desc}</p>
              {link && (
                <Link
                  href={link.href}
                  className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-link underline-offset-4 hover:underline"
                >
                  {link.label}
                  <ArrowRight aria-hidden className="size-3.5" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * The inverted band. `dark` on the section swaps every token for the dark set inside it, so the
 * workspace still is drawn with the same components as everywhere else, on the dark ground.
 */
function WorkspaceSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="dark rounded-xl border border-border bg-background px-6 py-12 text-foreground sm:px-10 sm:py-16 lg:px-14">
        <SectionTitle title={HOME.workspace.title} desc={HOME.workspace.desc} />
        <div className="mt-10">
          <WorkspacePreview />
        </div>
      </div>
    </section>
  );
}

function InsightsSection() {
  return (
    <section className="py-16 sm:py-20">
      <SectionTitle title={HOME.insights.title} desc={HOME.insights.eyebrow} />
      <ol className="mt-10 grid gap-x-12 gap-y-8 border-t border-border pt-8 sm:grid-cols-2">
        {HOME.insights.items.map((item, i) => (
          <li key={item.title} className="flex gap-5">
            <span className="mt-1 font-mono text-sm text-muted-foreground">0{i + 1}</span>
            <div>
              <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 text-base leading-relaxed text-muted-foreground">{item.body}</p>
              <Link
                href={item.link.href}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-link underline-offset-4 hover:underline"
              >
                {item.link.label}
                <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="grid gap-10 py-16 sm:py-20 lg:grid-cols-[1fr_1.4fr] lg:gap-20">
      <div>
        <p className="text-eyebrow uppercase text-muted-foreground">{HOME.trust.eyebrow}</p>
        <h2 className="mt-3 max-w-[16ch] text-balance text-h2 text-foreground">
          {TRUST_ACCENT ? (
            <>
              {TRUST_ACCENT.pre}
              <AccentWord>{TRUST_ACCENT.accent}</AccentWord>
              {TRUST_ACCENT.post}
            </>
          ) : (
            HOME.trust.title
          )}
        </h2>
        <div className="mt-6">
          <VerifiedStamp />
        </div>
      </div>
      <dl className="hairline-rows">
        {HOME.trust.items.map((item) => (
          <div key={item.label} className="grid gap-2 py-5 sm:grid-cols-[13rem_1fr] sm:gap-8">
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
    <section className="py-16 sm:py-20">
      <SectionTitle
        title={HOME.plans.title}
        action={
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1 text-base font-medium text-link underline-offset-4 hover:underline"
          >
            {HOME.plans.link}
            <ArrowRight aria-hidden className="size-4" />
          </Link>
        }
      />
      <ul className="mt-10 grid gap-5 md:grid-cols-3">
        {HOME.plans.items.map((plan, i) => {
          const last = i === HOME.plans.items.length - 1;
          return (
            <li
              key={plan.name}
              className={cn(
                "flex flex-col gap-5 rounded-xl border bg-card p-7",
                last ? "border-foreground" : "border-border",
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <span
                  className={cn(
                    "text-sm font-semibold",
                    last ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  {plan.name}
                </span>
                <span className="text-xs text-muted-foreground">{plan.note}</span>
              </div>
              <span className="text-4xl font-semibold tracking-tight text-foreground" data-tn>
                {plan.price}
              </span>
              <ul className="hairline-rows text-sm text-foreground/90">
                {plan.features.map((f) => (
                  <li key={f} className="py-2.5">
                    {f}
                  </li>
                ))}
              </ul>
              {"cta" in plan && plan.cta && (
                <Button asChild size="lg" className="mt-auto">
                  <Link href="/pricing">{plan.cta}</Link>
                </Button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function GuidesSection() {
  return (
    <section className="py-16 sm:py-20">
      <SectionTitle title={HOME.guides.title} desc={HOME.guides.eyebrow} />
      <ul className="hairline-rows mt-8">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guides/${g.slug}`}
              className="flex min-h-14 items-center justify-between gap-4 py-4 text-base font-medium text-foreground transition-colors hover:text-link"
            >
              {g.title}
              <ArrowRight aria-hidden className="size-4 shrink-0 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto flex max-w-[44rem] flex-col items-center text-center">
        <h2 className="text-balance text-h2 text-foreground">{HOME.closing.title}</h2>
        <p className="mt-4 text-lg text-muted-foreground">{HOME.closing.desc}</p>
        <Button asChild size="lg" className="mt-8">
          <Link href="/decode">
            {HOME.hero.primaryCta}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}

function FounderNoteSection({ note }: { note: NonNullable<typeof FOUNDER_NOTE> }) {
  return (
    <section className="py-16 sm:py-20">
      <blockquote className="border-l-2 border-border pl-6">
        <p className="text-lg italic text-foreground">{note.text}</p>
        <footer className="mt-3 text-sm text-muted-foreground">
          — {note.name}, {note.location}
        </footer>
      </blockquote>
    </section>
  );
}
