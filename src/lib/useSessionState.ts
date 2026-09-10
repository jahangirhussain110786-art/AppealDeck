"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export type SessionState = "unknown" | "signed-out" | "signed-in";

export function useSessionState(): SessionState {
  const [state, setState] = useState<SessionState>("unknown");

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      setState("signed-out");
      return;
    }

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
