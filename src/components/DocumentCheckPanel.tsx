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
    // v5 (26 Sep 2026, prototype record.html): a white report card on the warm panel — the header
    // says what was checked and when, each finding is a numbered row with its own status.
    <div className="overflow-hidden rounded-[14px] bg-surface-1 shadow-card ring-1 ring-inset ring-border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3.5 sm:px-5">
        <div className="min-w-0">
          <p className="text-[0.9375rem] font-semibold text-foreground">
            {APP.evidenceSlots.check.resultTitle}
          </p>
          {outcome && checkedAt && (
            <p className="text-xs text-muted-foreground">
              {APP.evidenceSlots.check.savedOn.replace("{date}", formatDateTime(checkedAt))}
            </p>
          )}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onCheck} disabled={busy}>
          <FileSearch className="mr-2 size-4" aria-hidden />
          {busy
            ? APP.evidenceSlots.check.checking
            : outcome
              ? APP.evidenceSlots.check.recheck
              : APP.evidenceSlots.check.action}
        </Button>
      </div>
      <div className="space-y-3 px-4 py-3.5 sm:px-5">
        {outcome && stale && (
          <p className="text-sm text-warning">{APP.evidenceSlots.check.stale}</p>
        )}

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
            <p className="text-sm text-muted-foreground">{summarizeCheck(outcome.result)}</p>
            <ol className="-mx-4 border-t border-border sm:-mx-5">
              {outcome.result.findings.map((f, i) => (
                <li
                  key={f.field}
                  className="grid grid-cols-[1.375rem_minmax(0,1fr)_auto] items-start gap-3 border-b border-border px-4 py-3 text-sm last:border-b-0 sm:px-5"
                >
                  <NumberDisc n={i + 1} status={f.status} />
                  <span className="min-w-0">
                    <span className="block font-semibold text-foreground">{f.field}</span>
                    <span className="block text-[0.8125rem] text-muted-foreground">{f.note}</span>
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
                  <Badge variant={badgeVariant(f.status)} size="sm" className="mt-0.5">
                    {FINDING_LABELS[f.status]}
                  </Badge>
                </li>
              ))}
            </ol>
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
    </div>
  );
}

/** A finding's number in a disc, green when the document shows it and orange when it does not. */
function NumberDisc({ n, status }: { n: number; status: FindingStatus }) {
  return (
    <span
      aria-hidden
      className={cn(
        "mt-px inline-flex size-[22px] items-center justify-center rounded-full text-[0.6875rem] font-bold text-white",
        status === "present"
          ? "bg-success"
          : status === "missing" || status === "conflicting"
            ? "bg-[hsl(var(--action))]"
            : "bg-muted-foreground",
      )}
    >
      {n}
    </span>
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
