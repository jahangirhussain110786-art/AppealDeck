import type { Metadata } from "next";
import Link from "next/link";
import { FileText, RotateCcw, ShieldCheck, CalendarDays, ArrowUpRight } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { LegalToc } from "@/components/LegalToc";
import { PageIntro } from "@/components/PageIntro";
import { DataFlow } from "@/components/DataFlow";
import { SURFACES } from "@/content/surfaces";
import { LEGAL, type LegalDoc } from "@/content/legal";
import { SHARED } from "@/content/shared";

export const legalPageMetadata = {
  privacy: { title: LEGAL.meta.titlePrivacy, description: LEGAL.meta.descriptionPrivacy },
  terms: { title: LEGAL.meta.titleTerms, description: LEGAL.meta.descriptionTerms },
  refund: { title: LEGAL.meta.titleRefund, description: LEGAL.meta.descriptionRefund },
} as const;

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const sections = LEGAL[doc].sections;
  const lastUpdated = LEGAL.lastUpdated[doc as keyof typeof LEGAL.lastUpdated];
  const icons = { privacy: ShieldCheck, terms: FileText, refund: RotateCcw };

  return (
    <MarketingShell>
      <div className="space-y-6 py-10 sm:py-14">
        <PageIntro
          icon={icons[doc]}
          eyebrow={SURFACES.legal.eyebrow}
          title={LEGAL[doc].title}
          description={SURFACES.legal[doc]}
          actions={
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden />
              {SHARED.lastUpdated} <time dateTime={lastUpdated}>{lastUpdated}</time>
            </p>
          }
        />
        <nav aria-label={SURFACES.legal.navigation} className="flex flex-wrap gap-2">
          {(["privacy", "terms", "refund"] as const).map((key) => (
            <Link
              key={key}
              href={`/${key}`}
              aria-current={doc === key ? "page" : undefined}
              className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm text-muted-foreground hover:bg-surface-2 aria-[current=page]:border-primary/30 aria-[current=page]:bg-primary/10 aria-[current=page]:text-foreground"
            >
              {LEGAL[key].title}
            </Link>
          ))}
        </nav>
        {doc === "privacy" && <DataFlow />}
        <div className="grid items-start gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <LegalToc sections={sections.map((s) => ({ id: s.id, title: s.title }))} />
          <div className="min-w-0 space-y-4">
            {sections.map((s, index) => (
              <section key={s.id} className="rounded-xl border border-border/80 bg-card p-5 sm:p-7">
                <div className="mb-4 flex items-start gap-3">
                  <span
                    className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 font-mono text-xs text-foreground"
                    aria-hidden
                  >
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <h2
                    id={s.id}
                    className="scroll-mt-24 pt-1 text-base font-semibold text-foreground"
                  >
                    {s.title}
                  </h2>
                </div>
                <div className="max-w-reading space-y-3 text-sm leading-7 text-muted-foreground">
                  {s.body.map((p, i) => (
                    <p key={`${s.id}-${i}`}>{p}</p>
                  ))}
                </div>
              </section>
            ))}
            <Link
              href="/faq"
              className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-foreground underline"
            >
              {SHARED.nav.faq} <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}

export function legalMetadata(doc: LegalDoc): Metadata {
  const m = legalPageMetadata[doc];
  return {
    title: m.title,
    description: m.description,
    // The page's own address, not the home page's (the root layout used to set "/" for all).
    alternates: { canonical: `/${doc}` },
    openGraph: {
      title: m.title,
      description: m.description,
    },
  };
}
