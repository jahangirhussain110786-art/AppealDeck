import Link from "next/link";
import { ArrowRight, Check, X } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GUIDES, GUIDES_COMMON, type Guide } from "@/content/guides";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-09-25" -> "25 Sep 2026" with no Date, so no timezone can move it a day. */
function formatDay(isoDay: string): string {
  const [y, m, d] = isoDay.split("-").map(Number);
  return `${d} ${MONTHS[(m ?? 1) - 1]} ${y}`;
}

/** One guide page. Content lives in `src/content/guides.ts`; this only lays it out. */
export function GuideView({ guide }: { guide: Guide }) {
  const others = GUIDES.filter((g) => g.slug !== guide.slug);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    dateModified: guide.lastVerified,
    author: { "@type": "Organization", name: "AppealDeck" },
  };
  return (
    <MarketingShell className="max-w-app">
      <script
        type="application/ld+json"
        // Static content from our own module, never user input.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="py-10 sm:py-14">
        <header className="mb-8 sm:mb-10">
          <p className="text-eyebrow uppercase text-primary">
            <Link href="/guides" className="hover:underline">
              {GUIDES_COMMON.eyebrow}
            </Link>
          </p>
          <h1 className="mt-2 font-accent text-h1 text-foreground">{guide.title}</h1>
          <p className="mt-2 text-xs text-muted-foreground tabular-nums">
            {GUIDES_COMMON.lastVerifiedLabel}{" "}
            <time dateTime={guide.lastVerified}>{formatDay(guide.lastVerified)}</time>
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{guide.intro}</p>
        </header>

        <div className="space-y-8">
          {guide.sections.map((s) => (
            <section key={s.heading}>
              <h2 className="font-accent text-2xl font-medium text-foreground">{s.heading}</h2>
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

          <Card className="p-5 sm:p-6">
            <h2 className="font-accent text-2xl font-medium text-foreground">
              {guide.appealDeck.heading}
            </h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  {GUIDES_COMMON.appealDeckDoes}
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {guide.appealDeck.does.map((d) => (
                    <li key={d} className="flex gap-2">
                      <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-success" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-sm font-medium text-foreground">
                  {GUIDES_COMMON.appealDeckDoesNot}
                </h3>
                <ul className="mt-2 space-y-2 text-sm text-muted-foreground">
                  {guide.appealDeck.doesNot.map((d) => (
                    <li key={d} className="flex gap-2">
                      <X aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="mt-6 border-t border-border/60 pt-5">
              <p className="text-sm text-foreground">{guide.cta}</p>
              <Button asChild className="mt-3">
                <Link href="/decode">
                  {GUIDES_COMMON.ctaButton}
                  <ArrowRight aria-hidden className="ml-1 size-4" />
                </Link>
              </Button>
              <p className="mt-2 text-xs text-muted-foreground">{GUIDES_COMMON.ctaNote}</p>
            </div>
          </Card>

          <nav aria-label={GUIDES_COMMON.related}>
            <h2 className="font-accent text-2xl font-medium text-foreground">
              {GUIDES_COMMON.related}
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {others.map((g) => (
                <li key={g.slug}>
                  <Link
                    className="text-primary underline underline-offset-4"
                    href={`/guides/${g.slug}`}
                  >
                    {g.title}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <p className="text-xs leading-relaxed text-muted-foreground">
            {GUIDES_COMMON.disclaimer}
          </p>
        </div>
      </article>
    </MarketingShell>
  );
}
