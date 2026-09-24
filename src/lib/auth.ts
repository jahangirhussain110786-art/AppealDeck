import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safeNext";
import { APP_URL } from "@/lib/urls";

export interface AppUser {
  id: string;
  email?: string | null;
}

export async function getOptionalUser(): Promise<AppUser | null> {
  try {
    const supabase = await createSupabaseServerClient();
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
    const supabase = await createSupabaseServerClient();
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
    const supabase = await createSupabaseServerClient();
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
    // APP_URL, not the raw NEXT_PUBLIC_APP_URL: the deployment guide says to leave that unset on a
    // single host, and an empty origin made `safeNext` reject every path and send the seller to
    // /dashboard after sign-in instead of the page they asked for (found 24 Sep 2026, by CI).
    const origin = APP_URL;
    redirect(next ? `/login?next=${encodeURIComponent(safeNext(next, origin))}` : "/login");
  }
  return user;
}
