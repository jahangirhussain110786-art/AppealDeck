"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Send, FileText, Loader2, ShieldAlert, Lock } from "lucide-react";
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
} from "@/core";
import type { CaseFile } from "@/core/interviewEngine";
import type { CaseState, CaseStateContext, ReplyCategory } from "@/core/caseState";
import { CaseStateBadge } from "@/components/CaseStateBadge";
import { DeadlineChip } from "@/components/DeadlineChip";
import { EmptyState } from "@/components/EmptyState";
import { VaultGate } from "@/components/VaultGate";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { ReplyCategoryLabel } from "@/components/ReplyCategoryLabel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { APP } from "@/content/app";
import { GLOBAL_EXPECTATIONS } from "@/core";
import type { LicenseSummary } from "@/lib/license";
import type { EvidenceKind } from "@/core";

interface ReplyAnalysis {
  category: ReplyCategory;
  extractedAsks: EvidenceKind[];
  confidence: "rule" | "ambiguous";
}

interface DashboardClientProps {
  license: LicenseSummary;
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

function formatNoticeDate(iso: string): string {
  return Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(iso));
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
      <CardContent className="space-y-2">
        <Progress value={Math.round(score * 100)} aria-label={READINESS_COPY} />
        <p className="text-xs text-muted-foreground">{READINESS_COPY}</p>
        {locked ? (
          <Skeleton className="h-3 w-24" />
        ) : (
          missingKinds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {APP.dashboard.readiness.missingLabel}{" "}
              {missingKinds.map((kind) => APP.evidenceKinds[kind]).join(", ")}
            </p>
          )
        )}
      </CardContent>
    </Card>
  );
}

export function DashboardClient({ license }: DashboardClientProps) {
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
  }, [vault, loadFromVault]);

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

  if (license.status !== "active") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="space-y-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <ReadinessCard score={0} missingKinds={[]} locked />

        <Card aria-disabled>
          <CardHeader>
            <CardTitle className="text-base">{APP.dashboard.actions.nextBestActions}</CardTitle>
          </CardHeader>
          <CardContent>
            <Lock className="absolute top-4 right-4 h-4 w-4 text-muted-foreground" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4 mt-1" />
          </CardContent>
        </Card>

        <Card aria-disabled>
          <CardHeader>
            <CardTitle className="text-base">{APP.dashboard.replyCard.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <Lock className="absolute top-4 right-4 h-4 w-4 text-muted-foreground" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>

        <HonestExpectationsCard
          summary={GLOBAL_EXPECTATIONS.typicalNote}
          whatToDo={[...GLOBAL_EXPECTATIONS.whatWeDo, ...GLOBAL_EXPECTATIONS.whatWeDoNot]}
        />
        <Button asChild>
          <Link href="/pricing">{APP.dashboard.noPassCard.cta}</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <VaultGate
      vault={vault}
      onUnlocked={() => {
        void loadFromVault();
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
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="space-y-6"
          >
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
                    {APP.dashboard.deadlines.noticeReceived} · {formatNoticeDate(noticeDate)}
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

            <Card>
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
                      placeholder={APP.dashboard.replyCard.placeholder}
                      rows={4}
                    />
                    <Button onClick={analyzeReply} disabled={busy || !replyText.trim()} size="sm">
                      {busy ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {APP.dashboard.replyCard.analyzing}
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          {APP.dashboard.replyCard.submit}
                        </>
                      )}
                    </Button>
                  </div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
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
                      <Button onClick={confirmReply} size="sm">
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
                  </motion.div>
                )}
              </CardContent>
            </Card>

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
          </motion.div>
        );
      }}
    </VaultGate>
  );
}
