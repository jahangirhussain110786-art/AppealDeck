import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FAQ } from "@/content/marketing";
import { FaqAccordion, faqJsonLd } from "@/components/pricing/FaqAccordion";
import { JsonLd } from "@/components/JsonLd";
import { SHARED } from "@/content/shared";

export const metadata: Metadata = {
  alternates: { canonical: "/faq" },
  title: SHARED.metadata.titleFaq,
  description: SHARED.metadata.descriptionFaq,
  openGraph: {
    title: SHARED.metadata.titleFaq,
    description: SHARED.metadata.descriptionFaq,
  },
};

export default function FaqPage() {
  return (
    <MarketingShell
      className="max-w-app"
      hero={<PageHero eyebrow={FAQ.eyebrow} title={FAQ.title} intro={FAQ.description} />}
    >
      <JsonLd data={faqJsonLd()} />
      <div className="py-12 sm:py-16">
        <FaqAccordion />
        <Card className="workspace-hero mt-8 p-5 sm:p-6">
          <h2 className="tracking-[-0.03em] text-2xl font-semibold text-foreground">
            {FAQ.cta.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{FAQ.cta.desc}</p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/decode">
                {FAQ.cta.link} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </MarketingShell>
  );
}
