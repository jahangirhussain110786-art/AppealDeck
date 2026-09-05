"use client";

import { Badge } from "@/components/ui/badge";
import type { ReplyCategory } from "@/core/caseState";

const REPLY_CATEGORY_LABEL: Record<ReplyCategory, string> = {
  needs_more_information: "Needs more information",
  document_request: "Document request",
  identity_verification: "Identity verification",
  final_decision_negative: "Final decision — negative",
  reinstated: "Reinstated",
  funds_decision: "Funds decision",
  unrecognized: "Unrecognized",
};

const REPLY_CATEGORY_VARIANT: Record<
  ReplyCategory,
  "default" | "secondary" | "outline" | "info" | "destructive" | "success" | "warning"
> = {
  needs_more_information: "info",
  document_request: "warning",
  identity_verification: "info",
  final_decision_negative: "destructive",
  reinstated: "success",
  funds_decision: "info",
  unrecognized: "secondary",
};

export function ReplyCategoryLabel({ category }: { category: ReplyCategory }) {
  return (
    <Badge variant={REPLY_CATEGORY_VARIANT[category]} className="text-xs">
      {REPLY_CATEGORY_LABEL[category]}
    </Badge>
  );
}
