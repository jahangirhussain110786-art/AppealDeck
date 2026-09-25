"use client";

import { CheckCircle2, Circle, Shield, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  computeReadiness,
  requiredKinds,
  noveltyRequired,
  expectationsCopy,
  READINESS_COPY,
} from "@/core";
import type { CaseFileData, EvidenceKind } from "@/core";
import {
  assessNovelty,
  shouldWarnBeforeSubmit,
  type PriorSubmission,
} from "@/core/submissionNovelty";
import { APP } from "@/content/app";

interface ChecklistItem {
  id: string;
  label: string;
  checked: boolean;
  detail?: string;
}

interface BeforeYouSubmitChecklistProps {
  caseFile: CaseFileData;
  /** Number of submissions already made (0 for a first submission). */
  attemptCount: number;
  /** The full draft with the seller's edits applied. */
  draftText: string;
  /** Whether the critic passed the draft. */
  allChecked: boolean;
  /**
   * AA-42: everything already sent on this case. When supplied, the novelty row stops being a
   * reminder keyed on the attempt number and becomes a real comparison of the words. Optional so
   * existing call sites that have no submission history keep working unchanged.
   */
  priorSubmissions?: readonly PriorSubmission[];
  /**
   * 25 Sep 2026: the workspace's own records list. Without it this row counted the retired case
   * model's evidence, so a workspace case read "1 still missing · Missing: Metric export" beside a
   * page listing two records by other names. When given, the row reports exactly that list.
   */
  requirements?: ReadonlyArray<{ label: string; status: string }>;
}

function fill(template: string, vars: Record<string, string | number>): string {
  return Object.entries(vars).reduce(
    (acc, [key, value]) => acc.replace(`{${key}}`, String(value)),
    template,
  );
}

function evidenceLabel(kind: string): string {
  return APP.evidenceKinds[kind as EvidenceKind] ?? kind;
}

function hasTemplatePhrases(text: string): boolean {
  return /\[.*describe.*\]|\[.*no .* recorded\]|\[.*no specific/i.test(text);
}

export function BeforeYouSubmitChecklist({
  caseFile,
  attemptCount,
  draftText,
  allChecked,
  priorSubmissions,
  requirements,
}: BeforeYouSubmitChecklistProps) {
  const copy = APP.compose.checklist;

  const readiness = computeReadiness(caseFile);
  // "Cannot obtain" is an answered record — the response states that gap under its own heading.
  const missing = requirements
    ? requirements
        .filter((r) => r.status === "needed" || r.status === "waiting")
        .map((r) => r.label)
    : readiness.missing.map((r) => evidenceLabel(r.kind));
  const notAccepted = requirements ? [] : readiness.disqualifiedPresent.map(evidenceLabel);
  const evidenceComplete = missing.length === 0 && notAccepted.length === 0;
  const templatePhrases = hasTemplatePhrases(draftText);
  /**
   * AA-42. With history we compare the actual words; without it we fall back to the old
   * attempt-count reminder. The comparison is strictly better when available: a seller who changed
   * nothing but the formatting used to pass this row, because the counter alone was satisfied.
   */
  const novelty =
    priorSubmissions && priorSubmissions.length > 0
      ? assessNovelty(draftText, priorSubmissions)
      : null;
  const needsNovelty = novelty ? shouldWarnBeforeSubmit(novelty) : noveltyRequired(attemptCount);

  const evidenceDetail = evidenceComplete
    ? fill(copy.evidenceComplete, {
        count: requirements ? requirements.length : requiredKinds(caseFile.kind).length,
      })
    : [
        fill(copy.evidenceMissing, { count: missing.length + notAccepted.length }),
        missing.length > 0 ? fill(copy.evidenceMissingDetail, { kinds: missing.join(", ") }) : null,
        notAccepted.length > 0
          ? fill(copy.evidenceDisqualifiedDetail, { kinds: notAccepted.join(", ") })
          : null,
      ]
        .filter((part): part is string => part !== null)
        .join(" · ");

  const items: ChecklistItem[] = [
    {
      id: "evidence",
      label: copy.items.evidence,
      checked: evidenceComplete,
      detail: evidenceDetail,
    },
    {
      id: "no_template_phrases",
      label: copy.items.templatePhrases,
      checked: !templatePhrases,
      detail: templatePhrases ? copy.templatePhrases : copy.noTemplatePhrases,
    },
    {
      id: "novelty",
      label: fill(copy.items.novelty, { n: attemptCount + 1 }),
      checked: !needsNovelty,
      // The comparison's own message explains what it found and what to do about it, which is more
      // use than the generic revision copy — so it wins whenever a comparison was possible.
      detail: novelty
        ? novelty.message
        : needsNovelty
          ? expectationsCopy("REVISION")
          : copy.noveltyFirst,
    },
    {
      id: "submit_yourself",
      label: copy.items.submitYourself,
      checked: true,
      detail: copy.submitDetail,
    },
  ];

  const readyForSellerCentral = allChecked && items.every((item) => item.checked);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Shield className="h-4 w-4 text-primary" aria-hidden="true" />
          {copy.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">{READINESS_COPY}</p>
        <ul role="list" className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-3">
              {item.checked ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" aria-hidden="true" />
              ) : (
                <Circle
                  className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
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
                <span className="sr-only">
                  {`, ${item.checked ? copy.status.done : copy.status.pending}`}
                </span>
                {item.detail && <p className="text-xs text-muted-foreground">{item.detail}</p>}
              </div>
            </li>
          ))}
        </ul>
        {readyForSellerCentral && (
          <Button asChild variant="outline" size="sm" className="mt-3 gap-2">
            <a href={APP.links.sellerCentralPerformance} target="_blank" rel="noopener noreferrer">
              {copy.sellerCentral}
              <ExternalLink className="h-4 w-4" aria-hidden="true" />
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
