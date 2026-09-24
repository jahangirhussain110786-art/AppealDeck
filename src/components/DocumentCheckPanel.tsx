"use client";

import {
  AlertCircle,
  CheckCircle2,
  CircleDashed,
  CircleHelp,
  FileSearch,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FINDING_LABELS, summarizeCheck, type FindingStatus } from "@/core/documentCheck";
import type { CheckOutcome } from "@/lib/documentChecks/runCheck";
import { APP } from "@/content/app";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";

/**
 * AA-41: shows what was read from a seller's document.
 *
 * The display rule matches the model's: every line describes the document, and the panel closes
 * with a sentence saying Amazon decides. A seller in a crisis reads a green tick as "I am safe",
 * so "everything readable" is never dressed as approval.
 */
export function DocumentCheckPanel({
  outcome,
  busy,
  onCheck,
  processing,
  checkedAt,
  stale,
}: {
  outcome: CheckOutcome | null;
  /** Set when this is a check saved with the case: when it ran. */
  checkedAt?: string;
  /** The saved check was compared with case details that have since changed. */
  stale?: boolean;
  busy: boolean;
  onCheck: () => void;
  /** Where the file will be read, stated before the seller presses the button. */
  processing?: "server" | "device";
}) {
  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-2/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" size="sm" onClick={onCheck} disabled={busy}>
          <FileSearch className="mr-2 size-4" aria-hidden />
          {busy
            ? APP.evidenceSlots.check.checking
            : outcome
              ? APP.evidenceSlots.check.recheck
              : APP.evidenceSlots.check.action}
        </Button>
        {outcome && checkedAt && (
          <span className="text-xs text-muted-foreground">
            {APP.evidenceSlots.check.savedOn.replace("{date}", formatDateTime(checkedAt))}
          </span>
        )}
      </div>

      {outcome && stale && <p className="text-sm text-warning">{APP.evidenceSlots.check.stale}</p>}

      {!outcome && processing && (
        <p className="text-xs text-muted-foreground">
          {processing === "server"
            ? APP.evidenceSlots.check.beforeServer
            : APP.evidenceSlots.check.beforeDevice}
        </p>
      )}

      {outcome?.kind === "unavailable" && (
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{APP.evidenceSlots.check.failed}. </span>
          {outcome.message}
        </p>
      )}

      {outcome?.kind === "fields" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {APP.evidenceSlots.check.resultTitle}
          </p>
          <p className="text-sm text-muted-foreground">{summarizeCheck(outcome.result)}</p>
          <ul className="space-y-2">
            {outcome.result.findings.map((f) => (
              <li key={f.field} className="flex items-start gap-2 text-sm">
                <StatusIcon status={f.status} />
                <span className="min-w-0">
                  <span className="font-medium text-foreground">{f.field}</span>{" "}
                  <Badge variant={badgeVariant(f.status)} className="align-middle text-xs">
                    {FINDING_LABELS[f.status]}
                  </Badge>
                  <span className="block text-muted-foreground">{f.note}</span>
                  {f.observed && (
                    <span className="block font-mono text-xs text-muted-foreground">
                      “{f.observed}”
                    </span>
                  )}
                  {f.comparedWith && (
                    <span className="block text-xs text-muted-foreground">
                      {APP.evidenceSlots.check.comparedWith} {f.comparedWith}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          {outcome.result.triggeredDisqualifiers.length > 0 && (
            <ul className="space-y-1 border-t border-border pt-3 text-sm text-warning">
              {outcome.result.triggeredDisqualifiers.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            {APP.evidenceSlots.check.serverNote} {APP.evidenceSlots.check.noVerdict}
          </p>
        </div>
      )}

      {outcome?.kind === "image" && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-foreground">
            {APP.evidenceSlots.check.localTitle}
          </p>
          <ul className="space-y-2">
            {outcome.report.checks.map((c) => (
              <li key={c.id} className="flex items-start gap-2 text-sm">
                <StatusIcon
                  status={
                    c.status === "ok" ? "present" : c.status === "warn" ? "missing" : "unclear"
                  }
                />
                <span className="min-w-0">
                  <span className="font-medium text-foreground">{c.label}</span>
                  <span className="block text-muted-foreground">{c.detail}</span>
                </span>
              </li>
            ))}
          </ul>
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            {APP.evidenceSlots.check.localNote}
          </p>
        </div>
      )}
    </div>
  );
}

function badgeVariant(status: FindingStatus): "success" | "warning" | "secondary" | "destructive" {
  switch (status) {
    case "present":
      return "success";
    case "missing":
      return "warning";
    case "conflicting":
      return "destructive";
    default:
      return "secondary";
  }
}

function StatusIcon({ status }: { status: FindingStatus }) {
  const Icon =
    status === "present"
      ? CheckCircle2
      : status === "conflicting"
        ? AlertCircle
        : status === "missing"
          ? TriangleAlert
          : status === "not_assessed"
            ? CircleDashed
            : CircleHelp;
  return (
    <Icon
      className={cn(
        "mt-0.5 size-4 shrink-0",
        status === "present"
          ? "text-success"
          : status === "conflicting"
            ? "text-destructive"
            : status === "missing"
              ? "text-warning"
              : "text-muted-foreground",
      )}
      aria-hidden
    />
  );
}
