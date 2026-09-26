"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { OfflineNotice } from "@/components/OfflineNotice";

/** Sign-in pages lay out their own full-screen split (v5), with no app navigation around them. */
const BARE_ROUTES = ["/login", "/signup", "/forgot-password", "/reset-password", "/auth"];

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

  return (
    <div className="min-h-svh bg-background lg:grid lg:grid-cols-[15.5rem_minmax(0,1fr)]">
      <AppSidebar user={user} signedIn={Boolean(user)} />
      <main id="main" className="mx-auto w-full max-w-app px-4 py-8 sm:px-8 sm:py-10">
        <OfflineNotice className="mb-6" />
        <AppBreadcrumb />
        {children}
      </main>
    </div>
  );
}
