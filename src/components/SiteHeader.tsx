import Link from "next/link";

export function SiteHeader() {
  return (
    <header className="border-b border-edge">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-lg font-semibold text-gray-100">
          Appeal<span className="text-accent">Deck</span>
        </Link>
        <nav className="flex gap-4 text-sm text-gray-400">
          <Link href="/decode" className="hover:text-gray-100">Decode</Link>
          <Link href="/pricing" className="hover:text-gray-100">Pricing</Link>
          <Link href="/privacy" className="hover:text-gray-100">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-100">Terms</Link>
        </nav>
      </div>
    </header>
  );
}
