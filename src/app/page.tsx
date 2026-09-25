import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  FileSearch,
  FolderOpen,
  ClipboardCheck,
  Send,
  LockKeyhole,
  Scale,
} from "lucide-react";
import { IconTile } from "@/components/workspace/WorkspaceVisuals";
import { MarketingShell } from "@/components/MarketingShell";
import { SectionHeading } from "@/components/SectionHeading";
import { HeroArtifact } from "@/components/marketing/HeroArtifact";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { JsonLd } from "@/components/JsonLd";
import { VerifiedStamp } from "@/components/VerifiedStamp";
import { HOME, FOUNDER_NOTE } from "@/content/marketing";
import { GUIDES } from "@/content/guides";
import { SHARED } from "@/content/shared";
import { SITE_URL } from "@/lib/urls";
import { AccentWord } from "@/components/ui/accent-word";
import { splitAccent } from "@/lib/splitAccent";

const HERO_ACCENT = splitAccent(HOME.hero.headline, HOME.hero.accent);

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

const STEP_ICONS = [FileSearch, FolderOpen, ClipboardCheck];
const TRUST_ICONS = [Send, LockKeyhole, Scale];

export default function HomePage() {
  return (
    <MarketingShell>
      <JsonLd data={STRUCTURED_DATA} />
      <HeroSection />
      <InsightsSection />
      <HowItWorksSection />
      <TrustSection />
      <GuidesSection />
      <ClosingSection />
      {FOUNDER_NOTE && <FounderNoteSection note={FOUNDER_NOTE} />}
    </MarketingShell>
  );
}

function HeroSection() {
  return (
    <section className="marketing-surface-aurora grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28">
      <div>
        <p className="text-eyebrow uppercase text-primary">{HOME.hero.eyebrow}</p>
        <h1 className="mt-4 max-w-[18ch] text-balance text-display text-foreground">
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
        <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
          {HOME.hero.subline}
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link href="/decode">
              {HOME.hero.primaryCta}
              <ArrowRight />
            </Link>
          </Button>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">{HOME.hero.reassuranceLine}</p>
      </div>
      <HeroArtifact />
    </section>
  );
}

function InsightsSection() {
  return (
    <section className="py-16 sm:py-20">
      <SectionHeading eyebrow={HOME.insights.eyebrow} title={HOME.insights.title} />
      <ol className="mt-10 grid gap-4 sm:grid-cols-2">
        {HOME.insights.items.map((item, i) => (
          <li key={item.title}>
            <Card className="flex h-full flex-col p-6">
              <span className="font-mono text-sm text-muted-foreground">0{i + 1}</span>
              <h3 className="mt-3 text-base font-semibold text-foreground">{item.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {item.body}
              </p>
              <Link
                href={item.link.href}
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                {item.link.label}
                <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            </Card>
          </li>
        ))}
      </ol>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-20">
      <SectionHeading eyebrow={HOME.howItWorks.eyebrow} title={HOME.howItWorks.title} />
      <ol className="mt-10 grid gap-6 md:grid-cols-3">
        {HOME.howItWorks.steps.map((step, i) => {
          const Icon = STEP_ICONS[i] ?? FileSearch;
          const link = "link" in step ? step.link : undefined;
          return (
            <li key={step.title}>
              <Card className="flex h-full flex-col p-6">
                <div className="flex items-center gap-3">
                  <IconTile icon={Icon} tone={i === 0 ? "info" : i === 1 ? "warning" : "primary"} />
                  <Badge variant={step.tag === "Free" ? "success" : "default"} className="ml-auto">
                    {step.tag}
                  </Badge>
                </div>
                <h3 className="mt-5 text-base font-semibold text-foreground">{step.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {step.desc}
                </p>
                {link && (
                  <Link
                    href={link.href}
                    className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {link.label}
                    <ArrowRight aria-hidden className="size-3.5" />
                  </Link>
                )}
              </Card>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function TrustSection() {
  return (
    <section className="py-16 sm:py-20">
      <SectionHeading eyebrow={HOME.trust.eyebrow} title={HOME.trust.title} />
      <ul className="mt-10 grid gap-4 md:grid-cols-3">
        {HOME.trust.items.map((item, i) => (
          <li key={item.label}>
            <Card className="flex h-full items-start gap-4 p-5">
              <IconTile icon={TRUST_ICONS[i] ?? Send} />
              <div>
                <h3 className="text-sm font-medium text-foreground">{item.label}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <div className="mt-6">
        <VerifiedStamp />
      </div>
    </section>
  );
}

function GuidesSection() {
  return (
    <section className="py-16 sm:py-20">
      <SectionHeading eyebrow={HOME.guides.eyebrow} title={HOME.guides.title} />
      <ul className="mt-8 grid gap-3 sm:grid-cols-2">
        {GUIDES.map((g) => (
          <li key={g.slug}>
            <Link
              href={`/guides/${g.slug}`}
              className="flex h-full items-center justify-between gap-4 rounded-xl border border-border/70 bg-surface-2/60 p-5 text-sm font-medium text-foreground transition-colors hover:border-primary/40"
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
    <section className="py-16 sm:py-20">
      <div className="rounded-xl border border-border/80 bg-surface-2 px-6 py-10 text-center sm:px-10">
        <h2 className="text-h2 text-foreground">{HOME.closing.title}</h2>
        <p className="mt-3 text-muted-foreground">{HOME.closing.desc}</p>
        <Button asChild size="lg" className="mt-6">
          <Link href="/decode">{HOME.hero.primaryCta}</Link>
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
