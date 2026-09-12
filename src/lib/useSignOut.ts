"use client";

import { useState } from "react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Shared sign-out logic, extracted from `SignOutButton` so the new profile-menu sign-out item
 * (AM-25, 12 Sep 2026) can trigger the exact same behavior without nesting a button inside a
 * dropdown-menu item. A full navigation, not a client-side router push: Next's client Router
 * Cache can otherwise keep serving an already-rendered (signed-in) copy of /dashboard, /vault,
 * etc. for up to its stale window after the cookie is gone.
 */
export function useSignOut() {
  const [pending, setPending] = useState(false);

  async function signOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      window.location.assign("/login");
      return;
    }
    setPending(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Sign out failed", { description: error.message });
      setPending(false);
      return;
    }
    window.location.assign("/login");
  }

  return { signOut, pending };
}
