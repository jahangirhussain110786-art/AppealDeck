import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function requireUser() {
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
  if (!user) redirect("/login");
  return user;
}
