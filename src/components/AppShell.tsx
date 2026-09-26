"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { APP_BAR_IDS } from "@/components/AppBarSlot";
import { CaseListProvider } from "@/components/CaseListContext";
import { OfflineNotice } from "@/components/OfflineNotice";
import { ProfileMenu } from "@/components/ProfileMenu";
import { ThemeToggle } from "@/components/theme-toggle";
import { TooltipProvider } from "@/components/ui/tooltip";
import Link from "next/link";
import { SHARED } from "@/content/shared";

/** Sign-in pages lay out their own full-screen split (v5), with no app navigation around them. */
const BARE_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth"];

/**
 * The signed-in app (v5, 26 Sep 2026): the navy sidebar, then a slim bar across the top of the
 * page (where you are, what the page reports about itself, and the account), then the page.
 */
export function AppShell({
  user,
  children,
}: {
  user: { email?: string | null } | null;
  children: ReactNode;
}) {
  const pathname = usePathname() ?? "";
  if (BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`))) {
    return (
      <main id="main" className="min-h-svh">
        {children}
      </main>
    );
  }
  const signInHref = `/login?next=${encodeURIComponent(pathname || "/dashboard")}`;

  return (
    <CaseListProvider>
      {/* The gradient paints the sidebar's column navy the whole way down; the sidebar itself is
        only one screen tall, because it sticks. */}
      <div className="app-ground min-h-svh lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)] lg:bg-[linear-gradient(to_right,hsl(var(--stage-2))_15.5rem,hsl(var(--app-ground))_15.5rem)]">
        <AppSidebar user={user} signedIn={Boolean(user)} />
        <div className="min-w-0">
          <div
            className="sticky top-14 z-[var(--z-sticky)] flex h-[3.75rem] items-center justify-between gap-4 border-b border-border bg-[hsl(var(--app-ground)/0.85)] px-4 backdrop-blur-md sm:px-7 lg:top-0"
            data-no-print
          >
            <AppBreadcrumb titleSlotId={APP_BAR_IDS.title} />
            <div className="flex shrink-0 items-center gap-2.5">
              <div id={APP_BAR_IDS.actions} className="flex items-center gap-2.5" />
              <TooltipProvider>
                <ThemeToggle />
                {/* On a phone the account sits in the navy top bar above; here it is desktop only. */}
                <div className="hidden items-center gap-1 lg:flex">
                  {user ? (
                    <ProfileMenu email={user.email} />
                  ) : (
                    <Link
                      href={signInHref}
                      className="inline-flex h-9 items-center rounded-full bg-surface-1 px-3.5 text-sm font-medium text-foreground shadow-sm ring-1 ring-inset ring-border transition-colors hover:ring-input"
                    >
                      {SHARED.nav.signIn}
                    </Link>
                  )}
                </div>
              </TooltipProvider>
            </div>
          </div>
          <main id="main" className="w-full max-w-[82.5rem] px-4 py-6 sm:px-7 sm:py-7">
            <OfflineNotice className="mb-6" />
            {children}
          </main>
        </div>
      </div>
    </CaseListProvider>
  );
}
