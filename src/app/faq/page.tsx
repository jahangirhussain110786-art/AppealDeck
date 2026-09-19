import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, MessagesSquare } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FAQ } from "@/content/marketing";
import { FaqAccordion } from "@/components/pricing/FaqAccordion";
import { IconTile } from "@/components/workspace/WorkspaceVisuals";
import { SHARED } from "@/content/shared";

export const metadata: Metadata = {
  title: SHARED.metadata.titleFaq,
  description: SHARED.metadata.descriptionFaq,
  openGraph: {
    title: SHARED.metadata.titleFaq,
    description: SHARED.metadata.descriptionFaq,
  },
};

export default function FaqPage() {
  return (
    <MarketingShell className="max-w-app">
      <div className="py-10 sm:py-14">
        <header className="mb-8 flex items-start gap-4 sm:mb-10">
          <IconTile icon={MessagesSquare} tone="info" className="mt-1 hidden sm:inline-flex" />
          <div>
            <p className="text-eyebrow uppercase text-primary">Help & answers</p>
            <h1 className="mt-2 font-accent text-h1 text-foreground">{FAQ.title}</h1>
            <p className="mt-3 text-base text-muted-foreground">{FAQ.description}</p>
          </div>
        </header>
        <FaqAccordion />
        <Card className="workspace-hero mt-8 p-5 sm:p-6">
          <h2 className="font-accent text-2xl font-medium text-foreground">{FAQ.cta.title}</h2>
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
