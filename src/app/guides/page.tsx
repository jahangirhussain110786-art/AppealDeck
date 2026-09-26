import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHero } from "@/components/PageHero";
import { ArrowRight } from "lucide-react";
import { GUIDES, GUIDES_COMMON } from "@/content/guides";

export const metadata: Metadata = {
  alternates: { canonical: "/guides" },
  title: GUIDES_COMMON.indexMetaTitle,
  description: GUIDES_COMMON.indexDescription,
  openGraph: { title: GUIDES_COMMON.indexMetaTitle, description: GUIDES_COMMON.indexDescription },
};

export default function GuidesIndexPage() {
  return (
    <MarketingShell
      className="max-w-app"
      hero={
        <PageHero
          eyebrow={GUIDES_COMMON.eyebrow}
          title={GUIDES_COMMON.indexTitle}
          intro={GUIDES_COMMON.indexIntro}
        />
      }
    >
      <div className="py-12 sm:py-16">
        {/* v5 (26 Sep 2026): hairline rows, a large title and an arrow, like the prototype's lists. */}
        <ul className="border-t border-border">
          {GUIDES.map((g, i) => (
            <li key={g.slug} className="border-b border-border">
              <Link
                href={`/guides/${g.slug}`}
                className="group grid gap-4 py-7 sm:grid-cols-[3rem_minmax(0,1fr)_2rem] sm:items-center"
              >
                <span className="font-mono text-sm text-primary-ink" aria-hidden>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>
                  <h2 className="text-balance text-[clamp(1.25rem,1rem+0.8vw,1.625rem)] font-semibold tracking-[-0.03em] text-foreground group-hover:underline">
                    {g.title}
                  </h2>
                  <p className="mt-2 max-w-[48rem] text-muted-foreground">{g.description}</p>
                </span>
                <ArrowRight
                  aria-hidden
                  className="hidden size-5 text-muted-foreground transition-transform group-hover:translate-x-1 sm:block"
                />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </MarketingShell>
  );
}
