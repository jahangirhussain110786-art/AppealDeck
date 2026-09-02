import type { Metadata } from "next";
import { PageShell } from "@/components/PageShell";

export const metadata: Metadata = {
  title: "Refunds & withdrawal",
  description:
    "AppealDeck offers a 7-day voluntary refund and honours EU/UK consumer withdrawal rights with explicit checkout consent.",
};

export default function RefundPage() {
  return (
    <PageShell title="Refund & withdrawal">
      <div className="mt-6 space-y-4 text-sm text-muted-foreground">
        <p>
          <strong className="text-foreground">7-day voluntary refund.</strong> If you have not
          redeemed your Appeal Pass, request a refund within 7 days for a full refund, no questions
          asked.
        </p>
        <p>
          <strong className="text-foreground">EU/UK consumers.</strong> Where the law gives you a
          right to withdraw from a distance sale, we capture your explicit prior consent at checkout
          and send a durable-medium confirmation email immediately after purchase.
        </p>
        <p>To request a refund, contact support@appealdeck.app with your order email.</p>
      </div>
    </PageShell>
  );
}
