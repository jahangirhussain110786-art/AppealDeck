"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Lock,
  Unlock,
  Plus,
  Trash2,
  Eye,
  Download,
  ShieldCheck,
  RefreshCw,
  Cloud,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileBox,
  Search,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  browserWebCrypto,
  getBrowserVault,
  pushVaultToCloud,
  pullVaultFromCloud,
} from "@/lib/vault/browser";
import { VAULT_ENVELOPE_VERSION, VaultCryptoError } from "@/core/vault/envelope";
import { asBase64 } from "@/lib/vault/browser";
import type { AddDocumentInput, Vault, VaultListItem, VaultStatus } from "@/core/vault/vault";
import { EvidenceStatusBadge } from "@/components/EvidenceStatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { APP } from "@/content/app";
import type { EvidenceKind } from "@/core/evidenceModel";
import { LocalFirstBadge } from "@/components/LocalFirstBadge";
import { VaultGate } from "@/components/VaultGate";

type Phase =
  | { kind: "loading" }
  | { kind: "needs_init" }
  | { kind: "locked"; status: Extract<VaultStatus, { state: "locked" }> }
  | { kind: "unlocked" };

function useVault(): Vault {
  const ref = React.useRef<Vault | null>(null);
  if (ref.current === null) {
    ref.current = getBrowserVault();
  }
  return ref.current;
}

function mimeTypeToIcon(mimeType: string): React.ReactNode {
  if (mimeType.startsWith("image/")) return <FileImage className="h-5 w-5 text-muted-foreground" />;
  if (mimeType.includes("pdf")) return <FileText className="h-5 w-5 text-muted-foreground" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv"))
    return <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />;
  return <FileBox className="h-5 w-5 text-muted-foreground" />;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1_048_576).toFixed(1)} MB`;
}

const EVIDENCE_KINDS: EvidenceKind[] = [
  "supplier_invoice",
  "brand_authorization",
  "rights_owner_retraction",
  "identity_doc",
  "financial_instrument_doc",
  "sourcing_doc",
  "listing_fix_proof",
  "disposal_or_recall_proof",
  "metric_export",
  "sop_document",
  "other",
];

function evidenceKindLabel(kind: EvidenceKind): string {
  return kind.replace(/_/g, " ");
}

export default function VaultView({ userId }: { userId: string }) {
  const vault = useVault();
  const [items, setItems] = React.useState<VaultListItem[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterKind, setFilterKind] = React.useState<EvidenceKind | "all">("all");
  const [deleteTarget, setDeleteTarget] = React.useState<VaultListItem | null>(null);

  const refresh = React.useCallback(async () => {
    const list = await vault.list(filterKind !== "all" ? { evidenceKind: filterKind } : undefined);
    setItems(list);
  }, [vault, filterKind]);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await vault.open();
        const initialized = await vault.isInitialized();
        if (!cancelled && initialized) {
          const list = await vault.list();
          if (!cancelled) setItems(list);
        }
      } catch (e) {
        toast.error("Vault failed to open", {
          description: e instanceof Error ? e.message : "Unknown error",
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vault]);

  const onLock = () => {
    vault.lock();
    setItems([]);
  };

  const onAddFile = async (file: File) => {
    setBusy(true);
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      const input: AddDocumentInput = {
        name: file.name,
        mimeType: file.type || "application/octet-stream",
        data: buf,
        kind: "document",
      };
      await vault.add(input);
      toast.success(`Added "${file.name}"`, {
        description: "Encrypted on this device. Ready to attach to a case.",
      });
      setItems(await vault.list());
    } catch (e) {
      toast.error("Add failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  };

  const onView = async (id: string) => {
    try {
      const { bytes, record } = await vault.get(id);
      if (record.mimeType.startsWith("text/") || record.mimeType === "application/json") {
        const text = new TextDecoder().decode(bytes);
        const trimmed = text.length > 2000 ? `${text.slice(0, 2000)}…` : text;
        toast(`Preview of ${record.name}`, {
          description: `${record.sizeBytes} bytes —\n\n${trimmed}`,
          duration: 10_000,
        });
      } else {
        toast.info(`${record.name}`, {
          description: `Binary file, ${record.sizeBytes} bytes. Use download to save.`,
        });
      }
    } catch (e) {
      toast.error("Could not decrypt", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  const onDownload = async (id: string) => {
    try {
      const { bytes, record } = await vault.get(id);
      const blob = new Blob([new Uint8Array(bytes)], { type: record.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = record.name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Downloaded ${record.name}`);
    } catch (e) {
      toast.error("Download failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await vault.delete(deleteTarget.id);
      await refresh();
      toast.success("Record deleted");
    } catch (e) {
      toast.error("Delete failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const onSyncUp = async () => {
    setBusy(true);
    try {
      const r = await pushVaultToCloud(vault, userId);
      toast.success("Vault synced", {
        description: `${r.uploaded} snapshot uploaded${r.errors ? `, ${r.errors} errors` : ""}.`,
      });
    } catch (e) {
      toast.error("Sync failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setBusy(false);
    }
  };

  const displayItems = items.filter((it) => it.kind !== "case");

  const filteredItems = displayItems.filter(
    (it) =>
      (it.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (it.evidenceKind ?? "").toLowerCase().includes(searchTerm.toLowerCase())) &&
      (filterKind === "all" || it.evidenceKind === filterKind),
  );

  const totalBytes = filteredItems.reduce((sum, it) => sum + it.sizeBytes, 0);

  return (
    <VaultGate
      vault={vault}
      onUnlocked={() => {
        void refresh();
      }}
    >
      {() => (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Your encrypted evidence</h2>
              <p className="text-sm text-muted-foreground">
                Envelope v{VAULT_ENVELOPE_VERSION}, AES-GCM, key derived from your passphrase on
                this device.
              </p>
            </div>
            <LocalFirstBadge />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder={APP.vault.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterKind}
                onChange={(e) => setFilterKind(e.target.value as typeof filterKind)}
                className="text-sm rounded-md border border-border bg-background px-2 py-1"
                aria-label="Filter by evidence kind"
              >
                <option value="all">All evidence</option>
                {EVIDENCE_KINDS.map((k) => (
                  <option key={k} value={k}>
                    {evidenceKindLabel(k)}
                  </option>
                ))}
              </select>
              <Button onClick={() => void refresh()} variant="outline" size="sm" disabled={busy}>
                <RefreshCw className="size-4" />
              </Button>
              <Button onClick={onSyncUp} variant="outline" size="sm" disabled={busy}>
                <Cloud className="size-4" />
              </Button>
              <Button onClick={onLock} variant="outline" size="sm">
                <Lock className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredItems.length} record of {displayItems.length}
              {filteredItems.length !== displayItems.length && ` of ${displayItems.length}`}
            </span>
            <span className="tabular-nums">{formatBytes(totalBytes)} total</span>
          </div>

          <FileDropZone onFile={onAddFile} disabled={busy} />

          {displayItems.length === 0 ? (
            <Card className="p-6">
              <CardContent className="pt-0">
                <EmptyState
                  icon={FileText}
                  title={APP.vault.teachingEmpty.title}
                  description={APP.vault.teachingEmpty.description}
                />
              </CardContent>
            </Card>
          ) : filteredItems.length === 0 ? (
            <Card className="p-6">
              <CardContent className="pt-0">
                <EmptyState
                  icon={FileText}
                  title="No files match"
                  description={
                    searchTerm ? `No results for "${searchTerm}"` : "Adjust your filter."
                  }
                  action={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("");
                        setFilterKind("all");
                      }}
                    >
                      Clear search
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <ul className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {filteredItems.map((it) => (
                  <motion.li
                    key={it.id}
                    layout
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    transition={{ duration: 0.15 }}
                  >
                    <Card className="flex items-center justify-between p-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {mimeTypeToIcon(it.mimeType)}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 truncate text-sm font-medium">
                            <span>{it.name}</span>
                            {it.evidenceKind && <EvidenceStatusBadge status="present" />}
                            <Badge variant="outline">{APP.vault.encryptedBadge}</Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {it.mimeType} · {formatBytes(it.sizeBytes)} ·{" "}
                            {new Date(it.createdAt)
                              .toLocaleString(undefined, {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                                hour: "2-digit",
                                minute: "2-digit",
                              })
                              .replace(/\s/g, " ")}
                            {it.evidenceKind
                              ? ` · ${evidenceKindLabel(it.evidenceKind as EvidenceKind)}`
                              : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void onView(it.id)}
                          aria-label="View"
                        >
                          <Eye className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => void onDownload(it.id)}
                          aria-label="Download"
                        >
                          <Download className="size-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => setDeleteTarget(it)}
                          aria-label="Delete"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </Card>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          <p className="text-xs text-muted-foreground">
            Case file and logs are stored separately. Unlock your case on the dashboard.
          </p>

          <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
            <DialogContent>
              {deleteTarget && (
                <>
                  <DialogTitle>
                    {APP.vault.deleteConfirm.title.replace("{name}", deleteTarget.name)}
                  </DialogTitle>
                  <DialogDescription>{APP.vault.deleteConfirm.description}</DialogDescription>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDeleteTarget(null)}>
                      {APP.vault.deleteConfirm.cancel}
                    </Button>
                    <Button variant="destructive" onClick={() => void confirmDelete()}>
                      {APP.vault.deleteConfirm.confirm}
                    </Button>
                  </DialogFooter>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </VaultGate>
  );
}

function FileDropZone({
  onFile,
  disabled,
}: {
  onFile: (file: File) => void | Promise<void>;
  disabled: boolean;
}) {
  const [dragging, setDragging] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  return (
    <Card
      className={`flex flex-col items-center justify-center gap-2 border-dashed p-6 text-sm transition-colors ${
        dragging ? "border-primary bg-accent/10" : "border-border"
      }`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (disabled) return;
        const f = e.dataTransfer.files?.[0];
        if (f) void onFile(f);
      }}
    >
      <Plus className="size-5 text-muted-foreground" />
      <p className="text-muted-foreground">Drop a file here, or</p>
      <Button
        variant="outline"
        size="sm"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        Choose a file
      </Button>
      <input
        ref={inputRef}
        type="file"
        hidden
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void onFile(f);
          e.target.value = "";
        }}
      />
      <p className="text-xs text-muted-foreground">
        Max 10 MB per file. Encrypted on this device before upload.
      </p>
    </Card>
  );
}
