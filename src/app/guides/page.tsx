import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHero } from "@/components/PageHero";
import { Card } from "@/components/ui/card";
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
        <ul className="space-y-4">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Card className="rounded-[20px] p-6 shadow-lift transition-colors hover:border-primary/40 sm:p-7">
                <h2 className="tracking-[-0.03em] text-xl font-semibold text-foreground">
                  <Link href={`/guides/${g.slug}`} className="hover:underline">
                    {g.title}
                  </Link>
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">{g.description}</p>
              </Card>
            </li>
          ))}
        </ul>
      </div>
    </MarketingShell>
  );
}
