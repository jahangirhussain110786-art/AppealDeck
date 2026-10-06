"use client";
import { useState } from "react";
import { Check, ChevronDown, Download, FileText } from "lucide-react";
import { DetailDisclosure } from "./WorkspaceVisuals";
import { StatusPill } from "./CaseOverview";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { FileDropZone } from "@/components/FileDropZone";
import { CopyButton } from "@/components/CopyButton";
import { DocumentCheckPanel } from "@/components/DocumentCheckPanel";
import { isBrowserOnly, type CheckOutcome } from "@/lib/documentChecks/runCheck";
import {
  answerableInWords,
  requirementEvidenceKind,
  type Requirement,
  type Workspace,
} from "@/core/workspace";
import { STORES } from "@/content/stores";
import { requirementGuidance } from "@/core/requirementGuidance";
import type { VaultListItem } from "@/core/vault/vault";
import {
  CannotObtainForm,
  CannotObtainRecorded,
  GuidanceLetters,
  GuidanceStandards,
  GuidanceWhy,
} from "./RequirementGuidance";
import type { ViolationKind } from "@/core";
import { WORKSPACE as C } from "@/content/workspace";
import { cn } from "@/lib/utils";

/**
 * One document the case needs. Calm pass, 29 Sep 2026: the card closes to its name and status, and
 * only the one that needs the seller is open (the parent decides which). Inside, what a seller
 * needs is in view — Amazon's words or ours, the one-line reason, the file, the note, Save — and
 * everything else is one tap away under "I don't have it" or "What a good … shows". The body is
 * hidden rather than unmounted when closed, so a half-typed note or page number is never lost.
 */
export function EvidenceReview({
  item,
  violationKind,
  records,
  busy,
  open,
  onToggle,
  draftNote,
  onDraftNote,
  onChange,
  onRemove,
  onUpload,
  onDownload,
  checkOutcome,
  checkedAt,
  checkStale,
  checking,
  onCheck,
  signedIn = true,
  position = "unsure",
}: {
  item: Requirement;
  /** Narrows the evidence-matrix guidance to this case: the same record is asked for different
   * reasons by different violations, and the wrong sentence is worse than no sentence. */
  violationKind: ViolationKind;
  records: VaultListItem[];
  busy: boolean;
  open: boolean;
  onToggle: () => void;
  draftNote?: string;
  onDraftNote: (value: string | undefined) => void;
  onChange: (value: Requirement) => Promise<boolean>;
  onRemove: (reason: string) => Promise<boolean>;
  onUpload: (file: File) => Promise<boolean>;
  onDownload: (id: string) => void;
  /**
   * AA-41 integration fix. Document checking was originally wired only into `EvidenceSlotPanel`,
   * which mounts in the classic-interview path — so the workspace, the primary journey, could not
   * reach it at all.
   */
  checkOutcome?: CheckOutcome | null;
  /** When a check shown here was saved with the case, the time it ran. */
  checkedAt?: string;
  /** A saved check compared with case details that have since changed. */
  checkStale?: boolean;
  checking?: boolean;
  onCheck?: () => void;
  /** A guest's business document is read on the device, so the note before the button says so. */
  signedIn?: boolean;
  /**
   * Whether the seller disputes the finding. A rights-owner retraction can be answered in words
   * only for a disputed claim, so the "State it in words" option needs to know.
   */
  position?: Workspace["position"];
}) {
  const D = C.documents;
  const [note, setNote] = useState(draftNote ?? item.note);
  const [page, setPage] = useState(String(item.page ?? 1));
  const [checked, setChecked] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [sourceQuote, setSourceQuote] = useState(item.sourceQuote);
  const [removeReason, setRemoveReason] = useState("");
  const guidance = requirementGuidance(item, violationKind);
  const pageValid = Number.isInteger(Number(page)) && Number(page) >= 1 && Number(page) <= 10000;
  const saveDisabled = busy || !item.recordId || !checked || !note.trim() || !pageValid;
  // Only the records `workspaceGaps` already accepts as a statement: never a weaker bar for a file.
  const inWords = answerableInWords({ position }, item);
  // A statement already saved without a file is complete; "add the file" would contradict it.
  const saveWhy =
    !saveDisabled || (inWords && item.status === "reviewed")
      ? null
      : busy
        ? null
        : !item.recordId
          ? D.saveWhyFile
          : !note.trim()
            ? D.saveWhyNote
            : !pageValid
              ? D.saveWhyPage
              : D.saveWhyTick;
  const bodyId = `document-${item.id}`;
  const request = `Hello,\n\nI need your help with the following records: ${item.label}.\n\nThe request I received says:\n${item.sourceQuote}\n\nPlease provide the genuine records or clarify any missing information. If a correction is needed, please issue it yourself while preserving the original transaction details. Thank you.`;
  /*
    B-05: a record Amazon named is shown as their sentence, quoted. A record we inferred from the
    evidence matrix is shown as ours, and said so plainly — in the closed header as well as inside,
    so a seller can tell the two apart without opening anything.
  */
  const origin =
    item.source === "matrix"
      ? C.inferred.badge
      : item.source === "seller"
        ? C.sellerAdded.badge
        : C.overview.source.notice;

  return (
    <section
      aria-labelledby={`${bodyId}-title`}
      className="overflow-hidden rounded-[18px] bg-card shadow-card ring-1 ring-inset ring-border"
    >
      <div className="flex items-start gap-3 p-5 sm:px-6">
        <div className="min-w-0 flex-1 space-y-1.5">
          <StatusPill
            tone={
              item.status === "reviewed"
                ? "ok"
                : item.status === "waiting"
                  ? "new"
                  : item.status === "cannot_obtain"
                    ? "mute"
                    : "need"
            }
            dot={item.status === "needed"}
          >
            {C.status[item.status]}
          </StatusPill>
          <h3
            id={`${bodyId}-title`}
            className="text-balance text-[clamp(1.25rem,1.05rem+0.7vw,1.5rem)] font-semibold leading-tight tracking-[-0.025em]"
          >
            {item.label}
          </h3>
          <p className="text-sm text-muted-foreground">{origin}</p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          aria-expanded={open}
          aria-controls={bodyId}
          aria-label={D.toggle.replace("{label}", item.label)}
          onClick={onToggle}
          className="shrink-0 text-link"
        >
          {open ? D.close : D.open}
          <ChevronDown
            className={cn(
              "transition-transform motion-reduce:transition-none",
              open && "rotate-180",
            )}
            aria-hidden
          />
        </Button>
      </div>
      <div id={bodyId} hidden={!open} className="space-y-5 px-5 pb-6 sm:px-6">
        {item.source === "matrix" || item.source === "seller" ? (
          <p className="max-w-[60ch] text-sm text-muted-foreground">
            {item.source === "seller" ? C.sellerAdded.help : C.inferred.help}
          </p>
        ) : (
          item.sourceQuote && (
            <blockquote className="max-w-[46em] border-l-2 border-primary/40 pl-3 font-accent text-[1.0625rem] italic leading-snug text-foreground/80">
              “{item.sourceQuote}”
            </blockquote>
          )
        )}
        {guidance && <GuidanceWhy guidance={guidance} />}
        <div className="warm-stage space-y-3 rounded-[18px] p-3 sm:p-4">
          {item.recordId ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] bg-surface-1 p-4 shadow-card ring-1 ring-inset ring-border">
              <div className="flex min-w-0 items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                <span className="break-all text-sm">{item.filename}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => onDownload(item.recordId!)}
                >
                  <Download className="mr-2 h-4 w-4" aria-hidden />
                  {D.readOriginal}
                </Button>
                {/* The wrong file picked: unlink it so the drop zone comes back. The file itself
                    stays in the vault. */}
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() =>
                    void onChange({
                      ...item,
                      recordId: undefined,
                      filename: undefined,
                      contentHash: undefined,
                      page: undefined,
                      status: "needed",
                    })
                  }
                >
                  {D.replaceFile}
                </Button>
              </div>
            </div>
          ) : (
            <FileDropZone
              disabled={busy}
              multiple={false}
              accept="application/pdf,image/png,image/jpeg"
              onFile={onUpload}
              hint="PDF, PNG or JPEG · up to 10 MB stored, up to 3 MB checked"
            />
          )}
          {records.length > 0 && (
            <DetailDisclosure title={item.recordId ? D.changeLinked : D.linkExisting}>
              <div className="space-y-2">
                <Label htmlFor={`file-${item.id}`}>{D.linkLabel}</Label>
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
                  <option value="">{D.chooseFile}</option>
                  {records.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            </DetailDisclosure>
          )}
          {/* AA-41: only offered once a file is actually linked to this requirement. */}
          {onCheck && item.recordId && (
            <DocumentCheckPanel
              outcome={checkOutcome ?? null}
              checkedAt={checkedAt}
              stale={checkStale}
              busy={Boolean(checking)}
              onCheck={onCheck}
              processing={checkProcessing(item, signedIn)}
            />
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_6rem]">
          <div className="space-y-2">
            <Label htmlFor={`note-${item.id}`}>{D.noteLabel}</Label>
            <Textarea
              id={`note-${item.id}`}
              rows={3}
              placeholder={D.notePlaceholder}
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
          <div className="max-w-28 space-y-2">
            <Label htmlFor={`page-${item.id}`}>{D.pageLabel}</Label>
            <Input
              id={`page-${item.id}`}
              type="number"
              inputMode="numeric"
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
        <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
          <input
            className="size-5 shrink-0 accent-primary"
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
          />
          {D.checked}
        </label>
        <Button
          disabled={saveDisabled}
          aria-describedby={saveWhy ? `${bodyId}-save-why` : undefined}
          onClick={() =>
            void onChange({ ...item, note: note.trim(), page: Number(page), status: "reviewed" })
          }
        >
          <Check className="mr-2 h-4 w-4" aria-hidden />
          {D.save}
        </Button>
        {/* A disabled button says why, rather than looking broken. */}
        {saveWhy && (
          <p id={`${bodyId}-save-why`} className="text-xs text-muted-foreground">
            {saveWhy}
          </p>
        )}
        {inWords && !item.recordId && (
          <div className="space-y-2 rounded-lg border border-border bg-surface-2 p-4">
            <p className="text-sm text-muted-foreground">{STORES.relationshipHint}</p>
            <Button
              variant="outline"
              disabled={busy || !note.trim()}
              onClick={() =>
                void onChange({ ...item, note: note.trim(), page: item.page, status: "reviewed" })
              }
            >
              <Check className="mr-2 h-4 w-4" aria-hidden />
              {D.stateInWords}
            </Button>
          </div>
        )}
        {item.status === "waiting" && (
          <p className="rounded-lg border border-warning/20 bg-warning/5 p-3 text-sm text-muted-foreground">
            {C.waitingHelp}
          </p>
        )}
        <CannotObtainRecorded item={item} busy={busy} onChange={onChange} />
        {item.status === "cannot_obtain" && item.declined && (
          <p className="text-xs text-muted-foreground">
            {D.recordedOn.replace("{date}", item.declined.at.slice(0, 10))}
          </p>
        )}
        <div className="space-y-2">
          {/* Every way forward when the file is not in hand, behind one honest question. */}
          <DetailDisclosure title={D.missing}>
            <div className="space-y-4 pt-1 text-foreground">
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => void onChange({ ...item, note, status: "waiting" })}
                >
                  {D.waiting}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowRequest(!showRequest)}
                  aria-expanded={showRequest}
                >
                  {D.draftRequest}
                </Button>
              </div>
              {showRequest && (
                <div className="space-y-3 rounded-lg border border-border bg-surface-2 p-4">
                  <h4 className="font-medium">{D.requestTitle}</h4>
                  <p className="text-xs text-muted-foreground">{D.requestNote}</p>
                  <pre className="whitespace-pre-wrap font-sans text-sm">{request}</pre>
                  <CopyButton text={request} label={D.copyRequest} />
                </div>
              )}
              {guidance && <GuidanceLetters guidance={guidance} />}
              {guidance && (
                <CannotObtainForm item={item} guidance={guidance} busy={busy} onChange={onChange} />
              )}
              <details className="border-t border-border pt-3">
                <summary className="cursor-pointer text-sm font-medium">{D.correct}</summary>
                <div className="mt-4 space-y-3">
                  <Label htmlFor={`source-${item.id}`}>{D.correctLabel}</Label>
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
                    {D.correctButton}
                  </Button>
                  <Label htmlFor={`remove-${item.id}`}>{D.removeLabel}</Label>
                  <Input
                    id={`remove-${item.id}`}
                    value={removeReason}
                    maxLength={1000}
                    onChange={(e) => setRemoveReason(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">{D.removeNote}</p>
                  <Button
                    variant="outline"
                    disabled={busy || removeReason.trim().length < 10}
                    onClick={() => void onRemove(removeReason.trim())}
                  >
                    {D.removeButton}
                  </Button>
                </div>
              </details>
            </div>
          </DetailDisclosure>
          <DetailDisclosure
            title={
              guidance
                ? // "What good product and label photos show", not "What a good … photos shows".
                  (/s$/i.test(item.label) && !/ss$/i.test(item.label)
                    ? D.standardsPlural
                    : D.standards
                  ).replace("{label}", item.label.toLowerCase())
                : D.howToCheck
            }
          >
            <div className="space-y-3">
              {guidance && <GuidanceStandards guidance={guidance} />}
              <p>{C.manualReview}</p>
              <p>{D.originalUnchanged}</p>
            </div>
          </DetailDisclosure>
        </div>
      </div>
    </section>
  );
}

/**
 * Where a check on this record would read the file, or nothing when it cannot be checked at all —
 * in which case the check itself says so, and a line about uploading would describe something that
 * will not happen.
 */
function checkProcessing(
  item: Requirement,
  signedIn: boolean,
): "server" | "device" | "device_text" | undefined {
  const kind = requirementEvidenceKind(item);
  if (!kind || kind === "other") return undefined;
  if (isBrowserOnly(kind)) return "device";
  return signedIn ? "server" : "device_text";
}
