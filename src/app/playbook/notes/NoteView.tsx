import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/urls";
import { formatDay } from "@/lib/formatDay";
import { readingMinutes } from "@/lib/readingTime";
import { GUIDES, GUIDES_COMMON } from "@/content/guides";
import { NOTES, NOTES_COMMON, type Note } from "@/content/notes";
import { ArticleBody, RelatedGrid } from "../ArticleParts";
import { LibraryHero } from "../LibraryHero";

/** One note. Content lives in `src/content/notes.ts`; this only lays it out. */
export function NoteView({ note }: { note: Note }) {
  const relatedNotes = NOTES.filter((n) => note.relatedNotes?.includes(n.slug));
  const relatedGuides = GUIDES.filter((g) => note.relatedGuides?.includes(g.slug));
  const revised = note.updated !== note.published;

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: note.title,
      description: note.description,
      datePublished: note.published,
      dateModified: note.updated,
      mainEntityOfPage: `${SITE_URL}/playbook/notes/${note.slug}`,
      image: `${SITE_URL}/brand/og-1200x630.png`,
      inLanguage: "en",
      author: { "@type": "Organization", name: "AppealDeck", url: SITE_URL },
      publisher: {
        "@type": "Organization",
        name: "AppealDeck",
        url: SITE_URL,
        logo: { "@type": "ImageObject", url: `${SITE_URL}/icon.svg` },
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "AppealDeck", item: SITE_URL },
        {
          "@type": "ListItem",
          position: 2,
          name: GUIDES_COMMON.eyebrow,
          item: `${SITE_URL}/playbook`,
        },
        { "@type": "ListItem", position: 3, name: note.navLabel },
      ],
    },
  ];

  return (
    <MarketingShell bleed>
      <LibraryHero
        eyebrow={
          <Link href="/playbook" className="text-primary hover:underline">
            {GUIDES_COMMON.eyebrow}
          </Link>
        }
        title={note.title}
        intro={note.intro}
        meta={
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-muted-foreground">
            <span>
              {readingMinutes(note)} {GUIDES_COMMON.readingSuffix}
            </span>
            <span aria-hidden>·</span>
            <span>
              {revised ? NOTES_COMMON.updatedLabel : NOTES_COMMON.publishedLabel}{" "}
              <time dateTime={revised ? note.updated : note.published}>
                {formatDay(revised ? note.updated : note.published)}
              </time>
            </span>
          </p>
        }
      />
      <JsonLd data={jsonLd} />
      <ArticleBody
        sections={note.sections}
        lead={
          <aside className="rounded-[var(--radius-xl)] bg-primary/5 p-6 ring-1 ring-inset ring-primary/15 sm:p-7">
            <p className="font-mono text-[0.68rem] uppercase tracking-[0.18em] text-primary-ink">
              {NOTES_COMMON.takeawayLabel}
            </p>
            <p className="mt-2 text-balance text-xl leading-snug tracking-[-0.02em] text-foreground">
              {note.takeaway}
            </p>
          </aside>
        }
      >
        <div className="space-y-12">
          <div className="flex flex-col gap-4 rounded-[20px] bg-card p-6 shadow-card ring-1 ring-inset ring-border sm:flex-row sm:items-center sm:justify-between sm:p-7">
            <div className="max-w-[44ch]">
              <p className="text-[0.95rem] leading-relaxed text-foreground">
                {NOTES_COMMON.ctaLead}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                {NOTES_COMMON.ctaNote}
              </p>
            </div>
            <Button asChild className="shrink-0">
              <Link href="/decode">
                {NOTES_COMMON.ctaButton}
                <ArrowRight aria-hidden className="ml-1 size-4" />
              </Link>
            </Button>
          </div>

          <nav aria-label={NOTES_COMMON.relatedLabel} className="space-y-10">
            {relatedNotes.length > 0 && (
              <RelatedGrid
                heading={NOTES_COMMON.relatedNotesLabel}
                items={relatedNotes.map((n) => ({
                  slug: n.slug,
                  href: `/playbook/notes/${n.slug}`,
                  title: n.title,
                  minutes: readingMinutes(n),
                }))}
              />
            )}
            {relatedGuides.length > 0 && (
              <RelatedGrid
                heading={NOTES_COMMON.relatedGuidesLabel}
                items={relatedGuides.map((g) => ({
                  slug: g.slug,
                  href: `/playbook/${g.slug}`,
                  title: g.title,
                  minutes: readingMinutes(g),
                }))}
              />
            )}
            <p className="text-sm">
              <Link
                className="inline-flex items-center gap-1.5 text-link underline underline-offset-4"
                href="/playbook"
              >
                <ArrowLeft aria-hidden className="size-4" />
                {GUIDES_COMMON.hubLink}
              </Link>
            </p>
          </nav>

          <p className="text-xs leading-relaxed text-muted-foreground">{NOTES_COMMON.disclaimer}</p>
        </div>
      </ArticleBody>
    </MarketingShell>
  );
}
