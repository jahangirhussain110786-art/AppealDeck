import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { PageHero } from "@/components/PageHero";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { pageMetadata } from "@/content/pageMetadata";
import { CHECK_INVOICE as C } from "@/content/checkInvoice";
import { InvoiceCheckClient } from "./InvoiceCheckClient";

export const metadata: Metadata = pageMetadata({
  title: C.metadata.title,
  description: C.metadata.description,
  canonical: "/check-invoice",
});

function Points({ title, items }: { title: string; items: readonly string[] }) {
  return (
    <section>
      <h2 className="text-lg font-semibold tracking-[-0.02em] text-foreground">{title}</h2>
      <ul className="mt-3 space-y-2 text-sm leading-relaxed text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2.5">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/**
 * The free invoice check (8 Oct 2026): the first thing a seller facing an authenticity complaint
 * needs, offered without an account. The check itself runs in the browser (see the client).
 */
export default function CheckInvoicePage() {
  return (
    <MarketingShell
      className="max-w-app"
      hero={<PageHero eyebrow={C.hero.eyebrow} title={C.hero.title} intro={C.hero.lede} />}
    >
      <div className="space-y-10 py-12 sm:py-16">
        <InvoiceCheckClient />
        <div className="grid gap-8 sm:grid-cols-2">
          <Points title={C.covers.title} items={C.covers.items} />
          <Points title={C.limits.title} items={C.limits.items} />
        </div>
        <Card className="workspace-hero p-5 sm:p-6">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] text-foreground">
            {C.next.title}
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">{C.next.body}</p>
          <div className="mt-4">
            <Button asChild>
              <Link href="/decode">
                {C.next.cta} <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    </MarketingShell>
  );
}
