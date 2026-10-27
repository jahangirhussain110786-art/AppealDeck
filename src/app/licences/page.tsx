import type { Metadata } from "next";
import { ArrowUpRight, CalendarDays, FileCode2 } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { pageMetadata } from "@/content/pageMetadata";
import { LICENCES } from "@/content/licences";
import { SHARED } from "@/content/shared";

export const metadata: Metadata = pageMetadata({
  title: LICENCES.meta.title,
  description: LICENCES.meta.description,
  canonical: "/licences",
});

/**
 * /licences (27 Oct 2026). The open-source notices the MIT, ISC and Apache licences require us to
 * pass on, and nothing else: a package name, the copyright line it carries, and a link to the full
 * text. It is linked from the footer's legal group, not from the home page.
 */
export default function LicencesPage() {
  return (
    <MarketingShell bleed>
      <section className="stage dark text-foreground">
        <div className="mx-auto flex max-w-marketing flex-col gap-4 px-4 pb-20 pt-16 sm:px-8 sm:pt-20">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <FileCode2 aria-hidden className="size-4" />
            {LICENCES.title}
          </p>
          <h1 className="text-balance text-[clamp(2.4rem,1.3rem+3.4vw,4.25rem)] font-semibold leading-[1.02] tracking-[-0.045em]">
            {LICENCES.title}
          </h1>
          <p className="max-w-[40rem] text-lg leading-relaxed text-muted-foreground">
            {LICENCES.lede}
          </p>
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <CalendarDays className="size-4" aria-hidden />
            {SHARED.lastUpdated} <time dateTime={LICENCES.updated}>{LICENCES.updated}</time>
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[56rem] space-y-6 px-4 py-12 sm:px-8 sm:py-14">
        <p className="text-sm leading-relaxed text-muted-foreground">{LICENCES.note}</p>
        {LICENCES.groups.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`licence-${group.id}`}
            className="overflow-hidden rounded-[20px] bg-card shadow-card ring-1 ring-inset ring-border"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
              <h2
                id={`licence-${group.id}`}
                className="text-lg font-semibold tracking-[-0.02em] text-foreground"
              >
                {group.name} licence
              </h2>
              <a
                href={group.href}
                className="inline-flex min-h-8 items-center gap-1.5 text-sm text-link underline underline-offset-4 max-sm:min-h-11 [@media(pointer:coarse)]:min-h-11"
              >
                Full text
                <ArrowUpRight className="size-4" aria-hidden />
              </a>
            </div>
            <ul>
              {group.packages.map((pkg) => (
                <li
                  key={pkg.name}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-6 py-3 text-[0.9375rem] last:border-b-0"
                >
                  <span className="font-mono text-[0.8125rem] text-foreground">{pkg.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {[pkg.note, pkg.holder].filter(Boolean).join(" · ")}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </MarketingShell>
  );
}
