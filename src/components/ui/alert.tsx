import * as React from "react";
import { cn } from "@/lib/utils";

const variants = {
  info: "border-info/25 bg-info/[0.07] [&>svg]:text-info",
  warning: "border-warning/30 bg-warning/[0.08] [&>svg]:text-warning",
  destructive: "border-destructive/30 bg-destructive/[0.07] [&>svg]:text-destructive",
  success: "border-success/30 bg-success/[0.08] [&>svg]:text-success",
} as const;

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "warning" | "destructive" | "success";
}

function Alert({ className, variant = "info", children, ...props }: AlertProps) {
  return (
    <div
      role={variant === "destructive" ? "alert" : "status"}
      className={cn(
        "relative flex items-start gap-3 rounded-lg border px-4 py-3 text-sm text-foreground [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0",
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
Alert.displayName = "Alert";

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("font-medium leading-snug text-foreground", className)} {...props} />;
}
AlertTitle.displayName = "AlertTitle";

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("mt-1 text-sm text-muted-foreground [&_p]:leading-relaxed", className)}
      {...props}
    />
  );
}
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
