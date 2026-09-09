"use client";

import { POLICY_CHECKED_ON } from "@/core/guidance";
import { CircleCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/format";

export interface VerifiedStampProps {
  checkedOn?: string;
  className?: string;
}

export function VerifiedStamp({ checkedOn = POLICY_CHECKED_ON, className }: VerifiedStampProps) {
  const label = checkedOn ? `Policy checked · ${formatDate(checkedOn)}` : "Policy check pending";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-xs font-medium text-success-foreground",
              className,
            )}
          >
            <CircleCheck className="h-3 w-3 text-success" aria-hidden />
            {label}
          </span>
        </TooltipTrigger>
        <TooltipContent className="max-w-xs text-left text-xs">
          <p className="font-medium">Quarterly policy re-check (EF-5)</p>
          <p className="mt-1 text-muted-foreground">
            {checkedOn
              ? "Window, funds timing, channels, invoice freshness, and Section 19 status were last reviewed on this date."
              : "The next re-check has not been recorded yet."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
