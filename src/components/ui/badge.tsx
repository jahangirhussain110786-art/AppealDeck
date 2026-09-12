import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border font-medium leading-5 transition-colors [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "border-primary/20 bg-primary/[0.07] text-primary",
        solid: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-transparent bg-muted text-muted-foreground",
        outline: "border-border bg-transparent text-foreground",
        info: "border-info/20 bg-info/10 text-info",
        success: "border-success/25 bg-success/10 text-success",
        warning: "border-warning/25 bg-warning/10 text-warning",
        destructive: "border-destructive/20 bg-destructive/10 text-destructive",
      },
      // Pixel-exact to the approved mockup's .pill (12.5px text, 5x12px padding)
      // and .pill-sm (11px text, 3x10px padding) — AM-22/V2.
      size: {
        default: "px-3 py-[5px] text-[0.78125rem]",
        sm: "px-2.5 py-[3px] text-[0.6875rem]",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size, className }))} {...props} />;
}
Badge.displayName = "Badge";

export { Badge, badgeVariants };
