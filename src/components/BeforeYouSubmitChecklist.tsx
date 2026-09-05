"use client";

import { CheckCircle2, Circle, Shield, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { generateActionItems, noveltyRequired, READINESS_COPY } from "@/core";
import type { CaseFileData } from "@/core/readiness";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  detail?: string;
}

interface BeforeYouSubmitChecklistProps {
  caseFile: CaseFileData;
  attemptCount: number;
  draftText: string;
  allChecked: boolean;
}

export function BeforeYouSubmitChecklist({
  caseFile,
  attemptCount,
  draftText,
  allChecked,
}: BeforeYouSubmitChecklistProps) {
  const actionItems = generateActionItems(caseFile.kind);
  const missing = caseFile.evidenceSlots;
  const requiredKinds = actionItems.map((a) => a.evidenceSlots).flat();

  const evidenceComplete = requiredKinds.every(
    (k) => missing[k] && missing[k].present && !missing[k].disqualified,
  );

  const items: ChecklistItem[] = [
    {
      id: "evidence",
      label: "Required evidence attached",
      checked: evidenceComplete,
      detail: evidenceComplete
        ? `${requiredKinds.length} required evidence items present`
        : `${requiredKinds.filter((k) => !(missing[k]?.present && !missing[k]?.disqualified)).length} still missing`,
    },
    {
      id: "no_template_phrases",
      label: "No template phrases left in the draft",
      checked: !hasTemplatePhrases(draftText),
      detail: hasTemplatePhrases(draftText)
        ? "Found bracketed placeholders like '[Describe...]' — replace with real facts"
        : "No placeholders detected",
    },
    {
      id: "novelty",
      label: `Novelty on attempt ${attemptCount + 1}`,
      checked: !noveltyRequired(attemptCount),
      detail: noveltyRequired(attemptCount)
        ? "This is at least your second attempt — Amazon requires new information or changed framing"
        : "First submission — novelty not yet required",
    },
    {
      id: "submit_yourself",
      label: "You submit this yourself in Seller Central",
      checked: true,
      detail: "AppealDeck never submits to Amazon",
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-primary" />
          Before you submit
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{READINESS_COPY}</p>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-3">
              {item.checked ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <div className="flex-1">
                <span
                  className={cn(
                    "text-sm font-medium",
                    item.checked ? "text-foreground" : "text-muted-foreground",
                  )}
                >
                  {item.label}
                </span>
                {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
              </div>
            </div>
          ))}
        </div>
        {allChecked && (
          <Button asChild variant="outline" size="sm" className="mt-3 gap-2">
            <a
              href="https://sellercentral.amazon.com/gp/account/performancenotifications"
              target="_blank"
              rel="noopener noreferrer"
            >
              Open Seller Central
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

function hasTemplatePhrases(text: string): boolean {
  return /\[.*describe.*\]|\[.*no .* recorded\]|\[.*no specific/i.test(text);
}
