"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  Lock,
  Trash2,
  Eye,
  Download,
  RefreshCw,
  Cloud,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileBox,
  Search,
  X,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getBrowserVault, pushVaultToCloud } from "@/lib/vault/browser";
import { FileDropZone } from "@/components/FileDropZone";
import { VAULT_ENVELOPE_VERSION } from "@/core/vault/envelope";
import type { AddDocumentInput, Vault, VaultListItem } from "@/core/vault/vault";
import { EvidenceStatusBadge } from "@/components/EvidenceStatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { APP } from "@/content/app";
import type { EvidenceKind } from "@/core/evidenceModel";
import { LocalFirstBadge } from "@/components/LocalFirstBadge";
import { VaultGate } from "@/components/VaultGate";
import { Label } from "@/components/ui/label";
import { formatDate, formatBytes } from "@/lib/format";

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
  const [selectedEvidenceKind, setSelectedEvidenceKind] = React.useState<EvidenceKind>("other");
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
        evidenceKind: selectedEvidenceKind,
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
              <h2 className="text-lg font-semibold">{APP.vault.title}</h2>
              <p className="text-sm text-muted-foreground">{APP.vault.subtitle}</p>
            </div>
            <div className="flex items-center">
              <LocalFirstBadge />
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex items-center rounded p-1 text-muted-foreground hover:text-foreground">
                      <Info className="h-4 w-4" aria-hidden />
                    </span>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs text-xs">
                    {APP.vault.cryptoDetails.replace("{version}", String(VAULT_ENVELOPE_VERSION))}
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
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
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={() => void refresh()}
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      aria-label={APP.vault.actions.refresh}
                    >
                      <RefreshCw className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{APP.vault.actions.refresh}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onSyncUp}
                      variant="outline"
                      size="sm"
                      disabled={busy}
                      aria-label={APP.vault.actions.sync}
                    >
                      <Cloud className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{APP.vault.actions.sync}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={onLock}
                      variant="outline"
                      size="sm"
                      aria-label={APP.vault.actions.lock}
                    >
                      <Lock className="size-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{APP.vault.actions.lock}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredItems.length === displayItems.length ? (
                <span data-tn>{displayItems.length}</span>
              ) : (
                <span>
                  <span data-tn>{filteredItems.length}</span> of{" "}
                  <span data-tn>{displayItems.length}</span>
                </span>
              )}{" "}
              record{displayItems.length === 1 ? "" : "s"}
            </span>
            <span className="tabular-nums">{formatBytes(totalBytes)} total</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="evidence-kind-select">{APP.vault.evidenceKindLabel}</Label>
            <select
              id="evidence-kind-select"
              value={selectedEvidenceKind}
              onChange={(e) => setSelectedEvidenceKind(e.target.value as EvidenceKind)}
              className="w-full rounded-md border border-border bg-background px-2 py-1 text-sm"
            >
              {EVIDENCE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {evidenceKindLabel(k)}
                </option>
              ))}
            </select>
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
                  title={APP.vault.noResults}
                  description={
                    searchTerm
                      ? `${APP.vault.noResultsDesc} "${searchTerm}"`
                      : APP.vault.noResultsDesc
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
                      {APP.vault.clearSearch}
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
                            <span data-tn>{formatDate(it.createdAt)}</span>
                            {it.evidenceKind
                              ? ` · ${APP.evidenceKinds[it.evidenceKind as EvidenceKind] ?? evidenceKindLabel(it.evidenceKind as EvidenceKind)}`
                              : ""}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void onView(it.id)}
                                aria-label={APP.vault.actions.view}
                              >
                                <Eye className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{APP.vault.actions.view}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => void onDownload(it.id)}
                                aria-label={APP.vault.actions.download}
                              >
                                <Download className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{APP.vault.actions.download}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteTarget(it)}
                                aria-label={`${APP.vault.actions.delete} ${it.name}`}
                              >
                                <Trash2 className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{`${APP.vault.actions.delete} ${it.name}`}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </Card>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}

          <p className="text-xs text-muted-foreground">{APP.vault.caseRecordsHidden}</p>

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
