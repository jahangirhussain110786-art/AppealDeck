import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AppUser {
  id: string;
  email?: string | null;
}

export async function getApiUser(): Promise<AppUser | null> {
  try {
    const supabase = createSupabaseServerClient();
    if (!supabase) return null;
    const { data } = await supabase.auth.getUser();
    const u = data.user;
    if (u && u.id) {
      return { id: u.id, email: u.email ?? null };
    }
  } catch {
    // fall through
  }
  return null;
}

export function unauthorizedJsonResponse() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function requireUser(): Promise<AppUser> {
  let user: AppUser | null = null;
  try {
    const supabase = createSupabaseServerClient();
    if (supabase) {
      const { data } = await supabase.auth.getUser();
      const u = data.user;
      if (u && u.id) {
        user = { id: u.id, email: u.email ?? null };
      }
    }
  } catch {
    user = null;
  }
  if (!user) redirect("/login");
  return user;
}
