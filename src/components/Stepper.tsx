"use client";

import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InterviewProgress } from "@/core/interviewEngine";

export interface StepperStep {
  id: string;
  label: string;
  state: "todo" | "current" | "done" | "skipped";
  skippedReason?: string;
}

export interface StepperProps {
  steps: StepperStep[];
  currentId?: string;
  progress?: InterviewProgress;
  className?: string;
}

export function Stepper({ steps, currentId, progress, className }: StepperProps) {
  const activeIndex = currentId ? steps.findIndex((s) => s.id === currentId) : -1;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 text-xs text-muted-foreground md:flex-col md:items-stretch md:gap-0",
        className,
      )}
      aria-label="Interview progress"
    >
      <ol className="hidden flex-col gap-2 md:flex">
        {steps.map((s, i) => {
          const isActive = i === activeIndex;
          const isDone = s.state === "done";
          const isSkipped = s.state === "skipped";
          return (
            <li
              key={s.id}
              className={cn(
                "flex items-start gap-2",
                i !== 0 &&
                  "relative before:absolute before:-top-2 before:left-[11px] before:h-2 before:w-px before:bg-border",
              )}
            >
              <div
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  isDone && "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary bg-background text-primary",
                  !isDone &&
                    !isActive &&
                    !isSkipped &&
                    "border-border bg-background text-muted-foreground",
                  isSkipped && "border-muted bg-background text-muted-foreground",
                )}
                data-step-state={s.state}
              >
                {isDone ? (
                  <Check className="size-3.5" />
                ) : isSkipped ? (
                  <Minus className="size-3.5" />
                ) : (
                  i + 1
                )}
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "font-medium",
                    isActive && "text-primary",
                    isDone && "text-foreground",
                    !isActive && !isDone && "text-muted-foreground",
                  )}
                >
                  {s.label}
                </span>
                {isSkipped && s.skippedReason && (
                  <span className="text-xs text-muted-foreground">{s.skippedReason}</span>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {progress && (
        <div
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface-1 px-3 py-1.5 text-xs font-medium tabular-nums md:hidden"
          aria-label={`Step ${progress.current} of ${progress.total}`}
        >
          <span className="inline-block size-1.5 rounded-full bg-primary" aria-hidden />
          <span>
            Step {progress.current}/{progress.total} · {steps[activeIndex]?.label ?? ""}
          </span>
        </div>
      )}
    </div>
  );
}
