import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function PrivacyPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-semibold text-gray-100">Privacy</h1>
        <div className="mt-6 space-y-4 text-sm text-gray-300">
          <p>
            AppealDeck is local-first. The notice text you paste into the decoder is processed in your browser
            and is not uploaded or stored by us.
          </p>
          <p>
            We use privacy-first analytics (Plausible or self-hosted Umami) that do not use cookies and do not
            identify you.
          </p>
          <p>
            If you purchase an Appeal Pass, your payment is handled by our Merchant of Record (Paddle), which
            processes your billing data on our behalf.
          </p>
          <p>We do not sell your data. For data-subject requests, contact support@appealdeck.app.</p>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
