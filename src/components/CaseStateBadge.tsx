"use client";

import type { ViolationKind } from "@/core";
import { Badge } from "@/components/ui/badge";

const CASE_STATE_LABEL: Record<ViolationKind, string> = {
  INAUTHENTIC_DOCUMENTS: "Falsified docs alleged",
  INAUTHENTIC: "Inauthentic items",
  RELATED_ACCOUNT: "Related account",
  POLICY: "Policy violation",
  INTELLECTUAL_PROPERTY: "IP complaint",
  LISTING: "Listing issue",
  FUNDS: "Funds review",
  VERIFICATION: "Verification",
  PERFORMANCE_METRIC: "Performance metric",
  PRODUCT_SAFETY: "Product safety",
  RESTRICTED_PRODUCT: "Restricted product",
  UNKNOWN: "Unclassified",
};

const CASE_STATE_VARIANT: Record<
  ViolationKind,
  "default" | "secondary" | "outline" | "info" | "destructive" | "success" | "warning"
> = {
  INAUTHENTIC_DOCUMENTS: "destructive",
  // The ordinary complaint is serious but workable, so it does not borrow the colour reserved for
  // the allegation this product declines to answer.
  INAUTHENTIC: "warning",
  RELATED_ACCOUNT: "warning",
  POLICY: "default",
  INTELLECTUAL_PROPERTY: "default",
  LISTING: "info",
  FUNDS: "info",
  // Safety carries a real deadline and a real obligation, so it reads as urgent rather than
  // informational. Verification and metrics are recoverable situations and are not dressed up as
  // emergencies — the panic-hour rule in AM-18 cuts both ways.
  VERIFICATION: "warning",
  PERFORMANCE_METRIC: "warning",
  PRODUCT_SAFETY: "destructive",
  RESTRICTED_PRODUCT: "warning",
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
