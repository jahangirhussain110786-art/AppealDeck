"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Lock, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignOutButton } from "@/components/SignOutButton";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { SHARED } from "@/content/shared";
import { useSessionState } from "@/lib/useSessionState";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  lock?: boolean;
}

function NavPill({ href, label, lock, mobile }: NavItem & { mobile?: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(`${href}/`);
  const className = cn(
    mobile
      ? "flex h-11 items-center rounded-md px-3 text-base font-medium hover:bg-muted"
      : "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors duration-[var(--dur-fast)] hover:bg-muted hover:text-foreground",
    !mobile && active && "bg-muted text-foreground",
    mobile && active && "bg-muted",
  );

  if (lock) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Link
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(className, "inline-flex items-center")}
          >
            {label}
            <Lock className="ml-1 size-3.5 text-muted-foreground" aria-hidden />
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

export function AppHeader({ mode = "marketing", user, signedIn }: AppHeaderProps) {
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

  const navItems: NavItem[] = [
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
    <TooltipProvider>
      <header
        className="sticky top-0 z-[var(--z-sticky)] border-b border-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
        data-no-print
      >
        <div
          className={cn(
            "mx-auto flex items-center justify-between gap-4 px-4 sm:px-6",
            mode === "app" ? "h-14 max-w-app" : "h-16 max-w-marketing",
          )}
        >
          <Logo href={isSignedIn ? "/dashboard" : "/"} />

          <nav className="hidden items-center gap-1 md:flex" aria-label={SHARED.nav.primary}>
            {navItems.map((item) => (
              <NavPill key={item.href} href={item.href} label={item.label} lock={item.lock} />
            ))}
          </nav>

          <div className="flex items-center gap-1.5">
            <ThemeToggle />
            {isSignedOut && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="hidden sm:inline-flex"
                aria-label={SHARED.nav.signIn}
              >
                <Link href={signInHref}>{SHARED.nav.signIn}</Link>
              </Button>
            )}
            {isSignedIn && <SignOutButton email={user?.email ?? undefined} />}

            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  aria-label={SHARED.nav.openMenu}
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetTitle>{SHARED.nav.menu}</SheetTitle>
                <nav className="flex flex-col gap-1" aria-label={SHARED.nav.primary}>
                  {navItems.map((item) => (
                    <NavPill
                      key={item.href}
                      href={item.href}
                      label={item.label}
                      lock={item.lock}
                      mobile
                    />
                  ))}
                </nav>
                {isSignedOut && (
                  <>
                    <div className="border-t border-border" />
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
    </TooltipProvider>
  );
}
