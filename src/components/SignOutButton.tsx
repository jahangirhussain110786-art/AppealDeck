"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SHARED } from "@/content/shared";
import { useSignOut } from "@/lib/useSignOut";

export function SignOutButton({ email }: { email?: string }) {
  const { signOut, pending } = useSignOut();

  return (
    <div className="flex items-center gap-2">
      {email && <span className="hidden text-xs text-muted-foreground lg:inline">{email}</span>}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => void signOut()}
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
