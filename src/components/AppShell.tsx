"use client";

import { AppHeader } from "@/components/AppHeader";
import { AppBreadcrumb } from "@/components/AppBreadcrumb";
import { OfflineNotice } from "@/components/OfflineNotice";
import type { ReactNode } from "react";

export function AppShell({
  user,
  children,
}: {
  user: { email?: string | null } | null;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader mode="app" user={user} signedIn={Boolean(user)} />
      <main id="main" className="mx-auto w-full max-w-app flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <OfflineNotice className="mb-6" />
        <AppBreadcrumb />
        {children}
      </main>
    </div>
  );
}
