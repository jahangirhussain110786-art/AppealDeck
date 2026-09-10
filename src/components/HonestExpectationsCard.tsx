import { Check, Info, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHARED } from "@/content/shared";

export function HonestExpectationsCard({
  summary,
  weDo,
  weDoNot,
  whatToDo,
  severityNote,
  className,
}: {
  summary: string;
  weDo?: readonly string[];
  weDoNot?: readonly string[];
  whatToDo?: readonly string[];
  severityNote?: string;
  className?: string;
}) {
  const twoColumn = weDo !== undefined || weDoNot !== undefined;

  return (
    <section className={cn("rounded-lg border border-border/80 bg-surface-2 p-6", className)}>
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 size-5 shrink-0 text-info" />
        <p className="text-sm leading-relaxed text-foreground">{summary}</p>
      </div>

      {twoColumn ? (
        <div className="mt-5 grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-eyebrow uppercase text-muted-foreground">
              {SHARED.expectations.weDo}
            </p>
            <ul className="mt-3 space-y-2">
              {(weDo ?? []).map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-eyebrow uppercase text-muted-foreground">
              {SHARED.expectations.weDoNot}
            </p>
            <ul className="mt-3 space-y-2">
              {(weDoNot ?? []).map((item) => (
                <li key={item} className="flex gap-2.5 text-sm text-muted-foreground">
                  <Minus className="mt-0.5 size-4 shrink-0 text-muted-foreground/70" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : (
        whatToDo && (
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {whatToDo.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        )
      )}

      {severityNote && <p className="mt-4 text-xs text-muted-foreground">{severityNote}</p>}
    </section>
  );
}
