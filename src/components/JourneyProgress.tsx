"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP } from "@/content/app";

/**
 * The four macro stages of the whole product journey — decode, build the case, draft the POA,
 * submit yourself in Seller Central. Shown consistently on /decode, /case, and /compose so the
 * seller experiences one continuous flow instead of three disconnected tools (founder feedback,
 * 12 Sep 2026). This is deliberately a thin, single-line strip, distinct from the granular
 * per-question `Stepper` already used inside the interview — that one tracks sub-steps within
 * "Build your case"; this one tracks the whole journey across pages.
 */
export type JourneyStage = "decode" | "build" | "draft" | "submit";

const STAGE_ORDER: readonly JourneyStage[] = ["decode", "build", "draft", "submit"];

export interface JourneyProgressProps {
  stage: JourneyStage;
  className?: string;
}

export function JourneyProgress({ stage, className }: JourneyProgressProps) {
  const currentIndex = STAGE_ORDER.indexOf(stage);
  const labels = APP.interview.journey;

  return (
    <ol
      aria-label="Your progress through AppealDeck"
      className={cn("flex items-center", className)}
    >
      {STAGE_ORDER.map((s, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const label = labels[s];
        return (
          <li key={s} className="flex flex-1 items-center last:flex-none">
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors duration-200",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-background text-primary",
                  !isDone && !isCurrent && "border-border bg-background text-muted-foreground",
                )}
                aria-current={isCurrent ? "step" : undefined}
              >
                {isDone ? <Check className="size-3.5" aria-hidden /> : i + 1}
              </span>
              <span
                className={cn(
                  "hidden text-xs font-medium sm:inline",
                  isCurrent && "text-foreground",
                  isDone && "text-muted-foreground",
                  !isDone && !isCurrent && "text-muted-foreground",
                )}
              >
                {label}
              </span>
            </div>
            {i < STAGE_ORDER.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "mx-2 h-px flex-1 bg-border transition-colors duration-200",
                  isDone && "bg-primary",
                )}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
