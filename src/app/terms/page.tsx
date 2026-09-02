import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Terms",
  description:
    "AppealDeck provides decoding and drafting assistance only. You stay in control of every appeal you submit to Amazon.",
};

export default function TermsPage() {
  return (
    <PageShell title="Terms">
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>
          AppealDeck provides decoding and drafting assistance only. You are responsible for the
          appeals you submit to Amazon.
        </p>
        <p>
          We do not guarantee reinstatement or any specific outcome. Sellers remain in control of
          every submission.
        </p>
        <p>
          Accounts and purchases are governed by our Merchant of Record (Paddle) terms and this
          agreement.
        </p>
        <p>
          Forged documents, fraud, or policy evasion are prohibited and routed to professional help,
          never sold.
        </p>
      </div>
    </PageShell>
  );
}
