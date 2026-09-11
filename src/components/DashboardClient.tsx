"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Send, FileText, Loader2, ShieldAlert } from "lucide-react";
import { getBrowserVault } from "@/lib/vault/browser";
import type { Vault } from "@/core/vault/vault";
import { saveCaseLog, loadCaseLog, loadCaseFile } from "@/lib/caseStore";
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
import type { CaseFile } from "@/core/interviewEngine";
import type { CaseState, CaseStateContext, ReplyCategory } from "@/core/caseState";
import { CaseStateBadge } from "@/components/CaseStateBadge";
import { DeadlineChip } from "@/components/DeadlineChip";
import { EmptyState } from "@/components/EmptyState";
import { VaultGate } from "@/components/VaultGate";
import { CasePreview } from "@/components/CasePreview";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { openVaultForVisitor } from "@/lib/vault/visitor";
import { ReplyCategoryLabel } from "@/components/ReplyCategoryLabel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { APP } from "@/content/app";
import { SHARED } from "@/content/shared";
import { formatDate } from "@/lib/format";
import type { LicenseSummary } from "@/lib/license";
import type { EvidenceKind } from "@/core";

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

function buildContext(file: CaseFile, log: CaseLog | null): CaseStateContext {
  return {
    kind: file.kind,
    severityGated: isSeverityGated(file.kind),
    intakeComplete: file.rootCause !== undefined && file.timelineEvents.length > 0,
    requiredComplete: isRequiredComplete(file),
    submitted: isSubmitted(file.state) || log?.submittedAt !== undefined,
    attemptCount: log?.attemptCount ?? file.attemptCount,
    hasReply: log?.lastReply !== undefined,
    replyCategory: log?.lastReply?.category,
    fundsHeld: false,
    fundsEligible: false,
  };
}

function ReadinessCard({
  score,
  missingKinds,
  locked = false,
}: {
  score: number;
  missingKinds: EvidenceKind[];
  locked?: boolean;
}) {
  return (
    <Card aria-disabled={locked || undefined}>
      <CardHeader>
        <CardTitle className="text-base">{APP.dashboard.readiness.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-xs text-muted-foreground">{READINESS_COPY}</p>
          {locked ? (
            <Skeleton className="h-6 w-12" />
          ) : (
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {Math.round(score * 100)}%
            </span>
          )}
        </div>
        <Progress value={Math.round(score * 100)} aria-label={READINESS_COPY} />
        {!locked && missingKinds.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {APP.dashboard.readiness.missingLabel}{" "}
            {missingKinds.map((kind) => APP.evidenceKinds[kind]).join(", ")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardClient({ license: _license, signedIn }: DashboardClientProps) {
  const vault = useVaultInstance();
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [caseLog, setCaseLog] = useState<CaseLog | null>(null);
  const [busy, setBusy] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyResult, setReplyResult] = useState<ReplyAnalysis | null>(null);

  const loadFromVault = useCallback(async () => {
    try {
      const file = await loadCaseFile(vault);
      const log = file ? await loadCaseLog(vault) : null;
      setCaseFile(file);
      setCaseLog(log);
      setReplyText("");
      setReplyResult(null);
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
      lastReply: { category: replyResult.category, at: new Date().toISOString() },
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
    try {
      await saveCaseLog(vault, logEntry);
      toast.success(APP.dashboard.submitCard.confirmed);
      await loadFromVault();
    } catch (e) {
      toast.error(APP.dashboard.toasts.recordSubmissionFailed, {
        description: e instanceof Error ? e.message : APP.dashboard.toasts.unknownError,
      });
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

    const draftLog: CaseLog = caseLog ?? {
      state: caseFile.state,
      attemptCount: caseFile.attemptCount,
    };
    const draftCtx = buildContext(caseFile, draftLog);
    const draftCurrent: CaseState = draftLog.state;
    const draftNext = nextState(draftCtx, draftCurrent);
    const draftActions = nextBestActions(draftNext);
    const draftReadiness = computeReadiness(caseFile);

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
          );
        }

        const currentLog: CaseLog = caseLog ?? {
          state: caseFile.state,
          attemptCount: caseFile.attemptCount,
        };
        const ctx = buildContext(caseFile, currentLog);
        const current: CaseState = currentLog.state;
        const next = nextState(ctx, current);
        const actions = nextBestActions(next);
        const readiness = computeReadiness(caseFile);
        const expCopy = expectationsCopy(next);
        const noticeDate = caseFile.timelineEvents[0]?.date ?? null;
        const isNoveltyRequired = noveltyRequired(currentLog.attemptCount);

        return (
          <div className="animate-fade-in space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <CaseStateBadge kind={caseFile.kind} />
                  <span className="text-sm font-medium">{APP.dashboard.stateLabels[current]}</span>
                </div>
                {expCopy && <p className="text-sm text-muted-foreground">{expCopy}</p>}
              </div>
            </div>

            <ReadinessCard
              score={readiness.score}
              missingKinds={readiness.missing.map((m) => m.kind)}
            />

            {noticeDate && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span
                    data-tn
                    className="inline-flex items-center gap-1 rounded-md border border-border bg-muted/40 px-2 py-1 font-mono text-xs tabular-nums text-foreground"
                  >
                    {APP.dashboard.deadlines.noticeReceived} · {formatDate(noticeDate)}
                  </span>
                  <DeadlineChip
                    deadline={{
                      kind: "appeal_window",
                      dueAt: null,
                      label: APP.dashboard.deadlines.appealWindow,
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  <Link href="/decode" className="underline underline-offset-4">
                    {APP.dashboard.deadlines.decoderHint}
                  </Link>
                </p>
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
                            <li key={i}>{ask}</li>
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
                  <Button onClick={markSubmitted} disabled={busy} variant="outline" size="sm">
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
