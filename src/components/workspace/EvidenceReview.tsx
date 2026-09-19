"use client";
import { useState } from "react";
import { Check, Download, FileText, ClipboardCheck } from "lucide-react";
import { DetailDisclosure, IconTile } from "./WorkspaceVisuals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDropZone } from "@/components/FileDropZone";
import { CopyButton } from "@/components/CopyButton";
import type { Requirement } from "@/core/workspace";
import type { VaultListItem } from "@/core/vault/vault";
import { WORKSPACE as C } from "@/content/workspace";

export function EvidenceReview({
  item,
  records,
  busy,
  draftNote,
  onDraftNote,
  onChange,
  onRemove,
  onUpload,
  onDownload,
}: {
  item: Requirement;
  records: VaultListItem[];
  busy: boolean;
  draftNote?: string;
  onDraftNote: (value: string | undefined) => void;
  onChange: (value: Requirement) => Promise<boolean>;
  onRemove: (reason: string) => Promise<boolean>;
  onUpload: (file: File) => Promise<boolean>;
  onDownload: (id: string) => void;
}) {
  const [note, setNote] = useState(draftNote ?? item.note);
  const [page, setPage] = useState(String(item.page ?? 1));
  const [checked, setChecked] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [sourceQuote, setSourceQuote] = useState(item.sourceQuote);
  const [removeReason, setRemoveReason] = useState("");
  const request = `Hello,\n\nI need your help with the following records: ${item.label}.\n\nThe request I received says:\n${item.sourceQuote}\n\nPlease provide the genuine records or clarify any missing information. If a correction is needed, please issue it yourself while preserving the original transaction details. Thank you.`;
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconTile
              icon={item.status === "reviewed" ? ClipboardCheck : FileText}
              tone={item.status === "reviewed" ? "primary" : "warning"}
            />
            <CardTitle className="text-base">{item.label}</CardTitle>
          </div>
          <Badge
            variant={item.status === "reviewed" ? "success" : "warning"}
            className="text-foreground"
          >
            {C.status[item.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <DetailDisclosure title="Why this record is requested">
          <blockquote className="border-l-2 border-info/30 pl-3">{item.sourceQuote}</blockquote>
        </DetailDisclosure>
        {item.recordId ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-surface-2 p-4">
            <div className="flex min-w-0 items-center gap-2">
              <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden />
              <span className="break-all text-sm">{item.filename}</span>
            </div>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => onDownload(item.recordId!)}
            >
              <Download className="mr-2 h-4 w-4" aria-hidden />
              Read original
            </Button>
          </div>
        ) : (
          <FileDropZone
            disabled={busy}
            multiple={false}
            accept="application/pdf,image/png,image/jpeg"
            onFile={onUpload}
            hint="PDF, PNG or JPEG · up to 10 MB · stored in this case"
          />
        )}
        {records.length > 0 && (
          <DetailDisclosure
            title={item.recordId ? "Change linked file" : "Use a file already in this case"}
          >
            <div className="space-y-2">
              <Label htmlFor={`file-${item.id}`}>Link an existing file from this case</Label>
              <select
                id={`file-${item.id}`}
                className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm"
                disabled={busy}
                value={item.recordId ?? ""}
                onChange={(e) => {
                  const r = records.find((v) => v.id === e.target.value);
                  if (r) {
                    setChecked(false);
                    void onChange({
                      ...item,
                      recordId: r.id,
                      filename: r.name,
                      contentHash: r.plaintextHash,
                      status: "needed",
                    });
                  }
                }}
              >
                <option value="">Choose a file</option>
                {records.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </DetailDisclosure>
        )}
        <div className="flex items-center gap-2 border-t border-border/70 pt-4 text-xs text-muted-foreground">
          <ClipboardCheck className="size-4 text-primary" aria-hidden />
          <p>Manual review · Original files stay unchanged</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_7rem]">
          <div className="space-y-2">
            <Label htmlFor={`note-${item.id}`}>
              What does this record support or leave unclear?
            </Label>
            <Textarea
              id={`note-${item.id}`}
              placeholder="Record the facts this file supports and any gaps…"
              value={note}
              maxLength={4000}
              onChange={(e) => {
                const next = e.target.value;
                setNote(next);
                onDraftNote(next === item.note ? undefined : next);
                setChecked(false);
              }}
            />
          </div>
          <div className="max-w-40 space-y-2">
            <Label htmlFor={`page-${item.id}`}>Source page</Label>
            <Input
              id={`page-${item.id}`}
              type="number"
              min={1}
              max={10000}
              value={page}
              onChange={(e) => {
                setPage(e.target.value);
                setChecked(false);
              }}
            />
          </div>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <input
            className="mt-1 h-4 w-4 accent-primary"
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          I checked the original, its page reference and the facts recorded here.
        </label>
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={
              busy ||
              !item.recordId ||
              !checked ||
              !note.trim() ||
              !Number.isInteger(Number(page)) ||
              Number(page) < 1 ||
              Number(page) > 10000
            }
            onClick={() =>
              void onChange({ ...item, note: note.trim(), page: Number(page), status: "reviewed" })
            }
          >
            <Check className="mr-2 h-4 w-4" aria-hidden />
            Save evidence review
          </Button>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => void onChange({ ...item, note, status: "waiting" })}
          >
            I’m waiting for information
          </Button>
          <Button
            variant="ghost"
            onClick={() => setShowRequest(!showRequest)}
            aria-expanded={showRequest}
          >
            Draft a request
          </Button>
        </div>
        {item.status === "waiting" && (
          <p className="rounded-lg border border-warning/20 bg-warning/5 p-3 text-sm text-muted-foreground">
            {C.waitingHelp}
          </p>
        )}
        <DetailDisclosure title="How to review this file">{C.manualReview}</DetailDisclosure>
        <details className="border-t border-border pt-3">
          <summary className="cursor-pointer text-sm font-medium">
            Correct this task or mark it no longer applicable
          </summary>
          <div className="mt-4 space-y-3">
            <Label htmlFor={`source-${item.id}`}>Exact request in the current notice or form</Label>
            <Textarea
              id={`source-${item.id}`}
              value={sourceQuote}
              maxLength={2000}
              onChange={(e) => setSourceQuote(e.target.value)}
            />
            <Button
              variant="outline"
              disabled={busy || !sourceQuote.trim()}
              onClick={() =>
                void onChange({ ...item, sourceQuote: sourceQuote.trim(), status: "needed" })
              }
            >
              Update request and reopen review
            </Button>
            <Label htmlFor={`remove-${item.id}`}>Why is this record no longer requested?</Label>
            <Input
              id={`remove-${item.id}`}
              value={removeReason}
              maxLength={1000}
              onChange={(e) => setRemoveReason(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Removing a task does not delete its original file or earlier submission references.
              Confirm the complete request list again afterwards.
            </p>
            <Button
              variant="outline"
              disabled={busy || removeReason.trim().length < 10}
              onClick={() => void onRemove(removeReason.trim())}
            >
              Remove from current plan
            </Button>
          </div>
        </details>
        {showRequest && (
          <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-4">
            <h3 className="font-medium">Request to the record issuer</h3>
            <p className="text-xs text-muted-foreground">
              Review the draft, add the recipient and send it yourself. AppealDeck does not send
              messages.
            </p>
            <pre className="whitespace-pre-wrap font-sans text-sm">{request}</pre>
            <CopyButton text={request} label="Copy request draft" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
