import * as React from "react";
import { cn } from "@/lib/utils";

function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        "inline-flex h-5 select-none items-center gap-1 rounded-sm border border-border bg-muted px-1.5 font-mono text-xs font-medium text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}
Kbd.displayName = "Kbd";

export { Kbd };
