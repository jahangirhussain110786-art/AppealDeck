import type { Metadata } from "next";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHero } from "@/components/PageHero";
import { pageMetadata } from "@/content/pageMetadata";
import { CHANGELOG as C } from "@/content/changelog";

export const metadata: Metadata = pageMetadata({
  title: C.metadata.title,
  description: C.metadata.description,
  canonical: "/changelog",
});

/** P-01 (12 Oct 2026): a dated list of changes. Static; the rules for its lines are in `src/content/changelog.ts`. */
export default function ChangelogPage() {
  return (
    <MarketingShell
      className="max-w-app"
      hero={<PageHero eyebrow={C.hero.eyebrow} title={C.hero.title} intro={C.hero.lede} />}
    >
      <div className="space-y-10 py-12 sm:py-16">
        {C.entries.map((entry) => (
          <section key={entry.date}>
            <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">
              {entry.date}
            </h2>
            <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
              {entry.items.map((item) => (
                <li key={item} className="flex gap-2.5">
                  <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
        <p className="max-w-prose text-sm text-muted-foreground">{C.footnote}</p>
      </div>
    </MarketingShell>
  );
}
