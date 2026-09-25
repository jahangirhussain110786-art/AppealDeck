import type { Metadata } from "next";
import type { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

// Sign-in pages and a seller's own case, vault and billing are not search results. Until 25 Sep
// 2026 they inherited the root layout's `index: true`, and most also inherited the home page's
// title, so a crawler saw a set of near-empty copies of the home page.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
};

export default async function AppLayout({ children }: { children: ReactNode }) {
  let user: { id: string; email?: string | null } | null = null;
  try {
    const supabase = await createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
  } catch {
    user = null;
  }

  return <AppShell user={user}>{children}</AppShell>;
}
