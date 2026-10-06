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

/** A leading icon: a component element with no children of its own (a lucide icon). */
function isIcon(node: React.ReactNode): node is React.ReactElement {
  if (!React.isValidElement(node) || typeof node.type === "string") return false;
  const props = node.props as { children?: unknown };
  return props.children === undefined && node.type !== AlertTitle && node.type !== AlertDescription;
}

/**
 * An icon (optional) beside ONE column. Everything after the icon is stacked in that column, so a
 * title, several messages and a button row can be passed as separate children and still read top
 * to bottom, however narrow the screen. (Before 7 Oct 2026 each child became its own flex column.)
 */
function Alert({ className, variant = "info", children, ...props }: AlertProps) {
  const all = React.Children.toArray(children);
  const icon = all.length > 0 && isIcon(all[0]) ? all[0] : null;
  const body = icon ? all.slice(1) : all;
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
      {icon}
      {body.length > 0 && <div className="min-w-0 flex-1">{body}</div>}
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
