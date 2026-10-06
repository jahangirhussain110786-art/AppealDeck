import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-[background-color,border-color,color,box-shadow,transform] duration-[var(--dur-fast)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.985]",
  {
    variants: {
      variant: {
        // Disabled turns neutral: at half opacity the orange read as broken, not as "not yet".
        default:
          "btn-action disabled:bg-muted disabled:bg-none disabled:text-muted-foreground disabled:opacity-100 disabled:shadow-none",
        secondary: "bg-surface-2 text-foreground hover:bg-muted",
        outline:
          "border border-border bg-surface-1 font-medium text-foreground shadow-card hover:border-foreground/30 hover:bg-surface-1",
        ghost: "text-foreground hover:bg-muted",
        link: "h-auto px-0 text-link underline-offset-4 hover:underline max-sm:min-h-11 [@media(pointer:coarse)]:min-h-11",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      },
      size: {
        default: "h-11 px-5",
        // Touch: a phone-width screen or a coarse pointer gets a 44px floor; a mouse keeps 36px.
        sm: "h-9 px-3.5 max-sm:min-h-11 [@media(pointer:coarse)]:min-h-11",
        lg: "h-[3.25rem] px-7 text-base",
        icon: "h-10 w-10 max-sm:size-11 [@media(pointer:coarse)]:size-11",
        "icon-sm": "h-9 w-9 max-sm:size-11 [@media(pointer:coarse)]:size-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
