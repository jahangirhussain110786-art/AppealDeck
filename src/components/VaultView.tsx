"use client";

import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
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
  KeyRound,
  FolderOpen,
  Upload,
  Shield,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getBrowserVault, pushVaultToCloud, pullVaultFromCloud } from "@/lib/vault/browser";
import { storagePersistenceState, type StoragePersistence } from "@/lib/vault/persistence";
import { FileDropZone } from "@/components/FileDropZone";
import { VAULT_ENVELOPE_VERSION } from "@/core/vault/envelope";
import type { Vault, VaultListItem } from "@/core/vault/vault";
import { EvidenceStatusBadge } from "@/components/EvidenceStatusBadge";
import { EmptyState } from "@/components/EmptyState";
import { VaultDoorIllustration } from "@/components/illustrations/VaultDoorIllustration";
import { APP } from "@/content/app";
import type { EvidenceKind } from "@/core/evidenceModel";
import { EVIDENCE_KINDS as ALL_EVIDENCE_KINDS } from "@/core/workspace";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { IconTile, DetailDisclosure } from "@/components/workspace/WorkspaceVisuals";
import { VaultGate } from "@/components/VaultGate";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDateTime, formatBytes } from "@/lib/format";
import { getActiveCaseId } from "@/lib/caseStore";
import { addFileToVault } from "@/lib/vault/addFileToVault";

function useVault(): Vault {
  const ref = React.useRef<Vault | null>(null);
  if (ref.current === null) {
    ref.current = getBrowserVault();
  }
  return ref.current;
}

function mimeTypeToIcon(mimeType: string): React.ReactNode {
  if (mimeType.startsWith("image/")) return <FileImage className="size-5" />;
  if (mimeType.includes("pdf")) return <FileText className="size-5" />;
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel") || mimeType.includes("csv"))
    return <FileSpreadsheet className="size-5" />;
  return <FileBox className="size-5" />;
}

// The tagging menu offers every kind, from the one registry (`core/workspace`) — a hand-kept list
// here fell behind the day a kind was added.
const EVIDENCE_KINDS: readonly EvidenceKind[] = ALL_EVIDENCE_KINDS;

function evidenceKindLabel(kind: EvidenceKind): string {
  return kind.replace(/_/g, " ");
}

export default function VaultView({ userId }: { userId: string }) {
  const vault = useVault();
  const [gateRevision, setGateRevision] = React.useState(0);
  const [persistence, setPersistence] = React.useState<StoragePersistence | null>(null);
  const [fileLoading, setFileLoading] = React.useState(true);
  const [fileError, setFileError] = React.useState(false);
  const [items, setItems] = React.useState<VaultListItem[]>([]);
  const [backupPassphrase, setBackupPassphrase] = React.useState("");
  const [recoveryPassphrase, setRecoveryPassphrase] = React.useState("");
  const [legacyAvailable, setLegacyAvailable] = React.useState(false);
  const [busy, setBusy] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [filterKind, setFilterKind] = React.useState<EvidenceKind | "all">("all");
  const [selectedEvidenceKind, setSelectedEvidenceKind] = React.useState<EvidenceKind>("other");
  const [deleteTarget, setDeleteTarget] = React.useState<VaultListItem | null>(null);

  const [keyMode, setKeyMode] = React.useState<"device" | "passphrase" | null>(null);
  const [showProtectDialog, setShowProtectDialog] = React.useState(false);
  const [protectPassphrase, setProtectPassphrase] = React.useState("");
  const [protectConfirm, setProtectConfirm] = React.useState("");
  const [protectBusy, setProtectBusy] = React.useState(false);
  const [protectError, setProtectError] = React.useState<string | null>(null);
  const [showSwitchDialog, setShowSwitchDialog] = React.useState(false);
  const [switchBusy, setSwitchBusy] = React.useState(false);

  const [previewTarget, setPreviewTarget] = React.useState<VaultListItem | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [previewText, setPreviewText] = React.useState<string | null>(null);

  const refresh = React.useCallback(async () => {
    setFileLoading(true);
    setFileError(false);
    try {
      setItems(await vault.list());
    } catch {
      setFileError(true);
    } finally {
      setFileLoading(false);
    }
  }, [vault]);

  const refreshMode = React.useCallback(async () => {
    const meta = await vault.rawMeta();
    setKeyMode(meta?.mode.kind ?? null);
  }, [vault]);

  // Report, rather than assume, whether this browser will keep the vault while a case waits.
  React.useEffect(() => {
    let cancelled = false;
    void storagePersistenceState().then((state) => {
      if (!cancelled) setPersistence(state);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  React.useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await vault.open();
        const legacy = getBrowserVault("appealdeck-vault");
        await legacy.open();
        setLegacyAvailable(await legacy.isInitialized());
        await legacy.close();
        const initialized = await vault.isInitialized();
        if (!cancelled && initialized) {
          const list = await vault.list();
          if (!cancelled) {
            setItems(list);
            setFileLoading(false);
          }
          if (!cancelled) await refreshMode();
        }
      } catch (e) {
        if (!cancelled) {
          setFileError(true);
          setFileLoading(false);
        }
        toast.error(APP.dashboard.toasts.vaultOpenFailed, {
          description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
        });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [vault, refreshMode]);

  const onLock = () => {
    vault.lock();
    setItems([]);
    setGateRevision((value) => value + 1);
  };

  const handleProtectSubmit = async () => {
    if (protectPassphrase.length < 8 || protectPassphrase !== protectConfirm || protectBusy) return;
    setProtectBusy(true);
    setProtectError(null);
    try {
      await vault.relockWithPassphrase(protectPassphrase);
      setProtectPassphrase("");
      setProtectConfirm("");
      setShowProtectDialog(false);
      setKeyMode("passphrase");
      toast.success(APP.vault.security.protectSuccess, {
        description: APP.vault.security.protectSuccessDesc,
      });
    } catch (e) {
      setProtectError(e instanceof Error ? e.message : APP.vault.security.protectError);
    } finally {
      setProtectBusy(false);
    }
  };

  const handleSwitchToDevice = async () => {
    setSwitchBusy(true);
    try {
      await vault.relockWithDeviceKey();
      setShowSwitchDialog(false);
      setKeyMode("device");
      toast.success(APP.vault.security.switchSuccess, {
        description: APP.vault.security.switchSuccessDesc,
      });
    } catch (e) {
      toast.error(APP.vault.security.switchError, {
        description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
      });
    } finally {
      setSwitchBusy(false);
    }
  };

  const onAddFile = async (file: File): Promise<boolean> => {
    setBusy(true);
    try {
      const result = await addFileToVault(vault, file, {
        evidenceKind: selectedEvidenceKind,
        caseId: (await getActiveCaseId(vault)) ?? undefined,
      });
      setItems(await vault.list());
      // A duplicate already gets its own informational toast from addFileToVault — nothing new
      // was uploaded, so FileDropZone shouldn't show a fresh "uploaded" confirmation for it too.
      return result.status === "added";
    } catch (e) {
      toast.error(APP.interview.fileUpload.addFailed, {
        description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
      });
      return false;
    } finally {
      setBusy(false);
    }
  };

  const openPreview = async (item: VaultListItem) => {
    try {
      const { bytes, record } = await vault.get(item.id);
      setPreviewUrl(null);
      setPreviewText(null);
      if (record.mimeType.startsWith("image/")) {
        const url = URL.createObjectURL(
          new Blob([new Uint8Array(bytes)], { type: record.mimeType }),
        );
        setPreviewUrl(url);
      } else if (record.mimeType === "application/pdf") {
        const url = URL.createObjectURL(
          new Blob([new Uint8Array(bytes)], { type: record.mimeType }),
        );
        setPreviewUrl(url);
      } else if (record.mimeType.startsWith("text/") || record.mimeType === "application/json") {
        const text = new TextDecoder().decode(bytes);
        const capped = text.length > 200_000 ? text.slice(0, 200_000) : text;
        setPreviewText(capped);
      }
      setPreviewTarget(item);
    } catch (e) {
      toast.error(APP.dashboard.toasts.decryptFailed, {
        description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
      });
    }
  };

  const onDownload = async (id: string) => {
    try {
      const { bytes, record } = await vault.get(id);
      const blob = new Blob([new Uint8Array(bytes)], { type: record.mimeType });

      if (
        typeof window !== "undefined" &&
        typeof (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker ===
          "function"
      ) {
        try {
          const handle = await (
            window as unknown as {
              showSaveFilePicker: (opts: {
                suggestedName: string;
                types: Record<string, { accept: string[] }>;
              }) => Promise<{
                createWritable: () => Promise<{
                  write: (data: Blob) => Promise<void>;
                  close: () => Promise<void>;
                }>;
              }>;
            }
          ).showSaveFilePicker({
            suggestedName: record.name,
            types: { [record.mimeType]: { accept: [record.mimeType] } },
          });
          const writable = await handle.createWritable();
          await writable.write(blob);
          await writable.close();
          toast.success(APP.dashboard.toasts.downloadSuccessSaved.replace("{name}", record.name));
        } catch (e) {
          if (e instanceof DOMException && e.name === "AbortError") {
            return;
          }
          throw e;
        }
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = record.name;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        toast.info(`${APP.dashboard.toasts.downloadSuccess} ${record.name}`);
      }
    } catch (e) {
      toast.error(APP.dashboard.toasts.downloadFailed, {
        description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
      });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await vault.delete(deleteTarget.id);
      await refresh();
      toast.success(APP.dashboard.toasts.recordDeleted);
    } catch (e) {
      toast.error(APP.dashboard.toasts.deleteFailed, {
        description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
      });
    } finally {
      setDeleteTarget(null);
    }
  };

  const onSyncUp = async () => {
    setBusy(true);
    try {
      const r = await pushVaultToCloud(vault, userId, { backupPassphrase });
      setBackupPassphrase("");
      toast.success(APP.dashboard.toasts.vaultSynced, {
        description: `${r.uploaded} snapshot uploaded${r.errors ? `, ${r.errors} errors` : ""}.`,
      });
    } catch (e) {
      toast.error(APP.dashboard.toasts.syncFailed, {
        description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
      });
    } finally {
      setBusy(false);
    }
  };

  const restore = async (legacy = false) => {
    setBusy(true);
    try {
      if (legacy) {
        const source = getBrowserVault("appealdeck-vault");
        await source.open();
        try {
          await vault.copyIntoEmpty(source);
        } finally {
          await source.close();
        }
      } else {
        await pullVaultFromCloud(vault, userId, {
          sourcePassphrase: recoveryPassphrase,
          destinationPassphrase: recoveryPassphrase,
        });
      }
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Restore failed");
    } finally {
      setBusy(false);
      setRecoveryPassphrase("");
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
      key={gateRevision}
      vault={vault}
      deviceMode
      autoUnlock
      onUnlocked={() => {
        void refresh();
        void refreshMode();
      }}
      onLocked={() => void refresh()}
    >
      {() => (
        <div className="flex flex-col gap-4">
          <Tabs defaultValue="files" className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList
                aria-label="Vault tools"
                className="grid h-auto w-full grid-cols-3 gap-1 rounded-lg p-1 sm:w-auto"
              >
                <TabsTrigger
                  value="files"
                  className="flex min-h-10 items-center justify-center gap-2"
                >
                  <FolderOpen className="size-4" aria-hidden />
                  {APP.vault.tabs.files}
                </TabsTrigger>
                <TabsTrigger
                  value="backup"
                  className="flex min-h-10 items-center justify-center gap-2"
                >
                  <Cloud className="size-4" aria-hidden />
                  {APP.vault.tabs.backup}
                </TabsTrigger>
                <TabsTrigger
                  value="security"
                  className="flex min-h-10 items-center justify-center gap-2"
                >
                  <Shield className="size-4" aria-hidden />
                  {APP.vault.tabs.security}
                </TabsTrigger>
              </TabsList>
              <span className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Lock className="size-3.5 text-primary" aria-hidden />
                {APP.vault.localLabel}
              </span>
            </div>
            <TabsContent value="files" className="mt-5">
              <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
                <section className="min-w-0 space-y-4" aria-label={APP.vault.libraryTitle}>
                  <h2 className="text-base font-semibold">{APP.vault.libraryTitle}</h2>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                      <div className="relative min-w-0 max-w-sm flex-1">
                        <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                          type="search"
                          placeholder={APP.vault.searchPlaceholder}
                          aria-label={APP.vault.searchPlaceholder}
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8 pr-9"
                        />
                        {searchTerm && (
                          <button
                            type="button"
                            onClick={() => setSearchTerm("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded text-muted-foreground hover:text-foreground"
                            aria-label="Clear search"
                          >
                            <X className="size-3" />
                          </button>
                        )}
                      </div>
                      <NativeSelect
                        aria-label={APP.vault.filterLabel}
                        value={filterKind}
                        onChange={(e) => setFilterKind(e.target.value as EvidenceKind | "all")}
                        className="sm:w-56"
                      >
                        <option value="all">{APP.vault.allTypes}</option>
                        {EVIDENCE_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {APP.evidenceKinds[k]}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              onClick={() => void refresh()}
                              variant="outline"
                              size="icon-sm"
                              disabled={busy || fileLoading}
                              aria-label={APP.vault.actions.refresh}
                            >
                              <RefreshCw className="size-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{APP.vault.actions.refresh}</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      {keyMode === "passphrase" && (
                        <TooltipProvider delayDuration={200}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                onClick={onLock}
                                variant="outline"
                                size="icon-sm"
                                aria-label={APP.vault.actions.lock}
                              >
                                <Lock className="size-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>{APP.vault.actions.lock}</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
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

                  {fileLoading ? (
                    <div role="status" aria-label={APP.vault.loading} className="space-y-3">
                      <Skeleton className="h-24 w-full" />
                      <Skeleton className="h-24 w-full" />
                    </div>
                  ) : fileError ? (
                    <Alert variant="warning">
                      <AlertDescription>
                        {APP.vault.loadError}
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3 block"
                          onClick={() => void refresh()}
                        >
                          {APP.vault.actions.refresh}
                        </Button>
                      </AlertDescription>
                    </Alert>
                  ) : displayItems.length === 0 ? (
                    <Card className="p-6">
                      <CardContent className="flex flex-col items-center gap-3 pt-0 text-center">
                        <VaultDoorIllustration size={52} />
                        <p className="text-base font-semibold text-foreground">
                          {APP.vault.teachingEmpty.title}
                        </p>
                        <p className="max-w-sm text-sm text-muted-foreground">
                          {APP.vault.teachingEmpty.description}
                        </p>
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
                            <Card className="flex flex-col items-stretch gap-3 rounded-row p-4 sm:flex-row sm:items-center sm:justify-between">
                              <div className="flex min-w-0 items-center gap-3">
                                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-info/10 text-info">
                                  {mimeTypeToIcon(it.mimeType)}
                                </div>
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2 text-sm font-medium">
                                    <span className="break-all">{it.name}</span>
                                    {it.evidenceKind && <EvidenceStatusBadge status="present" />}
                                    <Badge variant="outline">{APP.vault.encryptedBadge}</Badge>
                                  </div>
                                  <div className="mt-1 break-words text-xs leading-relaxed tabular-nums text-muted-foreground">
                                    {it.mimeType} · {formatBytes(it.sizeBytes)} ·{" "}
                                    <span data-tn>{formatDateTime(it.createdAt)}</span>
                                    {it.evidenceKind
                                      ? ` · ${APP.evidenceKinds[it.evidenceKind as EvidenceKind] ?? evidenceKindLabel(it.evidenceKind as EvidenceKind)}`
                                      : ""}
                                  </div>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center justify-end gap-1">
                                <TooltipProvider delayDuration={200}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon-sm"
                                        variant="ghost"
                                        onClick={() => void openPreview(it)}
                                        aria-label={`${APP.vault.actions.view} ${it.name}`}
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
                                        size="icon-sm"
                                        variant="ghost"
                                        onClick={() => void onDownload(it.id)}
                                        aria-label={`${APP.vault.actions.download} ${it.name}`}
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
                                        size="icon-sm"
                                        variant="ghost"
                                        className="text-muted-foreground hover:text-destructive"
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
                </section>
                <aside className="min-w-0 rounded-xl border border-border/80 bg-card p-5 lg:sticky lg:top-20">
                  <div className="mb-4 flex items-center gap-3">
                    <IconTile icon={Upload} tone="info" />
                    <h2 className="text-base font-semibold">{APP.vault.addTitle}</h2>
                  </div>
                  <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
                    {APP.vault.addDescription}
                  </p>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="evidence-kind-select">{APP.vault.evidenceKindLabel}</Label>
                      <NativeSelect
                        id="evidence-kind-select"
                        value={selectedEvidenceKind}
                        onChange={(e) => setSelectedEvidenceKind(e.target.value as EvidenceKind)}
                      >
                        {EVIDENCE_KINDS.map((k) => (
                          <option key={k} value={k}>
                            {APP.evidenceKinds[k]}
                          </option>
                        ))}
                      </NativeSelect>
                    </div>

                    <FileDropZone onFile={onAddFile} disabled={busy} />
                  </div>
                </aside>
              </div>
            </TabsContent>
            <TabsContent value="backup" className="mt-5 space-y-4">
              <div className="grid items-start gap-5 md:grid-cols-2">
                <Card className="space-y-4 p-5 sm:p-6">
                  <IconTile icon={Cloud} tone="info" />
                  <h2 className="text-lg font-semibold">{APP.vault.backup.title}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {APP.vault.backup.description}
                  </p>
                  <p className="rounded-lg bg-surface-2 p-3 text-xs leading-relaxed text-muted-foreground">
                    {APP.vault.backup.disclosure}
                  </p>
                  {keyMode === "device" && (
                    <div className="space-y-2">
                      <Label htmlFor="backup-passphrase">{APP.vault.backup.passphraseLabel}</Label>
                      <PasswordInput
                        id="backup-passphrase"
                        autoComplete="new-password"
                        value={backupPassphrase}
                        onChange={(e) => setBackupPassphrase(e.target.value)}
                        placeholder={APP.vault.backup.passphraseHint}
                      />
                      <p className="text-xs leading-relaxed text-muted-foreground">
                        {APP.vault.backup.passphraseHelp}
                      </p>
                    </div>
                  )}
                  <Button
                    onClick={onSyncUp}
                    disabled={
                      busy || !keyMode || (keyMode === "device" && backupPassphrase.length < 8)
                    }
                    className="h-auto min-h-11 whitespace-normal py-2"
                  >
                    <Cloud className="size-4" aria-hidden />
                    {busy ? APP.vault.backup.working : APP.vault.backup.save}
                  </Button>
                </Card>
                <Card className="space-y-4 p-5 sm:p-6">
                  <IconTile icon={Download} />
                  <h2 className="text-lg font-semibold">{APP.vault.backup.restoreTitle}</h2>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {APP.vault.backup.restoreDescription}
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="restore-passphrase">{APP.vault.backup.restorePassphrase}</Label>
                    <PasswordInput
                      id="restore-passphrase"
                      autoComplete="current-password"
                      value={recoveryPassphrase}
                      onChange={(e) => setRecoveryPassphrase(e.target.value)}
                    />
                  </div>
                  <Button
                    variant="outline"
                    disabled={busy || recoveryPassphrase.length < 8}
                    onClick={() => void restore()}
                    className="h-auto min-h-11 whitespace-normal py-2"
                  >
                    {busy ? APP.vault.backup.working : APP.vault.backup.restore}
                  </Button>
                </Card>
              </div>
              {legacyAvailable && (
                <DetailDisclosure title={APP.vault.backup.legacyTitle}>
                  <p>{APP.vault.backup.legacyDescription}</p>
                  <Button
                    variant="outline"
                    className="mt-4 h-auto min-h-11 whitespace-normal py-2"
                    disabled={busy}
                    onClick={() => {
                      if (
                        window.confirm(
                          "I confirm the older files on this browser belong to me. Copy them into my empty account vault?",
                        )
                      )
                        void restore(true);
                    }}
                  >
                    {APP.vault.backup.legacyAction}
                  </Button>
                </DetailDisclosure>
              )}
            </TabsContent>
            <TabsContent value="security" className="mt-5">
              <Card className="max-w-tool space-y-5 p-5 sm:p-6">
                <div className="flex items-center gap-3">
                  <IconTile icon={KeyRound} />
                  <h2 className="text-lg font-semibold">{APP.vault.tabs.security}</h2>
                </div>
                <p className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                  {keyMode === "passphrase"
                    ? APP.vault.security.passphraseModeDesc
                    : APP.vault.security.deviceModeDesc}
                </p>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border/70 bg-surface-2/50 p-4 text-sm text-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <KeyRound className="size-3.5" aria-hidden />
                    {keyMode === "passphrase"
                      ? APP.vault.security.passphraseModeLabel
                      : APP.vault.security.deviceModeLabel}
                  </span>
                  {keyMode === "passphrase" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto min-h-10 whitespace-normal py-2"
                      onClick={() => setShowSwitchDialog(true)}
                    >
                      {APP.vault.security.switchCta}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto min-h-10 whitespace-normal py-2"
                      onClick={() => setShowProtectDialog(true)}
                    >
                      {APP.vault.security.protectCta}
                    </Button>
                  )}
                </div>

                {persistence ? (
                  <div className="space-y-1.5 rounded-lg border border-border/70 bg-surface-2/50 p-4 text-sm">
                    <p className="inline-flex items-center gap-1.5 font-medium text-foreground">
                      <HardDrive className="size-3.5" aria-hidden />
                      {APP.vault.security.storageLabel}
                    </p>
                    <p
                      className={
                        persistence === "persisted"
                          ? "max-w-prose leading-relaxed text-muted-foreground"
                          : "max-w-prose leading-relaxed text-warning"
                      }
                    >
                      {persistence === "persisted"
                        ? APP.vault.security.storagePersisted
                        : persistence === "not-persisted"
                          ? APP.vault.security.storageNotPersisted
                          : APP.vault.security.storageUnknown}
                    </p>
                  </div>
                ) : null}

                <DetailDisclosure title={APP.vault.howEncrypted}>
                  <p>
                    {APP.vault.cryptoDetails.replace("{version}", String(VAULT_ENVELOPE_VERSION))}
                  </p>
                </DetailDisclosure>
              </Card>
            </TabsContent>
          </Tabs>

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

          <Dialog
            open={showProtectDialog}
            onOpenChange={(open) => {
              setShowProtectDialog(open);
              if (!open) {
                setProtectPassphrase("");
                setProtectConfirm("");
                setProtectError(null);
              }
            }}
          >
            <DialogContent>
              <DialogTitle>{APP.vault.security.protectDialogTitle}</DialogTitle>
              <DialogDescription>{APP.vault.security.protectDialogBody}</DialogDescription>
              <Alert variant="warning">
                <AlertDescription>{APP.vault.security.protectDialogWarning}</AlertDescription>
              </Alert>
              <div className="flex flex-col gap-3">
                <div>
                  <Label htmlFor="vault-protect-passphrase">
                    {APP.vault.create.passphraseLabel}
                  </Label>
                  <PasswordInput
                    id="vault-protect-passphrase"
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={protectPassphrase}
                    onChange={(e) => setProtectPassphrase(e.target.value)}
                    aria-invalid={!!protectError}
                    showToggle
                  />
                </div>
                <div>
                  <Label htmlFor="vault-protect-confirm">{APP.vault.create.confirmLabel}</Label>
                  <PasswordInput
                    id="vault-protect-confirm"
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    value={protectConfirm}
                    onChange={(e) => setProtectConfirm(e.target.value)}
                    aria-invalid={protectPassphrase !== protectConfirm && protectConfirm.length > 0}
                    showToggle
                  />
                  {protectPassphrase !== protectConfirm && protectConfirm.length > 0 && (
                    <p className="mt-1 text-xs text-destructive">
                      {APP.vault.create.mismatchError}
                    </p>
                  )}
                </div>
                {protectError && <p className="text-xs text-destructive">{protectError}</p>}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowProtectDialog(false)}>
                  {APP.vault.deleteConfirm.cancel}
                </Button>
                <Button
                  onClick={() => void handleProtectSubmit()}
                  disabled={
                    protectPassphrase.length < 8 ||
                    protectPassphrase !== protectConfirm ||
                    protectBusy
                  }
                >
                  {protectBusy
                    ? APP.vault.security.protectSubmitting
                    : APP.vault.security.protectSubmit}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={showSwitchDialog} onOpenChange={setShowSwitchDialog}>
            <DialogContent>
              <DialogTitle>{APP.vault.security.switchDialogTitle}</DialogTitle>
              <DialogDescription>{APP.vault.security.switchDialogBody}</DialogDescription>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowSwitchDialog(false)}>
                  {APP.vault.deleteConfirm.cancel}
                </Button>
                <Button onClick={() => void handleSwitchToDevice()} disabled={switchBusy}>
                  {APP.vault.security.switchConfirm}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog
            open={!!previewTarget}
            onOpenChange={(open) => {
              if (!open) {
                if (previewUrl) {
                  URL.revokeObjectURL(previewUrl);
                }
                setPreviewUrl(null);
                setPreviewText(null);
                setPreviewTarget(null);
              }
            }}
          >
            {previewTarget && (
              <DialogContent className="max-w-3xl max-h-[80vh]">
                <DialogTitle>
                  {APP.vault.preview.title.replace("{name}", previewTarget.name)}
                </DialogTitle>
                <div className="overflow-y-auto">
                  {previewUrl && previewTarget.mimeType.startsWith("image/") ? (
                    <img
                      src={previewUrl}
                      alt={previewTarget.name}
                      className="max-w-full rounded-md"
                    />
                  ) : previewUrl && previewTarget.mimeType === "application/pdf" ? (
                    <iframe
                      src={previewUrl}
                      title={previewTarget.name}
                      className="h-[70vh] w-full rounded-md"
                    />
                  ) : previewText !== null ? (
                    <pre className="whitespace-pre-wrap text-xs">
                      {previewText}
                      {previewText.length === 200_000 && (
                        <p className="mt-2 text-muted-foreground">
                          {APP.vault.preview.textTooLarge.replace("{count}", "200,000")}
                        </p>
                      )}
                    </pre>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {APP.vault.preview.noPreviewForType}
                    </p>
                  )}
                </div>
                <DialogFooter>
                  {previewUrl || previewText !== null ? null : (
                    <Button
                      variant="outline"
                      onClick={() => {
                        if (previewTarget) void onDownload(previewTarget.id);
                      }}
                    >
                      {APP.vault.preview.downloadInstead}
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (previewUrl) URL.revokeObjectURL(previewUrl);
                      setPreviewUrl(null);
                      setPreviewText(null);
                      setPreviewTarget(null);
                    }}
                  >
                    {APP.vault.preview.close}
                  </Button>
                </DialogFooter>
              </DialogContent>
            )}
          </Dialog>
        </div>
      )}
    </VaultGate>
  );
}
