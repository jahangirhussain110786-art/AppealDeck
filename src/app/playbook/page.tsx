import type { Metadata } from "next";
import { pageMetadata } from "@/content/pageMetadata";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, CalendarDays } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { SectionToc } from "@/components/SectionToc";
import { GUIDES, GUIDES_COMMON } from "@/content/guides";
import { NOTES, NOTES_COMMON } from "@/content/notes";
import { readingMinutes } from "@/lib/readingTime";
import { formatDay } from "@/lib/formatDay";
import { LibraryHero } from "./LibraryHero";

export const metadata: Metadata = pageMetadata({
  title: GUIDES_COMMON.indexMetaTitle,
  description: GUIDES_COMMON.indexDescription,
  canonical: "/playbook",
});

/**
 * The playbook index (2 Nov 2026). It is set like the legal pages — a navy band, a contents rail,
 * then one sheet of paper with a hairline between rows — because the pages below it are documents
 * a seller reads, not a product tour. The first row is the page to start with.
 */
const pad = (n: number) => String(n).padStart(2, "0");

function Entry({
  href,
  index,
  minutes,
  date,
  dateLabel,
  title,
  description,
}: {
  href: string;
  index: number;
  minutes: number;
  date: string;
  dateLabel: string;
  title: string;
  description: string;
}) {
  return (
    <li className="border-b border-border last:border-b-0">
      <Link href={href} className="group grid gap-3 py-6 sm:grid-cols-[3rem_minmax(0,1fr)]">
        <span aria-hidden className="pt-1 font-mono text-xs tabular-nums text-muted-foreground">
          {pad(index)}
        </span>
        <span className="min-w-0">
          <span className="flex items-start justify-between gap-4">
            <h3 className="text-balance text-[1.0625rem] font-semibold leading-snug tracking-[-0.02em] text-foreground group-hover:underline group-hover:decoration-primary/40 group-hover:underline-offset-4">
              {title}
            </h3>
            <ArrowUpRight
              aria-hidden
              className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            />
          </span>
          <span className="mt-1.5 block max-w-reading text-[0.9375rem] leading-7 text-muted-foreground">
            {description}
          </span>
          <span className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-muted-foreground">
            <span>
              {minutes} {GUIDES_COMMON.readingSuffix}
            </span>
            <span aria-hidden>·</span>
            <span>
              {dateLabel} <time dateTime={date}>{formatDay(date)}</time>
            </span>
          </span>
        </span>
      </Link>
    </li>
  );
}

function GroupHead({
  id,
  title,
  lede,
  count,
  unit,
}: {
  id: string;
  title: string;
  lede: string;
  count: number;
  unit: string;
}) {
  return (
    <header className="py-8">
      <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground">
        {count} {unit}
        {count === 1 ? "" : "s"}
      </p>
      <h2
        id={id}
        className="mt-2 text-balance text-[clamp(1.5rem,1.25rem+0.6vw,1.9rem)] font-semibold leading-tight tracking-[-0.03em] text-foreground"
      >
        {title}
      </h2>
      <p className="mt-2 max-w-reading text-sm leading-relaxed text-muted-foreground">{lede}</p>
    </header>
  );
}

export default function PlaybookIndexPage() {
  const noticeGuides = GUIDES.filter((g) => !g.compare);
  const choosing = GUIDES.filter((g) => g.compare);
  const lead = noticeGuides[0];
  const total = GUIDES.length + NOTES.length;
  const contents = [
    { id: "start-here", title: GUIDES_COMMON.startHere },
    { id: "notice-guides", title: GUIDES_COMMON.groups.notices.title },
    { id: "choosing", title: GUIDES_COMMON.groups.choosing.title },
    { id: "notes", title: GUIDES_COMMON.groups.notes.title },
  ];

  return (
    <MarketingShell bleed>
      <LibraryHero
        eyebrow={GUIDES_COMMON.eyebrow}
        title={GUIDES_COMMON.indexTitle}
        intro={GUIDES_COMMON.indexIntro}
        meta={
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-muted-foreground">
            <CalendarDays aria-hidden className="size-4" />
            <span>
              {total} {GUIDES_COMMON.pagesLabel}
            </span>
            <span aria-hidden>·</span>
            <span>{GUIDES_COMMON.freeLabel}</span>
            <span aria-hidden>·</span>
            <span>{GUIDES_COMMON.datedLabel}</span>
          </p>
        }
      />

      <div className="mx-auto w-full max-w-marketing px-4 sm:px-8">
        {lead && (
          <section
            id="start-here"
            aria-labelledby="start-here-heading"
            className="relative -mt-16 scroll-mt-24"
          >
            <Link
              href={`/playbook/${lead.slug}`}
              className="group grid gap-5 rounded-[20px] bg-card p-6 shadow-card ring-1 ring-inset ring-border transition-colors duration-150 hover:bg-surface-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:p-8"
            >
              <span className="min-w-0">
                <span className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-primary-ink">
                  {GUIDES_COMMON.startHere}
                </span>
                <h2
                  id="start-here-heading"
                  className="mt-2 max-w-[46ch] text-balance text-[1.25rem] font-semibold leading-snug tracking-[-0.025em] text-foreground group-hover:underline group-hover:decoration-primary/40 group-hover:underline-offset-4"
                >
                  {lead.title}
                </h2>
                <span className="mt-2 block max-w-[62ch] text-[0.9375rem] leading-7 text-muted-foreground">
                  {lead.description}
                </span>
                <span className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs tabular-nums text-muted-foreground">
                  <span>
                    {readingMinutes(lead)} {GUIDES_COMMON.readingSuffix}
                  </span>
                  <span aria-hidden>·</span>
                  <span>
                    {GUIDES_COMMON.verifiedLabel}{" "}
                    <time dateTime={lead.lastVerified}>{formatDay(lead.lastVerified)}</time>
                  </span>
                </span>
              </span>
              <span
                aria-hidden
                className="hidden size-11 place-items-center rounded-full bg-primary text-primary-foreground transition-transform duration-150 group-hover:translate-x-1 sm:grid"
              >
                <ArrowRight className="size-4" />
              </span>
            </Link>
          </section>
        )}

        <div className="mt-10 grid items-start gap-6 pb-16 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <SectionToc
            label={GUIDES_COMMON.sectionsLabel}
            heading={GUIDES_COMMON.sectionsLabel}
            sections={contents}
          />

          <div className="min-w-0 rounded-[20px] bg-card px-6 shadow-card ring-1 ring-inset ring-border sm:px-10">
            <section
              id="notice-guides"
              aria-labelledby="notice-guides-heading"
              className="scroll-mt-24 border-b border-border"
            >
              <GroupHead
                id="notice-guides-heading"
                title={GUIDES_COMMON.groups.notices.title}
                lede={GUIDES_COMMON.groups.notices.lede}
                count={noticeGuides.length}
                unit={GUIDES_COMMON.groups.notices.unit}
              />
              <ul className="border-t border-border">
                {noticeGuides.map((g, i) => (
                  <Entry
                    key={g.slug}
                    href={`/playbook/${g.slug}`}
                    index={i + 1}
                    minutes={readingMinutes(g)}
                    date={g.lastVerified}
                    dateLabel={GUIDES_COMMON.verifiedLabel}
                    title={g.title}
                    description={g.description}
                  />
                ))}
              </ul>
            </section>

            <section
              id="choosing"
              aria-labelledby="choosing-heading"
              className="scroll-mt-24 border-b border-border"
            >
              <GroupHead
                id="choosing-heading"
                title={GUIDES_COMMON.groups.choosing.title}
                lede={GUIDES_COMMON.groups.choosing.lede}
                count={choosing.length}
                unit={GUIDES_COMMON.groups.choosing.unit}
              />
              <ul className="border-t border-border">
                {choosing.map((g, i) => (
                  <Entry
                    key={g.slug}
                    href={`/playbook/${g.slug}`}
                    index={i + 1}
                    minutes={readingMinutes(g)}
                    date={g.lastVerified}
                    dateLabel={GUIDES_COMMON.verifiedLabel}
                    title={g.title}
                    description={g.description}
                  />
                ))}
              </ul>
            </section>

            <section id="notes" aria-labelledby="notes-heading" className="scroll-mt-24">
              <GroupHead
                id="notes-heading"
                title={GUIDES_COMMON.groups.notes.title}
                lede={GUIDES_COMMON.groups.notes.lede}
                count={NOTES.length}
                unit={GUIDES_COMMON.groups.notes.unit}
              />
              <ul className="border-t border-border">
                {NOTES.map((n, i) => {
                  const revised = n.updated !== n.published;
                  return (
                    <Entry
                      key={n.slug}
                      href={`/playbook/notes/${n.slug}`}
                      index={i + 1}
                      minutes={readingMinutes(n)}
                      date={revised ? n.updated : n.published}
                      dateLabel={revised ? NOTES_COMMON.updatedLabel : GUIDES_COMMON.addedLabel}
                      title={n.title}
                      description={n.description}
                    />
                  );
                })}
              </ul>
            </section>

            <div className="flex flex-wrap items-center justify-between gap-3 py-5">
              <p className="text-sm text-muted-foreground">{GUIDES_COMMON.unsureLead}</p>
              <Link
                href="/decode"
                className="inline-flex min-h-11 items-center gap-2 rounded-md text-sm text-foreground underline underline-offset-4"
              >
                {GUIDES_COMMON.unsureLink} <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MarketingShell>
  );
}
