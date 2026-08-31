import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function RefundPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">Refund &amp; withdrawal</h1>
        <div className="mt-6 space-y-4 text-sm text-muted-foreground">
          <p>
            <strong className="text-foreground">7-day voluntary refund.</strong> If you have not redeemed your
            Appeal Pass, request a refund within 7 days for a full refund, no questions asked.
          </p>
          <p>
            <strong className="text-foreground">EU/UK consumers.</strong> Where the law gives you a right to
            withdraw from a distance sale, we capture your explicit prior consent at checkout and send a
            durable-medium confirmation email immediately after purchase.
          </p>
          <p>To request a refund, contact support@appealdeck.app with your order email.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
