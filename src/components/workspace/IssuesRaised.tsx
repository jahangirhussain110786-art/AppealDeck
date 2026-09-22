"use client";
import { Layers } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { hasMultipleIssues } from "@/core/noticeIssues";
import type { Workspace } from "@/core/workspace";
import { APP } from "@/content/app";
import { WORKSPACE as C } from "@/content/workspace";

/**
 * #86: the second issue, made impossible to overlook.
 *
 * Amazon regularly names two things in one notice — an authenticity concern and a listing policy
 * breach, a metric and a restricted-product finding — and judges them separately. The product used
 * to route on whichever the classifier ranked first and drop the rest, so a seller built a plan
 * for one violation and never learned the other was unanswered. That response is refused for the
 * part it missed, and the refusal rarely says so.
 *
 * This writes nothing for the seller. It names each issue, quotes the sentence that raised it, and
 * — where a response is being prepared — asks them to confirm they have covered all of them. The
 * confirmation is what `workspaceGaps` requires, so a case cannot be called ready with an issue
 * still unanswered.
 */
export function IssuesRaised({
  workspace,
  busy,
  onConfirm,
}: {
  workspace: Workspace;
  busy?: boolean;
  /** Omit on read-only surfaces: the list is worth showing even where nothing can be confirmed. */
  onConfirm?: (confirmed: boolean) => void;
}) {
  const issues = workspace.issues ?? [];
  if (!hasMultipleIssues(issues)) return null;

  return (
    <Alert variant="warning">
      <Layers aria-hidden />
      <div className="space-y-3">
        <AlertTitle>{C.issuesTitle}</AlertTitle>
        <AlertDescription>{C.issuesLead}</AlertDescription>
        <ol className="space-y-3">
          {issues.map((issue) => (
            <li key={issue.kind} className="border-l-2 border-warning/30 pl-3">
              <p className="text-sm font-semibold text-foreground">
                {APP.violationKinds[issue.kind] ?? issue.kind}
              </p>
              <p className="text-eyebrow uppercase text-muted-foreground">{C.issuesSourceLabel}</p>
              <p className="text-sm italic text-muted-foreground">{issue.sourceQuote}</p>
            </li>
          ))}
        </ol>
        {onConfirm && (
          <label className="flex items-start gap-3 text-sm">
            <input
              className="mt-1 h-4 w-4 accent-primary"
              type="checkbox"
              disabled={busy}
              checked={Boolean(workspace.issuesConfirmed)}
              onChange={(e) => onConfirm(e.target.checked)}
            />
            {C.issuesConfirm}
          </label>
        )}
      </div>
    </Alert>
  );
}
