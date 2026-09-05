import type { Metadata } from "next";
import Link from "next/link";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { LEGAL, type LegalDoc } from "@/content/legal";
import { SHARED } from "@/content/shared";

export const legalPageMetadata = {
  privacy: { title: LEGAL.meta.titlePrivacy, description: LEGAL.meta.descriptionPrivacy },
  terms: { title: LEGAL.meta.titleTerms, description: LEGAL.meta.descriptionTerms },
  refund: { title: LEGAL.meta.titleRefund, description: LEGAL.meta.descriptionRefund },
} as const;

export function LegalPage({ doc }: { doc: LegalDoc }) {
  const sections = LEGAL[doc].sections;
  const lastUpdated = LEGAL.lastUpdated[doc as keyof typeof LEGAL.lastUpdated];

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader mode="marketing" />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
        <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
          <nav className="hidden lg:block" aria-label="On-page">
            <div className="sticky top-20 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">{SHARED.tocHeading}</p>
              <ul className="space-y-1.5">
                {sections.map((s) => (
                  <li key={s.id}>
                    <Link
                      href={`#${s.id}`}
                      className="text-sm text-muted-foreground underline decoration-transparent underline-offset-2 transition-colors hover:text-foreground hover:decoration-current"
                    >
                      {s.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="prose prose-sm">
            <h1 className="text-balance">{LEGAL[doc].title}</h1>
            <p className="text-xs text-muted-foreground">
              {SHARED.lastUpdated} {lastUpdated}
            </p>

            {sections.map((s) => (
              <section key={s.id}>
                <h2 id={s.id} className="text-balance">
                  {s.title}
                </h2>
                {s.body.map((p, i) => (
                  <p key={`${s.id}-${i}`}>{p}</p>
                ))}
              </section>
            ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export function legalMetadata(doc: LegalDoc): Metadata {
  const m = legalPageMetadata[doc];
  return {
    title: m.title,
    description: m.description,
    openGraph: {
      title: m.title,
      description: m.description,
    },
  };
}
