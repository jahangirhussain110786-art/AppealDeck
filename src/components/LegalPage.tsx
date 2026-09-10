import type { Metadata } from "next";
import { MarketingShell } from "@/components/MarketingShell";
import { LegalToc } from "@/components/LegalToc";
import { Badge } from "@/components/ui/badge";
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
    <MarketingShell>
      <div className="grid gap-12 py-16 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <LegalToc sections={sections.map((s) => ({ id: s.id, title: s.title }))} />

        <div className="prose prose-sm max-w-reading">
          <h1 className="text-h1 text-balance text-foreground">{LEGAL[doc].title}</h1>
          <Badge variant="secondary" className="mt-2">
            {SHARED.lastUpdated} {lastUpdated}
          </Badge>

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
    </MarketingShell>
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
