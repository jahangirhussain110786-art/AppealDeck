"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileSearch, Lock, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/SignOutButton";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SHARED } from "@/content/shared";
import { useSessionState } from "@/lib/useSessionState";
import { cn } from "@/lib/utils";

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

interface NavLinkProps {
  href: string;
  label: string;
  lock?: boolean;
}

function NavLink({ href, label, lock }: NavLinkProps) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const className = cn(
    "inline-flex items-center gap-1.5 text-sm font-medium underline underline-offset-2 transition-colors hover:text-foreground",
    active ? "text-foreground" : "text-muted-foreground",
  );

  if (lock) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link href={href} aria-current={active ? "page" : undefined} className={className}>
            {label}
            <Lock className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </TooltipTrigger>
        <TooltipContent>{SHARED.nav.lockedHint}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Link href={href} aria-current={active ? "page" : undefined} className={className}>
      {label}
    </Link>
  );
}

interface AppHeaderProps {
  mode?: "marketing" | "app";
  user?: { email?: string | null } | null;
  signedIn?: boolean;
}

export function AppHeader({ mode: _mode, user, signedIn }: AppHeaderProps) {
  const pathname = usePathname();
  const sessionState = useSessionState();
  const isSignedIn = signedIn !== undefined ? signedIn : sessionState === "signed-in";
  const isSignedOut = !isSignedIn;

  const signInHref =
    pathname.startsWith("/case") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/vault")
      ? `/login?next=${encodeURIComponent(pathname)}`
      : "/login";

  const navItems = [
    { href: "/decode", label: SHARED.nav.decode },
    { href: "/case", label: SHARED.nav.case },
    { href: "/dashboard", label: SHARED.nav.dashboard },
    { href: "/vault", label: SHARED.nav.vault, lock: isSignedOut },
    {
      href: isSignedIn ? "/billing" : "/pricing",
      label: isSignedIn ? SHARED.nav.billing : SHARED.nav.pricing,
    },
  ];

  return (
    <header
      className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      data-no-print
    >
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Logo href={isSignedIn ? "/dashboard" : "/"} />
        <TooltipProvider>
          <nav className="hidden items-center gap-2 sm:flex" aria-label={SHARED.nav.primary}>
            {navItems.map((item) => (
              <NavLink key={item.href} href={item.href} label={item.label} lock={item.lock} />
            ))}
          </nav>
        </TooltipProvider>

        <div className="flex items-center gap-1">
          <ThemeToggle aria-label={SHARED.nav.themeToggle} />
          {isSignedOut && (
            <Button asChild variant="ghost" size="sm" aria-label={SHARED.nav.signIn}>
              <Link href={signInHref}>{SHARED.nav.signIn}</Link>
            </Button>
          )}
          {isSignedIn && <SignOutButton email={user?.email ?? undefined} />}

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden"
                aria-label={SHARED.nav.openMenu}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-64">
              <SheetTitle>{SHARED.nav.menu}</SheetTitle>
              <nav className="flex flex-col gap-2 pt-4" aria-label={SHARED.nav.primary}>
                {navItems.map((item) => (
                  <NavLink key={item.href} href={item.href} label={item.label} lock={item.lock} />
                ))}
              </nav>
              {isSignedOut && (
                <>
                  <div className="my-2 border-t border-border" />
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href={signInHref}>{SHARED.nav.signIn}</Link>
                  </Button>
                </>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
