import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16">
        <h1 className="text-4xl font-semibold text-gray-100">Understand your Amazon suspension notice.</h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-400">
          AppealDeck decodes your deactivation or policy notice into plain English and drafts a Plan of Action
          you edit and submit yourself. Local-first, read-only, no automation.
        </p>
        <div className="mt-8 flex gap-3">
          <Link
            href="/decode"
            className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-black"
          >
            Decode a notice (free)
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg border border-edge px-5 py-2 text-sm font-semibold text-gray-200"
          >
            See pricing
          </Link>
        </div>
        <ul className="mt-12 grid gap-4 sm:grid-cols-3">
          <li className="rounded-lg border border-edge bg-panel p-4">
            <h2 className="font-medium text-gray-100">Free decoder</h2>
            <p className="mt-1 text-sm text-gray-400">
              Paste a notice, see what it means and the deadlines.
            </p>
          </li>
          <li className="rounded-lg border border-edge bg-panel p-4">
            <h2 className="font-medium text-gray-100">POA drafting</h2>
            <p className="mt-1 text-sm text-gray-400">A $199 Appeal Pass drafts your Plan of Action.</p>
          </li>
          <li className="rounded-lg border border-edge bg-panel p-4">
            <h2 className="font-medium text-gray-100">You stay in control</h2>
            <p className="mt-1 text-sm text-gray-400">
              We never submit to Amazon and never guarantee outcomes.
            </p>
          </li>
        </ul>
      </main>
      <SiteFooter />
    </div>
  );
}
