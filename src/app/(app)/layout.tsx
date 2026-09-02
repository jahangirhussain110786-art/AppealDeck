import type { ReactNode } from "react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  let user: { email?: string | null } | null = null;
  try {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      user = data.user;
    }
  } catch {
    user = null;
  }

  if (!user) return <>{children}</>;
  return <AppShell user={user}>{children}</AppShell>;
}
