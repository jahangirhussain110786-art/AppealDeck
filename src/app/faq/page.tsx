import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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

export default function FaqPage() {
  const groups = faqByGroup();

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader mode="marketing" />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {FAQ.title}
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">{FAQ.description}</p>

        <div className="mt-12 space-y-12">
          {groups.map((group) => (
            <section key={group.name}>
              <h2 className="text-xl font-semibold text-foreground">{group.name}</h2>
              <dl className="mt-4 space-y-6">
                {group.items.map((item) => (
                  <div key={item.q}>
                    <dt className="text-base font-medium text-foreground">{item.q}</dt>
                    <dd className="mt-1 text-sm text-muted-foreground">{item.a}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>

        <Card className="mt-12 border-border">
          <CardContent className="pt-6">
            <h2 className="text-lg font-semibold text-foreground">{FAQ.cta.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{FAQ.cta.desc}</p>
            <div className="mt-4">
              <Button asChild>
                <Link href="/decode">
                  {FAQ.cta.link} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
