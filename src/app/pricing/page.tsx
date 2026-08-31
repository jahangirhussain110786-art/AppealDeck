import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-16">
        <h1 className="text-3xl font-semibold text-gray-100">Pricing</h1>
        <div className="mt-8 rounded-xl border border-edge bg-panel p-6">
          <h2 className="text-xl font-semibold text-gray-100">Appeal Pass — $199 one-time</h2>
          <ul className="mt-4 space-y-2 text-sm text-gray-300">
            <li>Free notice decoder (no account needed)</li>
            <li>AI-drafted Plan of Action you edit and submit yourself</li>
            <li>Deadline tracker for appeal and funds reinstatement</li>
            <li>Encrypted, local case vault</li>
            <li>7-day no-questions refund if unused</li>
          </ul>
          <p className="mt-4 text-sm text-gray-400">
            We do not guarantee reinstatement. We help you submit a stronger, honest appeal faster.
          </p>
          <Link
            href="/decode"
            className="mt-6 inline-block rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-black"
          >
            Start with the free decoder
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
