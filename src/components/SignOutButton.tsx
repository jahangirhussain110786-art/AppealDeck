"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SHARED } from "@/content/shared";

export function SignOutButton({ email }: { email?: string }) {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
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
    // A full navigation, not a client-side router push: Next's client Router
    // Cache can otherwise keep serving an already-rendered (signed-in) copy of
    // /dashboard, /case, /vault etc. for up to its stale window after the
    // cookie is gone, which read back as "auto signed in as the previous
    // account." A hard navigation discards that cache entirely.
    window.location.assign("/login");
  }

  return (
    <div className="flex items-center gap-2">
      {email && <span className="hidden text-xs text-muted-foreground lg:inline">{email}</span>}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={handleSignOut}
            disabled={pending}
            aria-label={SHARED.nav.signOut}
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>{SHARED.nav.signOut}</TooltipContent>
      </Tooltip>
    </div>
  );
}
