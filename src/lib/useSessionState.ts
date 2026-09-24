"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SessionState = "unknown" | "signed-out" | "signed-in";

/** No auth backend configured: nobody can be signed in. Read from build-time variables only, so it
 * gives the same answer on the server and in the browser. */
const authConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);

export function useSessionState(): SessionState {
  const [state, setState] = useState<SessionState>(authConfigured ? "unknown" : "signed-out");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) return;

    const check = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setState(session ? "signed-in" : "signed-out");
    };

    void check();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState(session ? "signed-in" : "signed-out");
    });

    return () => subscription.unsubscribe();
  }, []);

  return state;
}
