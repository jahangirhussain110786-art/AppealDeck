"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Send, FileText, Loader2, Unlock, ShieldAlert } from "lucide-react";
import { getBrowserVault } from "@/lib/vault/browser";
import type { Vault, VaultStatus } from "@/core/vault/vault";
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
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { ReplyCategoryLabel } from "@/components/ReplyCategoryLabel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { APP } from "@/content/app";
import type { LicenseSummary } from "@/lib/license";
import type { EvidenceKind } from "@/core";

interface ReplyAnalysis {
  category: ReplyCategory;
  extractedAsks: EvidenceKind[];
  confidence: "rule" | "ambiguous";
}

interface DashboardClientProps {
  user: { id: string; email?: string | null };
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

export function DashboardClient({ user, license }: DashboardClientProps) {
  const vault = useVaultInstance();
  const [phase, setPhase] = useState<"loading" | "uninitialized" | "locked" | "unlocked">(
    "loading",
  );
  const [passphrase, setPassphrase] = useState("");
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [caseLog, setCaseLog] = useState<CaseLog | null>(null);
  const [busy, setBusy] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyResult, setReplyResult] = useState<ReplyAnalysis | null>(null);

  const loadVault = useCallback(async () => {
    setPhase("loading");
    try {
      await vault.open();
      const initialized = await vault.isInitialized();
      if (!initialized) {
        setPhase("uninitialized");
        setCaseFile(null);
        setCaseLog(null);
        return;
      }
      const status: VaultStatus = await vault.status();
      if (status.state === "locked") {
        setPhase("locked");
        setCaseFile(null);
        setCaseLog(null);
        return;
      }
      setPhase("unlocked");
      const file = await loadCaseFile(vault);
      const log = file ? await loadCaseLog(vault) : null;
      setCaseFile(file);
      setCaseLog(log);
      setReplyText("");
      setReplyResult(null);
    } catch (e) {
      toast.error("Vault failed to open", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
      setPhase("locked");
      setCaseFile(null);
      setCaseLog(null);
    }
  }, [vault]);

  useEffect(() => {
    if (license.status !== "active") return;
    void loadVault();
  }, [loadVault, license.status]);

  const handleUnlock = async () => {
    if (passphrase.length < 8) {
      toast.error("Passphrase must be at least 8 characters");
      return;
    }
    setUnlockBusy(true);
    try {
      await vault.unlock(passphrase);
      setPassphrase("");
      await loadVault();
    } catch (e) {
      toast.error("Unlock failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setUnlockBusy(false);
    }
  };

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
      toast.error("Could not analyze reply", {
        description: e instanceof Error ? e.message : "Unknown error",
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
      await loadVault();
    } catch (e) {
      toast.error("Could not save reply", {
        description: e instanceof Error ? e.message : "Unknown error",
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
      attemptCount: caseFile.attemptCount + 1,
    };
    const ctx = buildContext(caseFile, logEntry);
    logEntry.state = nextState(ctx, caseFile.state);
    try {
      await saveCaseLog(vault, logEntry);
      toast.success(APP.dashboard.submitCard.confirmed);
      await loadVault();
    } catch (e) {
      toast.error("Could not record submission", {
        description: e instanceof Error ? e.message : "Unknown error",
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
        <HonestExpectationsCard
          summary={APP.dashboard.noPassCard.summary}
          whatToDo={APP.dashboard.noPassCard.whatToDo}
        />
        <Button asChild>
          <Link href="/pricing">{APP.dashboard.noPassCard.cta}</Link>
        </Button>
      </motion.div>
    );
  }

  if (phase === "loading") {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4" />
            Loading vault…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (phase === "uninitialized" || (phase === "unlocked" && !caseFile)) {
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

  if (phase === "locked") {
    return (
      <Card>
        <CardContent className="pt-6">
          <h2 className="mb-1 text-lg font-semibold">Unlock your vault</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Enter your passphrase to decrypt your case data. The key never leaves your device.
          </p>
          <div className="flex flex-col gap-3">
            <input
              type="password"
              autoComplete="current-password"
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Passphrase"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              onKeyDown={(e) => {
                if (e.key === "Enter") void handleUnlock();
              }}
            />
            <Button onClick={() => void handleUnlock()} disabled={unlockBusy} size="sm">
              {unlockBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
              Unlock
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">
            <Link href="/vault" className="text-primary underline-offset-4 hover:underline">
              Need to set up or recover your vault?
            </Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!caseFile) return null;

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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Case readiness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">{READINESS_COPY}</p>
          {readiness.missing.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Missing: {readiness.missing.map((m) => m.kind).join(", ")}
            </p>
          )}
        </CardContent>
      </Card>

      {noticeDate && (
        <div className="flex flex-wrap gap-2">
          <DeadlineChip
            deadline={{
              kind: "appeal_window",
              dueAt: new Date(noticeDate),
              label: "Notice received",
            }}
          />
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Next best actions</CardTitle>
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
                ? "Review your POA"
                : "Continue case"}
            </Link>
          </Button>
        </CardContent>
      </Card>

      {expCopy === "" && isNoveltyRequired && (
        <Card className="border-warning/40 bg-warning/5">
          <CardContent className="pt-5">
            <div className="flex items-start gap-3">
              <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div>
                <h3 className="font-medium text-foreground">Resubmission requires novelty</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  This is attempt #{currentLog.attemptCount}. Amazon requires new information or
                  changed framing on resubmission.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{APP.dashboard.replyCard.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{APP.dashboard.replyCard.description}</p>
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
                Amazon marked this as: <ReplyCategoryLabel category={replyResult.category} />
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
                  Update case →
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setReplyResult(null);
                    setReplyText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{APP.dashboard.submitCard.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{APP.dashboard.submitCard.description}</p>
        </CardHeader>
        <CardContent>
          <Button onClick={markSubmitted} disabled={busy} variant="outline" size="sm">
            {APP.dashboard.submitCard.button}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
