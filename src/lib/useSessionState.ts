"use client";

import { useEffect, useState } from "react";

export type SessionState = "unknown" | "signed-out" | "signed-in";

/** No auth backend configured: nobody can be signed in. Read from build-time variables only, so it
 * gives the same answer on the server and in the browser. */
const authConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

/**
 * Whether this browser holds a Supabase auth cookie at all (`sb-<project>-auth-token`, possibly
 * chunked as `.0`, `.1`).
 *
 * The session lives in a cookie that script can read, so "no such cookie" is a certain answer: the
 * visitor is signed out. That answer needs none of the ~230 KB Supabase client, which used to be
 * downloaded and run on every public page — the FAQ, the guides, the legal pages — just to learn
 * that the reader was a stranger (measured 30 Sep 2026: ~60 KB gzipped of the shared baseline).
 * Only a browser that has the cookie loads the client to find out whether the session is still
 * good. If cookies cannot be read the answer is "maybe", which takes the same slower, exact path.
 */
function mayHaveSession(): boolean {
  try {
    return /(?:^|;\s*)sb-[^=;]*-auth-token(?:\.\d+)?=/.test(document.cookie);
  } catch {
    return true;
  }
}

export function useSessionState(): SessionState {
  const [state, setState] = useState<SessionState>(authConfigured ? "unknown" : "signed-out");

  useEffect(() => {
    if (!authConfigured) return;
    let cancelled = false;
    let unsubscribe = () => {};

    let subscribed = false;
    const resolve = async () => {
      if (subscribed) return;
      if (!mayHaveSession()) {
        setState("signed-out");
        return;
      }
      subscribed = true;
      const { createSupabaseBrowserClient } = await import("@/lib/supabase/client");
      if (cancelled) return;
      const supabase = createSupabaseBrowserClient();
      if (!supabase) return;

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      setState(session ? "signed-in" : "signed-out");

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_event, next) => {
        setState(next ? "signed-in" : "signed-out");
      });
      unsubscribe = () => subscription.unsubscribe();
      // The effect may have been cleaned up while we waited for the session.
      if (cancelled) unsubscribe();
    };

    void resolve();

    // A tab that found no auth cookie never subscribes to auth changes, so a sign-in completed in
    // another tab (a magic link, an email confirmation) would leave it showing "signed out" until a
    // reload. Looking again when the tab comes back to the front costs one cookie read.
    const recheck = () => {
      if (document.visibilityState === "visible") void resolve();
    };
    document.addEventListener("visibilitychange", recheck);
    window.addEventListener("focus", recheck);

    return () => {
      cancelled = true;
      unsubscribe();
      document.removeEventListener("visibilitychange", recheck);
      window.removeEventListener("focus", recheck);
    };
  }, []);

  return state;
}
