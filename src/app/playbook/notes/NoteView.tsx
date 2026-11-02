import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/urls";
import { formatDay } from "@/lib/formatDay";
import { GUIDES, GUIDES_COMMON } from "@/content/guides";
import { NOTES, NOTES_COMMON, type Note } from "@/content/notes";

/** One note. Content lives in `src/content/notes.ts`; this only lays it out. */
export function NoteView({ note }: { note: Note }) {
  const relatedNotes = NOTES.filter((n) => note.relatedNotes?.includes(n.slug));
  const relatedGuides = GUIDES.filter((g) => note.relatedGuides?.includes(g.slug));

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
    <MarketingShell
      className="max-w-app"
      hero={
        <PageHero
          eyebrow={
            <Link href="/playbook" className="hover:underline">
              {GUIDES_COMMON.eyebrow}
            </Link>
          }
          title={note.title}
          intro={note.intro}
        >
          <p className="mt-4 text-sm tabular-nums text-muted-foreground">
            {NOTES_COMMON.publishedLabel}{" "}
            <time dateTime={note.published}>{formatDay(note.published)}</time>
            {note.updated !== note.published && (
              <>
                {" · "}
                {NOTES_COMMON.updatedLabel}{" "}
                <time dateTime={note.updated}>{formatDay(note.updated)}</time>
              </>
            )}
          </p>
        </PageHero>
      }
    >
      <JsonLd data={jsonLd} />
      <article className="py-12 sm:py-16">
        <div className="space-y-8">
          {note.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="tracking-[-0.03em] text-2xl font-semibold text-foreground">
                {s.heading}
              </h2>
              {s.body && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{s.body}</p>
              )}
              {s.points && (
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
                  {s.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <aside className="border-l-2 border-primary pl-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {NOTES_COMMON.takeawayLabel}
            </p>
            <p className="mt-1 text-lg text-foreground">{note.takeaway}</p>
          </aside>

          <Card className="p-5 sm:p-6">
            <p className="text-sm text-foreground">{NOTES_COMMON.ctaLead}</p>
            <Button asChild className="mt-3">
              <Link href="/decode">
                {NOTES_COMMON.ctaButton}
                <ArrowRight aria-hidden className="ml-1 size-4" />
              </Link>
            </Button>
            <p className="mt-2 text-xs text-muted-foreground">{NOTES_COMMON.ctaNote}</p>
          </Card>

          <nav aria-label={NOTES_COMMON.relatedLabel}>
            {relatedNotes.length > 0 && (
              <div>
                <h2 className="tracking-[-0.03em] text-2xl font-semibold text-foreground">
                  {NOTES_COMMON.relatedNotesLabel}
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {relatedNotes.map((n) => (
                    <li key={n.slug}>
                      <Link
                        className="text-link underline underline-offset-4"
                        href={`/playbook/notes/${n.slug}`}
                      >
                        {n.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {relatedGuides.length > 0 && (
              <div className={relatedNotes.length > 0 ? "mt-6" : undefined}>
                <h2 className="tracking-[-0.03em] text-2xl font-semibold text-foreground">
                  {NOTES_COMMON.relatedGuidesLabel}
                </h2>
                <ul className="mt-3 space-y-2 text-sm">
                  {relatedGuides.map((g) => (
                    <li key={g.slug}>
                      <Link
                        className="text-link underline underline-offset-4"
                        href={`/playbook/${g.slug}`}
                      >
                        {g.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <p className="mt-6 text-sm">
              <Link className="text-link underline underline-offset-4" href="/playbook">
                {GUIDES_COMMON.hubLink}
              </Link>
            </p>
          </nav>

          <p className="text-xs leading-relaxed text-muted-foreground">{NOTES_COMMON.disclaimer}</p>
        </div>
      </article>
    </MarketingShell>
  );
}
