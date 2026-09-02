import type { Metadata } from "next";
import Link from "next/link";
import { Check } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckoutButton } from "@/components/CheckoutButton";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "The Appeal Pass is a $199 one-time purchase: free decoder, AI-drafted Plan of Action, deadline tracker, and encrypted local vault.",
};

const INCLUDED = [
  "Free notice decoder (no account needed)",
  "AI-drafted Plan of Action you edit and submit yourself",
  "Deadline tracker for appeal and funds reinstatement",
  "Encrypted, local case vault",
  "7-day no-questions refund if unused",
];

export default function PricingPage() {
  return (
    <PageShell title="Pricing">
      <Card className="mt-8 border-primary/30 bg-primary/5 shadow-soft-lg transition-shadow hover:shadow-soft-lg">
        <CardContent className="pt-6">
          <h2 className="text-xl font-semibold text-foreground">Appeal Pass — $199 one-time</h2>
          <ul className="mt-4 space-y-2 text-sm text-foreground">
            {INCLUDED.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-sm text-muted-foreground">
            We do not guarantee reinstatement. We help you submit a stronger, honest appeal faster.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <CheckoutButton size="lg" priceId={process.env.NEXT_PUBLIC_PADDLE_PRICE_APPEAL_PASS}>
              Buy Appeal Pass — $199
            </CheckoutButton>
            <Button asChild variant="outline" size="lg">
              <Link href="/decode">
                Try the free decoder first <Check className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </PageShell>
  );
}
