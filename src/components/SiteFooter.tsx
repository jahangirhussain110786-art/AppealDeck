import Link from "next/link";
import { cn } from "@/lib/utils";
import { SHARED } from "@/content/shared";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>{SHARED.footer.tagline}</p>
        <nav className="flex flex-wrap gap-4">
          <Link href="/privacy" className={cn("transition-colors hover:text-foreground")}>
            {SHARED.footer.nav.privacy}
          </Link>
          <Link href="/terms" className={cn("transition-colors hover:text-foreground")}>
            {SHARED.footer.nav.terms}
          </Link>
          <Link href="/refund" className={cn("transition-colors hover:text-foreground")}>
            {SHARED.footer.nav.refund}
          </Link>
          <Link href="/faq" className={cn("transition-colors hover:text-foreground")}>
            {SHARED.footer.nav.faq}
          </Link>
        </nav>
      </div>
      <div className="mx-auto px-4 py-3 text-xs text-muted-foreground">
        <p>{SHARED.footer.neverSubmits}</p>
      </div>
    </footer>
  );
}
