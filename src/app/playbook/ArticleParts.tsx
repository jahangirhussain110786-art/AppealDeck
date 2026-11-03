import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowUpRight, Quote } from "lucide-react";
import { SectionToc } from "@/components/SectionToc";
import { cn } from "@/lib/utils";
import { GUIDES_COMMON } from "@/content/guides";

/** A heading's anchor. Headings are unique within a page, so the slug is too. */
export function anchorId(heading: string): string {
  return heading
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const pad = (n: number) => String(n).padStart(2, "0");

export type ArticleSection = {
  heading: string;
  body?: string;
  points?: string[];
  example?: { label: string; paragraphs: string[] };
};

/**
 * The reading page (2 Nov 2026), set like the legal documents: a contents rail on the left and
 * one sheet of paper with a hairline between sections. The measure stays short enough to read,
 * the sections keep their own numbers, and on a phone the page is simply the text.
 */
export function ArticleBody({
  sections,
  children,
}: {
  sections: ArticleSection[];
  children: ReactNode;
}) {
  const toc = sections.map((s) => ({ id: anchorId(s.heading), title: s.heading }));

  return (
    <div className="mx-auto w-full max-w-marketing px-4 pb-16 pt-12 sm:px-8 sm:pt-14">
      <div
        className={cn(
          "grid items-start gap-6",
          toc.length > 1 && "lg:grid-cols-[14rem_minmax(0,1fr)]",
        )}
      >
        {toc.length > 1 && (
          <SectionToc
            label={GUIDES_COMMON.onThisPage}
            heading={GUIDES_COMMON.onThisPage}
            sections={toc}
          />
        )}

        <div className="min-w-0 space-y-12">
          <div className="rounded-[20px] bg-card px-6 shadow-card ring-1 ring-inset ring-border sm:px-10">
            {sections.map((s, i) => (
              <section
                key={s.heading}
                id={anchorId(s.heading)}
                className="grid scroll-mt-24 gap-3 border-b border-border py-8 last:border-b-0 sm:grid-cols-[3rem_minmax(0,1fr)]"
              >
                <span aria-hidden className="pt-1 font-mono text-xs text-muted-foreground">
                  {pad(i + 1)}
                </span>
                <div className="min-w-0">
                  <h2 className="text-balance text-xl font-semibold tracking-[-0.02em] text-foreground">
                    {s.heading}
                  </h2>
                  {s.body && (
                    <p className="mt-3 max-w-reading text-[0.9375rem] leading-7 text-muted-foreground">
                      {s.body}
                    </p>
                  )}
                  {s.example && (
                    <figure className="mt-4 rounded-[var(--radius-xl)] border border-border/70 bg-surface-1 p-5 sm:p-6">
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-7 place-items-center rounded-full bg-primary/10 text-primary-ink">
                          <Quote aria-hidden className="size-3.5" />
                        </span>
                        <figcaption className="font-mono text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                          {s.example.label}
                        </figcaption>
                      </div>
                      <div className="mt-4 max-w-reading space-y-3 text-[0.9375rem] leading-7 text-foreground">
                        {s.example.paragraphs.map((p) => (
                          <p key={p}>{p}</p>
                        ))}
                      </div>
                    </figure>
                  )}
                  {s.points && (
                    <ul className="mt-3 max-w-reading space-y-3 text-[0.9375rem] leading-7 text-muted-foreground">
                      {s.points.map((p) => (
                        <li
                          key={p}
                          className="relative pl-5 before:absolute before:left-0 before:top-[0.7em] before:size-1.5 before:rounded-full before:bg-primary/60"
                        >
                          {p}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            ))}
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/** Related pages as one short list of rows, matching the sheet above it. */
export function RelatedGrid({
  heading,
  items,
}: {
  heading: string;
  items: { slug: string; href: string; title: string; minutes: number }[];
}) {
  return (
    <nav aria-label={heading}>
      <h2 className="text-xl font-semibold tracking-[-0.02em] text-foreground">{heading}</h2>
      <ul className="mt-4 overflow-hidden rounded-[20px] bg-card shadow-card ring-1 ring-inset ring-border">
        {items.map((item) => (
          <li key={item.slug} className="border-b border-border last:border-b-0">
            <Link
              href={item.href}
              className="group flex items-center justify-between gap-4 px-6 py-4 transition-colors duration-150 hover:bg-surface-1"
            >
              <span className="min-w-0">
                <span className="block text-[0.9375rem] font-semibold leading-snug text-foreground group-hover:underline group-hover:decoration-primary/40 group-hover:underline-offset-4">
                  {item.title}
                </span>
                <span className="mt-0.5 block text-xs tabular-nums text-muted-foreground">
                  {item.minutes} {GUIDES_COMMON.readingSuffix}
                </span>
              </span>
              <ArrowUpRight
                aria-hidden
                className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
