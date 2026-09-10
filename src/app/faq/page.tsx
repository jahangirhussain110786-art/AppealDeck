import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FAQ, faqByGroup } from "@/content/marketing";
import { SHARED } from "@/content/shared";

export const metadata: Metadata = {
  title: SHARED.metadata.titleFaq,
  description: SHARED.metadata.descriptionFaq,
  openGraph: {
    title: SHARED.metadata.titleFaq,
    description: SHARED.metadata.descriptionFaq,
  },
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function FaqPage() {
  const groups = faqByGroup();

  return (
    <MarketingShell width="reading">
      <div className="py-16">
        <h1 className="text-h1 text-foreground">{FAQ.title}</h1>
        <p className="mt-4 text-lg text-muted-foreground">{FAQ.description}</p>

        <div className="mt-12 space-y-10">
          {groups.map((group) => (
            <section key={group.name}>
              <h2 className="text-eyebrow uppercase text-primary">{group.name}</h2>
              <Card className="mt-4 divide-y divide-border/70 p-0">
                {group.items.map((item) => (
                  <div key={item.q} className="p-5">
                    <h3 id={slugify(item.q)} className="text-base font-medium text-foreground">
                      {item.q}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                  </div>
                ))}
              </Card>
            </section>
          ))}
        </div>

        <Card className="mt-12 p-6">
          <h2 className="text-lg font-semibold text-foreground">{FAQ.cta.title}</h2>
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
