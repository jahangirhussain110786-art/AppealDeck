import type { Metadata } from "next";
import { Check, Lock, MonitorSmartphone, RotateCcw, ShieldCheck } from "lucide-react";
import { MarketingShell } from "@/components/MarketingShell";
import { SectionHeading } from "@/components/SectionHeading";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { LEGAL } from "@/content/legal";
import { SHARED } from "@/content/shared";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: SHARED.metadata.titlePricing,
  description: SHARED.metadata.descriptionPricing,
  openGraph: {
    title: SHARED.metadata.titlePricing,
    description: SHARED.metadata.descriptionPricing,
  },
};

const TRUST_ITEMS = [
  { icon: ShieldCheck, ...PRICING.trust.submit },
  { icon: MonitorSmartphone, ...PRICING.trust.localFirst },
  { icon: Lock, ...PRICING.trust.vault },
  { icon: RotateCcw, ...PRICING.trust.refund },
];

const PASS_ONLY_ROWS = [
  PRICING.rows.poa,
  PRICING.rows.critic,
  PRICING.rows.replyAnalysis,
  PRICING.rows.devices,
  PRICING.rows.refund,
];

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
      <section className="grid gap-12 py-16 lg:grid-cols-[1fr_24rem] lg:py-24">
        <div>
          <p className="text-eyebrow uppercase text-primary">{PRICING.pass}</p>
          <h1 className="mt-4 text-h1 text-foreground">{PRICING.headline}</h1>
          <p className="mt-4 text-lg text-muted-foreground">{PRICING.subline}</p>
        </div>

        <Card className="rounded-xl border-primary/30 shadow-elevated">
          <CardContent className="pt-6">
            <p className="text-eyebrow uppercase text-primary">{PRICING.pass}</p>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-display tabular-nums text-foreground">{PRICING.price}</span>
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
            <Button asChild size="lg" className="mt-6 w-full">
              <a href="#purchase">{PRICING.jumpToPurchase}</a>
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              {PRICING.trust.submit.desc}
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="pb-16">
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
        <div className="grid gap-4 sm:grid-cols-2">
          {TRUST_ITEMS.map((item) => (
            <Card key={item.label} className="p-5">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-md bg-primary/10 text-primary">
                  <item.icon className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section className="pb-16 sm:pb-20">
        <SectionHeading title={PRICING.faqTitle} />
        <Card className="mt-6 px-6">
          <FaqAccordion />
        </Card>
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
            <CardTitle>{PRICING.purchaseTitle}</CardTitle>
            <CardDescription>{LEGAL.consent.deliveryNote}</CardDescription>
          </CardHeader>
          <CardContent>
            <PurchasePanel />
          </CardContent>
        </Card>
      </section>
    </MarketingShell>
  );
}
