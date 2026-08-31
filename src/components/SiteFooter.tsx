import Link from "next/link";
import { cn } from "@/lib/utils";

export function SiteFooter() {
  return (
    <footer className="border-t border-border bg-background/60">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          AppealDeck by Hawlton. We decode notices and draft appeals; we do not submit to Amazon and do not
          guarantee reinstatement.
        </p>
        <nav className="flex gap-4">
          <Link href="/privacy" className={cn("transition-colors hover:text-foreground")}>
            Privacy
          </Link>
          <Link href="/terms" className={cn("transition-colors hover:text-foreground")}>
            Terms
          </Link>
          <Link href="/refund" className={cn("transition-colors hover:text-foreground")}>
            Refund
          </Link>
        </nav>
      </div>
    </footer>
  );
}
