import Link from "next/link";
import { ArrowUpRight, ChevronDown } from "lucide-react";
import { FAQ, faqByGroup, type FaqItem } from "@/content/marketing";

/**
 * 25 Sep 2026: this was a set of tabs holding accordions, and both unmount what is hidden — so the
 * page's HTML carried 1 of 13 answers and search engines could read no others. Native
 * `<details>` keeps every answer in the document, opens by keyboard and needs no script.
 *
 * `ids` shows a chosen set in one list (the buyer's questions on /pricing); without it, every
 * question renders under its topic heading (/faq).
 */
export function FaqAccordion({ ids }: { ids?: readonly string[] }) {
  if (ids) {
    const byId = new Map<string, FaqItem>(FAQ.items.map((i) => [i.id, i]));
    const items = ids.map((id) => byId.get(id)).filter((i): i is FaqItem => Boolean(i));
    return <QuestionList items={items} />;
  }
  return (
    <div className="space-y-8">
      {faqByGroup().map((group) => (
        <section key={group.id} aria-labelledby={`faq-${group.id}`}>
          <h2
            id={`faq-${group.id}`}
            className="tracking-[-0.03em] text-2xl font-semibold text-foreground"
          >
            {group.name}
          </h2>
          <QuestionList items={group.items} />
        </section>
      ))}
    </div>
  );
}

function QuestionList({ items }: { items: FaqItem[] }) {
  return (
    <div className="mt-3 divide-y divide-border/70 overflow-hidden rounded-xl border border-border/80 bg-card shadow-card">
      {items.map((item) => (
        <details key={item.id} id={item.id} className="group px-5 sm:px-6">
          <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 rounded-sm py-4 text-left text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
            {item.q}
            <ChevronDown
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
            />
          </summary>
          <div className="max-w-prose pb-5 pr-5 text-sm leading-relaxed text-muted-foreground">
            <p className="font-medium text-foreground">{item.a}</p>
            {item.detail && <p className="mt-2">{item.detail}</p>}
            {item.link && (
              <Link
                href={item.link.href}
                className="mt-3 inline-flex min-h-8 items-center gap-1.5 rounded-sm font-medium text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.link.label}
                <ArrowUpRight className="size-3.5" aria-hidden />
              </Link>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}

/** schema.org FAQPage for the /faq page only — one page should own each question. */
export function faqJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (FAQ.items as readonly FaqItem[]).map((i) => ({
      "@type": "Question",
      name: i.q,
      acceptedAnswer: { "@type": "Answer", text: i.detail ? `${i.a} ${i.detail}` : i.a },
    })),
  };
}
