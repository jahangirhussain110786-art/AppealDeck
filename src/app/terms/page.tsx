import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function TermsPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Terms</h1>
        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
          <p>
            AppealDeck provides decoding and drafting assistance only. You are responsible for the appeals you
            submit to Amazon.
          </p>
          <p>We do not guarantee reinstatement or any specific outcome. Sellers remain in control of every submission.</p>
          <p>Accounts and purchases are governed by our Merchant of Record (Paddle) terms and this agreement.</p>
          <p>
            Forged documents, fraud, or policy evasion are prohibited and routed to professional help, never sold.
          </p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
