import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safeNext";

export interface AppUser {
  id: string;
  email?: string | null;
}

export async function getOptionalUser(): Promise<AppUser | null> {
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

export async function requireUser(next?: string): Promise<AppUser> {
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
  if (!user) {
    const origin = process.env.NEXT_PUBLIC_APP_URL ?? "";
    redirect(next ? `/login?next=${encodeURIComponent(safeNext(next, origin))}` : "/login");
  }
  return user;
}
