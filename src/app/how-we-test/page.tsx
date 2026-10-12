import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pageMetadata } from "@/content/pageMetadata";
import { HOW_WE_TEST as C } from "@/content/howWeTest";

export const metadata: Metadata = pageMetadata({
  title: C.metadata.title,
  description: C.metadata.description,
  canonical: "/how-we-test",
});

function Points({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * G-45 and G-80 (12 Oct 2026): the written answer to "how do you know it reads a notice right?".
 * Static, dated, and led by the misses. See `src/content/howWeTest.ts` for the rules it follows.
 */
export default function HowWeTestPage() {
  return (
    <MarketingShell
      className="max-w-app"
      hero={<PageHero eyebrow={C.hero.eyebrow} title={C.hero.title} intro={C.hero.lede} />}
    >
      <div className="space-y-12 py-12 sm:py-16">
        <Points title={C.scope.title} items={C.scope.items} />

        <section className="space-y-5">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
            {C.misses.title}
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            {C.misses.intro}
          </p>
          <div className="space-y-4">
            {C.misses.rows.map((row) => (
              <Card key={row.when} className="space-y-2 p-5 sm:p-6">
                <p className="text-xs font-semibold text-muted-foreground">{row.when}</p>
                <p className="text-sm text-foreground">{row.what}</p>
                <p className="text-base font-semibold text-foreground">{row.result}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{row.detail}</p>
                <p className="text-sm leading-relaxed text-foreground/85">{row.fixed}</p>
              </Card>
            ))}
          </div>
          <p className="max-w-prose text-sm leading-relaxed text-foreground/85">
            {C.misses.closing}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">{C.ai.title}</h2>
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">{C.ai.body}</p>
          <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
            {C.ai.rows.map((row) => (
              <li key={row} className="flex gap-2.5">
                <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                <span>{row}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
            {C.corpus.title}
          </h2>
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            {C.corpus.body}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button asChild variant="outline">
              <a href={C.corpus.file} download>
                <Download aria-hidden className="size-4" />
                {C.corpus.fileLabel}
              </a>
            </Button>
            <span className="text-xs text-muted-foreground">{C.corpus.fileNote}</span>
          </div>
        </section>

        <section className="space-y-3">
          <Points title={C.routine.title} items={C.routine.items} />
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
            {C.routine.cadence}
          </p>
        </section>

        <Card className="workspace-hero p-5 sm:p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {C.next.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{C.next.body}</p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/decode">
                {C.next.cta} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </MarketingShell>
  );
}
