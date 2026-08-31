import Link from "next/link";
import { Check } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const INCLUDED = [
  "Free notice decoder (no account needed)",
  "AI-drafted Plan of Action you edit and submit yourself",
  "Deadline tracker for appeal and funds reinstatement",
  "Encrypted, local case vault",
  "7-day no-questions refund if unused",
];

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Pricing</h1>
        <Card className="mt-8 border-primary/30 bg-primary/5 shadow-soft-lg">
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
            <Button asChild size="lg" className="mt-6">
              <Link href="/decode">
                Start with the free decoder <Check className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
      <SiteFooter />
    </div>
  );
}
