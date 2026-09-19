"use client";

import { ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { SITE_URL } from "@/lib/urls";

export function LocalFirstBadge({
  className,
  processing = "browser",
}: {
  className?: string;
  processing?: "browser" | "server";
}) {
  const host = new URL(SITE_URL).hostname;
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
            {processing === "server"
              ? "Analyzed by AppealDeck. Nothing sent to Amazon"
              : "Decoded in your browser. Nothing sent"}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">
          {processing === "server"
            ? "Your notice is sent to AppealDeck’s decode endpoint for analysis. This does not send a response or sign in to Seller Central."
            : `How to verify: open DevTools to the Network tab while decoding. You should see zero requests to ${host}.`}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
