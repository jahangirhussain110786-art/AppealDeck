"use client";

import * as React from "react";
import { Plus, ExternalLink, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EvidenceStatusBadge } from "@/components/EvidenceStatusBadge";
import { getBrowserVault } from "@/lib/vault/browser";
import type { EvidenceKind, ViolationKind } from "@/core";
import { requirementsFor, allKinds } from "@/core";
import { addFileToVault } from "@/lib/vault/addFileToVault";
import { APP } from "@/content/app";

export interface EvidenceSlotState {
  kind: EvidenceKind;
  present: boolean;
  disqualified?: boolean;
  vaultRecordId?: string;
}

export function useEvidenceSlots(kind: ViolationKind) {
  const vault = React.useMemo(() => getBrowserVault(), []);
  const [slots, setSlots] = React.useState<EvidenceSlotState[]>([]);
  const [unlocked, setUnlocked] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  const required = React.useMemo(() => requirementsFor(kind).filter((r) => r.required), [kind]);

  const refresh = React.useCallback(async () => {
    if (!vault.isUnlocked()) {
      setUnlocked(false);
      setSlots([]);
      return;
    }
    setUnlocked(true);
    const all = await vault.list();
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
    void refresh();
  }, [refresh]);
  const onUpload = async (kind: EvidenceKind, file: File) => {
    if (!vault.isUnlocked()) {
      throw new Error("Vault is locked — unlock it first on the Vault page");
    }
    setBusy(true);
    try {
      await addFileToVault(vault, file, { evidenceKind: kind });
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  return { slots, unlocked, busy, refresh, onUpload, required };
}

export function EvidenceSlotPanel({
  kind,
  onChange,
}: {
  kind: ViolationKind;
  onChange?: (slots: EvidenceSlotState[]) => void;
}) {
  const { slots, unlocked, busy, refresh, onUpload, required } = useEvidenceSlots(kind);

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
        {required.map((req) => {
          const slot = slots.find((s) => s.kind === req.kind);
          const present = slot?.present;
          return (
            <li
              key={req.kind}
              className="flex items-center justify-between gap-2 rounded-md border border-border bg-card p-2"
            >
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{APP.evidenceKinds[req.kind]}</div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{req.whyAmazonWantsIt}</p>
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
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
      <span className="sr-only">{kind}</span>
    </>
  );
}
