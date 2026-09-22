"use client";

import { ShieldCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/**
 * AM-26 (22 Sep 2026): this badge previously had a `processing="browser"` variant reading
 * "Decoded in your browser. Nothing sent", whose tooltip invited the reader to verify it in
 * DevTools by observing "zero requests" to our host. That check would have FAILED — decoding has
 * always been a server round-trip (`/api/decode`). The variant was only ever rendered in the dev
 * gallery, so no visitor was shown it, but it was a false claim one prop away from a real page and
 * is removed rather than left as a trap. The remaining text is accurate today and stays accurate
 * after AA-41 adds document reading, because it is a claim about Amazon, not about our server.
 *
 * The file name is kept for import stability; "local-first" now means evidence files stay in the
 * browser vault, not that processing is local. See AM-26 in the amendments file.
 */
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
            Analyzed by AppealDeck. Nothing sent to Amazon
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-xs">
          Your notice is sent to AppealDeck’s decode endpoint for analysis. This does not send a
          response or sign in to Seller Central.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
