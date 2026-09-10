import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileSearch, FileText, ShieldCheck } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { SectionHeading } from "@/components/SectionHeading";
import { HeroArtifact } from "@/components/marketing/HeroArtifact";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { VerifiedStamp } from "@/components/VerifiedStamp";
import { HOME, PRICING, FOUNDER_NOTE } from "@/content/marketing";
import { SHARED } from "@/content/shared";

export const metadata: Metadata = {
  title: SHARED.metadata.titleDefault,
  description: SHARED.metadata.description,
  openGraph: {
    title: SHARED.metadata.titleDefault,
    description: SHARED.metadata.description,
  },
};

const HOW_IT_WORKS = [
  { icon: FileSearch, title: HOME.howItWorks.step1.title, desc: HOME.howItWorks.step1.desc },
  { icon: FileText, title: HOME.howItWorks.step2.title, desc: HOME.howItWorks.step2.desc },
  { icon: ShieldCheck, title: HOME.howItWorks.step3.title, desc: HOME.howItWorks.step3.desc },
];

export default function HomePage() {
  return (
    <MarketingShell>
      <HeroSection />
      <HowItWorksSection />
      <IncludedSection />
      <ProofSection />
      <ClosingSection />
      {FOUNDER_NOTE && <FounderNoteSection note={FOUNDER_NOTE} />}
    </MarketingShell>
  );
}

function HeroSection() {
  return (
    <section className="grid items-center gap-12 py-16 sm:py-20 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:py-28">
      <div>
        <p className="text-eyebrow uppercase text-primary">{HOME.hero.eyebrow}</p>
        <h1 className="mt-4 max-w-[16ch] text-balance text-display text-foreground">
          {HOME.hero.headline}
        </h1>
        <p className="mt-6 max-w-[46ch] text-lg leading-relaxed text-muted-foreground">
          {HOME.hero.subline}
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/decode">
              {HOME.hero.primaryCta}
              <ArrowRight />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/pricing">{HOME.hero.secondaryCta}</Link>
          </Button>
        </div>
        <p className="mt-5 text-sm text-muted-foreground">{HOME.hero.reassuranceLine}</p>
      </div>
      <HeroArtifact />
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="py-16 sm:py-20">
      <SectionHeading
        eyebrow={HOME.howItWorks.eyebrow}
        title={HOME.howItWorksTitle}
        description={HOME.howItWorksSub}
      />
      <ol className="mt-12 grid gap-6 md:grid-cols-3">
        {HOW_IT_WORKS.map((step, i) => {
          const Icon = step.icon;
          return (
            <li key={step.title}>
              <Card className="p-6">
                <div className="flex items-center gap-3">
                  <span className="grid size-8 place-items-center rounded-md bg-primary/10 text-sm font-semibold tabular-nums text-primary">
                    {i + 1}
                  </span>
                  <Icon className="size-5 text-muted-foreground" />
                </div>
                <p className="mt-5 text-base font-semibold text-foreground">{step.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{step.desc}</p>
              </Card>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function IncludedSection() {
  return (
    <section className="py-16 sm:py-20">
      <SectionHeading
        eyebrow={HOME.included.eyebrow}
        title={HOME.included.title}
        description={HOME.included.sub}
      />
      <ul className="mt-10 grid gap-3 sm:grid-cols-2">
        {Object.values(PRICING.rows).map((row) => (
          <li
            key={row.feature}
            className="rounded-md border border-border/70 bg-surface-2 p-4 text-sm text-foreground"
          >
            {row.feature}
          </li>
        ))}
      </ul>
    </section>
  );
}

function ProofSection() {
  const items = [
    PRICING.trust.submit,
    PRICING.trust.localFirst,
    PRICING.trust.vault,
    PRICING.trust.refund,
  ];
  return (
    <section className="py-16 sm:py-20">
      <SectionHeading eyebrow={HOME.proof.eyebrow} title={HOME.proof.title} />
      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-sm font-medium text-foreground">{item.label}</p>
            <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
          </Card>
        ))}
      </div>
      <div className="mt-6">
        <VerifiedStamp />
      </div>
    </section>
  );
}

function ClosingSection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="rounded-xl border border-border/80 bg-surface-2 px-6 py-10 text-center sm:px-10">
        <h2 className="text-h2 text-foreground">{HOME.closing.title}</h2>
        <p className="mt-3 text-muted-foreground">{HOME.closing.desc}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Button asChild size="lg">
            <Link href="/decode">{HOME.hero.primaryCta}</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/pricing">{HOME.hero.secondaryCta}</Link>
          </Button>
        </div>
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
