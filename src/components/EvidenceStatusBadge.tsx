"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const EVIDENCE_STATUS_LABEL: Record<string, string> = {
  present: "Present",
  missing: "Missing",
  pending: "Pending",
};

const EVIDENCE_STATUS_VARIANT: Record<
  "present" | "missing" | "pending",
  "default" | "secondary" | "outline" | "info" | "destructive" | "success" | "warning"
> = {
  present: "success",
  missing: "warning",
  pending: "secondary",
};

export type EvidenceStatusBadgeProps = React.ComponentProps<typeof Badge> & {
  status: "present" | "missing" | "pending";
};

export function EvidenceStatusBadge({ status, className, ...props }: EvidenceStatusBadgeProps) {
  return (
    <Badge
      variant={EVIDENCE_STATUS_VARIANT[status]}
      className={cn("font-medium", className)}
      {...props}
    >
      {EVIDENCE_STATUS_LABEL[status]}
    </Badge>
  );
}
