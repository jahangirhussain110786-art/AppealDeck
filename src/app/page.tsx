import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, FileText, FileSearch, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/SeverityBadge";
import { DeadlineChip } from "@/components/DeadlineChip";
import { LocalFirstBadge } from "@/components/LocalFirstBadge";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { HOME, FOUNDER_NOTE } from "@/content/marketing";
import { SHARED } from "@/content/shared";
import { GLOBAL_EXPECTATIONS } from "@/core/guidance";
import type { Deadline } from "@/core";

export const metadata: Metadata = {
  title: SHARED.metadata.titleDefault,
  description: SHARED.metadata.description,
  openGraph: {
    title: SHARED.metadata.titleDefault,
    description: SHARED.metadata.description,
  },
};

const ARTIFACT_TODAY = new Date("2026-09-05T00:00:00Z");

const HERO_DEADLINES: Deadline[] = [
  {
    kind: "appeal_window",
    dueAt: new Date("2026-09-22T23:59:59Z"),
    label: "Appeal window",
  },
  {
    kind: "funds_appeal_eligible",
    dueAt: new Date("2026-11-04T23:59:59Z"),
    label: "Funds appeal becomes available",
  },
];

const HOW_IT_WORKS = [
  { icon: FileSearch, title: HOME.howItWorks.step1.title, desc: HOME.howItWorks.step1.desc },
  { icon: FileText, title: HOME.howItWorks.step2.title, desc: HOME.howItWorks.step2.desc },
  { icon: ShieldCheck, title: HOME.howItWorks.step3.title, desc: HOME.howItWorks.step3.desc },
];

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader mode="marketing" />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
        <HeroSection />
        <HowItWorksSection />
        <ExpectationsSection />
        {FOUNDER_NOTE && <FounderNoteSection note={FOUNDER_NOTE} />}
      </main>
      <SiteFooter />
    </div>
  );
}

function HeroSection() {
  return (
    <section>
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="pt-4">
          <h1
            className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl"
            style={{ textWrap: "balance" }}
          >
            {HOME.hero.headline}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{HOME.hero.subline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/decode">
                {HOME.hero.primaryCta} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/pricing">{HOME.hero.secondaryCta}</Link>
            </Button>
          </div>
        </div>

        <div aria-hidden="true" role="presentation">
          <Card className="border-border">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <SeverityBadge severity="low" />
                <span className="text-sm font-medium text-foreground">Policy violation</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <DeadlineChip deadline={HERO_DEADLINES[0]!} now={ARTIFACT_TODAY} />
                <DeadlineChip deadline={HERO_DEADLINES[1]!} now={ARTIFACT_TODAY} />
              </div>
              <LocalFirstBadge />
              <p className="sr-only">{HOME.hero.artwork.srOnly}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold text-foreground">{HOME.howItWorksTitle}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{HOME.howItWorksSub}</p>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {HOW_IT_WORKS.map((step) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} className="border-border">
              <CardContent className="pt-5">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 font-medium text-foreground">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.desc}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}

function ExpectationsSection() {
  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold text-foreground">{HOME.expectationsTitle}</h2>
      <div className="mt-4">
        <HonestExpectationsCard
          summary={GLOBAL_EXPECTATIONS.typicalNote}
          whatToDo={[...GLOBAL_EXPECTATIONS.whatWeDo, ...GLOBAL_EXPECTATIONS.whatWeDoNot]}
        />
      </div>
    </section>
  );
}

function FounderNoteSection({ note }: { note: NonNullable<typeof FOUNDER_NOTE> }) {
  return (
    <section className="mt-16">
      <blockquote className="border-l-2 border-border pl-6">
        <p className="text-lg italic text-foreground">{note.text}</p>
        <footer className="mt-3 text-sm text-muted-foreground">
          — {note.name}, {note.location}
        </footer>
      </blockquote>
    </section>
  );
}
