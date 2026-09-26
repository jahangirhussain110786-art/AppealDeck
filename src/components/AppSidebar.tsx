"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCaseList } from "@/components/CaseListContext";
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
        className="dark sticky top-0 hidden h-svh flex-col gap-1 self-start border-r border-white/[0.06] bg-[hsl(var(--stage-2))] px-3 py-4 text-foreground lg:flex"
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
        <SidebarCases />
        <SidebarStatus signedIn={signedIn} email={user?.email} signInHref={signInHref} />
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

/**
 * The cases on this device (v5), each with the one fact that matters at a glance: days to a stated
 * date, or that it is waiting. Shown only once a page that reads the vault has published them.
 */
function SidebarCases() {
  const { cases, open } = useCaseList();
  const [opening, setOpening] = useState<string | null>(null);
  const pathname = usePathname();
  const router = useRouter();
  const shown = cases?.filter((c) => !c.archived) ?? [];
  if (shown.length === 0) return null;
  return (
    <div className="mt-4">
      <p className="px-2.5 pb-1.5 text-[0.71875rem] font-semibold text-muted-foreground">
        {SHARED.nav.cases}
      </p>
      <ul className="flex flex-col gap-0.5">
        {shown.map((c) => {
          const tail =
            c.status === "waiting"
              ? SHARED.nav.caseWaiting
              : c.due?.days !== undefined
                ? c.due.days <= 0
                  ? SHARED.nav.caseToday
                  : `${c.due.days}d`
                : "";
          const inner = (
            <>
              <span
                aria-hidden
                className={cn("size-2 rounded-full", c.status === "act" ? "bg-primary" : "bg-info")}
              />
              <span className="truncate">{c.title.split(" · ")[0]}</span>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  c.status === "act" && tail ? "text-primary" : "text-muted-foreground",
                )}
              >
                {opening === c.id ? "…" : tail}
              </span>
            </>
          );
          const cls = cn(
            "grid min-h-10 w-full grid-cols-[0.5rem_minmax(0,1fr)_auto] items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-[0.84375rem] transition-colors",
            c.current
              ? "bg-white/[0.09] text-foreground"
              : "text-muted-foreground hover:bg-white/[0.05] hover:text-foreground",
          );
          return (
            <li key={c.id}>
              {open ? (
                <button
                  type="button"
                  className={cls}
                  aria-current={c.current ? "true" : undefined}
                  disabled={opening !== null}
                  onClick={async () => {
                    setOpening(c.id);
                    try {
                      await open(c.id);
                      // The case page reads the active case when it mounts, so an open case page
                      // is reloaded to pick up the new choice; from anywhere else it is opened.
                      if (pathname === "/case") window.location.reload();
                      else router.push("/case");
                      setOpening(null);
                    } catch {
                      setOpening(null);
                    }
                  }}
                >
                  {inner}
                </button>
              ) : (
                <Link href="/dashboard" className={cls}>
                  {inner}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/**
 * The sidebar's foot card (v5): who this session belongs to. It states only what the page knows
 * for certain. An Appeal Pass belongs to one case, so whether one is active is said on that case
 * and on Billing, never here as if it covered the account.
 */
function SidebarStatus({
  signedIn,
  email,
  signInHref,
}: {
  signedIn: boolean;
  email?: string | null;
  signInHref: string;
}) {
  return (
    <div className="mt-auto rounded-[14px] bg-white/[0.05] p-3.5 text-[0.8125rem] text-muted-foreground ring-1 ring-inset ring-white/[0.08]">
      <p className="flex items-center gap-2 font-semibold text-foreground">
        <span
          aria-hidden
          className={cn("size-[7px] rounded-full", signedIn ? "bg-success" : "bg-primary")}
        />
        {signedIn ? SHARED.nav.statusSignedIn : SHARED.nav.statusGuest}
      </p>
      {signedIn ? (
        email && <p className="mt-1 truncate">{email}</p>
      ) : (
        <p className="mt-1">
          {SHARED.nav.statusGuestBody}{" "}
          <Link
            href={signInHref}
            className="font-medium text-foreground underline underline-offset-4"
          >
            {SHARED.nav.signIn}
          </Link>
        </p>
      )}
    </div>
  );
}
