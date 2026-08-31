import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-edge">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 text-xs text-gray-500 sm:flex-row sm:items-center sm:justify-between">
        <p>AppealDeck by Hawlton. We decode notices and draft appeals; we do not submit to Amazon and do not guarantee reinstatement.</p>
        <nav className="flex gap-4">
          <Link href="/privacy" className="hover:text-gray-300">Privacy</Link>
          <Link href="/terms" className="hover:text-gray-300">Terms</Link>
          <Link href="/refund" className="hover:text-gray-300">Refund</Link>
        </nav>
      </div>
    </footer>
  );
}
