import { CircleAlert, CircleCheck } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AnnotationTag } from "@/lib/decodeAnnotations";

/**
 * A floating "what this means" card next to the decoded notice (AM-22/V5, per
 * Decode.dc.html) -- tagged clear/risky, always anchored to a real phrase found in the
 * seller's own pasted text (built by `buildNoticeAnnotations`, never invented here).
 */
export function AnnotationCard({
  tag,
  heading,
  body,
}: {
  tag: AnnotationTag;
  heading: string;
  body: string;
}) {
  const Icon = tag === "risky" ? CircleAlert : CircleCheck;
  return (
    <Card
      className={cn(
        "border-l-4 p-4",
        tag === "risky" ? "border-l-warning" : "border-l-success bg-success/5",
      )}
    >
      <div className="flex items-center gap-2">
        <Icon
          className={cn("size-4 shrink-0", tag === "risky" ? "text-warning" : "text-success")}
          aria-hidden
        />
        <span className="text-sm font-bold text-foreground">{heading}</span>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </Card>
  );
}
