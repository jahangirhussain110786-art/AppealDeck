"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ArrowRight, Check, FileSearch, FileText, Plus } from "lucide-react";
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
import { VerificationChecklistCard } from "@/components/VerificationChecklistCard";
import { FactsLedgerCard } from "@/components/FactsLedgerCard";
import { CaseFactsCard } from "./CaseFactsCard";
import Image from "next/image";
import { AppBarSlot } from "@/components/AppBarSlot";
import {
  CaseChecklist,
  CaseTimeline,
  NextRecordPaper,
  NextStepCard,
  type ChecklistRow,
  type TimelineDeadline,
} from "./CaseOverview";
import { RequestReview } from "./RequestReview";
import { EvidenceReview } from "./EvidenceReview";
import { ResponseReview, type WorkspaceResponse } from "./ResponseReview";
import { ReplyDeltaReview } from "./ReplyDeltaReview";
import { SellerDeadlineField } from "./SellerDeadlineField";
import { ChangeOfApproach } from "./ChangeOfApproach";
import { shouldOfferChangeOfApproach } from "@/core/escalation";
import { deadlinesForDisplay, sellerDeadline, withSellerDeadlines } from "@/core/deadlinesModel";
import { DetailDisclosure, VIEW_ICONS } from "./WorkspaceVisuals";
import { createCaseFile, type CaseFile } from "@/core/caseFile";
import {
  isSeverityGated,
  computeDeadlines,
  serializeDeadlines,
  formatDay,
  parseNotice,
  kindForConfirmedNotice,
  extractEntities,
  type EvidenceKind,
  type ViolationKind,
} from "@/core";
import {
  buildFactsLedger,
  entriesFromEntities,
  entriesFromSeller,
  entriesFromDocumentCheck,
  entriesFromCaseFacts,
  disagreementsFromDocumentCheck,
} from "@/core/factsLedger";
import { runDocumentCheck, type CheckOutcome } from "@/lib/documentChecks/runCheck";
import { analyzeReply } from "@/core/responseAnalyzer";
import { replyCriticisms } from "@/core/replyFeedback";
import { checkCaseDataForWorkspace } from "@/lib/documentChecks/context";
import {
  checkContextKey,
  savedCheckFor,
  withSavedCheck,
  type SavedDocumentCheck,
} from "@/core/documentCheck";
import { migrateLegacyCase, needsMigration, migrationSummary } from "@/core/legacyMigration";
import {
  addWorkspaceEvent,
  applyWorkspaceReply,
  newWorkspace,
  proposedRequirements,
  requirementsAfterKindChange,
  requirementsAfterNoticeChange,
  requirementKey,
  requirementEvidenceKind,
  sourceQuoteResolves,
  SELLER_SOURCE_NOTE,
  PROTOCOL_LABELS,
  questionnaireQuestions,
  routeWorkspace,
  workspaceCanCompose,
  type Requirement,
  type Workspace,
} from "@/core/workspace";
import { getBrowserVault } from "@/lib/vault/browser";
import { ensureFreshGuestSession } from "@/lib/vault/guestSession";
import { addFileToVault } from "@/lib/vault/addFileToVault";
import { withCaseEvidence } from "@/lib/caseEvidence";
import {
  loadCaseFile,
  saveCaseFile,
  loadCaseLog,
  saveCaseLog,
  setActiveCaseId,
} from "@/lib/caseStore";
import { loadCaseSummaries, type CaseSummary } from "@/lib/caseSummary";
import { usePublishCases } from "@/components/CaseListContext";
import { WorkspaceSchema } from "@/lib/workspaceSchema";
import { proposedIssues, totalAttempts } from "@/core/workspace";
import { buildCaseExport } from "@/lib/workspaceExport";
import { buildSubmission, submissionHistoryMessage } from "@/lib/submissionRecord";
import { buildEvidenceManifest, manifestFilename } from "@/lib/evidencePack";
import {
  evidenceNoteKey,
  HISTORY_REPLY_KEY,
  REQUEST_DRAFT_KEYS,
  responseDraftKeys,
  migrateAnswerDrafts,
  withDraftValue,
  withoutDraftKeys,
} from "@/lib/workspaceDraft";
import { peekPendingNotice, clearPendingNotice } from "@/lib/pendingNotice";
import { importDecodedNotice } from "@/lib/importDecodedNotice";
import type { Vault, VaultListItem } from "@/core/vault/vault";
import { formatDate } from "@/lib/format";
import { WORKSPACE as C } from "@/content/workspace";
import { APP } from "@/content/app";
import { trackFunnelEvent, FUNNEL_EVENTS } from "@/lib/analytics";

/**
 * Shared by the two text downloads below — one blob-URL lifecycle rather than two copies of it.
 * Named `downloadText` because `download` is already taken inside the component for fetching an
 * original file out of the vault.
 */
function downloadText(text: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

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
  initialKind,
  initialView,
}: {
  signedIn: boolean;
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
  initialKind,
  initialView,
}: {
  vault: Vault;
  signedIn: boolean;
  initialKind?: ViolationKind;
  initialView?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [file, setFile] = useState<CaseFile | null>(null);
  const fileRef = useRef<CaseFile | null>(null);
  /*
    `gated_screen_shown`: defined and sent from nowhere since the interview that fired it was
    retired, so how often the product declines a case was unmeasured. Once per case per visit, with
    no properties — which kind of serious allegation it was is not something analytics needs.
  */
  const gatedCountedFor = useRef<string | null>(null);
  useEffect(() => {
    if (!file?.workspace) return;
    const gatedCase =
      isSeverityGated(file.kind) || routeWorkspace(file.workspace).protocol === "specialist";
    if (!gatedCase || gatedCountedFor.current === file.id) return;
    gatedCountedFor.current = file.id;
    trackFunnelEvent(FUNNEL_EVENTS.gatedScreenShown);
  }, [file]);
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
  // AA-41 in the workspace: results keyed by vault record id, in memory only.
  const [docChecks, setDocChecks] = useState<Record<string, CheckOutcome>>({});
  const [checkingId, setCheckingId] = useState<string | null>(null);
  /** Set once when a pre-workspace case is migrated on open, so the change is explained. */
  const [migrationNote, setMigrationNote] = useState<string | null>(null);
  const draftTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const draftPending = useRef<Map<string, string | undefined>>(new Map());
  const draftCaseId = useRef<Map<string, string>>(new Map());
  // The sidebar's case list, read from the vault this page already has open (see CaseListContext).
  const [caseSummaries, setCaseSummaries] = useState<CaseSummary[] | null>(null);
  const fileId = file?.id;
  const fileState = file?.state;
  const deadlineKey = JSON.stringify(file?.deadlines ?? null);
  useEffect(() => {
    if (!fileId) return;
    let alive = true;
    void loadCaseSummaries(vault, fileId)
      .then((s) => {
        if (alive) setCaseSummaries(s);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [vault, fileId, fileState, deadlineKey]);
  const openCase = useCallback((id: string) => setActiveCaseId(vault, id), [vault]);
  usePublishCases(caseSummaries, openCase);
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
              };
        if (pendingNotice) {
          clearPendingNotice(pendingNotice);
          persisted.current = JSON.stringify(next.workspace);
        }
        const reconciled = pendingNotice ? await withCaseEvidence(vault, next) : next;
        const displayed = reconciled.workspace
          ? {
              ...reconciled,
              workspace: {
                ...reconciled.workspace,
                draft: migrateAnswerDrafts(reconciled.workspace),
              },
            }
          : reconciled;
        const docs = (await vault.list({ caseId: next.id })).filter((r) => r.kind === "document");
        if (!alive) return;
        setCurrent(displayed);
        setSaved(Boolean(existing || pendingNotice));
        // B-12: `intake_started` was defined in analytics.ts since 11 Sep 2026 and fired from
        // nowhere, so step 3 of the funnel has always been empty. The workspace is the intake now
        // that the classic interview is retired, and the honest trigger is a case that did not
        // exist before this open — once per case, covering both a fresh start and a decode import.
        if (!existing) trackFunnelEvent(FUNNEL_EVENTS.intakeStarted);

        /**
         * Retiring the classic interview: a case saved before the workspace existed is migrated
         * here, on open, rather than waiting behind a button that no longer has a page to live on.
         * `migrateLegacyCase` is lossless and idempotent, and the seller is told what moved.
         */
        if (needsMigration(displayed)) {
          const summary = migrationSummary(displayed);
          const migrated: CaseFile = { ...displayed, workspace: migrateLegacyCase(displayed) };
          await saveCaseFile(vault, migrated);
          if (!alive) return;
          persisted.current = JSON.stringify(migrated.workspace);
          setCurrent(migrated);
          setSaved(true);
          setMigrationNote(summary);
        }
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

  /**
   * Every save runs, in the order it was asked for.
   *
   * `commit` used to open with `if (saving.current) return false`, so a save asked for while
   * another was in flight was **dropped** — and `flushDraftKey` had already removed the edit from
   * its pending map before awaiting that answer, with nothing to put it back. One field survived
   * and the rest were gone.
   *
   * The unmount path made that the normal case rather than a rare one: leaving the page flushes
   * every pending key in a synchronous loop, so the first started a save and every other one hit
   * the guard and vanished. That path is the sign-in redirect AM-21 deliberately routes sellers
   * through, in the middle of typing, which is the worst possible moment to lose their words.
   *
   * Serialising rather than dropping also keeps the optimistic-concurrency check below honest: it
   * compares against `persisted.current`, which the previous save has finished updating by the time
   * the next one starts.
   *
   * **The updater runs later than the call.** It receives the workspace as it stands once every
   * earlier save has landed, which is the point — but it means an updater must never read anything
   * mutable lazily. Read event values into a local before calling `commit`: the first version of
   * this change broke the "this list covers all requested records" checkbox, because its updater
   * read `e.target.checked` after React had reset the controlled input, and wrote `false`.
   */
  const commitQueue = useRef<Promise<unknown>>(Promise.resolve());
  const commit = (
    update: (w: Workspace) => Workspace,
    message?: string,
    state?: CaseFile["state"],
    opts?: {
      silent?: boolean;
      /** Leave the case state alone: this change is bookkeeping, not a new response. */
      keepState?: boolean;
      deadlines?: CaseFile["deadlines"];
      kind?: ViolationKind;
      kindSetBy?: CaseFile["kindSetBy"];
    },
  ): Promise<boolean> => {
    const run = commitQueue.current.then(() => runCommit(update, message, state, opts));
    // The chain must survive a rejection, or one failure would strand every later save.
    commitQueue.current = run.catch(() => undefined);
    return run;
  };

  const runCommit = async (
    update: (w: Workspace) => Workspace,
    message?: string,
    state?: CaseFile["state"],
    // B-06: `kind` joins `deadlines` as a file-level field a commit may change. It is not
    // cosmetic — it drives severity gating, the evidence-matrix union and the per-record guidance,
    // so a seller who cannot correct it is stuck with three wrong answers derived from one.
    opts?: {
      silent?: boolean;
      keepState?: boolean;
      deadlines?: CaseFile["deadlines"];
      kind?: ViolationKind;
      kindSetBy?: CaseFile["kindSetBy"];
    },
  ) => {
    if (!fileRef.current) return false;
    // Restored rather than cleared in `finally`. `generate` and the new-case action hold this flag
    // as their own guard; now that commits no longer bail out when it is set, a queued save that
    // blindly cleared it would release someone else's guard halfway through their work.
    const heldBefore = saving.current;
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
        state:
          state ?? (current.state === "SUBMITTED" && !opts?.keepState ? "REVISION" : current.state),
        ...(opts?.deadlines !== undefined ? { deadlines: opts.deadlines } : {}),
        ...(opts?.kind !== undefined ? { kind: opts.kind } : {}),
        ...(opts?.kindSetBy !== undefined ? { kindSetBy: opts.kindSetBy } : {}),
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
      saving.current = heldBefore;
      if (!opts?.silent) setBusy(false);
    }
  };

  /**
   * Debounced autosave for in-progress field text into the encrypted, vault-backed
   * `Workspace.draft` map, so edits survive route changes (including the sign-in
   * redirect), reloads and tab closes, not only an explicit "Save" click.
   */
  // A named function expression, so the retry below refers to this function itself rather than
  // to the `flushDraftKey` binding before it is initialised.
  const flushDraftKey = useCallback(function flushDraft(key: string) {
    const timer = draftTimers.current.get(key);
    if (timer) {
      clearTimeout(timer);
      draftTimers.current.delete(key);
    }
    if (!draftPending.current.has(key)) return;
    const value = draftPending.current.get(key);
    const scopedId = draftCaseId.current.get(key);
    const clear = () =>
      setDirtyKeys((s) => {
        if (!s.has(key)) return s;
        const next = new Set(s);
        next.delete(key);
        return next;
      });
    const forget = () => {
      draftPending.current.delete(key);
      draftCaseId.current.delete(key);
    };
    if (scopedId !== undefined && fileRef.current?.id !== scopedId) {
      forget();
      clear();
      return;
    }
    // Another action holds the workspace — `generate` reading a consistent snapshot, or a new case
    // being created. A draft write landing mid-way would make `generate` report a changed document
    // that did not change. The edit is still pending, so trying again shortly costs nothing; before
    // the requeue fix below, deferring here would have been impossible because the edit was gone.
    if (saving.current || uploading.current) {
      draftTimers.current.set(
        key,
        setTimeout(() => flushDraft(key), 900),
      );
      return;
    }
    /*
      The edit stays in `draftPending` until it is actually on disk. It used to be deleted here,
      before the await, and the `.then` had no branch for a failed save — so a save that did not
      happen took the seller's text with it and the "unsaved" indicator stayed on forever, pointing
      at a value nothing would ever write.

      On success it is dropped only if it still holds the value that was written: if the seller kept
      typing during the save, the newer text is pending and the next flush owes them that write.
    */
    void commit(
      (w) => ({ ...w, draft: withDraftValue(w.draft, key, value) }),
      undefined,
      undefined,
      { silent: true },
    ).then((ok) => {
      if (!ok) return;
      if (draftPending.current.get(key) === value) {
        forget();
        clear();
      }
    });
    // commit's own behaviour is ref-driven and stable across renders; see its definition.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Writes every pending field in a single save, for the moment the seller leaves the page.
   *
   * The unmount effect used to call `flushDraftKey` once per key in a synchronous loop, which
   * started one save and queued the rest behind it. With the drop-guard gone none are lost any
   * more, but a run of separate vault writes during teardown is still the wrong shape: each one
   * re-reads the case, and the seller is already navigating. One write says the same thing.
   */
  const flushAllDraftKeys = useCallback(() => {
    for (const timer of draftTimers.current.values()) clearTimeout(timer);
    draftTimers.current.clear();

    const caseId = fileRef.current?.id;
    const entries: Array<[string, string | undefined]> = [];
    for (const [key, value] of draftPending.current) {
      const scopedId = draftCaseId.current.get(key);
      // A key typed against a different case is dropped, exactly as the per-key flush does — it
      // belongs to a case this vault write is not about.
      if (scopedId !== undefined && caseId !== scopedId) continue;
      entries.push([key, value]);
    }
    if (entries.length === 0) return;

    void commit(
      (w) => ({
        ...w,
        draft: entries.reduce((draft, [key, value]) => withDraftValue(draft, key, value), w.draft),
      }),
      undefined,
      undefined,
      { silent: true },
    ).then((ok) => {
      if (!ok) return;
      for (const [key, value] of entries) {
        if (draftPending.current.get(key) === value) {
          draftPending.current.delete(key);
          draftCaseId.current.delete(key);
        }
      }
    });
    // commit is ref-driven and stable across renders; see its definition.
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
    return () => {
      // Every pending field, in one write. The per-key loop that used to be here started one save
      // and dropped the rest on the floor.
      flushAllDraftKeys();
    };
    // Flush on unmount only (e.g. navigating to sign-in); not on every callback identity change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const changeRequirement = (value: Requirement) => {
    const current = fileRef.current?.workspace;
    /*
      Was an inline `includes` against the current notice, which meant three kinds of requirement
      could be shown but never actioned: one we inferred from the evidence matrix (its quote is
      ours, and is not in the notice by definition), one the seller added themselves, and one
      carried through a reply round (its quote belongs to the previous request). The seller was
      told to "update the task's source to an exact sentence from the current notice" — an
      instruction that cannot be followed when no such sentence exists. `sourceQuoteResolves` is
      the same rule `workspaceGaps` applies, so the two can no longer disagree.
    */
    if (!current || !sourceQuoteResolves(current, value)) {
      setError(
        "Update the task’s source to an exact sentence from the request it came from before reviewing it.",
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
      /*
        The record is stored as the kind of record it actually is.

        This was `evidenceKind: "other"`, hardcoded, on every upload — and `runCheckFor` then read
        that value back to decide both what to check the document against and, more seriously,
        whether it may leave the device at all. So a passport attached to an identity requirement
        was filed as "other", missed the browser-only route, and was sent to the server; and every
        other document was checked against a requirement list that did not describe it, which is
        why the check reported "not one Amazon asks for on this case" about the very record Amazon
        had asked for.

        `requirementEvidenceKind` returns undefined for a record the seller worded themselves. That
        is left undefined rather than coerced to "other": an unnamed document is one we cannot
        promise is not sensitive, and saying so is the honest answer. Original documents are stored
        intact; attaching never means reviewed.
      */
      const requirement = fileRef.current.workspace?.requirements.find((r) => r.id === id);
      const added = await addFileToVault(vault, uploadFile, {
        caseId,
        evidenceKind: requirement ? requirementEvidenceKind(requirement) : undefined,
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
  /**
   * AA-41. Checks a requirement's linked file against what Amazon asks for on that requirement.
   *
   * The kind comes from the requirement first and the stored record second. The requirement is the
   * authority — it is what Amazon asked for — and reading the record alone meant a file attached
   * before this was fixed, and therefore stored as `"other"`, would keep being checked as "other"
   * forever. Falling back to the record covers a file linked from the vault rather than uploaded
   * here.
   *
   * When neither names a kind the check does not happen and says so. There is deliberately no
   * `?? "other"` here: that fallback is what let an unidentified document reach the network.
   */
  const runCheckFor = async (req: Requirement) => {
    const recordId = req.recordId;
    if (!recordId) return;
    setCheckingId(recordId);
    try {
      const { record, bytes } = await vault.get(recordId);
      const evidenceKind =
        requirementEvidenceKind(req) ?? (record.evidenceKind as EvidenceKind | undefined);
      if (!evidenceKind) {
        setDocChecks((prev) => ({
          ...prev,
          [recordId]: { kind: "unavailable", message: C.check.unnamed },
        }));
        return;
      }
      const ws = fileRef.current?.workspace;
      // The ASINs and IDs Amazon named, from every request on the case, so an invoice is compared
      // with the product Amazon asked about rather than judged in the abstract.
      const caseData = ws ? checkCaseDataForWorkspace(ws) : undefined;
      const outcome = await runDocumentCheck({
        caseId: fileRef.current?.id ?? "",
        kind: fileRef.current?.kind ?? "UNKNOWN",
        evidenceKind,
        bytes,
        mimeType: record.mimeType || "application/octet-stream",
        caseData,
      });
      setDocChecks((prev) => ({ ...prev, [recordId]: outcome }));
      // Kept with the case (24 Sep 2026), so a paid reading survives a reload. A check that could
      // not run is not saved — there is nothing to keep, and the seller simply tries again.
      if (outcome.kind !== "unavailable") {
        const entry: SavedDocumentCheck = {
          recordId,
          ...(req.contentHash ? { contentHash: req.contentHash } : {}),
          at: new Date().toISOString(),
          contextKey: checkContextKey(caseData ?? {}),
          outcome,
        };
        const kept = await commit(
          (old) => ({
            ...old,
            documentChecks: withSavedCheck(
              old.documentChecks,
              entry,
              old.requirements.flatMap((r) => (r.recordId ? [r.recordId] : [])),
            ),
          }),
          undefined,
          undefined,
          { silent: true, keepState: true },
        );
        // Once saved, the saved copy is what shows — with the day it ran, so the seller can see it
        // is kept. Until then the reading shows from memory, so nothing waits on the vault.
        if (kept)
          setDocChecks((prev) => {
            const next = { ...prev };
            delete next[recordId];
            return next;
          });
      }
    } catch {
      setDocChecks((prev) => ({
        ...prev,
        [recordId]: {
          kind: "unavailable",
          message: "We could not open that file from your vault. Your document is unchanged.",
        },
      }));
    } finally {
      setCheckingId(null);
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
              // Saved document readings are for the seller's own review and export; preparing the
              // response does not use them, so they do not travel with it.
              documentChecks: undefined,
              draft: undefined,
            },
          },
          attemptNumber: Math.min(99, totalAttempts(w) + 1),
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
      // Defined in analytics.ts and sent from nowhere until 23 Sep 2026, so the funnel could not
      // tell a seller who bought a Pass and prepared a response from one who stopped.
      trackFunnelEvent(FUNNEL_EVENTS.poaGenerated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Response preparation failed.");
    } finally {
      saving.current = false;
      setBusy(false);
    }
  };

  /*
    Records what the seller says they sent. Until 23 Sep 2026 this refused unless the prepared
    response passed every check, and always saved the prepared text — so a seller who edited it in
    Seller Central, or sent it with a warning open, could not record the attempt at all, or recorded
    words they never sent. The rules now live in `buildSubmission`, where they are tested.
  */
  const recordSubmission = async ({
    receipt,
    sentText,
  }: {
    receipt: string;
    sentText?: string;
  }) => {
    if (!result || !fileRef.current?.workspace) return false;
    // Current evidence, not the evidence as it stood when the response was prepared.
    const fresh = await withCaseEvidence(vault, fileRef.current);
    const submission = buildSubmission({
      workspace: fresh.workspace!,
      prepared: {
        rendered: result.rendered,
        mode: result.draft.mode.mode,
        findings: result.critique.findings,
      },
      sentText,
      receipt,
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
    });
    const ok = await commit(
      (w) => ({ ...w, submissions: [...w.submissions, submission] }),
      submissionHistoryMessage(submission),
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
  /**
   * The classic interview is retired (founder direction, 22 Sep 2026), so there is no longer a
   * second place for a workspace-less case to live. It used to sit here behind an "Add workspace"
   * button with the interview underneath; now it migrates on open, in the background, carrying
   * everything the seller wrote (`migrateLegacyCase`, which is lossless and idempotent).
   *
   * A spinner rather than a button: making a seller press "upgrade" to reach their own case is
   * asking them to care about our internal history at the worst possible moment.
   */
  if (!file.workspace) return <Loading />;
  const w = file.workspace;
  const route = routeWorkspace(w);
  const gated = isSeverityGated(file.kind) || route.protocol === "specialist";

  /**
   * AA-41/AA-42 carry-forward: the facts ledger.
   *
   * Assembled from the three sources that are actually available here — the decoder's entities from
   * the seller's own notice, the notes the seller wrote against each requirement, and whatever
   * document checks the case holds.
   *
   * Since 24 Sep 2026 a check is saved with the case (`SavedDocumentCheck`). A saved reading that
   * was compared with different case details — the seller has since corrected their business
   * address, say — is shown on its record as out of date and kept out of the ledger, because a
   * disagreement computed against details that no longer hold is not a disagreement the case has.
   */
  const contextKeyNow = checkContextKey(checkCaseDataForWorkspace(w));
  const checkShownFor = (
    r: Requirement,
  ): { outcome: CheckOutcome; at?: string; stale: boolean } | null => {
    if (!r.recordId) return null;
    const live = docChecks[r.recordId];
    if (live) return { outcome: live, stale: false };
    const saved = savedCheckFor(w.documentChecks, r.recordId, r.contentHash);
    return saved
      ? { outcome: saved.outcome, at: saved.at, stale: saved.contextKey !== contextKeyNow }
      : null;
  };
  const checkedFiles = w.requirements.flatMap((r) => {
    const shown = checkShownFor(r);
    return shown && !shown.stale && shown.outcome.kind === "fields"
      ? [
          {
            filename:
              r.filename ??
              records.find((rec) => rec.id === r.recordId)?.name ??
              "an uploaded document",
            result: shown.outcome.result,
          },
        ]
      : [];
  });
  const ledger = buildFactsLedger(
    [
      // The draft is read first: `w.notice` only becomes populated when the seller confirms the
      // request, so reading it alone left the ledger invisible for everyone who had typed their
      // notice but not yet confirmed the route — which is most of the time they spend here.
      ...entriesFromEntities(extractEntities(w.draft?.["request.notice"] ?? w.notice)),
      ...entriesFromSeller(
        Object.fromEntries(
          w.requirements.filter((r) => r.note.trim()).map((r) => [r.label, r.note]),
        ),
      ),
      // The business details the seller stated once — the facts every document is compared with.
      ...entriesFromCaseFacts(w.caseFacts),
      ...checkedFiles.flatMap((c) => entriesFromDocumentCheck(c.filename, c.result)),
    ],
    // Where a checked document disagrees with the notice or with those details: both sides, both
    // sources, listed with every other disagreement (ChatGPT audit item G, 24 Sep 2026).
    checkedFiles.flatMap((c) => disagreementsFromDocumentCheck(c.filename, c.result)),
  );
  const next = w.requirements.find((r) => r.status !== "reviewed");
  const awaiting = file.state === "SUBMITTED" && !w.replies.some((r) => !r.applied);
  const replyPending = w.replies.some((r) => !r.applied);
  const confirmRequest = async (updated: Workspace) => {
    cancelDraftFields(REQUEST_DRAFT_KEYS);
    /*
      The classification wire-up, 23 Sep 2026. Until now only `/decode` ever classified a notice, so
      a case started by typing one straight in here stayed `UNKNOWN` — the most ordinary path in the
      product carried an empty evidence matrix, no violation-specific reasons, and needed fallbacks
      in two places to show guidance at all. `kindForConfirmedNotice` states the rules: a seller's
      own correction is final, an unplaceable notice never downgrades a known kind, and otherwise
      the notice decides.

      The kind is read before the requirements are built, because B-05's matrix union depends on it.

      Deadlines are computed here too, since the same day. They were held back at first because
      `/decode` counted a stated window from the moment of decoding — wrong in the dangerous
      direction for a notice received days earlier — and repeating that here would have spread it
      to every typed case. That is fixed at the source: a window is counted from the notice's own
      header date when it carries one, and otherwise described as running from the day the seller
      received it, with no invented countdown. So a typed notice now shows its window like a decoded
      one, instead of "no confirmed deadline recorded" beside a notice that states thirty days.
    */
    const current = fileRef.current;
    const previousKind = current?.kind ?? "UNKNOWN";
    const parsed = parseNotice(`${updated.notice}\n${updated.formInstructions}`);
    const kind = current ? kindForConfirmedNotice(current, parsed) : previousKind;
    const kindChanged = kind !== previousKind;
    // A date the seller entered from Account Health survives a re-read of the notice.
    const deadlines = withSellerDeadlines(
      serializeDeadlines(computeDeadlines({ parsed, kind })),
      current?.deadlines,
    );
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
        // B-05: the kind unions the evidence matrix in, so a record this violation family nearly
        // always needs is raised even when the notice never spells it out. Rebuilt from the
        // corrected text on every confirmation, not only the first, and merged so a record the
        // seller has worked on is never removed because we read the notice again — see
        // `requirementsAfterNoticeChange`. A changed kind's records arrive through the same merge.
        requirements: requirementsAfterNoticeChange(
          old.requirements,
          proposedRequirements(updated, kind),
          old.dismissed,
        ),
        // #86: recomputed on every route confirmation, because the notice text may have changed
        // and a second issue must not survive from a notice the seller has since replaced.
        issues: proposedIssues(updated),
        issuesConfirmed: false,
        submissions: old.submissions,
        replies: old.replies,
        history: old.history,
        draft: withoutDraftKeys(old.draft, REQUEST_DRAFT_KEYS),
      }),
      // Said in the case history, so a reading we made is visible as ours and can be corrected.
      kindChanged
        ? `Saved the notice and reviewed response route. We read it as: ${APP.violationKinds[kind]}.`
        : "Saved the notice and reviewed response route.",
      "INTAKE",
      kindChanged ? { kind, deadlines } : { deadlines },
    );
    if (ok) setReviewRequest(false);
    return ok;
  };
  /*
    The time windows, said once and used twice: the first dated one heads the next-step card, and
    the timeline lists them all. The wording is the notice's own ("Appeal by 1 Oct 2026"), or says
    plainly that the date must come from Account Health; no countdown is invented for an undated one.
  */
  const deadlineLines: TimelineDeadline[] = file.deadlines?.length
    ? deadlinesForDisplay(file.deadlines).map((d) => ({
        hot: Boolean(d.dueOn || d.dueAt) && !d.isIndefinite,
        text: d.isIndefinite
          ? `${d.label} — no countdown to track`
          : d.dueOn
            ? // The day as the notice gives it; a stated date is already in its own label
              // ("Appeal by 1 Oct 2026").
              d.startsOn
              ? `${d.label}, closes ${formatDay(d.dueOn)}`
              : d.label
            : d.dueAt
              ? `${d.label}: ${formatDate(d.dueAt)}`
              : d.startsOnReceipt
                ? // Amazon gave the length; the notice did not carry its date.
                  `${d.label}, from the day you received this notice`
                : `${d.label} · confirm the date in Account Health`,
      }))
    : [];
  const caseTitle = file.kind === "UNKNOWN" ? C.title : APP.violationKinds[file.kind];
  const nextTab =
    replyPending || awaiting || !workspaceCanCompose(w)
      ? "history"
      : next || !w.requirementsConfirmed
        ? "evidence"
        : "response";
  const responseText = [w.explanation, w.correctiveActions, w.preventiveMeasures]
    .join("")
    .trim().length;
  const sentThisRound = w.submissions.some(
    (s) => s.source !== "prior" && s.revision === w.revision,
  );
  const checklistRows: ChecklistRow[] = [
    ...w.requirements.map((r): ChecklistRow => ({
      id: r.id,
      title: r.label,
      sub: C.overview.source[r.source ?? "notice"],
      tone: r.status === "reviewed" ? "ok" : r.status === "waiting" ? "todo" : ("need" as const),
      pill: {
        tone:
          r.status === "reviewed"
            ? "ok"
            : r.status === "waiting"
              ? "new"
              : r.status === "cannot_obtain"
                ? "mute"
                : "need",
        label: C.status[r.status],
        dot: r.status === "needed",
      },
      detail: r.filename,
      mono: Boolean(r.filename),
      onOpen: () => setTab("evidence"),
    })),
    ...(w.issues && w.issues.length > 1
      ? [
          {
            id: "issues",
            title: C.overview.issuesRow,
            tone: w.issuesConfirmed ? ("ok" as const) : ("need" as const),
            pill: w.issuesConfirmed
              ? { tone: "ok" as const, label: C.overview.doneLabel }
              : { tone: "need" as const, label: C.status.needed, dot: true },
            detail: C.overview.issuesCount.replace("{n}", String(w.issues.length)),
            onOpen: () => setTab("response"),
          },
        ]
      : []),
    ...(workspaceCanCompose(w)
      ? [
          {
            id: "response",
            title: C.overview.responseRow,
            tone: sentThisRound ? ("ok" as const) : ("todo" as const),
            pill: sentThisRound
              ? { tone: "ok" as const, label: C.overview.responseSent }
              : responseText
                ? { tone: "mute" as const, label: C.overview.responseDraft }
                : { tone: "mute" as const, label: C.overview.responseEmpty },
            detail: responseText
              ? C.overview.characters.replace("{n}", responseText.toLocaleString("en-US"))
              : undefined,
            onOpen: () => setTab(sentThisRound ? "history" : "response"),
          },
        ]
      : []),
  ];
  return (
    <div className="space-y-5">
      <AppBarSlot target="title">
        {/* The case's own issue, once we know it: "Your case workspace" told the seller nothing. */}
        <h1 className="truncate text-sm font-semibold text-foreground">{caseTitle}</h1>
        {/* Each Amazon reply starts a new round; "R1" was shorthand only we used. */}
        <span className="hidden shrink-0 font-mono text-xs sm:inline">
          {C.round.replace("{n}", String(w.revision))}
        </span>
      </AppBarSlot>
      <AppBarSlot target="actions">
        <p
          role="status"
          className="flex max-w-[40vw] items-center gap-1.5 text-[0.8125rem] leading-tight text-muted-foreground sm:max-w-none"
        >
          {dirtyKeys.size === 0 && !busy && saved && (
            <Check className="size-3.5 text-success" aria-hidden />
          )}
          {dirtyKeys.size > 0
            ? "Unsaved changes — saving to this device…"
            : busy
              ? "Saving or processing…"
              : saved
                ? C.saved
                : "Save each review to keep changes."}
        </p>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setNewCasePrompt(true)}
          className="hidden sm:inline-flex"
        >
          <Plus className="mr-1.5 h-4 w-4" aria-hidden />
          New case
        </Button>
      </AppBarSlot>
      {/* Explains a case that has visibly changed shape since the seller last opened it. */}
      {migrationNote && (
        <Alert>
          <AlertTitle>Your case moved into the workspace</AlertTitle>
          <AlertDescription>{migrationNote}</AlertDescription>
        </Alert>
      )}
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
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_21.25rem]">
        <div className="min-w-0 space-y-5">
          <Tabs value={tab} onValueChange={setTab}>
            {/* An underlined row, the way the public header marks the current page: the case reads
                as one page with four views, not as a control panel. */}
            <TabsList
              className="flex h-auto w-full justify-start gap-1 overflow-x-auto rounded-none border-b border-border bg-transparent p-0 [scrollbar-width:none]"
              aria-label="Case workspace views"
            >
              {Object.entries(C.tabs).map(([id, label]) => {
                const Icon = VIEW_ICONS[id] ?? FileSearch;
                return (
                  <TabsTrigger
                    key={id}
                    value={id}
                    className="-mb-px flex h-11 shrink-0 items-center gap-2 rounded-none border-b-2 border-transparent px-3 text-sm data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
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
              {/* B-04: after two responses and another refusal, a different route, not a third copy. */}
              {shouldOfferChangeOfApproach(w) && <ChangeOfApproach />}
              {!w.confirmed || reviewRequest ? (
                <>
                  {!w.confirmed && (
                    <NextStepCard
                      due={deadlineLines.find((d) => d.hot)?.text}
                      title={C.overview.confirmTitle}
                      body={C.overview.confirmBody}
                    />
                  )}
                  <RequestReview
                    key={`${file.id}-${w.revision}-${reviewRequest}-${file.kind}`}
                    workspace={w}
                    kind={file.kind}
                    busy={busy}
                    onSave={confirmRequest}
                    /*
                    B-06: additive by construction. Rebuilding the list would delete records the
                    seller has already reviewed and linked a file to — punishing them for telling
                    us we read the notice wrong, which is the opposite of the point.
                  */
                    onKindChange={(next) =>
                      commit(
                        (old) => ({
                          ...old,
                          requirements: requirementsAfterKindChange(
                            old.requirements,
                            next,
                            old.dismissed,
                          ),
                          requirementsConfirmed: false,
                        }),
                        C.kindOverride.applied.replace("{kind}", APP.violationKinds[next]),
                        undefined,
                        // Marked as the seller's, so the classification that now runs on every route
                        // confirmation never overwrites a correction they made on purpose.
                        { kind: next, kindSetBy: "seller" },
                      )
                    }
                    /*
                    #91 needs a save that keeps the whole workspace. `confirmRequest` deliberately
                    enumerates the fields a route confirmation may change and re-uses `old` for the
                    rest — including `submissions` — so putting a recorded prior attempt through it
                    would drop it on the way to the vault.
                  */
                    onCommitWorkspace={(updated) =>
                      commit(
                        () => updated,
                        "Recorded a response sent before this case was created.",
                      )
                    }
                    draft={w.draft}
                    onDraftChange={setDraftField}
                  />
                </>
              ) : (
                <>
                  <NextStepCard
                    due={deadlineLines.find((d) => d.hot)?.text}
                    aside={
                      next && !gated && !replyPending && !awaiting ? (
                        <NextRecordPaper requirement={next} />
                      ) : undefined
                    }
                    title={
                      gated
                        ? "Get professional help with this allegation"
                        : replyPending
                          ? C.replyPending.title
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
                                    : "Prepare your factual response"
                    }
                    body={
                      gated
                        ? C.unsupported
                        : replyPending
                          ? C.replyPending.body
                          : awaiting
                            ? "Your submitted text and document references are preserved in History. Add a reply when one arrives."
                            : next
                              ? next.status === "waiting"
                                ? C.waitingHelp
                                : "Read the original, record what it supports, and resolve anything unclear."
                              : route.reason
                    }
                    actions={
                      <>
                        <Button onClick={() => setTab(nextTab)}>
                          {replyPending
                            ? C.replyPending.cta
                            : awaiting
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
                      </>
                    }
                  />
                  {/* The route itself, said once, then everything that has to be done for it. */}
                  <p className="px-1 text-[0.8125rem] text-muted-foreground">
                    {PROTOCOL_LABELS[w.protocol]} · You review the wording and send it yourself
                    through Amazon’s own page.
                  </p>
                  {checklistRows.length > 0 && <CaseChecklist rows={checklistRows} />}
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
                  <CardTitle as="h2" className="text-[1.375rem] tracking-[-0.025em]">
                    Requested records
                  </CardTitle>
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
                        <Label htmlFor="requirement-source">{C.sourceLabel}</Label>
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
                        // The source box is no longer required: a record the seller knows the case
                        // needs is worth recording whether or not Amazon put it in writing.
                        disabled={busy || !newLabel.trim() || w.requirements.length >= 30}
                        onClick={async () => {
                          /*
                            This used to refuse the save outright unless the typed sentence appeared
                            verbatim in the notice — so a seller or appeal writer who knew from
                            experience that the case needed a record Amazon had not named could not
                            write it down. Knowing the unnamed requirement is the expertise being
                            sold, and the form blocked exactly that.

                            Now the text decides provenance instead of permission: if it really is
                            Amazon's sentence it is recorded as theirs, against the revision it came
                            from; if it is not, it is recorded as the seller's own and never shown
                            as a quotation. Nothing is attributed to Amazon that they did not write.
                          */
                          const typed = newSource.trim();
                          // `includes("")` is true, so the length test is load-bearing: without it
                          // an empty box would be recorded as an Amazon quotation.
                          const fromNotice =
                            typed.length > 0 &&
                            `${w.notice}\n${w.formInstructions}`.includes(typed);
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
                                    sourceQuote: fromNotice ? typed : SELLER_SOURCE_NOTE,
                                    status: "needed",
                                    note: "",
                                    source: fromNotice ? ("notice" as const) : ("seller" as const),
                                    ...(fromNotice ? { sourceRevision: w.revision } : {}),
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
                      onChange={(e) => {
                        // Read now, not inside the updater. `commit` runs its updater after any
                        // save already in flight, which is after this handler has returned — and
                        // by then React has reset this controlled input to the saved value, so a
                        // lazy `e.target.checked` reads `false` and the tick silently undoes itself.
                        const confirmed = e.target.checked;
                        void commit((old) => ({ ...old, requirementsConfirmed: confirmed }));
                      }}
                    />
                    {C.allRequirements}
                  </label>
                </CardContent>
              </Card>
              {/* Before the records: a check compares each document with these. */}
              <CaseFactsCard
                key={JSON.stringify(w.caseFacts ?? {})}
                facts={w.caseFacts}
                busy={busy}
                onSave={(facts) =>
                  commit((old) => {
                    // Built without the key when empty, never by merging `undefined` over it.
                    const { caseFacts: _previous, ...rest } = old;
                    void _previous;
                    return Object.keys(facts).length > 0 ? { ...rest, caseFacts: facts } : rest;
                  }, C.caseFacts.saved)
                }
              />
              {w.requirements.map((r) => (
                <EvidenceReview
                  key={`${r.id}-${r.recordId}-${r.status}-${r.sourceQuote}`}
                  item={r}
                  violationKind={file.kind}
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
                        // Remembered, so reading the notice again does not raise it a second time.
                        dismissed: [
                          ...(old.dismissed ?? []).filter((d) => d.key !== requirementKey(r)),
                          {
                            key: requirementKey(r),
                            label: r.label,
                            reason,
                            at: new Date().toISOString(),
                          },
                        ],
                      }),
                      `Removed ${r.label} from the current plan: ${reason}`,
                    )
                  }
                  onUpload={(f) => upload(r.id, f)}
                  onDownload={(id) => void download(id)}
                  checkOutcome={checkShownFor(r)?.outcome ?? null}
                  checkedAt={checkShownFor(r)?.at}
                  checkStale={checkShownFor(r)?.stale ?? false}
                  checking={checkingId === r.recordId}
                  onCheck={r.recordId ? () => void runCheckFor(r) : undefined}
                />
              ))}
              {/* The ledger sits after the evidence, because it is the comparison across it. */}
              <FactsLedgerCard ledger={ledger} />
            </TabsContent>
            <TabsContent forceMount value="response" className="mt-5 data-[state=inactive]:hidden">
              {gated ? (
                <Alert variant="warning">
                  <AlertTitle>Professional review needed</AlertTitle>
                  <AlertDescription>{C.unsupported}</AlertDescription>
                </Alert>
              ) : route.protocol === "verification" ? (
                /*
                  AA-42: a verification case gets a preparation checklist instead of a drafting
                  surface. Before AA-39 these landed in "please clarify" with nothing at all; giving
                  them a composer would be worse still, because it would invite a seller to write an
                  appeal when Amazon asked for a passport.
                */
                <VerificationChecklistCard notice={`${w.notice}\n${w.formInstructions}`} />
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
                  onConfirmIssues={(confirmed) => {
                    void commit((old) => ({ ...old, issuesConfirmed: confirmed }));
                  }}
                  onSave={(updated) => {
                    // Includes one key per questionnaire answer, so a saved answer's draft is
                    // cleared with the rest instead of being shown again over the saved text.
                    const keys = responseDraftKeys(questionnaireQuestions(updated));
                    cancelDraftFields(keys);
                    return commit(
                      (old) => ({
                        ...old,
                        explanation: updated.explanation,
                        correctiveActions: updated.correctiveActions,
                        correctiveActionsAttested: updated.correctiveActionsAttested,
                        preventiveMeasures: updated.preventiveMeasures,
                        answers: updated.answers,
                        draft: withoutDraftKeys(old.draft, keys),
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
                  <CardTitle as="h2" className="text-[1.375rem] tracking-[-0.025em]">
                    Submissions and replies
                  </CardTitle>
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
                      {!r.applied && <ReplyReading text={r.text} />}
                      {!r.applied && (
                        <>
                          {/*
                            B-03: the delta is shown before the revision starts, so "confirm before
                            applying" is literal. It is recomputed from the authoritative workspace
                            inside the commit below rather than passed down from here, so a stale
                            preview can never be the thing that gets written.
                          */}
                          <ReplyDeltaReview workspace={w} replyId={r.id} />
                          <p className="text-xs text-muted-foreground">
                            The reply becomes the request for the next round. What you already sent
                            stays unchanged.
                          </p>
                          <Button
                            disabled={busy}
                            size="sm"
                            onClick={async () => {
                              // The reply carries whatever new time window Amazon stated, if any
                              // — the case's deadlines were frozen at the original notice and
                              // would otherwise keep showing a now-irrelevant (possibly already
                              // expired) date after this revision starts.
                              // No `noticeReceivedAt`: this was `new Date()`, which counted the
                              // reply's window from the moment it was applied rather than from when
                              // Amazon sent it. The reply's own header date is used if it has one.
                              // A date the seller entered is theirs, not the reply's, so it is
                              // kept; Amazon's new window, if the reply states one, sits beside it.
                              const recomputed = withSellerDeadlines(
                                serializeDeadlines(
                                  computeDeadlines({
                                    parsed: parseNotice(r.text),
                                    kind: file.kind,
                                  }),
                                ),
                                file.deadlines,
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
                            Start the next round with this reply
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
                  <div className="mt-5 flex flex-wrap gap-3">
                    <Button
                      variant="outline"
                      onClick={() =>
                        void (async () => {
                          // The log holds the outcome and follow-up dates. A read failure still
                          // exports the case, and the outcome section says it could not be read.
                          const log = await loadCaseLog(vault, file.id).catch(() => undefined);
                          downloadText(buildCaseExport(file, w, log), "appealdeck-case-notes.txt");
                        })()
                      }
                    >
                      Download case notes
                    </Button>
                    {/*
                      AA-42: the manifest is the independent record — every file with its content
                      hash, and the hash captured at the moment each attachment was sent. It is what
                      lets a seller prove months later that the file they still hold is the file
                      they sent, which is the one thing Amazon's own tooling will never give them.
                    */}
                    <Button
                      variant="outline"
                      onClick={() =>
                        void (async () => {
                          try {
                            const records = (await vault.list({ caseId: file.id })).filter(
                              (r) => r.kind !== "case",
                            );
                            downloadText(
                              buildEvidenceManifest({
                                file,
                                workspace: w,
                                records: records.map((r) => ({
                                  filename: r.name,
                                  mimeType: r.mimeType,
                                  sizeBytes: r.sizeBytes,
                                  contentHash: r.plaintextHash,
                                  addedAt: r.createdAt,
                                  answers: w.requirements.find((q) => q.recordId === r.id)?.label,
                                  page: w.requirements.find((q) => q.recordId === r.id)?.page,
                                })),
                              }),
                              manifestFilename(file.id),
                            );
                          } catch {
                            setError(
                              "Could not build the manifest. Your case and files are unchanged.",
                            );
                          }
                        })()
                      }
                    >
                      Download evidence manifest
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        <aside className="space-y-5 xl:sticky xl:top-[5.25rem]" aria-label="Case context">
          <CaseTimeline
            workspace={w}
            createdAt={file.createdAt}
            deadlines={deadlineLines}
            action={
              w.confirmed && !gated ? (
                <Button size="sm" variant="outline" onClick={() => setTab("history")}>
                  {C.overview.timeline.replyAgain}
                </Button>
              ) : undefined
            }
          >
            <SellerDeadlineField
              key={file.deadlines?.find((d) => d.setBy === "seller")?.dueOn ?? "none"}
              entered={file.deadlines?.find((d) => d.setBy === "seller")}
              busy={busy}
              onSave={(dueOn) =>
                commit(
                  (old) => old,
                  C.sellerDeadline.saved.replace("{date}", formatDay(dueOn)),
                  undefined,
                  {
                    keepState: true,
                    deadlines: [
                      ...(fileRef.current?.deadlines ?? []).filter((d) => d.setBy !== "seller"),
                      sellerDeadline(dueOn),
                    ],
                  },
                )
              }
              onRemove={() =>
                commit((old) => old, C.sellerDeadline.removed, undefined, {
                  keepState: true,
                  deadlines: (fileRef.current?.deadlines ?? []).filter((d) => d.setBy !== "seller"),
                })
              }
            />
          </CaseTimeline>
          <div className="rounded-[18px] bg-card p-5 shadow-card ring-1 ring-inset ring-border">
            <div className="flex items-center gap-3.5">
              <Image
                src="/illustrations/vault.svg"
                alt=""
                width={64}
                height={54}
                className="h-auto w-16 shrink-0"
                unoptimized
              />
              <div className="min-w-0 text-[0.84375rem]">
                <p className="text-sm font-semibold">
                  {records.length === 0
                    ? C.overview.noFiles
                    : records.length === 1
                      ? C.overview.oneFile
                      : C.overview.files.replace("{n}", String(records.length))}
                </p>
                <p className="text-muted-foreground">
                  {C.local}.{" "}
                  <Link
                    href="/vault"
                    className="font-medium text-link underline underline-offset-4"
                  >
                    {C.overview.openVault}
                  </Link>
                </p>
              </div>
            </div>
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
            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
              <Button asChild size="sm" variant="outline">
                <Link href="/dashboard">{C.overview.allCases}</Link>
              </Button>
              {/* The bar's "New case" is hidden on a phone, where the bar has no room for it. */}
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => setNewCasePrompt(true)}
                className="sm:hidden"
              >
                <Plus className="mr-1.5 h-4 w-4" aria-hidden />
                New case
              </Button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * What the reply means, before the records delta (25 Sep 2026). The reading is ours and says so;
 * the reasons are Amazon's sentences, quoted exactly, so the seller can check both against the text.
 */
function ReplyReading({ text }: { text: string }) {
  const { category } = analyzeReply(text);
  const reasons = replyCriticisms(text);
  const reading = C.replyReading.categories[category];
  return (
    <div className="space-y-2 rounded-md border border-border/70 bg-background/60 p-3 text-sm">
      <p className="text-xs text-muted-foreground">{C.replyReading.title}</p>
      <p className="font-medium text-foreground">{reading}</p>
      {reasons.length > 0 && (
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground">{C.replyReading.reasons}</p>
          {reasons.map((q) => (
            <blockquote key={q} className="border-l-2 border-warning/50 pl-3 text-foreground">
              {q}
            </blockquote>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">{C.replyReading.note}</p>
    </div>
  );
}
