"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Send,
  FileText,
  Loader2,
  ShieldAlert,
  CheckCircle2,
  CreditCard,
  FileCheck2,
} from "lucide-react";
import { getBrowserVault } from "@/lib/vault/browser";
import type { Vault, VaultListItem } from "@/core/vault/vault";
import {
  saveCaseLog,
  loadCaseLog,
  loadCaseFile,
  listCases,
  setActiveCaseId,
  setCaseArchived,
} from "@/lib/caseStore";
import { withCaseEvidence } from "@/lib/caseEvidence";
import type { CaseIndexEntry } from "@/lib/caseStore";
import type { CaseLog } from "@/lib/caseStore";
import {
  nextState,
  nextBestActions,
  expectationsCopy,
  isSeverityGated,
  isSubmitted,
  isRequiredComplete,
  computeReadiness,
  READINESS_COPY,
  noveltyRequired,
  GLOBAL_EXPECTATIONS,
  defaultDocumentType,
} from "@/core";
import { buildOutcomeRecord, outcomeFromReplyCategory } from "@/core/outcomeModel";
import { OutcomeShareCard } from "@/components/OutcomeShareCard";
import type { CaseFile } from "@/core/caseFile";
import type { CaseState, CaseStateContext, ReplyCategory } from "@/core/caseState";
import { buildClockBrief, type ClockBrief } from "@/core";
import { ClockBriefCard } from "@/components/ClockBriefCard";
import { syncCaseReminder } from "@/lib/reminderSync";
import { CaseStateBadge } from "@/components/CaseStateBadge";
import { DeadlineChip, DeadlineChipList } from "@/components/DeadlineChip";
import { EmptyState } from "@/components/EmptyState";
import { VaultGate } from "@/components/VaultGate";
import { CasePreview } from "@/components/CasePreview";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { openVaultForVisitor } from "@/lib/vault/visitor";
import { ensureFreshGuestSession } from "@/lib/vault/guestSession";
import { ReplyCategoryLabel } from "@/components/ReplyCategoryLabel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { APP } from "@/content/app";
import { SHARED } from "@/content/shared";
import { formatDate, formatBytes } from "@/lib/format";
import type { LicenseSummary } from "@/lib/license";
import type { EvidenceKind } from "@/core";
import { cn } from "@/lib/utils";
import { WorkspaceSummary } from "@/components/workspace/WorkspaceSummary";

interface ReplyAnalysis {
  category: ReplyCategory;
  extractedAsks: EvidenceKind[];
  confidence: "rule" | "ambiguous";
}

interface DashboardClientProps {
  license: LicenseSummary;
  signedIn: boolean;
}

function useVaultInstance(): Vault {
  const ref = useRef<Vault | null>(null);
  if (ref.current === null) {
    ref.current = getBrowserVault();
  }
  return ref.current;
}

/**
 * Personalizes nextBestActions()'s generic sentence with what's actually outstanding: required
 * evidence while still gathering it, or exactly what Amazon's reply asked for once one has come
 * back — both already computed on this page (readiness card, reply analysis) but not previously
 * connected to the action list underneath them.
 */
function missingLabelsFor(
  state: CaseState,
  missingEvidenceKinds: EvidenceKind[],
  extractedAsks: EvidenceKind[] | undefined,
): string[] {
  if (state === "REMEDIATION") return missingEvidenceKinds.map((k) => APP.evidenceKinds[k]);
  if ((state === "REJECTED" || state === "REVISION") && extractedAsks && extractedAsks.length > 0) {
    return extractedAsks.map((k) => APP.evidenceKinds[k]);
  }
  return [];
}

function buildContext(file: CaseFile, log: CaseLog | null): CaseStateContext {
  return {
    kind: file.kind,
    severityGated: isSeverityGated(file.kind),
    intakeComplete: file.rootCause !== undefined && file.timelineEvents.length > 0,
    requiredComplete: isRequiredComplete(file),
    submitted: isSubmitted(file.state) || log?.submittedAt !== undefined,
    attemptCount: log?.attemptCount ?? file.attemptCount,
    hasReply: log?.lastReply !== undefined,
    reminderDue: Boolean(log?.reminderAt && Date.parse(log.reminderAt) <= Date.now()),
    waitingOnThirdParty: Boolean(log?.waitingOn),
    replyCategory: log?.lastReply?.category,
    fundsHeld: false,
    fundsEligible: false,
  };
}

/**
 * Renders the Appeal Pass status the license/status API already returns to this component —
 * previously fetched, typed, and passed in, then silently discarded (`license: _license`). A
 * seller had no way to see from Dashboard whether their Pass was active without going to Billing.
 */
function PassStatusRow({ license }: { license: LicenseSummary }) {
  const active = license.status === "active";
  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-2 rounded-md border px-3 py-2 text-sm",
        active ? "border-success/30 bg-success/5" : "border-border bg-surface-2",
      )}
    >
      {active ? (
        <CheckCircle2 className="size-4 shrink-0 text-success" aria-hidden />
      ) : (
        <CreditCard className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      )}
      <span className="font-medium text-foreground">
        {active ? APP.dashboard.active.heading : APP.dashboard.inactive.heading}
      </span>
      {active && license.plan && (
        <span className="text-muted-foreground">
          · {APP.dashboard.active.planLabel}: {license.plan}
        </span>
      )}
      {!active && (
        <Link href="/pricing" className="ml-auto text-xs underline underline-offset-4">
          {APP.dashboard.inactive.cta}
        </Link>
      )}
    </div>
  );
}

/** The most recently uploaded evidence files, so a seller can see what's already in the vault
 * without leaving Dashboard for it. */
function EvidenceActivityCard({ records }: { records: VaultListItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{APP.dashboard.activity.title}</CardTitle>
      </CardHeader>
      <CardContent>
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">{APP.dashboard.activity.empty}</p>
        ) : (
          <ul className="space-y-2">
            {records.slice(0, 5).map((r) => (
              <li key={r.id} className="flex items-center gap-2 text-sm">
                <FileCheck2 className="size-4 shrink-0 text-success" aria-hidden />
                <span className="truncate font-medium text-foreground">{r.name}</span>
                <span className="ml-auto shrink-0 whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">
                  {formatBytes(r.sizeBytes)} · {formatDate(r.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
        <Button asChild variant="ghost" size="sm" className="mt-3">
          <Link href="/vault">{APP.dashboard.activity.viewAll}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function ReadinessCard({ score, missingKinds }: { score: number; missingKinds: EvidenceKind[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{APP.dashboard.readiness.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs text-muted-foreground">{READINESS_COPY}</p>
          <span className="text-2xl font-semibold tabular-nums text-foreground">
            {Math.round(score * 100)}%
          </span>
        </div>
        <Progress value={Math.round(score * 100)} aria-label={READINESS_COPY} />
        {missingKinds.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {APP.dashboard.readiness.missingLabel}{" "}
            {missingKinds.map((kind) => APP.evidenceKinds[kind]).join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardClient({ license, signedIn }: DashboardClientProps) {
  const vault = useVaultInstance();
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [caseLog, setCaseLog] = useState<CaseLog | null>(null);
  const [evidenceRecords, setEvidenceRecords] = useState<VaultListItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyResult, setReplyResult] = useState<ReplyAnalysis | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [cases, setCases] = useState<CaseIndexEntry[]>([]);
  const [clockBrief, setClockBrief] = useState<ClockBrief | null>(null);
  /**
   * AA-40: `lastSeenAt` must be stamped exactly once per visit, and only AFTER the brief has been
   * computed against the previous value — otherwise the seller is told nothing is new, because the
   * evidence that it was has already been overwritten. A ref rather than state because StrictMode
   * double-invokes effects in development, and this project has already lost a case file to that
   * exact race once (`InterviewFlow.tsx`, 19 Sep 2026).
   */
  const seenStampedRef = useRef(false);
  const loadFromVault = useCallback(async () => {
    try {
      const stored = await loadCaseFile(vault);
      const file = stored ? await withCaseEvidence(vault, stored) : null;
      setCases(await listCases(vault));
      const log = file ? await loadCaseLog(vault) : null;
      // Real evidence documents only — case-file/case-log bookkeeping records share the same
      // vault under kind "case" and aren't something a seller thinks of as "a file I uploaded".
      const records = (await vault.list({ caseId: file?.id ?? "no-active-case" }))
        .filter((r) => r.kind !== "case")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCaseFile(file);
      setCaseLog(log);
      setEvidenceRecords(records);
      setReplyText("");
      setReplyResult(null);

      if (file && log) {
        setClockBrief(
          buildClockBrief(
            [
              {
                caseId: file.id,
                kind: file.kind,
                state: log.state,
                reminderAt: log.reminderAt,
                waitingOn: log.waitingOn,
                lastSeenAt: log.lastSeenAt,
              },
            ],
            Date.now(),
          ),
        );
        if (!seenStampedRef.current) {
          seenStampedRef.current = true;
          // Deliberately not awaited and not followed by a reload: stamping the visit must never
          // block the page or re-enter this function. A failure here costs one "new since you were
          // here" badge, which is not worth surfacing an error to a seller in a crisis.
          void saveCaseLog(vault, { ...log, lastSeenAt: new Date().toISOString() }).catch(() => {});
        }
      } else {
        setClockBrief(null);
      }
    } catch (e) {
      toast.error(APP.dashboard.toasts.vaultOpenFailed, {
        description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
      });
    }
  }, [vault]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        if (!signedIn) {
          await ensureFreshGuestSession(vault, signedIn);
          const unlocked = await openVaultForVisitor(vault);
          if (!cancelled && unlocked) await loadFromVault();
          return;
        }
        await vault.open();
        if (vault.isUnlocked()) {
          await loadFromVault();
        }
      } catch {
        // VaultGate handles unlock/init UI
      }
      void cancelled;
    })();
    return () => {
      cancelled = true;
    };
  }, [vault, loadFromVault, signedIn]);

  const analyzeReply = async () => {
    if (!replyText.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/analyze-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply: replyText }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error ?? "Analysis failed");
      }
      const result: ReplyAnalysis = await res.json();
      setReplyResult(result);
    } catch (e) {
      toast.error(APP.dashboard.toasts.analyzeFailed, {
        description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
      });
    } finally {
      setBusy(false);
    }
  };

  const confirmReply = async () => {
    if (!replyResult || !caseFile) return;
    const currentLog: CaseLog = caseLog ?? {
      state: caseFile.state,
      attemptCount: caseFile.attemptCount,
    };
    const logEntry: CaseLog = {
      ...currentLog,
      lastReply: {
        category: replyResult.category,
        at: new Date().toISOString(),
        extractedAsks: replyResult.extractedAsks,
      },
    };
    const ctx = buildContext(caseFile, logEntry);
    logEntry.state = nextState(ctx, caseFile.state);
    try {
      await saveCaseLog(vault, logEntry);
      setReplyResult(null);
      setReplyText("");
      await loadFromVault();
    } catch (e) {
      toast.error(APP.dashboard.toasts.saveReplyFailed, {
        description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
      });
    }
  };

  const resolveOutcomePrompt = async (shared: boolean) => {
    if (!caseFile || !caseLog) return;
    const logEntry: CaseLog = { ...caseLog, outcomePromptResolved: true };
    try {
      await saveCaseLog(vault, logEntry);
      await loadFromVault();
      if (shared) toast.success(APP.dashboard.outcomeShare.accept);
    } catch {
      // Non-critical — the case still works either way; a save hiccup here means the prompt may
      // reappear next visit, which is a safe failure mode, not a data-loss one.
    }
  };

  const markSubmitted = async () => {
    if (!caseFile) return;
    const currentLog: CaseLog = caseLog ?? {
      state: caseFile.state,
      attemptCount: caseFile.attemptCount,
    };
    const logEntry: CaseLog = {
      ...currentLog,
      submittedAt: new Date().toISOString(),
      attemptCount: currentLog.attemptCount + 1,
      // Snapshot readiness at the moment of submission — the outcome record (EF-5) needs what
      // the seller actually knew when they submitted, not a score recomputed later.
      readinessAtSubmit: Math.round(computeReadiness(caseFile).score * 100),
    };
    const ctx = buildContext(caseFile, logEntry);
    logEntry.state = nextState(ctx, caseFile.state);
    setSubmitting(true);
    try {
      await saveCaseLog(vault, logEntry);
      toast.success(APP.dashboard.submitCard.confirmed);
      await loadFromVault();
    } catch (e) {
      toast.error(APP.dashboard.toasts.recordSubmissionFailed, {
        description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const saveWorkspaceLog = async (log: CaseLog) => {
    try {
      await saveCaseLog(vault, log);
      await loadFromVault();
      return true;
    } catch (e) {
      toast.error(APP.dashboard.toasts.saveReplyFailed, {
        description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
      });
      return false;
    }
  };

  const archiveCase = async (id: string, archived: boolean) => {
    try {
      await setCaseArchived(vault, id, archived);
      await loadFromVault();
      return true;
    } catch (e) {
      toast.error(APP.dashboard.toasts.deleteFailed, {
        description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
      });
      return false;
    }
  };

  if (!signedIn) {
    if (!caseFile) {
      return (
        <div className="animate-fade-in space-y-6">
          <EmptyState
            icon={FileText}
            title={APP.access.dashboardSignedOut.emptyTitle}
            description={APP.access.dashboardSignedOut.emptyDesc}
            action={
              <div className="flex flex-wrap justify-center gap-3">
                <Button asChild variant="outline">
                  <Link href="/decode">{APP.access.dashboardSignedOut.decode}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/case">{APP.access.dashboardSignedOut.start}</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href="/login?next=/dashboard">{SHARED.nav.signIn}</Link>
                </Button>
              </div>
            }
          />
        </div>
      );
    }

    if (caseFile.workspace)
      return (
        <WorkspaceSummary
          file={caseFile}
          cases={cases}
          log={caseLog}
          onSaveLog={saveWorkspaceLog}
          onArchive={archiveCase}
          onSelect={async (id) => {
            try {
              await setActiveCaseId(vault, id);
              await loadFromVault();
            } catch {
              toast.error("Could not switch cases");
            }
          }}
        />
      );
    const draftLog: CaseLog = caseLog ?? {
      state: caseFile.state,
      attemptCount: caseFile.attemptCount,
    };
    const draftCtx = buildContext(caseFile, draftLog);
    const draftCurrent: CaseState = draftLog.state;
    const draftNext = nextState(draftCtx, draftCurrent);
    const draftReadiness = computeReadiness(caseFile);
    const draftActions = nextBestActions(
      draftNext,
      missingLabelsFor(
        draftNext,
        draftReadiness.missing.map((m) => m.kind),
        draftLog.lastReply?.extractedAsks,
      ),
    );

    return (
      <div className="animate-fade-in space-y-6">
        <h2 className="text-h3 text-foreground">{APP.access.dashboardSignedOut.title}</h2>
        <div className="flex items-center gap-2">
          <CaseStateBadge kind={caseFile.kind} />
          <span className="text-sm font-medium">{APP.dashboard.stateLabels[draftCurrent]}</span>
        </div>

        <ReadinessCard
          score={draftReadiness.score}
          missingKinds={draftReadiness.missing.map((m) => m.kind)}
        />

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{APP.dashboard.actions.nextBestActions}</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {draftActions.map((action, i) => (
                <li key={i}>{action}</li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <CasePreview kind={caseFile.kind} caseFile={caseFile} />

        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-5">
            <p className="text-sm text-muted-foreground">
              {APP.access.dashboardSignedOut.draftNote}
            </p>
            <Button asChild>
              <Link href="/login?next=/dashboard">{APP.access.keepCaseLink}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <VaultGate
      vault={vault}
      deviceMode
      autoUnlock
      onUnlocked={() => {
        void loadFromVault();
      }}
      onLocked={() => {
        setCaseFile(null);
        setCaseLog(null);
        setReplyText("");
        setReplyResult(null);
      }}
    >
      {() => {
        if (!caseFile) {
          return (
            <div className="animate-fade-in space-y-4">
              <PassStatusRow license={license} />
              <EmptyState
                icon={FileText}
                title={APP.dashboard.caseSummary.noCase.title}
                description={APP.dashboard.caseSummary.noCase.description}
                action={
                  <Button asChild>
                    <Link href="/case">{APP.dashboard.caseSummary.noCase.cta}</Link>
                  </Button>
                }
              />
            </div>
          );
        }

        if (caseFile.workspace)
          return (
            <WorkspaceSummary
              file={caseFile}
              cases={cases}
              log={caseLog}
              onSaveLog={saveWorkspaceLog}
              onArchive={archiveCase}
              onSelect={async (id) => {
                try {
                  await setActiveCaseId(vault, id);
                  await loadFromVault();
                } catch {
                  toast.error("Could not switch cases");
                }
              }}
            />
          );
        const currentLog: CaseLog = caseLog ?? {
          state: caseFile.state,
          attemptCount: caseFile.attemptCount,
        };
        const ctx = buildContext(caseFile, currentLog);
        const current: CaseState = currentLog.state;
        const next = nextState(ctx, current);
        const readiness = computeReadiness(caseFile);
        const actions = nextBestActions(
          next,
          missingLabelsFor(
            next,
            readiness.missing.map((m) => m.kind),
            currentLog.lastReply?.extractedAsks,
          ),
        );
        const expCopy = expectationsCopy(next);
        const noticeDate = caseFile.timelineEvents[0]?.date ?? null;
        const isNoveltyRequired = noveltyRequired(currentLog.attemptCount);

        // AA-40. Passing `undefined` clears the waiting note entirely, which is why the field is
        // spread away rather than set to undefined — a stored `waitingOn: undefined` would still
        // satisfy `currentLog.waitingOn` checks after a round trip through the vault.
        const saveWaitingOn = async (waitingOn: CaseLog["waitingOn"]) => {
          const { waitingOn: _drop, ...rest } = currentLog;
          void _drop;
          try {
            await saveCaseLog(vault, waitingOn ? { ...rest, waitingOn } : rest);
            await loadFromVault();
            toast.success(
              waitingOn ? APP.dashboard.clock.waitingSaved : APP.dashboard.clock.waitingCleared,
            );
          } catch {
            toast.error(APP.dashboard.clock.waitingSaveFailed);
          }
        };

        return (
          <div className="animate-fade-in space-y-6">
            {/* AA-40: the clock speaks before anything else on the page. */}
            <ClockBriefCard brief={clockBrief} />
            <PassStatusRow license={license} />
            {cases.length > 1 && (
              <label className="block text-sm">
                Current case
                <select
                  className="ml-2 h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  value={caseFile.id}
                  onChange={(event) => {
                    void setActiveCaseId(vault, event.target.value)
                      .then(loadFromVault)
                      .catch(() => toast.error("Could not switch cases"));
                  }}
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.kind.replaceAll("_", " ")} · {formatDate(c.createdAt)}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {ctx.submitted && !ctx.hasReply && (
              <div className="space-y-3">
                <label className="block text-sm">
                  Your follow-up reminder date
                  <input
                    className="ml-2 h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    type="date"
                    value={currentLog.reminderAt?.slice(0, 10) ?? ""}
                    onChange={(event) => {
                      const reminderAt = event.target.value
                        ? event.target.value + "T00:00:00Z"
                        : undefined;
                      void saveCaseLog(vault, { ...currentLog, reminderAt })
                        .then(loadFromVault)
                        // The date is the seller's; keep the server row in step but never let its
                        // failure stop the date being saved (AA-40, see reminderSync.ts).
                        .then(() =>
                          syncCaseReminder({
                            caseRef: caseFile.id,
                            kind: caseFile.kind,
                            dueAt: reminderAt,
                            enabled: currentLog.emailReminder === true,
                          }),
                        )
                        .catch(() => toast.error("Could not save reminder"));
                    }}
                  />
                </label>
                {/* AA-40: opt-in, per case, and the copy states exactly what leaves the device. */}
                <div className="rounded-lg border border-border bg-surface-2/40 p-4">
                  <p className="text-sm font-medium text-foreground">
                    {APP.dashboard.clock.emailTitle}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {APP.dashboard.clock.emailBody}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-3">
                    <Button
                      type="button"
                      variant={currentLog.emailReminder ? "outline" : "default"}
                      disabled={!currentLog.reminderAt}
                      onClick={() => {
                        const enabled = !currentLog.emailReminder;
                        void saveCaseLog(vault, { ...currentLog, emailReminder: enabled })
                          .then(loadFromVault)
                          .then(() =>
                            syncCaseReminder({
                              caseRef: caseFile.id,
                              kind: caseFile.kind,
                              dueAt: currentLog.reminderAt,
                              enabled,
                            }),
                          )
                          .then((ok) => {
                            if (!ok) toast.error(APP.dashboard.clock.emailFailed);
                          })
                          .catch(() => toast.error(APP.dashboard.clock.emailFailed));
                      }}
                    >
                      {currentLog.emailReminder
                        ? APP.dashboard.clock.emailDisable
                        : APP.dashboard.clock.emailEnable}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {currentLog.emailReminder
                        ? APP.dashboard.clock.emailOn
                        : APP.dashboard.clock.emailOff}
                    </span>
                  </div>
                </div>
              </div>
            )}
            {/*
              AA-40: a case blocked on a supplier used to sit in "Evidence gathering", which reads
              as the seller not having done their homework. Recording who they are waiting on moves
              it to WAITING_THIRD_PARTY and gives the clock a date to chase.
            */}
            {(!ctx.submitted || currentLog.waitingOn) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{APP.dashboard.clock.waitingTitle}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {APP.dashboard.clock.waitingDescription}
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap items-end gap-3">
                    <label className="block text-sm">
                      <span className="mb-1 block">{APP.dashboard.clock.waitingPartyLabel}</span>
                      <input
                        className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        type="text"
                        defaultValue={currentLog.waitingOn?.party ?? ""}
                        placeholder={APP.dashboard.clock.waitingPartyPlaceholder}
                        onBlur={(event) => {
                          const party = event.target.value.trim();
                          if (!party) return;
                          void saveWaitingOn({
                            party,
                            since: currentLog.waitingOn?.since ?? new Date().toISOString(),
                            followUpAt: currentLog.waitingOn?.followUpAt,
                          });
                        }}
                      />
                    </label>
                    <label className="block text-sm">
                      <span className="mb-1 block">{APP.dashboard.clock.waitingFollowUpLabel}</span>
                      <input
                        className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        type="date"
                        value={currentLog.waitingOn?.followUpAt?.slice(0, 10) ?? ""}
                        onChange={(event) => {
                          const party = currentLog.waitingOn?.party;
                          // Without a named party there is nothing to chase; the date alone would
                          // produce a clock item reading "Chase undefined".
                          if (!party) return;
                          void saveWaitingOn({
                            party,
                            since: currentLog.waitingOn?.since ?? new Date().toISOString(),
                            followUpAt: event.target.value
                              ? `${event.target.value}T00:00:00Z`
                              : undefined,
                          });
                        }}
                      />
                    </label>
                    {currentLog.waitingOn && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void saveWaitingOn(undefined)}
                      >
                        {APP.dashboard.clock.waitingClear}
                      </Button>
                    )}
                  </div>
                  {currentLog.waitingOn && (
                    <p className="text-xs text-muted-foreground">
                      {APP.dashboard.clock.waitingSince} {formatDate(currentLog.waitingOn.since)}
                    </p>
                  )}
                </CardContent>
              </Card>
            )}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <CaseStateBadge kind={caseFile.kind} />
                  <span className="text-sm font-medium">{APP.dashboard.stateLabels[next]}</span>
                </div>
                {expCopy && <p className="text-sm text-muted-foreground">{expCopy}</p>}
              </div>
            </div>

            <ReadinessCard
              score={readiness.score}
              missingKinds={readiness.missing.map((m) => m.kind)}
            />

            <EvidenceActivityCard records={evidenceRecords} />

            {noticeDate && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span
                    data-tn
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-xs tabular-nums text-foreground"
                  >
                    {APP.dashboard.deadlines.noticeReceived} · {formatDate(noticeDate)}
                  </span>
                  {caseFile.deadlines && caseFile.deadlines.length > 0 ? (
                    <DeadlineChipList deadlines={caseFile.deadlines} />
                  ) : (
                    <DeadlineChip
                      deadline={{
                        kind: "appeal_window",
                        dueAt: null,
                        label: APP.dashboard.deadlines.appealWindow,
                      }}
                    />
                  )}
                </div>
                {(!caseFile.deadlines || caseFile.deadlines.length === 0) && (
                  <p className="text-xs text-muted-foreground">
                    <Link href="/decode" className="underline underline-offset-4">
                      {APP.dashboard.deadlines.decoderHint}
                    </Link>
                  </p>
                )}
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{APP.dashboard.actions.nextBestActions}</CardTitle>
              </CardHeader>
              <CardContent>
                <ol className="list-decimal space-y-2 pl-5 text-sm">
                  {actions.map((action) => (
                    <li key={action}>{action}</li>
                  ))}
                </ol>
                <Button asChild className="mt-4">
                  <Link
                    href={
                      next === "SUBMITTED" || next === "REVISION" || next === "APPROVED"
                        ? "/compose"
                        : "/case"
                    }
                  >
                    {next === "SUBMITTED" || next === "REVISION" || next === "APPROVED"
                      ? APP.dashboard.actions.reviewPoa
                      : APP.dashboard.actions.continueCase}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {isNoveltyRequired && (
              <Card className="border-warning/40 bg-warning/5">
                <CardContent className="pt-5">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
                    <div>
                      <h3 className="font-medium text-foreground">{APP.dashboard.novelty.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {APP.dashboard.novelty.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="grid gap-6 lg:grid-cols-2">
              <Card data-no-print>
                <CardHeader>
                  <CardTitle className="text-base">{APP.dashboard.replyCard.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {APP.dashboard.replyCard.description}
                  </p>
                </CardHeader>
                <CardContent>
                  {!replyResult ? (
                    <div className="space-y-3">
                      <Textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        spellCheck={false}
                        placeholder={APP.dashboard.replyCard.placeholder}
                        rows={4}
                      />
                      <Button
                        onClick={analyzeReply}
                        disabled={busy || !replyText.trim()}
                        variant="outline"
                        size="sm"
                      >
                        {busy ? (
                          <>
                            <Loader2 className="size-4 animate-spin" />
                            {APP.dashboard.replyCard.analyzing}
                          </>
                        ) : (
                          <>
                            <Send className="size-4" />
                            {APP.dashboard.replyCard.submit}
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <div className="animate-fade-in space-y-3">
                      <p>
                        {APP.dashboard.replyCard.markedAs}{" "}
                        <ReplyCategoryLabel category={replyResult.category} />
                      </p>
                      {replyResult.extractedAsks.length > 0 && (
                        <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                          {replyResult.extractedAsks.map((ask, i) => (
                            <li key={i}>{APP.evidenceKinds[ask]}</li>
                          ))}
                        </ul>
                      )}
                      <div className="flex gap-2">
                        <Button onClick={confirmReply} variant="outline" size="sm">
                          {APP.dashboard.replyCard.updateButton}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setReplyResult(null);
                            setReplyText("");
                          }}
                        >
                          {APP.dashboard.replyCard.cancelButton}
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {caseFile &&
                caseLog?.lastReply &&
                !caseLog.outcomePromptResolved &&
                (() => {
                  const outcome = outcomeFromReplyCategory(caseLog.lastReply.category);
                  if (!outcome) return null;
                  const record = buildOutcomeRecord({
                    kind: caseFile.kind,
                    marketplace: "unknown",
                    docType: defaultDocumentType(caseFile.kind),
                    attempts: caseLog.attemptCount,
                    readinessAtSubmit:
                      caseLog.readinessAtSubmit ??
                      Math.round(computeReadiness(caseFile).score * 100),
                    outcome,
                    submittedAt: caseLog.submittedAt ?? caseLog.lastReply.at,
                    outcomeAt: caseLog.lastReply.at,
                  });
                  return <OutcomeShareCard record={record} onResolved={resolveOutcomePrompt} />;
                })()}

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{APP.dashboard.submitCard.title}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {APP.dashboard.submitCard.description}
                  </p>
                </CardHeader>
                <CardContent>
                  <Button onClick={markSubmitted} disabled={submitting} variant="outline" size="sm">
                    {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                    {APP.dashboard.submitCard.button}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <HonestExpectationsCard
              summary={GLOBAL_EXPECTATIONS.typicalNote}
              weDo={GLOBAL_EXPECTATIONS.whatWeDo}
              weDoNot={GLOBAL_EXPECTATIONS.whatWeDoNot}
            />
          </div>
        );
      }}
    </VaultGate>
  );
}
