"use client";

import { ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export function LocalFirstBadge({ className }: { className?: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/60 px-2.5 py-1 text-xs font-medium text-foreground",
              className,
            )}
          >
            <ShieldCheck className="h-3.5 w-3.5 text-success" aria-hidden />
            Decoded in your browser. Nothing sent
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">
          How to verify: open DevTools to the Network tab while decoding. You should see zero
          requests to appealdeck.com.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
