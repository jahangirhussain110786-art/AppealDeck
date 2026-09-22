"use client";

import * as React from "react";
import type { Vault } from "@/core/vault/vault";
import { toast } from "sonner";
import { Plus, ExternalLink, RefreshCw, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { CopyButton } from "@/components/CopyButton";
import { EvidenceStatusBadge } from "@/components/EvidenceStatusBadge";
import { getActiveCaseId } from "@/lib/caseStore";
import { openVaultForVisitor } from "@/lib/vault/visitor";
import { getBrowserVault } from "@/lib/vault/browser";
import type { EvidenceKind, ViolationKind } from "@/core";
import { requirementsFor, allKinds, lettersForEvidenceKind } from "@/core";
import { addFileToVault } from "@/lib/vault/addFileToVault";
import { runDocumentCheck, type CheckOutcome } from "@/lib/documentChecks/runCheck";
import { DocumentCheckPanel } from "@/components/DocumentCheckPanel";
import { APP } from "@/content/app";

export interface EvidenceSlotState {
  kind: EvidenceKind;
  present: boolean;
  disqualified?: boolean;
  vaultRecordId?: string;
}

export function useEvidenceSlots(kind: ViolationKind, sharedVault?: Vault) {
  const vault = React.useMemo(() => sharedVault ?? getBrowserVault(), [sharedVault]);
  const [slots, setSlots] = React.useState<EvidenceSlotState[]>([]);
  const [unlocked, setUnlocked] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const required = React.useMemo(() => requirementsFor(kind).filter((r) => r.required), [kind]);

  const refresh = React.useCallback(async () => {
    await openVaultForVisitor(vault);
    if (!vault.isUnlocked()) {
      setUnlocked(false);
      setSlots([]);
      return;
    }
    setUnlocked(true);
    const caseId = await getActiveCaseId(vault);
    const all = await vault.list({ caseId: caseId ?? "no-active-case" });
    const byKind = new Map<string, { id: string; name: string; createdAt: string }>();
    for (const r of all) {
      if (r.evidenceKind && !byKind.has(r.evidenceKind)) {
        byKind.set(r.evidenceKind, { id: r.id, name: r.name, createdAt: r.createdAt });
      }
    }
    const next: EvidenceSlotState[] = [];
    for (const req of required) {
      const hit = byKind.get(req.kind);
      next.push({
        kind: req.kind,
        present: Boolean(hit),
        ...(hit ? { vaultRecordId: hit.id } : {}),
      });
    }
    setSlots(next);
  }, [vault, required]);

  React.useEffect(() => {
    void refresh().catch(() => toast.error("Could not load evidence. Please retry."));
  }, [refresh]);
  const onUpload = async (kind: EvidenceKind, file: File) => {
    if (!vault.isUnlocked()) {
      throw new Error("Vault is locked — unlock it first on the Vault page");
    }
    setBusy(true);
    try {
      await addFileToVault(vault, file, {
        evidenceKind: kind,
        caseId: (await getActiveCaseId(vault)) ?? undefined,
      });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return { slots, unlocked, busy, refresh, onUpload, required };
}

export function EvidenceSlotPanel({
  kind,
  vault,
  onChange,
  priorityKinds = [],
}: {
  kind: ViolationKind;
  vault?: Vault;
  onChange?: (slots: EvidenceSlotState[]) => void;
  /**
   * Evidence kinds to surface first, with a "Amazon asked for this in their reply" badge —
   * typically `CaseLog.lastReply.extractedAsks` from a resubmission's reply analysis. Purely a
   * display hint: it never changes which evidence is actually required for `kind`.
   */
  priorityKinds?: EvidenceKind[];
}) {
  const { slots, unlocked, busy, refresh, onUpload, required } = useEvidenceSlots(kind, vault);

  /**
   * AA-41. Results are keyed by vault record id and held in memory only — a check describes a file
   * at a moment in time, and persisting a stale reading next to a document the seller has since
   * replaced would be worse than asking them to run it again.
   */
  const [checks, setChecks] = React.useState<Record<string, CheckOutcome>>({});
  const [checking, setChecking] = React.useState<string | null>(null);

  // The hook resolves the same fallback; resolving it once here keeps `check` independent of
  // whether a shared vault was passed in.
  const activeVault = React.useMemo(() => vault ?? getBrowserVault(), [vault]);

  const check = React.useCallback(
    async (recordId: string, evidenceKind: EvidenceKind) => {
      setChecking(recordId);
      try {
        const { record, bytes } = await activeVault.get(recordId);
        const outcome = await runDocumentCheck({
          kind,
          evidenceKind,
          bytes,
          mimeType: record.mimeType || "application/octet-stream",
        });
        setChecks((prev) => ({ ...prev, [recordId]: outcome }));
      } catch {
        setChecks((prev) => ({
          ...prev,
          [recordId]: {
            kind: "unavailable",
            message: "We could not open that file from your vault. Your document is unchanged.",
          },
        }));
      } finally {
        setChecking(null);
      }
    },
    [activeVault, kind],
  );
  const [letterDialogKind, setLetterDialogKind] = React.useState<EvidenceKind | null>(null);
  const letterTemplate = letterDialogKind ? lettersForEvidenceKind(letterDialogKind)[0] : undefined;

  React.useEffect(() => {
    if (onChange) onChange(slots);
  }, [slots, onChange]);

  if (!unlocked) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        <p>
          Encrypted vault is locked.{" "}
          <a
            href="/vault"
            className="text-primary underline underline-offset-2 hover:text-primary/80"
          >
            Unlock it
          </a>{" "}
          to attach evidence from your stored documents.
        </p>
      </Card>
    );
  }

  if (required.length === 0) {
    return (
      <Card className="p-4 text-sm text-muted-foreground">
        {APP.evidenceSlots.noneRequired}{" "}
        {APP.evidenceSlots.availableKinds.replace(
          "{kinds}",
          allKinds(kind)
            .map((k) => APP.evidenceKinds[k])
            .join(", "),
        )}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{APP.evidenceSlots.title}</h3>
        <Button
          size="sm"
          variant="ghost"
          className="h-11"
          onClick={() => void refresh()}
          disabled={busy}
        >
          <RefreshCw className="size-3" /> {APP.evidenceSlots.refresh}
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {[...required]
          .sort(
            (a, b) =>
              Number(priorityKinds.includes(b.kind)) - Number(priorityKinds.includes(a.kind)),
          )
          .map((req) => {
            const slot = slots.find((s) => s.kind === req.kind);
            const present = slot?.present;
            const isPriority = priorityKinds.includes(req.kind);
            const hasLetter = lettersForEvidenceKind(req.kind).length > 0;
            return (
              <li
                key={req.kind}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-sm font-medium">
                      {APP.evidenceKinds[req.kind]}
                    </span>
                    {isPriority && (
                      <Badge variant="warning" className="shrink-0 font-normal">
                        {APP.evidenceSlots.priorityBadge}
                      </Badge>
                    )}
                  </div>
                  <p className="line-clamp-2 text-xs text-muted-foreground">
                    {req.whyAmazonWantsIt}
                  </p>
                  {!present && hasLetter && (
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-xs"
                      onClick={() => setLetterDialogKind(req.kind)}
                    >
                      <Mail className="mr-1 size-3" aria-hidden="true" />
                      {APP.evidenceSlots.requestTemplate}
                    </Button>
                  )}
                </div>
                {present ? (
                  <EvidenceStatusBadge status="present" />
                ) : (
                  <SlotUploadButton
                    kind={req.kind}
                    disabled={busy}
                    onPick={(file) => onUpload(req.kind, file)}
                  />
                )}
                {/* AA-41: reading the file is only offered once there is a file to read. */}
                {present && slot?.vaultRecordId && (
                  <div className="mt-3 w-full">
                    <DocumentCheckPanel
                      outcome={checks[slot.vaultRecordId] ?? null}
                      busy={checking === slot.vaultRecordId}
                      onCheck={() => void check(slot.vaultRecordId!, req.kind)}
                    />
                  </div>
                )}
              </li>
            );
          })}
      </ul>
      <p className="text-xs text-muted-foreground">
        {APP.evidenceSlots.encryptedNote}{" "}
        <a
          href="/vault"
          className="text-primary underline underline-offset-2 hover:text-primary/80"
        >
          {APP.evidenceSlots.openVault}
        </a>
        <ExternalLink className="ml-0.5 inline size-3" />
      </p>

      <Dialog
        open={letterTemplate !== undefined}
        onOpenChange={(open) => !open && setLetterDialogKind(null)}
      >
        <DialogContent>
          {letterTemplate && (
            <>
              <DialogTitle>{letterTemplate.label}</DialogTitle>
              <DialogDescription>{letterTemplate.purpose}</DialogDescription>
              <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded border border-border bg-muted/20 p-3 font-mono text-xs text-foreground">
                {letterTemplate.body}
              </pre>
              <p className="text-xs text-muted-foreground">
                {APP.evidenceSlots.requestDialog.description}
              </p>
              <DialogFooter>
                <CopyButton
                  text={letterTemplate.body}
                  label={APP.evidenceSlots.requestDialog.copy}
                />
                <Button variant="outline" size="sm" onClick={() => setLetterDialogKind(null)}>
                  {APP.evidenceSlots.requestDialog.close}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SlotUploadButton({
  kind,
  disabled,
  onPick,
}: {
  kind: EvidenceKind;
  disabled: boolean;
  onPick: (file: File) => void;
}) {
  const ref = React.useRef<HTMLInputElement>(null);
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="h-11"
        onClick={() => ref.current?.click()}
        disabled={disabled}
      >
        <Plus className="size-3" /> Attach
      </Button>
      <input
        ref={ref}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f)
            Promise.resolve(onPick(f)).catch(() =>
              toast.error("Could not attach the file. Please retry."),
            );
          e.target.value = "";
        }}
      />
      <span className="sr-only">{kind}</span>
    </>
  );
}
