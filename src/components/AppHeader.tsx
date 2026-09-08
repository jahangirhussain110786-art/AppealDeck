"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSearch, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/SignOutButton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const MARKETING_NAV = [
  { href: "/decode", label: "Decode" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
];

const APP_NAV = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/case", label: "Case" },
  { href: "/vault", label: "Vault" },
  { href: "/billing", label: "Billing" },
];

function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 text-lg font-semibold text-foreground">
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/15 text-primary">
        <FileSearch className="h-5 w-5" />
      </span>
      Appeal<span className="text-primary">Deck</span>
    </Link>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "text-sm font-medium underline underline-offset-2 transition-colors hover:text-foreground",
        active ? "text-foreground" : "text-muted-foreground",
      )}
    >
      {label}
    </Link>
  );
}

interface AppHeaderProps {
  mode?: "marketing" | "app";
  user?: { email?: string | null };
}

export function AppHeader({ mode = "marketing", user }: AppHeaderProps) {
  const nav = mode === "app" ? APP_NAV : MARKETING_NAV;

  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Logo href={mode === "app" ? "/dashboard" : "/"} />

        <div className="flex items-center gap-1">
          <nav className="hidden items-center gap-2 sm:flex" aria-label="Primary">
            {nav.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} />
            ))}
          </nav>
          <ThemeToggle />
          {mode === "app" && <SignOutButton email={user?.email ?? undefined} />}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="sm:hidden" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <nav className="flex flex-col gap-2 pt-10" aria-label="Mobile">
                {nav.map((item) => (
                  <NavLink key={item.href} href={item.href} label={item.label} />
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
