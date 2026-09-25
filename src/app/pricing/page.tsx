import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Check, FileSearch, MessagesSquare } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { IconTile } from "@/components/workspace/WorkspaceVisuals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FaqAccordion } from "@/components/pricing/FaqAccordion";
import { PurchasePanel } from "@/components/pricing/PurchasePanel";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { GLOBAL_EXPECTATIONS } from "@/core/guidance";
import { PRICING } from "@/content/marketing";
import { SHARED } from "@/content/shared";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  alternates: { canonical: "/pricing" },
  title: SHARED.metadata.titlePricing,
  description: SHARED.metadata.descriptionPricing,
  openGraph: {
    title: SHARED.metadata.titlePricing,
    description: SHARED.metadata.descriptionPricing,
  },
};

const PASS_ONLY_ROWS = [PRICING.rows.poa, PRICING.rows.critic, PRICING.rows.devices];

function ValueCell({ value }: { value: string }) {
  if (value === "Yes") {
    return (
      <span className="inline-flex items-center gap-1.5 text-foreground">
        <Check className="size-4 text-success" />
        {value}
      </span>
    );
  }
  if (value === "—") {
    return <span className="text-muted-foreground/60">{value}</span>;
  }
  return <span className="text-sm text-foreground">{value}</span>;
}

export default function PricingPage() {
  return (
    <MarketingShell>
      <section className="grid items-center gap-8 py-10 sm:py-14 lg:grid-cols-[1fr_24rem] lg:gap-16">
        <div>
          <IconTile icon={FileSearch} tone="info" />
          <p className="mt-5 text-eyebrow uppercase text-primary">Start with the request</p>
          <h1 className="mt-3 max-w-[20ch] font-accent text-h1 text-foreground">
            {PRICING.headline}
          </h1>
          <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
            {PRICING.subline}
          </p>
          <Button asChild className="mt-6">
            <Link href="/decode">
              Start with a free decode
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Button>
          <p className="mt-3 text-xs text-muted-foreground">
            No payment needed to understand the request.
          </p>
        </div>

        <Card className="rounded-xl border-primary/30 shadow-elevated">
          <CardContent className="pt-6">
            <p className="text-eyebrow uppercase text-primary">{PRICING.pass}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="font-mono text-4xl font-medium tabular-nums tracking-tight text-foreground">
                {PRICING.price}
              </span>
              <span className="text-sm text-muted-foreground">{PRICING.priceNote}</span>
            </div>
            <p className="mt-4 text-eyebrow uppercase text-muted-foreground">{PRICING.included}</p>
            <ul className="mt-3 space-y-2">
              {PASS_ONLY_ROWS.map((row) => (
                <li key={row.feature} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  {row.feature}
                </li>
              ))}
            </ul>
            <Button asChild size="lg" variant="outline" className="mt-6 w-full">
              <a href="#purchase">{PRICING.jumpToPurchase}</a>
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              No subscription · One eligible case
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="pb-16">
        <h2 className="mb-5 text-lg font-semibold text-foreground">Choose the access you need</h2>
        <div className="overflow-x-auto">
          <Card className="overflow-hidden p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{PRICING.tableHeadings.feature}</TableHead>
                  <TableHead className="text-center">{PRICING.tableHeadings.free}</TableHead>
                  <TableHead className="text-center">{PRICING.tableHeadings.account}</TableHead>
                  <TableHead className="text-center">{PRICING.tableHeadings.pass}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(PRICING.rows).map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell className="font-medium">{row.feature}</TableCell>
                    <TableCell className="text-center">
                      <ValueCell value={row.free} />
                    </TableCell>
                    <TableCell className="text-center">
                      <ValueCell value={row.account} />
                    </TableCell>
                    <TableCell className={cn("text-center", "bg-primary/[0.04]")}>
                      <ValueCell value={row.pass} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <div className="mb-6 flex items-center gap-3">
          <IconTile icon={MessagesSquare} tone="info" />
          <div>
            <h2 className="font-accent text-2xl font-medium text-foreground sm:text-3xl">
              {PRICING.faqTitle}
            </h2>
          </div>
        </div>
        <FaqAccordion ids={PRICING.faqIds} />
      </section>

      <section id="purchase" className="pb-16 sm:pb-20">
        {/* Honest-expectations card renders before the purchase panel, per the checkout-consent
            spec (legal/withdrawal-consent.md item 1) and D8's intent — a visitor must see the
            expectations disclosure before they reach the pay button, not after. Fixed 11 Sep 2026;
            see docs/handoffs/2026-09-11-full-repo-audit-guidebook.md Section F3. */}
        <HonestExpectationsCard
          summary={GLOBAL_EXPECTATIONS.typicalNote}
          weDo={GLOBAL_EXPECTATIONS.whatWeDo}
          weDoNot={GLOBAL_EXPECTATIONS.whatWeDoNot}
        />
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">{PRICING.purchaseTitle}</CardTitle>
            <p className="text-sm text-muted-foreground">
              Start your case and confirm the request first. Your pass applies to that case.
            </p>
          </CardHeader>
          <CardContent>
            <PurchasePanel />
          </CardContent>
        </Card>
      </section>
    </MarketingShell>
  );
}
