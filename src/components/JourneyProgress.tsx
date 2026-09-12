"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP } from "@/content/app";
import type { ViolationKind } from "@/core";

/**
 * The four macro stages of the whole product journey — decode, build the case, draft the POA,
 * submit yourself in Seller Central. Shown consistently on /decode, /case, and /compose so the
 * seller experiences one continuous flow instead of three disconnected tools (founder feedback,
 * 12 Sep 2026). This is deliberately a thin, single-line strip, distinct from the granular
 * per-question `Stepper` already used inside the interview — that one tracks sub-steps within
 * "Build your case"; this one tracks the whole journey across pages.
 *
 * Every stage is a real link, including ones ahead of where the seller currently is (founder
 * direction, 12 Sep 2026: nothing here should be locked) — each destination page already handles
 * being reached out of order on its own (an empty case redirects to starting one, an empty
 * compose page shows its own empty state), so there is nothing unsafe about letting the seller
 * jump anywhere in the journey directly from this strip.
 */
export type JourneyStage = "decode" | "build" | "draft" | "submit";

const STAGE_ORDER: readonly JourneyStage[] = ["decode", "build", "draft", "submit"];

function hrefFor(stage: JourneyStage, kind: ViolationKind | undefined): string {
  switch (stage) {
    case "decode":
      return "/decode";
    case "build":
      return kind ? `/case?kind=${kind}` : "/case";
    case "draft":
    case "submit":
      // "Submit" has no page of its own — submitting happens in Seller Central, outside the
      // app — so it points at Compose, where that step (and the "Open Seller Central" link)
      // actually lives.
      return "/compose";
  }
}

export interface JourneyProgressProps {
  stage: JourneyStage;
  /** Known violation kind, if any, carried into the "Build your case" link so it resumes the
   * right case type instead of showing the kind picker again. */
  kind?: ViolationKind;
  className?: string;
}

export function JourneyProgress({ stage, kind, className }: JourneyProgressProps) {
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
            <Link
              href={hrefFor(s, kind)}
              className={cn(
                "-m-1 flex items-center gap-2 rounded-md p-1 transition-colors duration-200",
                "hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors duration-200",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-background text-primary",
                  !isDone && !isCurrent && "border-border bg-background text-muted-foreground",
                )}
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
            </Link>
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
