"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Clock3,
  FileSearch,
  FileText,
  FolderOpen,
  History,
  ListChecks,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VaultGate } from "@/components/VaultGate";
import { PageIntro } from "@/components/PageIntro";
import { InterviewFlow } from "@/components/InterviewFlow";
import { RequestReview } from "./RequestReview";
import { EvidenceReview } from "./EvidenceReview";
import { ResponseReview, type WorkspaceResponse } from "./ResponseReview";
import { DetailDisclosure, IconTile, VIEW_ICONS } from "./WorkspaceVisuals";
import { createCaseFile, type CaseFile } from "@/core/interviewEngine";
import {
  isSeverityGated,
  computeDeadlines,
  serializeDeadlines,
  parseNotice,
  type ViolationKind,
} from "@/core";
import {
  addWorkspaceEvent,
  applyWorkspaceReply,
  newWorkspace,
  proposedRequirements,
  PROTOCOL_LABELS,
  routeWorkspace,
  workspaceCanCompose,
  workspaceGaps,
  type Requirement,
  type Workspace,
} from "@/core/workspace";
import { getBrowserVault } from "@/lib/vault/browser";
import { ensureFreshGuestSession } from "@/lib/vault/guestSession";
import { addFileToVault } from "@/lib/vault/addFileToVault";
import { withCaseEvidence } from "@/lib/caseEvidence";
import { loadCaseFile, saveCaseFile, loadCaseLog, saveCaseLog } from "@/lib/caseStore";
import { WorkspaceSchema } from "@/lib/workspaceSchema";
import { buildCaseExport } from "@/lib/workspaceExport";
import {
  evidenceNoteKey,
  HISTORY_REPLY_KEY,
  REQUEST_DRAFT_KEYS,
  RESPONSE_DRAFT_KEYS,
  withDraftValue,
  withoutDraftKeys,
} from "@/lib/workspaceDraft";
import { consumePendingDeadlines } from "@/lib/pendingDeadlines";
import { peekPendingNotice, clearPendingNotice } from "@/lib/pendingNotice";
import { importDecodedNotice } from "@/lib/importDecodedNotice";
import type { Vault, VaultListItem } from "@/core/vault/vault";
import { formatDate } from "@/lib/format";
import { WORKSPACE as C } from "@/content/workspace";

function Loading() {
  return (
    <div role="status" className="space-y-4">
      <p className="text-sm text-muted-foreground">{C.loading}</p>
      <Skeleton className="h-24 w-full" />
      <Skeleton className="h-72 w-full" />
    </div>
  );
}

export function CaseWorkspace({
  signedIn,
  hasPass,
  initialKind,
  initialView,
}: {
  signedIn: boolean;
  hasPass: boolean;
  initialKind?: ViolationKind;
  initialView?: string;
}) {
  const [vault, setVault] = useState<Vault | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let alive = true;
    const v = getBrowserVault();
    void ensureFreshGuestSession(v, signedIn)
      .then(() => {
        if (alive) setVault(v);
      })
      .catch(() => {
        if (alive) setError(true);
      });
    return () => {
      alive = false;
    };
  }, [signedIn]);
  if (error)
    return (
      <Alert variant="destructive">
        <AlertTitle>Could not open this browser’s vault</AlertTitle>
        <AlertDescription>
          Reload to try again. Your saved records have not been removed.
        </AlertDescription>
      </Alert>
    );
  if (!vault) return <Loading />;
  return (
    <VaultGate vault={vault} deviceMode autoUnlock>
      {(v) => (
        <WorkspaceInner
          vault={v}
          signedIn={signedIn}
          hasPass={hasPass}
          initialKind={initialKind}
          initialView={initialView}
        />
      )}
    </VaultGate>
  );
}

function WorkspaceInner({
  vault,
  signedIn,
  hasPass,
  initialKind,
  initialView,
}: {
  vault: Vault;
  signedIn: boolean;
  hasPass: boolean;
  initialKind?: ViolationKind;
  initialView?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [file, setFile] = useState<CaseFile | null>(null);
  const fileRef = useRef<CaseFile | null>(null);
  const persisted = useRef<string>("null");
  const saving = useRef(false);
  const uploading = useRef(false);
  const [newCasePrompt, setNewCasePrompt] = useState(false);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [records, setRecords] = useState<VaultListItem[]>([]);
  const [tab, setTab] = useState(initialView && initialView in C.tabs ? initialView : "overview");
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (tab === "overview") params.delete("view");
    else params.set("view", tab);
    const qs = params.toString();
    router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    // Keep the URL in sync with the active tab so it survives reload, back/forward
    // and the sign-in redirect; router/pathname are stable across this component's life.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);
  const signInHref = `/login?next=${encodeURIComponent(`/case?view=${tab}`)}`;
  const [reviewRequest, setReviewRequest] = useState(false);
  const [saved, setSaved] = useState(false);
  const [result, setResult] = useState<WorkspaceResponse | null>(null);
  const [purchase, setPurchase] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newSource, setNewSource] = useState("");
  const [replyText, setReplyText] = useState("");
  const [dirtyKeys, setDirtyKeys] = useState<Set<string>>(new Set());
  const draftTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const draftPending = useRef<Map<string, string | undefined>>(new Map());
  const draftCaseId = useRef<Map<string, string>>(new Map());
  const setCurrent = useCallback((next: CaseFile) => {
    fileRef.current = next;
    setFile(next);
  }, []);

  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const existing = await loadCaseFile(vault);
        if (existing?.workspace) WorkspaceSchema.parse(existing.workspace);
        persisted.current = JSON.stringify(existing?.workspace ?? null);
        if (!alive) return;
        const pendingNotice = peekPendingNotice();
        const next = pendingNotice
          ? await importDecodedNotice(vault, pendingNotice, initialKind ?? "UNKNOWN")
          : existing
            ? await withCaseEvidence(vault, existing)
            : {
                ...createCaseFile(initialKind ?? "UNKNOWN"),
                workspace: newWorkspace(),
                deadlines: consumePendingDeadlines(),
              };
        if (pendingNotice) {
          clearPendingNotice(pendingNotice);
          persisted.current = JSON.stringify(next.workspace);
        }
        const displayed = pendingNotice ? await withCaseEvidence(vault, next) : next;
        const docs = (await vault.list({ caseId: next.id })).filter((r) => r.kind === "document");
        if (!alive) return;
        setCurrent(displayed);
        setSaved(Boolean(existing || pendingNotice));
        setRecords(docs);
        setReplyText(displayed.workspace?.draft?.[HISTORY_REPLY_KEY] ?? "");
        setReady(true);
      } catch {
        if (alive) {
          setError("Could not read your saved case. Reload to retry; no records were changed.");
          setReady(true);
        }
      }
    })();
    return () => {
      alive = false;
    };
  }, [vault, initialKind, setCurrent]);

  const commit = async (
    update: (w: Workspace) => Workspace,
    message?: string,
    state?: CaseFile["state"],
    opts?: { silent?: boolean; deadlines?: CaseFile["deadlines"] },
  ) => {
    if (saving.current || !fileRef.current) return false;
    saving.current = true;
    if (!opts?.silent) setBusy(true);
    setError("");
    try {
      const current = fileRef.current;
      let next = update(
        current.workspace ?? {
          ...newWorkspace(),
          explanation: current.rootCause ?? "",
          preventiveMeasures: current.preventiveMeasures ?? "",
        },
      );
      if (message) next = addWorkspaceEvent(next, message);
      WorkspaceSchema.parse(next);
      const updated = {
        ...current,
        workspace: next,
        state: state ?? (current.state === "SUBMITTED" ? "REVISION" : current.state),
        ...(opts?.deadlines !== undefined ? { deadlines: opts.deadlines } : {}),
      };
      await vault.atomic(async () => {
        const disk = await loadCaseFile(vault);
        if (
          (disk && disk.id !== current.id) ||
          JSON.stringify(disk?.workspace ?? null) !== persisted.current
        )
          throw new Error(
            "This case changed in another window. Reload before saving to preserve both versions.",
          );
        await saveCaseFile(vault, updated);
        if (state) {
          const oldLog = await loadCaseLog(vault);
          await saveCaseLog(vault, {
            ...oldLog,
            state,
            attemptCount: Math.max(oldLog?.attemptCount ?? 0, next.submissions.length),
            ...(state === "SUBMITTED" ? { submittedAt: next.submissions.at(-1)?.at } : {}),
          });
        }
      });
      persisted.current = JSON.stringify(next);
      setCurrent(updated);
      setSaved(true);
      setResult(null);
      setPurchase(false);
      return true;
    } catch (e) {
      setError(e instanceof Error ? e.message : C.error);
      return false;
    } finally {
      saving.current = false;
      if (!opts?.silent) setBusy(false);
    }
  };

  /**
   * Debounced autosave for in-progress field text into the encrypted, vault-backed
   * `Workspace.draft` map, so edits survive route changes (including the sign-in
   * redirect), reloads and tab closes, not only an explicit "Save" click.
   */
  const flushDraftKey = useCallback((key: string) => {
    const timer = draftTimers.current.get(key);
    if (timer) {
      clearTimeout(timer);
      draftTimers.current.delete(key);
    }
    if (!draftPending.current.has(key)) return;
    const value = draftPending.current.get(key);
    const scopedId = draftCaseId.current.get(key);
    draftPending.current.delete(key);
    draftCaseId.current.delete(key);
    const clear = () =>
      setDirtyKeys((s) => {
        if (!s.has(key)) return s;
        const next = new Set(s);
        next.delete(key);
        return next;
      });
    if (scopedId !== undefined && fileRef.current?.id !== scopedId) {
      clear();
      return;
    }
    void commit(
      (w) => ({ ...w, draft: withDraftValue(w.draft, key, value) }),
      undefined,
      undefined,
      { silent: true },
    ).then((ok) => {
      if (ok && !draftPending.current.has(key)) clear();
    });
    // commit's own behaviour is ref-driven and stable across renders; see its definition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setDraftField = useCallback(
    (key: string, value: string | undefined) => {
      draftPending.current.set(key, value);
      draftCaseId.current.set(key, fileRef.current?.id ?? "");
      setDirtyKeys((s) => (s.has(key) ? s : new Set(s).add(key)));
      const existing = draftTimers.current.get(key);
      if (existing) clearTimeout(existing);
      draftTimers.current.set(
        key,
        setTimeout(() => flushDraftKey(key), 900),
      );
    },
    [flushDraftKey],
  );

  const cancelDraftFields = useCallback((keys: string[]) => {
    for (const key of keys) {
      const timer = draftTimers.current.get(key);
      if (timer) clearTimeout(timer);
      draftTimers.current.delete(key);
      draftPending.current.delete(key);
      draftCaseId.current.delete(key);
    }
    setDirtyKeys((s) => {
      if (!keys.some((k) => s.has(k))) return s;
      const next = new Set(s);
      for (const k of keys) next.delete(k);
      return next;
    });
  }, []);

  useEffect(() => {
    const timers = draftTimers.current;
    return () => {
      for (const key of Array.from(timers.keys())) flushDraftKey(key);
    };
    // Flush on unmount only (e.g. navigating to sign-in); not on every flushDraftKey change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeRequirement = (value: Requirement) => {
    const current = fileRef.current?.workspace;
    if (!current || !`${current.notice}\n${current.formInstructions}`.includes(value.sourceQuote)) {
      setError(
        "Update the task’s source to an exact sentence from the current notice or form before reviewing it.",
      );
      return Promise.resolve(false);
    }
    cancelDraftFields([evidenceNoteKey(value.id)]);
    return commit(
      (w) => ({
        ...w,
        draft: withoutDraftKeys(w.draft, [evidenceNoteKey(value.id)]),
        requirements: w.requirements.map((r) => (r.id === value.id ? value : r)),
      }),
      `Updated evidence review: ${value.label}`,
    );
  };
  const upload = async (id: string, uploadFile: File) => {
    if (!fileRef.current || saving.current || uploading.current) return false;
    uploading.current = true;
    setBusy(true);
    const caseId = fileRef.current.id;
    try {
      // Original documents are stored intact; attaching never means reviewed.
      const added = await addFileToVault(vault, uploadFile, {
        caseId,
        evidenceKind: "other",
      });
      const record = added.status === "added" ? added.record : added.existing;
      if (fileRef.current.id !== caseId) throw new Error("The active case changed.");
      const ok = await commit(
        (w) => ({
          ...w,
          requirements: w.requirements.map((r) =>
            r.id === id
              ? {
                  ...r,
                  recordId: record.id,
                  filename: record.name,
                  contentHash: record.plaintextHash,
                  status: "needed",
                  page: undefined,
                }
              : r,
          ),
        }),
        `Attached ${uploadFile.name}; factual review is pending.`,
      );
      setRecords(
        (await vault.list({ caseId: fileRef.current.id })).filter((r) => r.kind === "document"),
      );
      return ok;
    } catch {
      setError("Could not attach the file. Try again.");
      return false;
    } finally {
      uploading.current = false;
      setBusy(false);
    }
  };
  const download = async (id: string) => {
    try {
      const { record, bytes } = await vault.get(id);
      if (record.caseId !== fileRef.current?.id || record.kind !== "document")
        throw new Error("Wrong case");
      const url = URL.createObjectURL(
        new Blob([new Uint8Array(bytes)], { type: "application/octet-stream" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download = record.name;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch {
      setError(
        "The original file is unavailable. Review its attachment before preparing a response.",
      );
    }
  };

  const generate = async () => {
    if (!fileRef.current?.workspace || saving.current || uploading.current) return;
    saving.current = true;
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const fresh = await withCaseEvidence(vault, fileRef.current);
      if (JSON.stringify(fresh.workspace) !== JSON.stringify(fileRef.current.workspace)) {
        setCurrent(fresh);
        throw new Error(
          "A linked document changed or was removed. Review the evidence again before preparing a response.",
        );
      }
      const w = fresh.workspace!;
      const response = await fetch("/api/compose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseData: {
            ...fresh,
            workspace: {
              ...w,
              history: [],
              previousRequests: [],
              submissions: [],
              replies: w.replies.filter((r) => !r.applied),
            },
          },
          attemptNumber: Math.min(99, w.submissions.length + 1),
        }),
      });
      const data = await response.json();
      if (response.status === 403 && data.code === "case_pass_required") {
        setPurchase(true);
        return;
      }
      if (!response.ok) throw new Error(data.error ?? "Could not prepare the response. Try again.");
      setResult(data as WorkspaceResponse);
      setPurchase(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Response preparation failed.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  const recordSubmission = async (receipt: string) => {
    if (
      !result ||
      result.draft.mode.mode !== "full-draft" ||
      !result.critique.passed ||
      !fileRef.current?.workspace
    )
      return false;
    const fresh = await withCaseEvidence(vault, fileRef.current);
    if (workspaceGaps(fresh.workspace!).length) {
      setError("Review the case again: an evidence requirement is no longer satisfied.");
      setResult(null);
      return false;
    }
    const text = result.rendered;
    const ok = await commit(
      (w) => ({
        ...w,
        submissions: [
          ...w.submissions,
          {
            id: crypto.randomUUID(),
            at: new Date().toISOString(),
            revision: w.revision,
            protocol: w.protocol,
            text,
            receipt,
            attachments: w.requirements.map((r) => ({
              recordId: r.recordId!,
              filename: r.filename!,
              contentHash: r.contentHash!,
              page: r.page!,
            })),
          },
        ],
      }),
      "Recorded the seller-confirmed submission and selected document versions.",
      "SUBMITTED",
    );
    if (ok) setTab("history");
    return ok;
  };

  if (!ready) return <Loading />;
  if (!file)
    return (
      <Alert variant="destructive">
        <AlertTitle>Case unavailable</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (!file.workspace)
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{C.title}</CardTitle>
            <p className="text-sm text-muted-foreground">{C.legacy}</p>
          </CardHeader>
          <CardContent>
            <Button
              disabled={busy}
              onClick={() =>
                void commit(
                  (w) => w,
                  "Added the workspace; original interview answers were retained.",
                )
              }
            >
              Add workspace to this case
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
            </Button>
          </CardContent>
        </Card>
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <InterviewFlow signedIn={signedIn} hasPass={hasPass} initialKind={file.kind} />
      </div>
    );
  const w = file.workspace;
  const route = routeWorkspace(w);
  const gated = isSeverityGated(file.kind) || route.protocol === "specialist";
  const gaps = workspaceGaps(w);
  const next = w.requirements.find((r) => r.status !== "reviewed");
  const awaiting = file.state === "SUBMITTED" && !w.replies.some((r) => !r.applied);
  const confirmRequest = async (updated: Workspace) => {
    cancelDraftFields(REQUEST_DRAFT_KEYS);
    const ok = await commit(
      (old) => ({
        ...old,
        marketplace: updated.marketplace,
        position: updated.position,
        notice: updated.notice,
        formInstructions: updated.formInstructions,
        protocol: updated.protocol,
        confirmed: updated.confirmed,
        professionalReviewRequired:
          old.professionalReviewRequired ||
          (updated.confirmed && updated.protocol === "specialist"),
        requirementsConfirmed: false,
        requirements: old.requirements.length ? old.requirements : proposedRequirements(updated),
        submissions: old.submissions,
        replies: old.replies,
        history: old.history,
        draft: withoutDraftKeys(old.draft, REQUEST_DRAFT_KEYS),
      }),
      "Saved the notice and reviewed response route.",
      "INTAKE",
    );
    if (ok) setReviewRequest(false);
    return ok;
  };
  return (
    <div className="space-y-5">
      <PageIntro
        icon={FileSearch}
        eyebrow={`Case workspace · ${w.marketplace === "US" ? "Amazon US" : "Marketplace to confirm"}`}
        title={C.title}
        description={C.subtitle}
        actions={
          <>
            <Badge variant="secondary" className="font-mono">
              R{w.revision}
              <span className="sr-only"> · Revision {w.revision}</span>
            </Badge>
            <Button
              size="sm"
              variant="outline"
              disabled={busy}
              onClick={() => setNewCasePrompt(true)}
            >
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              New case
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link href="/dashboard">All cases</Link>
            </Button>
          </>
        }
      />
      {w.decodedNoticeHash && !w.confirmed && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-1 text-sm">
          <Check className="size-4 shrink-0 text-primary" aria-hidden />
          <p>Your decoded notice is saved in this case</p>
          {tab !== "overview" && (
            <Button size="sm" variant="link" onClick={() => setTab("overview")}>
              Review the saved request
            </Button>
          )}
        </div>
      )}
      {newCasePrompt && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Start a separate case?</CardTitle>
            <p className="text-sm text-muted-foreground">
              Your saved case and files will remain in All cases. Save any unfinished edits before
              continuing.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button
              disabled={busy}
              onClick={async () => {
                if (saving.current || uploading.current) return;
                saving.current = true;
                setBusy(true);
                try {
                  for (const timer of draftTimers.current.values()) clearTimeout(timer);
                  draftTimers.current.clear();
                  draftPending.current.clear();
                  draftCaseId.current.clear();
                  setDirtyKeys(new Set());
                  const fresh = { ...createCaseFile("UNKNOWN"), workspace: newWorkspace() };
                  await vault.atomic(async () => {
                    const disk = await loadCaseFile(vault);
                    if (
                      (disk && disk.id !== file.id) ||
                      JSON.stringify(disk?.workspace ?? null) !== persisted.current
                    )
                      throw new Error(
                        "This case changed in another window. Reload before starting another case.",
                      );
                    await saveCaseFile(vault, fresh);
                  });
                  persisted.current = JSON.stringify(fresh.workspace);
                  setCurrent(fresh);
                  setRecords([]);
                  setTab("overview");
                  setReviewRequest(false);
                  setResult(null);
                  setPurchase(false);
                  setNewLabel("");
                  setNewSource("");
                  setReplyText("");
                  setError("");
                  setSaved(true);
                  setNewCasePrompt(false);
                } catch (e) {
                  setError(e instanceof Error ? e.message : C.error);
                } finally {
                  saving.current = false;
                  setBusy(false);
                }
              }}
            >
              Create separate case
            </Button>
            <Button variant="outline" disabled={busy} onClick={() => setNewCasePrompt(false)}>
              Keep working here
            </Button>
          </CardContent>
        </Card>
      )}
      {error && (
        <Alert variant="destructive" role="alert">
          <AlertTitle>Action not completed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="min-w-0 space-y-5">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList
              className="grid h-auto w-full grid-cols-4 rounded-xl border border-border/80 bg-surface-2/70 p-1.5"
              aria-label="Case workspace views"
            >
              {Object.entries(C.tabs).map(([id, label]) => {
                const Icon = VIEW_ICONS[id] ?? FileSearch;
                return (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="flex min-h-12 min-w-0 flex-col items-center justify-center gap-1.5 rounded-lg px-1 py-2 text-xs data-[state=active]:text-primary sm:flex-row sm:gap-2 sm:px-2 sm:text-sm"
                  >
                    <Icon className="size-4 shrink-0" aria-hidden />
                    {label}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <TabsContent
              forceMount
              value="overview"
              className="mt-5 space-y-5 data-[state=inactive]:hidden"
            >
              {!w.confirmed || reviewRequest ? (
                <RequestReview
                  key={`${file.id}-${w.revision}-${reviewRequest}`}
                  workspace={w}
                  busy={busy}
                  onSave={confirmRequest}
                  draft={w.draft}
                  onDraftChange={setDraftField}
                />
              ) : (
                <>
                  <Card className="workspace-hero border-primary/25">
                    <CardHeader>
                      <div className="flex items-center gap-2 text-primary">
                        <FileSearch className="h-4 w-4" aria-hidden />
                        <p className="text-eyebrow uppercase">Next action</p>
                      </div>
                      <CardTitle as="h2" className="text-xl">
                        {gated
                          ? "Get professional help with this allegation"
                          : awaiting
                            ? "Keep the next reply with this attempt"
                            : w.protocol === "information"
                              ? "No new response is requested"
                              : !workspaceCanCompose(w)
                                ? "Clarify the requested response"
                                : next
                                  ? next.status === "waiting"
                                    ? "Continue while you wait"
                                    : `Review ${next.label}`
                                  : !w.requirementsConfirmed
                                    ? "Check the requested records"
                                    : "Prepare your factual response"}
                      </CardTitle>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {gated
                          ? C.unsupported
                          : awaiting
                            ? "Your submitted text and document references are preserved in History. Add a reply when one arrives."
                            : next
                              ? next.status === "waiting"
                                ? C.waitingHelp
                                : "Read the original, record what it supports, and resolve anything unclear."
                              : route.reason}
                      </p>
                    </CardHeader>
                    <CardContent className="flex flex-wrap gap-3">
                      <Button
                        onClick={() =>
                          setTab(
                            awaiting || !workspaceCanCompose(w)
                              ? "history"
                              : next || !w.requirementsConfirmed
                                ? "evidence"
                                : "response",
                          )
                        }
                      >
                        {awaiting
                          ? "Add a reply"
                          : !workspaceCanCompose(w)
                            ? "View case notes"
                            : next || !w.requirementsConfirmed
                              ? "Review evidence plan"
                              : "Review response facts"}
                        <ArrowRight className="ml-2 h-4 w-4" aria-hidden />
                      </Button>
                      <Button variant="outline" onClick={() => setReviewRequest(true)}>
                        {C.reviewNotice}
                      </Button>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle as="h2" className="text-base">
                        Your plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ol className="space-y-4">
                        <li className="flex items-start gap-3">
                          <Check className="mt-0.5 h-4 w-4 text-primary" aria-hidden />
                          <div>
                            <p className="text-sm font-medium">Understand the request</p>
                            <p className="text-xs text-muted-foreground">
                              {PROTOCOL_LABELS[w.protocol]}
                            </p>
                          </div>
                        </li>
                        {w.requirements.map((r) => (
                          <li
                            className="flex items-start justify-between gap-3 border-t border-border pt-3"
                            key={r.id}
                          >
                            <div className="flex items-start gap-3">
                              <ListChecks
                                className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground"
                                aria-hidden
                              />
                              <button
                                className="text-left text-sm underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                onClick={() => setTab("evidence")}
                              >
                                {r.label}
                              </button>
                            </div>
                            <Badge variant={r.status === "reviewed" ? "success" : "secondary"}>
                              {C.status[r.status]}
                            </Badge>
                          </li>
                        ))}
                        <li className="flex items-start gap-3 border-t border-border pt-3">
                          <FileText className="mt-0.5 h-4 w-4 text-muted-foreground" aria-hidden />
                          <div>
                            <p className="text-sm font-medium">
                              Respond through the official channel
                            </p>
                            <p className="text-xs text-muted-foreground">
                              You review the wording and control submission.
                            </p>
                          </div>
                        </li>
                      </ol>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
            <TabsContent
              forceMount
              value="evidence"
              className="mt-5 space-y-5 data-[state=inactive]:hidden"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconTile icon={FolderOpen} tone="warning" />
                    <div>
                      <p className="text-eyebrow uppercase text-muted-foreground">02 / Evidence</p>
                      <CardTitle as="h2" className="mt-1 text-lg">
                        Requested records
                      </CardTitle>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Attach originals. Review each record. Note what it supports.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <details>
                    <summary className="cursor-pointer text-sm font-medium">
                      Read the saved request
                    </summary>
                    <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                      {w.notice}
                      {"\n\n"}
                      {w.formInstructions}
                    </p>
                  </details>
                  <details open={w.requirements.length === 0}>
                    <summary className="cursor-pointer text-sm font-medium">
                      Add a requested record
                    </summary>
                    <div className="mt-4 space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="requirement-label">Requested record</Label>
                        <Input
                          id="requirement-label"
                          placeholder="For example, supplier invoice"
                          maxLength={500}
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="requirement-source">
                          Exact request from your notice or form
                        </Label>
                        <Textarea
                          id="requirement-source"
                          maxLength={2000}
                          value={newSource}
                          onChange={(e) => setNewSource(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">{C.sourceHelp}</p>
                      </div>
                      <Button
                        variant="outline"
                        disabled={
                          busy ||
                          !newLabel.trim() ||
                          !newSource.trim() ||
                          w.requirements.length >= 30
                        }
                        onClick={async () => {
                          if (!`${w.notice}\n${w.formInstructions}`.includes(newSource.trim())) {
                            setError(
                              "The source sentence must appear in the saved notice or form instructions. Review the request first.",
                            );
                            return;
                          }
                          if (
                            await commit(
                              (old) => ({
                                ...old,
                                requirementsConfirmed: false,
                                requirements: [
                                  ...old.requirements,
                                  {
                                    id: crypto.randomUUID(),
                                    label: newLabel.trim(),
                                    sourceQuote: newSource.trim(),
                                    status: "needed",
                                    note: "",
                                  },
                                ],
                              }),
                              "Added a requested record to the evidence plan.",
                            )
                          ) {
                            setNewLabel("");
                            setNewSource("");
                          }
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" aria-hidden />
                        Add requested record
                      </Button>
                    </div>
                  </details>
                  <label className="flex items-start gap-3 border-t border-border pt-4 text-sm">
                    <input
                      className="mt-1 h-4 w-4 accent-primary"
                      type="checkbox"
                      checked={w.requirementsConfirmed}
                      disabled={busy || !w.confirmed}
                      onChange={(e) =>
                        void commit((old) => ({ ...old, requirementsConfirmed: e.target.checked }))
                      }
                    />
                    {C.allRequirements}
                  </label>
                </CardContent>
              </Card>
              {w.requirements.map((r) => (
                <EvidenceReview
                  key={`${r.id}-${r.recordId}-${r.status}-${r.sourceQuote}`}
                  item={r}
                  records={records}
                  busy={busy}
                  draftNote={w.draft?.[evidenceNoteKey(r.id)]}
                  onDraftNote={(value) => setDraftField(evidenceNoteKey(r.id), value)}
                  onChange={changeRequirement}
                  onRemove={(reason) =>
                    commit(
                      (old) => ({
                        ...old,
                        requirementsConfirmed: false,
                        requirements: old.requirements.filter((item) => item.id !== r.id),
                      }),
                      `Removed ${r.label} from the current plan: ${reason}`,
                    )
                  }
                  onUpload={(f) => upload(r.id, f)}
                  onDownload={(id) => void download(id)}
                />
              ))}
            </TabsContent>
            <TabsContent forceMount value="response" className="mt-5 data-[state=inactive]:hidden">
              {gated ? (
                <Alert variant="warning">
                  <AlertTitle>Professional review needed</AlertTitle>
                  <AlertDescription>{C.unsupported}</AlertDescription>
                </Alert>
              ) : (
                <ResponseReview
                  key={`${file.id}-${w.revision}-${w.explanation}-${w.correctiveActions}-${w.preventiveMeasures}`}
                  file={{ ...file, workspace: w }}
                  vault={vault}
                  signedIn={signedIn}
                  busy={busy}
                  result={result}
                  purchase={purchase}
                  draft={w.draft}
                  onDraftChange={setDraftField}
                  signInHref={signInHref}
                  onSave={(updated) => {
                    cancelDraftFields(RESPONSE_DRAFT_KEYS);
                    return commit(
                      () => ({
                        ...updated,
                        draft: withoutDraftKeys(updated.draft, RESPONSE_DRAFT_KEYS),
                      }),
                      "Saved the seller’s response facts.",
                    );
                  }}
                  onGenerate={() => void generate()}
                  onSubmit={recordSubmission}
                />
              )}
            </TabsContent>
            <TabsContent
              forceMount
              value="history"
              className="mt-5 space-y-5 data-[state=inactive]:hidden"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconTile icon={History} tone="info" />
                    <div>
                      <p className="text-eyebrow uppercase text-muted-foreground">04 / History</p>
                      <CardTitle as="h2" className="mt-1 text-lg">
                        Submissions and replies
                      </CardTitle>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Earlier attempts stay unchanged when you revise the plan.
                  </p>
                </CardHeader>
                <CardContent className="space-y-5">
                  {w.previousRequests.map((request) => (
                    <details className="rounded-lg border border-border p-4" key={request.revision}>
                      <summary className="cursor-pointer text-sm font-medium">
                        Earlier request · revision {request.revision}
                      </summary>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm">
                        {request.notice}
                      </p>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm text-muted-foreground">
                        {request.formInstructions}
                      </p>
                      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                        {request.requirements.map((requirement) => (
                          <li key={requirement.id}>
                            {requirement.label}: {requirement.filename ?? "No file linked"} ·{" "}
                            {C.status[requirement.status]}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                  {w.submissions.length === 0 && (
                    <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-surface-2/40 p-4">
                      <FileText className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          No submission recorded
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Copying or exporting does not submit a response.
                        </p>
                      </div>
                    </div>
                  )}
                  {w.submissions.map((s, i) => (
                    <details className="rounded-lg border border-border p-4" key={s.id}>
                      <summary className="cursor-pointer text-sm font-medium">
                        Attempt {i + 1} · {formatDate(s.at)} · revision {s.revision}
                      </summary>
                      <pre className="mt-3 whitespace-pre-wrap break-words font-sans text-sm">
                        {s.text}
                      </pre>
                      {s.receipt && (
                        <p className="mt-3 text-xs text-muted-foreground">Reference: {s.receipt}</p>
                      )}
                      <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
                        {s.attachments.map((a, j) => (
                          <li key={j}>
                            {a.filename} · page {a.page}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ))}
                  <div className="space-y-2">
                    <Label htmlFor="workspace-reply">Add Amazon’s next reply</Label>
                    <Textarea
                      id="workspace-reply"
                      rows={5}
                      value={replyText}
                      maxLength={12000}
                      onChange={(e) => {
                        const next = e.target.value;
                        setReplyText(next);
                        setDraftField(HISTORY_REPLY_KEY, next.trim() ? next : undefined);
                      }}
                    />
                  </div>
                  <Button
                    variant="outline"
                    disabled={busy || replyText.trim().length < 30 || w.replies.length >= 99}
                    onClick={async () => {
                      cancelDraftFields([HISTORY_REPLY_KEY]);
                      if (
                        await commit(
                          (old) => ({
                            ...old,
                            draft: withoutDraftKeys(old.draft, [HISTORY_REPLY_KEY]),
                            replies: [
                              ...old.replies,
                              {
                                id: crypto.randomUUID(),
                                at: new Date().toISOString(),
                                text: replyText.trim(),
                                applied: false,
                              },
                            ],
                          }),
                          "Saved a new reply for review.",
                          "REVISION",
                        )
                      )
                        setReplyText("");
                    }}
                  >
                    Save reply for review
                  </Button>
                  {w.replies.map((r) => (
                    <div className="space-y-3 rounded-lg bg-surface-2 p-4" key={r.id}>
                      <Badge variant="secondary">
                        {r.applied
                          ? "Applied to a new revision"
                          : "Review before changing the plan"}
                      </Badge>
                      <DetailDisclosure title={`Read reply · ${formatDate(r.at)}`}>
                        <p className="whitespace-pre-wrap break-words">{r.text}</p>
                      </DetailDisclosure>
                      {!r.applied && (
                        <>
                          <p className="text-xs text-muted-foreground">
                            Use this reply as the new request and recheck the evidence. Earlier
                            submissions stay unchanged.
                          </p>
                          <Button
                            disabled={busy}
                            size="sm"
                            onClick={async () => {
                              // The reply carries whatever new time window Amazon stated, if any
                              // — the case's deadlines were frozen at the original notice and
                              // would otherwise keep showing a now-irrelevant (possibly already
                              // expired) date after this revision starts.
                              const recomputed = serializeDeadlines(
                                computeDeadlines({
                                  noticeReceivedAt: new Date(),
                                  parsed: parseNotice(r.text),
                                  kind: file.kind,
                                }),
                              );
                              if (
                                await commit(
                                  (old) => applyWorkspaceReply(old, r.id),
                                  undefined,
                                  "REVISION",
                                  { deadlines: recomputed },
                                )
                              ) {
                                setReviewRequest(false);
                                setTab("overview");
                              }
                            }}
                          >
                            Use reply for a new revision
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle as="h2" className="text-base">
                    Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="space-y-3">
                    {w.history.length ? (
                      [...w.history]
                        .reverse()
                        .slice(0, 3)
                        .map((e) => (
                          <li
                            className="relative border-l-2 border-primary/20 pl-4 text-sm before:absolute before:-left-[5px] before:top-1.5 before:size-2 before:rounded-full before:bg-primary"
                            key={e.id}
                          >
                            <p className="text-foreground">{e.message}</p>
                            <p className="text-xs text-muted-foreground">{formatDate(e.at)}</p>
                          </li>
                        ))
                    ) : (
                      <li className="text-sm text-muted-foreground">
                        Activity appears as you save your work.
                      </li>
                    )}
                  </ol>
                  {w.history.length > 3 && (
                    <DetailDisclosure
                      title={`Earlier activity (${w.history.length - 3})`}
                      className="mt-4"
                    >
                      <ol className="space-y-3">
                        {[...w.history]
                          .reverse()
                          .slice(3)
                          .map((e) => (
                            <li key={e.id} className="border-l border-border pl-3">
                              <p>{e.message}</p>
                              <p className="text-xs text-muted-foreground">{formatDate(e.at)}</p>
                            </li>
                          ))}
                      </ol>
                    </DetailDisclosure>
                  )}
                  <Button
                    className="mt-5"
                    variant="outline"
                    onClick={() => {
                      const text = buildCaseExport(file, w);
                      const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "appealdeck-case-notes.txt";
                      a.click();
                      setTimeout(() => URL.revokeObjectURL(url), 1000);
                    }}
                  >
                    Download case notes
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <aside className="space-y-4 lg:sticky lg:top-24" aria-label="Case context">
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <CardTitle as="h2" className="text-xs uppercase tracking-wider text-muted-foreground">
                Case snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <IconTile icon={FileSearch} tone="info" />
                <div>
                  <p className="text-xs text-muted-foreground">Requested route</p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    {PROTOCOL_LABELS[w.protocol]}
                  </p>
                </div>
              </div>
              <div className="rounded-lg bg-primary/5 px-3 py-2.5 ring-1 ring-inset ring-primary/15">
                <p className="text-xs text-muted-foreground">Current focus</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {gated
                    ? "Professional review"
                    : awaiting
                      ? "Awaiting a reply"
                      : !w.confirmed
                        ? "Confirm the request"
                        : next
                          ? C.status[next.status]
                          : gaps.length
                            ? "Review remaining items"
                            : "Final factual review"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="rounded-lg border border-border/80 bg-surface-2/50 p-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setTab("evidence")}
                >
                  <FolderOpen className="mb-2 size-4 text-warning" aria-hidden />
                  <span className="block font-mono text-xl font-medium text-foreground">
                    {w.requirements.filter((r) => r.status === "reviewed").length}
                    <span className="text-sm text-muted-foreground">
                      {" "}
                      / {w.requirements.length}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs">Records reviewed</span>
                </button>
                <button
                  className="rounded-lg border border-border/80 bg-surface-2/50 p-3 text-left transition-colors hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setTab("history")}
                >
                  <History className="mb-2 size-4 text-info" aria-hidden />
                  <span className="block font-mono text-xl font-medium text-foreground">
                    {w.submissions.length}
                  </span>
                  <span className="mt-1 block text-xs">Submissions</span>
                </button>
              </div>
              <div className="flex items-start gap-2 rounded-lg border border-warning/20 bg-warning/5 p-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                <div>
                  <p className="mb-1 text-xs font-semibold text-foreground">Time window</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {file.deadlines?.length
                      ? file.deadlines
                          .map((d) =>
                            d.isIndefinite
                              ? `${d.label} — no countdown to track`
                              : d.dueAt
                                ? `${d.label}: ${formatDate(d.dueAt)}`
                                : `${d.label} · confirm the date in Account Health`,
                          )
                          .join(" · ")
                      : "No confirmed deadline recorded. Check your current notice."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <div className="rounded-lg border border-border/70 bg-surface-1/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium">
              <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
              {C.local}
            </div>
            <p role="status" className="mt-3 text-xs text-muted-foreground">
              {dirtyKeys.size > 0
                ? "Unsaved changes — saving to this device…"
                : busy
                  ? "Saving or processing…"
                  : saved
                    ? C.saved
                    : "Save each review to keep changes."}
            </p>
            <DetailDisclosure
              title="Storage & privacy"
              className="mt-3 border-0 bg-transparent [&>summary]:px-0 [&>div]:px-0 [&>div]:text-xs"
            >
              {C.privacy}
            </DetailDisclosure>
            {!signedIn && (
              <p className="mt-3 text-xs text-muted-foreground">
                Guest session ·{" "}
                <Link
                  href={signInHref}
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Sign in
                </Link>{" "}
                to move work to your account vault.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
