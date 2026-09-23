import Link from "next/link";
import { useState } from "react";
import { ArrowRight, FileSearch, FolderOpen, History, GitBranch } from "lucide-react";
import { IconTile } from "./WorkspaceVisuals";
import { CaseOutcome } from "./CaseOutcome";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROTOCOL_LABELS, workspaceGaps } from "@/core/workspace";
import type { CaseFile } from "@/core/caseFile";
import type { CaseIndexEntry, CaseLog } from "@/lib/caseStore";
import { formatDate } from "@/lib/format";

function caseLabel(c: CaseIndexEntry): string {
  const kind = c.kind
    .toLowerCase()
    .split("_")
    .map((w) => w[0]?.toUpperCase() + w.slice(1))
    .join(" ");
  // The id suffix keeps same-kind, same-day cases distinguishable from each other in the list.
  return `${kind} · #${c.id.slice(0, 6)}`;
}

function CaseList({
  cases,
  activeId,
  busy,
  switching,
  onSelect,
  onReopen,
}: {
  cases: CaseIndexEntry[];
  activeId: string;
  busy: boolean;
  /** Id of the case a switch is currently in flight for, so the row can say so. */
  switching: string | null;
  onSelect: (id: string) => Promise<void>;
  onReopen: (id: string) => void;
}) {
  const active = cases.filter((c) => !c.archived);
  const archived = cases.filter((c) => c.archived);
  return (
    <Card role="region" aria-label="Your cases">
      <CardHeader>
        <CardTitle className="text-base">Your cases</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {active.map((c) => (
          <button
            key={c.id}
            disabled={busy}
            aria-current={c.id === activeId ? "true" : undefined}
            onClick={() => void onSelect(c.id)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border border-border/70 bg-card/60 px-4 py-3 text-left text-sm transition-colors hover:bg-surface-2 disabled:opacity-60"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium text-foreground">{caseLabel(c)}</span>
              <span className="text-xs text-muted-foreground">
                Started {formatDate(c.createdAt)}
              </span>
            </span>
            {switching === c.id ? (
              <Badge variant="secondary">Opening…</Badge>
            ) : (
              c.id === activeId && <Badge variant="secondary">Current</Badge>
            )}
          </button>
        ))}
        {archived.length > 0 && (
          <details className="pt-2">
            <summary className="cursor-pointer text-xs font-medium text-muted-foreground">
              Archived cases ({archived.length})
            </summary>
            <div className="mt-2 space-y-2">
              {archived.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border px-4 py-3 text-sm"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-foreground">{caseLabel(c)}</span>
                    <span className="text-xs text-muted-foreground">
                      Started {formatDate(c.createdAt)}
                    </span>
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={busy}
                    onClick={() => onReopen(c.id)}
                  >
                    Reopen
                  </Button>
                </div>
              ))}
            </div>
          </details>
        )}
      </CardContent>
    </Card>
  );
}

export function WorkspaceSummary({
  file,
  cases,
  log,
  onSelect,
  onSaveLog,
  onArchive,
}: {
  file: CaseFile;
  cases: CaseIndexEntry[];
  log: CaseLog | null;
  onSelect: (id: string) => Promise<void>;
  onSaveLog: (log: CaseLog) => Promise<boolean>;
  onArchive: (id: string, archived: boolean) => Promise<boolean>;
}) {
  const [busy, setBusy] = useState(false);
  // Switching cases writes to the vault. Until that returns the list is disabled and the row says
  // what is happening, so the seller is not left clicking a list that looks inert — and cannot
  // start a second switch over the top of the first.
  const [switching, setSwitching] = useState<string | null>(null);
  const w = file.workspace!;
  const gaps = workspaceGaps(w);
  return (
    <div className="space-y-5">
      {cases.length > 1 && (
        <CaseList
          cases={cases}
          activeId={file.id}
          busy={busy || switching !== null}
          switching={switching}
          onSelect={(id) => {
            setSwitching(id);
            return onSelect(id).finally(() => setSwitching(null));
          }}
          onReopen={(id) => {
            setBusy(true);
            void onArchive(id, false)
              .then(async (ok) => {
                if (ok) await onSelect(id);
              })
              .finally(() => setBusy(false));
          }}
        />
      )}
      <Card className="workspace-hero">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <IconTile icon={FileSearch} tone="info" />
            <Badge variant="secondary">{PROTOCOL_LABELS[w.protocol]}</Badge>
          </div>
          <CardTitle className="pt-3 font-accent text-3xl font-medium">
            Your case, at a glance
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            {file.state === "SUBMITTED"
              ? "Your response is recorded. Keep the next reply with this case."
              : (gaps[0] ?? "Your facts and evidence are ready for a final review.")}
          </p>
        </CardHeader>
        <CardContent className="space-y-5">
          <dl className="grid grid-cols-3 gap-2 text-sm sm:gap-4">
            <div className="rounded-xl border border-border/70 bg-card/80 p-3 sm:p-5">
              <dt className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <GitBranch className="size-4 text-info" aria-hidden />
                Revision
              </dt>
              <dd className="mt-3 font-mono text-2xl text-foreground">{w.revision}</dd>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/80 p-3 sm:p-5">
              <dt className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <FolderOpen className="size-4 text-warning" aria-hidden />
                Records reviewed
              </dt>
              <dd className="mt-3 font-mono text-2xl text-foreground">
                {w.requirements.filter((r) => r.status === "reviewed").length}
                <span className="text-sm text-muted-foreground"> / {w.requirements.length}</span>
              </dd>
            </div>
            <div className="rounded-xl border border-border/70 bg-card/80 p-3 sm:p-5">
              <dt className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <History className="size-4 text-primary" aria-hidden />
                Submissions
              </dt>
              <dd className="mt-3 font-mono text-2xl text-foreground">{w.submissions.length}</dd>
            </div>
          </dl>
          <Button asChild>
            <Link href="/case">
              Continue your case
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      </Card>
      <CaseOutcome
        file={file}
        log={log}
        busy={busy}
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
    </div>
  );
}
