import Link from "next/link";
import type { ReactNode } from "react";
import { LayoutDashboard, FileSearch, Briefcase } from "lucide-react";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/theme-toggle";

export function AppShell({
  user,
  children,
}: {
  user: { email?: string | null };
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link
            href="/app"
            className="flex items-center gap-2 text-lg font-semibold text-foreground"
          >
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
              <FileSearch className="h-5 w-5" />
            </span>
            Appeal<span className="text-primary">Deck</span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary">
            <Link
              href="/app"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
            <Link
              href="/app/case"
              className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
            >
              <Briefcase className="h-4 w-4" /> Case
            </Link>
            <Link
              href="/app/billing"
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/10 hover:text-foreground"
            >
              Billing
            </Link>
            <ThemeToggle />
            <SignOutButton email={user.email ?? undefined} />
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-12">
        {children}
      </main>
    </div>
  );
}
