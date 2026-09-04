"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { FileSearch, Briefcase, Vault, CreditCard } from "lucide-react";
import { cn } from "@/lib/utils";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/theme-toggle";

type NavItem = { href: string; label: string; icon: typeof FileSearch };

const NAV: ReadonlyArray<NavItem> = [
  { href: "/case", label: "Case", icon: Briefcase },
  { href: "/vault", label: "Vault", icon: Vault },
  { href: "/billing", label: "Billing", icon: CreditCard },
];

export function AppShell({
  user,
  children,
}: {
  user: { email?: string | null };
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-2 focus:top-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to main content
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <span
              aria-hidden="true"
              className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary"
            >
              <FileSearch className="h-5 w-5" />
            </span>
            <span>
              Appeal<span className="text-primary">Deck</span>
            </span>
          </Link>
          <nav className="flex items-center gap-1 sm:gap-2" aria-label="Primary">
            {NAV.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-2 text-sm transition-colors",
                    active
                      ? "bg-accent/15 text-foreground"
                      : "text-muted-foreground hover:bg-accent/10 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
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
