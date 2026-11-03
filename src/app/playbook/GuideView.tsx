import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { Button } from "@/components/ui/button";
import { JsonLd } from "@/components/JsonLd";
import { SITE_URL } from "@/lib/urls";
import { formatDay } from "@/lib/formatDay";
import { readingMinutes } from "@/lib/readingTime";
import { GUIDES, GUIDES_COMMON, type Guide } from "@/content/guides";
import { ArticleBody, RelatedGrid } from "./ArticleParts";
import { LibraryHero } from "./LibraryHero";

/** One guide page. Content lives in `src/content/guides.ts`; this only lays it out. */
export function GuideView({ guide }: { guide: Guide }) {
  const others = GUIDES.filter((g) => g.slug !== guide.slug).slice(0, 3);
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: guide.title,
      description: guide.description,
      dateModified: guide.lastVerified,
      mainEntityOfPage: `${SITE_URL}/playbook/${guide.slug}`,
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
        { "@type": "ListItem", position: 3, name: guide.navLabel },
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
        title={guide.title}
        intro={guide.intro}
        meta={
          <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm tabular-nums text-muted-foreground">
            <span>
              {readingMinutes(guide)} {GUIDES_COMMON.readingSuffix}
            </span>
            <span aria-hidden>·</span>
            <span>
              {GUIDES_COMMON.lastVerifiedLabel}{" "}
              <time dateTime={guide.lastVerified}>{formatDay(guide.lastVerified)}</time>
            </span>
          </p>
        }
      />
      <JsonLd data={jsonLd} />
      <ArticleBody sections={guide.sections}>
        <div className="space-y-12">
          <section className="overflow-hidden rounded-[20px] bg-card shadow-card ring-1 ring-inset ring-border">
            <div className="p-6 sm:p-7">
              <h2 className="text-balance text-xl font-semibold tracking-[-0.03em] text-foreground sm:text-2xl">
                {guide.appealDeck.heading}
              </h2>
              <div className="mt-5 grid gap-6 sm:grid-cols-2 sm:gap-8">
                <div>
                  <h3 className="text-sm font-medium text-foreground">
                    {GUIDES_COMMON.appealDeckDoes}
                  </h3>
                  <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                    {guide.appealDeck.does.map((d) => (
                      <li key={d} className="flex gap-2.5">
                        <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="sm:border-l sm:border-border/60 sm:pl-8">
                  <h3 className="text-sm font-medium text-foreground">
                    {GUIDES_COMMON.appealDeckDoesNot}
                  </h3>
                  <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-muted-foreground">
                    {guide.appealDeck.doesNot.map((d) => (
                      <li key={d} className="flex gap-2.5">
                        <X aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
            <div className="border-t border-border/60 bg-surface-2/60 px-6 py-5 sm:px-7">
              <p className="text-sm text-foreground">{guide.cta}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                <Button asChild>
                  <Link href="/decode">
                    {GUIDES_COMMON.ctaButton}
                    <ArrowRight aria-hidden className="ml-1 size-4" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground">{GUIDES_COMMON.ctaNote}</p>
              </div>
            </div>
          </section>

          <RelatedGrid
            heading={GUIDES_COMMON.related}
            items={others.map((g) => ({
              slug: g.slug,
              href: `/playbook/${g.slug}`,
              title: g.title,
              minutes: readingMinutes(g),
            }))}
          />

          <p className="text-sm">
            <Link
              className="inline-flex items-center gap-1.5 text-link underline underline-offset-4"
              href="/playbook"
            >
              <ArrowLeft aria-hidden className="size-4" />
              {GUIDES_COMMON.hubLink}
            </Link>
          </p>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {GUIDES_COMMON.disclaimer}
          </p>
        </div>
      </ArticleBody>
    </MarketingShell>
  );
}
