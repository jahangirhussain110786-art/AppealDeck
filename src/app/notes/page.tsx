import type { Metadata } from "next";
import { pageMetadata } from "@/content/pageMetadata";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHero } from "@/components/PageHero";
import { NOTES, NOTES_COMMON } from "@/content/notes";
import { formatDay } from "./format";

export const metadata: Metadata = pageMetadata({
  title: NOTES_COMMON.indexMetaTitle,
  description: NOTES_COMMON.indexDescription,
  canonical: "/notes",
});

export default function NotesIndexPage() {
  return (
    <MarketingShell
      className="max-w-app"
      hero={
        <PageHero
          eyebrow={NOTES_COMMON.eyebrow}
          title={NOTES_COMMON.indexTitle}
          intro={NOTES_COMMON.indexIntro}
        />
      }
    >
      <div className="py-12 sm:py-16">
        <ul className="border-t border-border">
          {NOTES.map((n) => (
            <li key={n.slug} className="border-b border-border">
              <Link
                href={`/notes/${n.slug}`}
                className="group grid gap-3 py-7 sm:grid-cols-[8rem_minmax(0,1fr)_2rem] sm:items-baseline"
              >
                <time dateTime={n.published} className="font-mono text-sm text-primary-ink">
                  {formatDay(n.published)}
                </time>
                <span>
                  <h2 className="text-balance text-[clamp(1.25rem,1rem+0.8vw,1.625rem)] font-semibold tracking-[-0.03em] text-foreground group-hover:underline">
                    {n.title}
                  </h2>
                  <p className="mt-2 max-w-[48rem] text-muted-foreground">{n.description}</p>
                </span>
                <ArrowRight
                  aria-hidden
                  className="hidden size-5 text-muted-foreground transition-transform group-hover:translate-x-1 sm:block"
                />
              </Link>
            </li>
          ))}
        </ul>

        <p className="mt-8 text-muted-foreground">
          {NOTES_COMMON.guidesLead}{" "}
          <Link className="text-link underline underline-offset-4" href="/guides">
            {NOTES_COMMON.allGuides}
          </Link>
        </p>
      </div>
    </MarketingShell>
  );
}
