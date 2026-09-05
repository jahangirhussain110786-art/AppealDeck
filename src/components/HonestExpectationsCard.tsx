import type { ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";

export function HonestExpectationsCard({
  summary,
  whatToDo,
  severityNote,
  className,
}: {
  summary: string;
  whatToDo: readonly string[];
  severityNote?: string;
  className?: string;
}) {
  return (
    <div className={cn("rounded-lg border border-border bg-surface-2 p-5", className)}>
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-5 w-5 text-info shrink-0" />
        <div className="space-y-2">
          <p className="text-sm text-foreground">{summary}</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {whatToDo.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
          {severityNote && <p className="text-xs text-muted-foreground/80">{severityNote}</p>}
        </div>
      </div>
    </div>
  );
}
