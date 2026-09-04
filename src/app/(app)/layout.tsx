import type { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";
import { AppHeader } from "@/components/AppHeader";

export default async function AppLayout({ children }: { children: ReactNode }) {
  let user: { id: string; email?: string | null } | null = null;
  try {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
  } catch {
    user = null;
  }

  if (!user) {
    return (
      <>
        <AppHeader mode="marketing" />
        {children}
      </>
    );
  }

  return <AppShell user={user}>{children}</AppShell>;
}
