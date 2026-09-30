"use client";

import { useState } from "react";
import { toast } from "sonner";

/**
 * Shared sign-out logic, extracted from `SignOutButton` so the new profile-menu sign-out item
 * (AM-25, 12 Sep 2026) can trigger the exact same behavior without nesting a button inside a
 * dropdown-menu item. A full navigation, not a client-side router push: Next's client Router
 * Cache can otherwise keep serving an already-rendered (signed-in) copy of /dashboard, /vault,
 * etc. for up to its stale window after the cookie is gone.
 *
 * The Supabase client and the vault are imported when the seller presses Sign out, not at the top
 * of this file (30 Sep 2026). This hook sits in the header of every page, so importing them here put
 * both — about 100 KB gzipped, the vault database and the auth SDK — into the first load of pages
 * that have nothing to do with either. A sign-out is a click and can wait a moment.
 */
export function useSignOut() {
  const [pending, setPending] = useState(false);

  async function signOut() {
    setPending(true);
    try {
      const [{ createSupabaseBrowserClient }, { forgetGuestVault }] = await Promise.all([
        import("@/lib/supabase/client"),
        import("@/lib/vault/scoped"),
      ]);
      const supabase = createSupabaseBrowserClient();
      if (!supabase) {
        // A full page load on purpose, not router.push: the client Router Cache replayed a signed-in
        // page after sign-out (11 Sep 2026), and only a hard navigation drops it.
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.assign("/login");
        return;
      }
      const { error } = await supabase.auth.signOut();
      if (error) {
        toast.error("Sign out failed", { description: error.message });
        setPending(false);
        return;
      }
      forgetGuestVault();
      // See above: a hard navigation, so no cached signed-in page survives.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/login");
    } catch {
      // The pieces above could not even be loaded (offline, or a chunk that failed to arrive).
      toast.error("Sign out failed", { description: "Check your connection and try again." });
      setPending(false);
    }
  }

  return { signOut, pending };
}
