"use client";

import type { ViolationKind } from "@/core";
import { Badge } from "@/components/ui/badge";

const CASE_STATE_LABEL: Record<ViolationKind, string> = {
  INAUTHENTIC_DOCUMENTS: "Inauthentic docs",
  RELATED_ACCOUNT: "Related account",
  POLICY: "Policy violation",
  INTELLECTUAL_PROPERTY: "IP complaint",
  LISTING: "Listing issue",
  FUNDS: "Funds review",
  UNKNOWN: "Unclassified",
};

const CASE_STATE_VARIANT: Record<
  ViolationKind,
  "default" | "secondary" | "outline" | "info" | "destructive" | "success" | "warning"
> = {
  INAUTHENTIC_DOCUMENTS: "destructive",
  RELATED_ACCOUNT: "warning",
  POLICY: "default",
  INTELLECTUAL_PROPERTY: "default",
  LISTING: "info",
  FUNDS: "info",
  UNKNOWN: "secondary",
};

export type CaseStateBadgeProps = React.ComponentProps<typeof Badge> & {
  kind: ViolationKind;
};

export function CaseStateBadge({ kind, className, ...props }: CaseStateBadgeProps) {
  return (
    <Badge variant={CASE_STATE_VARIANT[kind]} className={className} {...props}>
      {CASE_STATE_LABEL[kind]}
    </Badge>
  );
}
