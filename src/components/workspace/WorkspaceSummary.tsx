import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Trash2 } from "lucide-react";
import { CaseOutcome } from "./CaseOutcome";
import { StatusPill } from "./CaseOverview";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { APP } from "@/content/app";
import { PROTOCOL_LABELS, workspaceGaps } from "@/core/workspace";
import type { CaseFile } from "@/core/caseFile";
import type { CaseLog } from "@/lib/caseStore";

/**
 * The current case under the case list (v5, 26 Sep 2026): its route, the one thing still open,
 * three counts and the way back in. The list of every case lives above it, in `DashboardCases`.
 */
export function WorkspaceSummary({
  file,
  log,
  signedIn,
  onSaveLog,
  onArchive,
  onDelete,
}: {
  file: CaseFile;
  log: CaseLog | null;
  signedIn: boolean;
  onSaveLog: (log: CaseLog) => Promise<boolean>;
  onArchive: (id: string, archived: boolean) => Promise<boolean>;
  onDelete: () => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const del = APP.dashboard.deleteCase;
  const w = file.workspace!;
  const gaps = workspaceGaps(w);
  const stats = [
    { label: "Round", value: String(w.revision) },
    {
      label: "Records reviewed",
      value: `${w.requirements.filter((r) => r.status === "reviewed").length} / ${w.requirements.length}`,
    },
    { label: "Submissions", value: String(w.submissions.length) },
  ];
  return (
    <div className="space-y-5">
      <section
        aria-labelledby="case-at-a-glance"
        className="overflow-hidden rounded-[18px] bg-card shadow-card ring-1 ring-inset ring-border"
      >
        <div className="flex flex-wrap items-start justify-between gap-4 px-6 pb-5 pt-6">
          <div className="min-w-0 space-y-2">
            <StatusPill tone="mute">{PROTOCOL_LABELS[w.protocol]}</StatusPill>
            <h2 id="case-at-a-glance" className="text-[1.375rem] font-semibold tracking-[-0.025em]">
              Your case, at a glance
            </h2>
            <p className="max-w-[40em] text-sm text-muted-foreground">
              {file.state === "SUBMITTED"
                ? "Your response is recorded. Keep the next reply with this case."
                : (gaps[0] ?? "Your facts and evidence are ready for a final review.")}
            </p>
          </div>
          <Button asChild>
            <Link href="/case">
              Continue your case
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </div>
        <dl className="grid grid-cols-3 border-t border-border">
          {stats.map((s) => (
            <div key={s.label} className="border-l border-border px-6 py-4 first:border-l-0">
              <dt className="text-xs text-muted-foreground">{s.label}</dt>
              <dd className="mt-1 text-2xl font-semibold tabular-nums tracking-[-0.02em]">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>
      </section>
      <CaseOutcome
        file={file}
        log={log}
        busy={busy}
        signedIn={signedIn}
        onSaveLog={onSaveLog}
        onArchive={async () => {
          setBusy(true);
          try {
            return await onArchive(file.id, true);
          } finally {
            setBusy(false);
          }
        }}
      />
      <div className="flex justify-end">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="text-muted-foreground hover:text-destructive"
          disabled={busy}
          onClick={() => setConfirmDelete(true)}
        >
          <Trash2 className="mr-2 size-4" aria-hidden />
          {del.action}
        </Button>
      </div>
      <Dialog open={confirmDelete} onOpenChange={(open) => !busy && setConfirmDelete(open)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{del.title}</DialogTitle>
            <DialogDescription>{del.body}</DialogDescription>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">{del.keepCopy}</p>
          <p className="text-xs text-muted-foreground">{del.backupNote}</p>
          <DialogFooter>
            <Button variant="outline" disabled={busy} onClick={() => setConfirmDelete(false)}>
              {del.cancel}
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => {
                setBusy(true);
                void onDelete().then((ok) => {
                  setBusy(false);
                  if (ok) setConfirmDelete(false);
                });
              }}
            >
              {del.confirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
