import Link from "next/link";
import { ArrowRight, FileSearch, FolderOpen, History, GitBranch } from "lucide-react";
import { IconTile } from "./WorkspaceVisuals";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PROTOCOL_LABELS, workspaceGaps } from "@/core/workspace";
import type { CaseFile } from "@/core/interviewEngine";
import type { CaseIndexEntry } from "@/lib/caseStore";
import { formatDate } from "@/lib/format";

export function WorkspaceSummary({
  file,
  cases,
  onSelect,
}: {
  file: CaseFile;
  cases: CaseIndexEntry[];
  onSelect: (id: string) => void;
}) {
  const w = file.workspace!;
  const gaps = workspaceGaps(w);
  return (
    <div className="space-y-5">
      {cases.length > 1 && (
        <label className="block text-sm">
          Current case
          <select
            className="ml-2 max-w-full rounded-md border border-input bg-background p-2"
            value={file.id}
            onChange={(e) => onSelect(e.target.value)}
          >
            {cases.map((c) => (
              <option key={c.id} value={c.id}>
                {c.kind.replaceAll("_", " ")} · {formatDate(c.createdAt)} · {c.id.slice(0, 6)}
              </option>
            ))}
          </select>
        </label>
      )}
      <Card className="workspace-hero">
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <IconTile icon={FileSearch} tone="info" />
            <Badge variant="secondary">{PROTOCOL_LABELS[w.protocol]}</Badge>
          </div>
          <CardTitle className="pt-3 font-accent text-3xl font-normal">
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
    </div>
  );
}
