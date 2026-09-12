import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Wraps exactly one word (or short phrase) of a headline in the italic serif
 * accent face (Newsreader, --font-accent). Use sparingly — one per headline,
 * never for body text (AM-22/V1). A shared component keeps every use
 * consistent, avoiding the drift the mockup itself had to fix by hand.
 */
export type AccentWordProps = React.HTMLAttributes<HTMLSpanElement>;

function AccentWord({ className, ...props }: AccentWordProps) {
  return <span className={cn("font-accent italic font-medium", className)} {...props} />;
}
AccentWord.displayName = "AccentWord";

export { AccentWord };
