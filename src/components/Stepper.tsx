"use client";

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
  const doneCount = steps.filter((s) => s.state === "done").length;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-2 text-xs text-muted-foreground md:flex-col md:items-stretch md:gap-0",
        className,
      )}
      aria-label="Interview progress"
    >
      <div className="hidden flex-col gap-2 md:flex">
        {steps.map((s, i) => {
          const isActive = activeIndex === i;
          const isPast = i < activeIndex;
          const isSkipped = s.state === "skipped";
          return (
            <div key={s.id} className="flex items-start gap-2">
              <div
                className={cn(
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium",
                  isPast &&
                    s.state === "done" &&
                    "border-primary bg-primary text-primary-foreground",
                  isActive && "border-primary bg-background text-primary",
                  !isPast && !isActive && "border-border bg-background text-muted-foreground",
                  isSkipped && "border-muted bg-background text-muted-foreground",
                )}
                data-step-state={s.state}
              >
                {s.state === "done" ? "✓" : s.state === "skipped" ? "—" : i + 1}
              </div>
              <div className="flex flex-col">
                <span
                  className={cn(
                    "font-medium",
                    isActive && "text-primary",
                    s.state === "done" && "text-foreground",
                  )}
                >
                  {s.label}
                </span>
                {isSkipped && s.skippedReason && (
                  <span className="text-xs text-muted-foreground">{s.skippedReason}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {progress && (
        <div
          className="inline-flex items-center gap-1 rounded-full bg-muted/40 px-2.5 py-1 font-mono text-xs tabular-nums md:hidden"
          aria-label={`Step ${progress.current} of ${progress.total}`}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
          <span>
            {progress.current}/{progress.total}
          </span>
        </div>
      )}
    </div>
  );
}
