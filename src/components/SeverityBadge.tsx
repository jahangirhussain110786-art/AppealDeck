"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const SEVERITY_LABEL: Record<string, string> = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const SEVERITY_VARIANT: Record<
  "high" | "medium" | "low",
  "default" | "secondary" | "outline" | "info" | "destructive" | "success" | "warning"
> = {
  high: "destructive",
  medium: "warning",
  low: "secondary",
};

export type SeverityBadgeProps = React.ComponentProps<typeof Badge> & {
  severity: "high" | "medium" | "low";
};

export function SeverityBadge({ severity, className, ...props }: SeverityBadgeProps) {
  return (
    <Badge variant={SEVERITY_VARIANT[severity]} className={cn("font-medium", className)} {...props}>
      {SEVERITY_LABEL[severity]}
    </Badge>
  );
}
