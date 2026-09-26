import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { FileText, RotateCcw, ShieldCheck, CalendarDays, ArrowUpRight, Plus } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { LegalToc } from "@/components/LegalToc";
import { PageIntro } from "@/components/PageIntro";
import { DataFlow } from "@/components/DataFlow";
import { AccentWord } from "@/components/ui/accent-word";
import { splitAccent } from "@/lib/splitAccent";
import { SURFACES } from "@/content/surfaces";
import { LEGAL, type LegalDoc } from "@/content/legal";
import { SHARED } from "@/content/shared";

export const legalPageMetadata = {
  privacy: { title: LEGAL.meta.titlePrivacy, description: LEGAL.meta.descriptionPrivacy },
  terms: { title: LEGAL.meta.titleTerms, description: LEGAL.meta.descriptionTerms },
  refund: { title: LEGAL.meta.titleRefund, description: LEGAL.meta.descriptionRefund },
} as const;

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const lastUpdated = LEGAL.lastUpdated[doc as keyof typeof LEGAL.lastUpdated];
  const icons = { privacy: ShieldCheck, terms: FileText, refund: RotateCcw };
  const updated = (
    <p className="flex items-center gap-2 text-xs text-muted-foreground">
      <CalendarDays className="size-4" aria-hidden />
      {SHARED.lastUpdated} <time dateTime={lastUpdated}>{lastUpdated}</time>
    </p>
  );

  if (doc === "privacy") return <PrivacyPage updated={updated} />;

  return (
    <MarketingShell>
      <div className="space-y-6 py-10 sm:py-14">
        <PageIntro
          icon={icons[doc]}
          eyebrow={SURFACES.legal.eyebrow}
          title={LEGAL[doc].title}
          description={SURFACES.legal[doc]}
          actions={updated}
        />
        <LegalBody doc={doc} />
      </div>
    </MarketingShell>
  );
}

const TOP = SURFACES.privacyTop;
const TOP_TITLE = splitAccent(TOP.title, TOP.accent);

/**
 * /privacy in the v5 layout (26 Sep 2026, prototype privacy.html): the short answer first — a
 * picture of where a case goes and three questions — and the full policy, unabridged, below it.
 */
function PrivacyPage({ updated }: { updated: React.ReactNode }) {
  return (
    <MarketingShell bleed>
      <section className="stage dark text-foreground">
        <div className="mx-auto grid max-w-marketing items-center gap-10 px-4 pb-40 pt-16 sm:px-8 sm:pt-20 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-4">
            <h1 className="text-balance text-[clamp(2.4rem,1.3rem+3.4vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
              {TOP_TITLE ? (
                <>
                  {TOP_TITLE.pre}
                  <AccentWord className="text-primary">{TOP_TITLE.accent}</AccentWord>
                  {TOP_TITLE.post}
                </>
              ) : (
                TOP.title
              )}
            </h1>
            <p className="text-lg text-muted-foreground sm:text-xl">{TOP.lede}</p>
          </div>
          <Image
            src="/illustrations/vault.svg"
            alt={TOP.illustration}
            width={300}
            height={250}
            className="hidden h-auto w-full max-w-[18.75rem] justify-self-end drop-shadow-[0_30px_50px_rgba(0,0,0,0.5)] lg:block"
            priority
            unoptimized
          />
        </div>
      </section>
      <div className="mx-auto w-full max-w-marketing px-4 sm:px-8">
        <div className="relative -mt-28">
          <DataFlow quietTitle />
        </div>
        <div className="mx-auto mt-14 max-w-[56rem] border-y border-border">
          {TOP.questions.map((item) => (
            <details key={item.q} className="group border-b border-border last:border-b-0">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 rounded-sm py-5 text-left text-[1.0625rem] font-semibold tracking-[-0.01em] text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
                {item.q}
                <span
                  aria-hidden
                  className="inline-flex size-[30px] shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-border transition-transform group-open:rotate-45"
                >
                  <Plus className="size-3.5 text-foreground" />
                </span>
              </summary>
              <p className="max-w-[40em] pb-6 pr-5 text-[0.9375rem] leading-relaxed text-muted-foreground">
                {item.a}
              </p>
            </details>
          ))}
        </div>
        <div className="space-y-6 pb-16 pt-20">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 className="text-[clamp(1.75rem,1.2rem+1.6vw,2.5rem)] font-semibold tracking-[-0.035em] text-foreground">
              {TOP.policyTitle}
            </h2>
            {updated}
          </div>
          <LegalBody doc="privacy" />
        </div>
      </div>
    </MarketingShell>
  );
}

function LegalBody({ doc }: { doc: LegalDoc }) {
  const sections = LEGAL[doc].sections;
  return (
    <>
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
                <h2 id={s.id} className="scroll-mt-24 pt-1 text-base font-semibold text-foreground">
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
    </>
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
