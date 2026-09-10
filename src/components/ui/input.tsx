import * as React from "react";
import { cn } from "@/lib/utils";

export const fieldClassName =
  "flex w-full rounded-md border border-input bg-surface-1 text-sm text-foreground shadow-inset transition-[border-color,box-shadow] duration-[var(--dur-fast)] placeholder:text-muted-foreground/80 hover:border-foreground/25 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/25 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/20";

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(fieldClassName, "h-10 px-3 py-2", className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export { Input };
