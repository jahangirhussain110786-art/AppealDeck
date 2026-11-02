import type { Metadata } from "next";
import type { ReactNode } from "react";
import { pageMetadata } from "@/content/pageMetadata";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHero } from "@/components/PageHero";
import { GUIDES, GUIDES_COMMON } from "@/content/guides";
import { NOTES, NOTES_COMMON } from "@/content/notes";
import { readingMinutes } from "@/lib/readingTime";
import { formatDay } from "@/lib/formatDay";
import { cn } from "@/lib/utils";

export const metadata: Metadata = pageMetadata({
  title: GUIDES_COMMON.indexMetaTitle,
  description: GUIDES_COMMON.indexDescription,
  canonical: "/playbook",
});

/**
 * The one hub for guides and notes (2 Nov 2026). Two indices asked a reader to know a distinction
 * that only matters to us: a guide explains one kind of notice, a note is one habit. Here the
 * formats sit under their own headings, and every row says what it is, how long it takes and when
 * it was last checked, so a seller can pick without opening four pages.
 */
function Group({
  id,
  heading,
  lede,
  count,
  unit,
  children,
}: {
  id: string;
  heading: string;
  lede: string;
  count: number;
  unit: string;
  children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-heading`} className="scroll-mt-24">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border pb-3">
        <h2
          id={`${id}-heading`}
          className="text-xl font-semibold tracking-[-0.02em] text-foreground sm:text-2xl"
        >
          {heading}
        </h2>
        <p className="text-sm text-muted-foreground">
          {count} {unit}
          {count === 1 ? "" : "s"}
        </p>
      </div>
      <p className="mt-3 max-w-[60ch] text-sm leading-relaxed text-muted-foreground">{lede}</p>
      <ul className="mt-3">{children}</ul>
    </section>
  );
}

function Row({
  href,
  index,
  minutes,
  date,
  dateLabel,
  title,
  description,
  compact,
}: {
  href: string;
  index: number;
  minutes: number;
  date: string;
  dateLabel: string;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <li className="border-b border-border">
      <Link
        href={href}
        className="group grid gap-3 py-6 sm:grid-cols-[3rem_minmax(0,1fr)_2rem] sm:items-start"
      >
        <span aria-hidden className="hidden pt-1 font-mono text-sm text-primary-ink sm:block">
          {String(index).padStart(2, "0")}
        </span>
        <span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
            <span aria-hidden className="mr-1 font-mono text-sm text-primary-ink sm:hidden">
              {String(index).padStart(2, "0")}
            </span>
            <span className="text-muted-foreground">
              {minutes} {GUIDES_COMMON.readingSuffix}
            </span>
            <span aria-hidden className="text-muted-foreground">
              ·
            </span>
            <span className="text-muted-foreground">
              {dateLabel} <time dateTime={date}>{formatDay(date)}</time>
            </span>
          </span>
          <h3
            className={cn(
              "mt-2 text-balance font-semibold tracking-[-0.03em] text-foreground group-hover:underline",
              compact
                ? "text-[clamp(1.1rem,1rem+0.4vw,1.35rem)]"
                : "text-[clamp(1.25rem,1rem+0.8vw,1.625rem)]",
            )}
          >
            {title}
          </h3>
          <p className="mt-2 max-w-[52rem] text-sm leading-relaxed text-muted-foreground">
            {description}
          </p>
        </span>
        <ArrowRight
          aria-hidden
          className="mt-1 hidden size-5 text-muted-foreground transition-transform group-hover:translate-x-1 sm:block"
        />
      </Link>
    </li>
  );
}

export default function GuidesIndexPage() {
  const noticeGuides = GUIDES.filter((g) => !g.compare);
  const choosing = GUIDES.filter((g) => g.compare);

  return (
    <MarketingShell
      className="max-w-app"
      hero={
        <PageHero
          eyebrow={GUIDES_COMMON.eyebrow}
          title={GUIDES_COMMON.indexTitle}
          intro={GUIDES_COMMON.indexIntro}
        >
          <p className="mt-4 text-sm text-muted-foreground">
            {GUIDES_COMMON.unsureLead}{" "}
            <Link className="text-link underline underline-offset-4" href="/decode">
              {GUIDES_COMMON.unsureLink}
            </Link>
          </p>
        </PageHero>
      }
    >
      <div className="space-y-14 py-12 sm:py-16">
        <Group
          id="notice-guides"
          heading={GUIDES_COMMON.groups.notices.title}
          lede={GUIDES_COMMON.groups.notices.lede}
          count={noticeGuides.length}
          unit={GUIDES_COMMON.groups.notices.unit}
        >
          {noticeGuides.map((g, i) => (
            <Row
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
        </Group>

        <Group
          id="choosing"
          heading={GUIDES_COMMON.groups.choosing.title}
          lede={GUIDES_COMMON.groups.choosing.lede}
          count={choosing.length}
          unit={GUIDES_COMMON.groups.choosing.unit}
        >
          {choosing.map((g, i) => (
            <Row
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
        </Group>

        <Group
          id="notes"
          heading={GUIDES_COMMON.groups.notes.title}
          lede={GUIDES_COMMON.groups.notes.lede}
          count={NOTES.length}
          unit={GUIDES_COMMON.groups.notes.unit}
        >
          {NOTES.map((n, i) => {
            const revised = n.updated !== n.published;
            return (
              <Row
                key={n.slug}
                href={`/playbook/notes/${n.slug}`}
                index={i + 1}
                minutes={readingMinutes(n)}
                date={revised ? n.updated : n.published}
                dateLabel={revised ? NOTES_COMMON.updatedLabel : GUIDES_COMMON.addedLabel}
                title={n.title}
                description={n.description}
                compact
              />
            );
          })}
        </Group>
      </div>
    </MarketingShell>
  );
}
