import type { Metadata } from "next";
import { AppHeader } from "@/components/AppHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { FaqAccordion } from "@/components/pricing/FaqAccordion";
import { PurchasePanel } from "@/components/pricing/PurchasePanel";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { GLOBAL_EXPECTATIONS } from "@/core/guidance";
import { PRICING } from "@/content/marketing";
import { SHARED } from "@/content/shared";

export const metadata: Metadata = {
  title: SHARED.metadata.titlePricing,
  description: SHARED.metadata.descriptionPricing,
  openGraph: {
    title: SHARED.metadata.titlePricing,
    description: SHARED.metadata.descriptionPricing,
  },
};

const TRUST_ITEMS = [
  PRICING.trust.submit,
  PRICING.trust.localFirst,
  PRICING.trust.vault,
  PRICING.trust.refund,
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader mode="marketing" />
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
        <section>
          <div className="max-w-2xl">
            <Badge variant="outline" className="mb-4 text-xs">
              {PRICING.pass}
            </Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {PRICING.headline}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">{PRICING.subline}</p>
          </div>
        </section>

        <section className="mt-12">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{PRICING.tableHeadings.feature}</TableHead>
                  <TableHead className="text-center">{PRICING.free}</TableHead>
                  <TableHead className="text-center">{PRICING.pass}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.values(PRICING.rows).map((row) => (
                  <TableRow key={row.feature}>
                    <TableCell className="font-medium">{row.feature}</TableCell>
                    <TableCell className="text-center">{row.free}</TableCell>
                    <TableCell className="text-center">{row.pass}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">{PRICING.samplePoa.watermark}</p>
        </section>

        <section className="mt-12">
          <h2 className="text-lg font-semibold text-foreground">{PRICING.trust.title}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {TRUST_ITEMS.map((item) => (
              <Card key={item.label} className="border-border">
                <CardContent className="pt-4">
                  <Badge variant="info" className="mb-2 text-xs">
                    {item.label}
                  </Badge>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="text-xl font-semibold text-foreground">{PRICING.faqTitle}</h2>
          <FaqAccordion />
        </section>

        <section className="mt-12">
          <Card className="border-border">
            <CardContent className="pt-6">
              <h2 className="text-xl font-semibold text-foreground">{PRICING.purchaseTitle}</h2>
              <PurchasePanel />
            </CardContent>
          </Card>
          <div className="mt-6">
            <HonestExpectationsCard
              summary={GLOBAL_EXPECTATIONS.typicalNote}
              whatToDo={[...GLOBAL_EXPECTATIONS.whatWeDo, ...GLOBAL_EXPECTATIONS.whatWeDoNot]}
            />
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
