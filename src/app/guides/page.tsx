import type { Metadata } from "next";
import Link from "next/link";
import { MarketingShell } from "@/components/MarketingShell";
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
    <MarketingShell className="max-w-app">
      <div className="py-10 sm:py-14">
        <header className="mb-8 sm:mb-10">
          <p className="text-eyebrow uppercase text-primary">{GUIDES_COMMON.eyebrow}</p>
          <h1 className="mt-2 font-accent text-h1 text-foreground">{GUIDES_COMMON.indexTitle}</h1>
          <p className="mt-3 text-base text-muted-foreground">{GUIDES_COMMON.indexIntro}</p>
        </header>
        <ul className="space-y-4">
          {GUIDES.map((g) => (
            <li key={g.slug}>
              <Card className="p-5 transition-colors hover:border-primary/40 sm:p-6">
                <h2 className="font-accent text-xl font-medium text-foreground">
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
