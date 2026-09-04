import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Privacy",
  description:
    "How AppealDeck handles your data: local-first decoding, no-cookie analytics, and Merchant-of-Record billing.",
};

export default function PrivacyPage() {
  return (
    <PageShell title="Privacy">
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>
          AppealDeck is local-first. The notice text you paste into the decoder is processed in your
          browser and is not uploaded or stored by us.
        </p>
        <p>
          We use analytics (Plausible or self-hosted Umami) that do not use cookies and do not
          identify you.
        </p>
        <p>
          If you purchase an Appeal Pass, your payment is handled by our Merchant of Record
          (Paddle), which processes your billing data on our behalf.
        </p>
        <p>We do not sell your data. For data-subject requests, contact support@appealdeck.app.</p>
      </div>
    </PageShell>
  );
}
