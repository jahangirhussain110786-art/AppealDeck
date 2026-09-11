"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  titleAs: TitleTag = "p",
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  /** Heading level when the empty state is the page's own heading (e.g. a signed-out gate). */
  titleAs?: "h1" | "h2" | "h3" | "p";
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="grid size-12 place-items-center rounded-lg bg-surface-2 text-muted-foreground">
          <Icon className="size-6" />
        </div>
      )}
      <TitleTag className="text-base font-semibold text-foreground">{title}</TitleTag>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
