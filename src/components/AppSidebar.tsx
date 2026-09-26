"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CreditCard, FilePlus2, LayoutGrid, Lock, Tag } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Logo, LogoMark } from "@/components/Logo";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ThemeToggle } from "@/components/theme-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SHARED } from "@/content/shared";
import { cn } from "@/lib/utils";

interface Item {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * The signed-in app's navigation (v5, 26 Sep 2026): a navy sidebar on a wide screen, a compact
 * top bar on a phone. The destinations are AM-25's (Decode, Dashboard, Vault), with Billing for a
 * signed-in seller and Pricing for a guest, exactly as the public header decides them.
 */
export function AppSidebar({
  user,
  signedIn,
}: {
  user: { email?: string | null } | null;
  signedIn: boolean;
}) {
  const pathname = usePathname();
  const items: Item[] = [
    { href: "/decode", label: SHARED.nav.decode, icon: FilePlus2 },
    { href: "/dashboard", label: SHARED.nav.dashboard, icon: LayoutGrid },
    { href: "/vault", label: SHARED.nav.vault, icon: Lock },
    signedIn
      ? { href: "/billing", label: SHARED.nav.billing, icon: CreditCard }
      : { href: "/pricing", label: SHARED.nav.pricing, icon: Tag },
  ];
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);
  const signInHref = `/login?next=${encodeURIComponent(pathname || "/dashboard")}`;

  const account = signedIn ? (
    <ProfileMenu email={user?.email} />
  ) : (
    <Link
      href={signInHref}
      className="inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium text-foreground ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/10"
    >
      {SHARED.nav.signIn}
    </Link>
  );

  return (
    <TooltipProvider>
      {/* Wide screens: the navy sidebar. */}
      <aside
        aria-label={SHARED.nav.appNav}
        className="dark sticky top-0 hidden h-svh flex-col gap-1 border-r border-white/[0.06] bg-[hsl(var(--stage))] px-3 py-4 text-foreground lg:flex"
        data-no-print
      >
        <div className="px-2 pb-5 pt-1">
          <Logo href="/" />
        </div>
        <nav aria-label={SHARED.nav.primary} className="flex flex-col gap-0.5">
          {items.map((item) => {
            const Icon = item.icon;
            const on = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "flex h-10 items-center gap-2.5 rounded-lg px-3 text-sm font-medium transition-colors",
                  on
                    ? "bg-white/[0.09] text-foreground"
                    : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
                )}
              >
                <Icon aria-hidden className="size-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto flex items-center justify-between gap-2 rounded-xl bg-white/[0.05] p-2.5 ring-1 ring-inset ring-white/[0.08]">
          {account}
          <ThemeToggle />
        </div>
      </aside>

      {/* Phones and small tablets: a compact navy top bar. */}
      <header
        className="dark sticky top-0 z-[var(--z-sticky)] flex h-14 items-center gap-1 border-b border-white/[0.08] bg-[hsl(var(--stage)/0.95)] px-2 text-foreground backdrop-blur-md lg:hidden"
        data-no-print
      >
        <Link href="/" aria-label={SHARED.brand.name} className="shrink-0 px-2">
          <LogoMark size={26} />
        </Link>
        <nav
          aria-label={SHARED.nav.primary}
          className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none]"
        >
          {items.map((item) => {
            const on = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={on ? "page" : undefined}
                className={cn(
                  "inline-flex h-9 shrink-0 items-center rounded-lg px-2.5 text-sm font-medium",
                  on ? "bg-white/[0.1] text-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex shrink-0 items-center gap-1">
          <ThemeToggle />
          {account}
        </div>
      </header>
    </TooltipProvider>
  );
}
