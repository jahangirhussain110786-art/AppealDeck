"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SHARED } from "@/content/shared";

export function SignOutButton({ email }: { email?: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      router.push("/login");
      return;
    }
    setPending(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Sign out failed", { description: error.message });
      setPending(false);
      return;
    }
    toast.success("Signed out");
    router.refresh();
    router.push("/login");
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
