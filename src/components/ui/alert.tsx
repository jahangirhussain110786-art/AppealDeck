import * as React from "react";
import { cn } from "@/lib/utils";

const alertVariants = {
  base: "relative flex items-start gap-2.5 rounded-lg border px-4 py-3 text-sm",
  info: "border-info/30 bg-info/10 text-foreground",
  warning: "border-warning/30 bg-warning/10 text-foreground",
  destructive: "border-destructive/30 bg-destructive/10 text-foreground",
  success: "border-success/30 bg-success/10 text-foreground",
};

const alertTitles = {
  info: "text-foreground",
  warning: "text-foreground",
  destructive: "text-foreground",
  success: "text-foreground",
  base: "text-foreground",
};

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "warning" | "destructive" | "success";
}

function Alert({ className, variant = "info", children, ...props }: AlertProps) {
  const styles = alertVariants[variant] ?? alertVariants.base;
  const titleStyles = alertTitles[variant] ?? alertTitles.base;
  return (
    <div role="alert" className={cn(styles, className)} {...props}>
      {React.Children.map(children, (child) => {
        if (!React.isValidElement(child)) return child;
        return React.cloneElement(child, {
          className: cn(titleStyles, child.props.className),
        });
      })}
    </div>
  );
}
Alert.displayName = "Alert";

function AlertTitle({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("font-medium", className)} {...props} />;
}
AlertTitle.displayName = "AlertTitle";

function AlertDescription({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("mt-1 text-sm [&_p]:mb-1 [&_p]:leading-relaxed", className)} {...props} />
  );
}
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
