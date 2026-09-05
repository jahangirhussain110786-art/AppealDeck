"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileUp,
  HelpCircle,
  Loader2,
  Save,
  Unlock,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldSuggester } from "@/components/FieldSuggester";
import { cn } from "@/lib/utils";
import { getBrowserVault } from "@/lib/vault/browser";
import { saveCaseFile, loadCaseFile, deleteCaseFile } from "@/lib/caseStore";
import type { Vault } from "@/core/vault/vault";
import type { CaseFile as CoreCaseFile } from "@/core/interviewEngine";
import { nextStep, interviewProgress } from "@/core/interviewEngine";

type ViolationKind =
  | "INAUTHENTIC_DOCUMENTS"
  | "RELATED_ACCOUNT"
  | "POLICY"
  | "INTELLECTUAL_PROPERTY"
  | "LISTING"
  | "FUNDS"
  | "UNKNOWN";

type StepKind =
  | "intake_root_cause"
  | "intake_timeline"
  | "intake_prior_appeals"
  | "evidence_ask"
  | "action_check"
  | "status_explanation";

type InputType = "enum" | "file" | "date" | "number" | "short_text";

interface EnumOption {
  id: string;
  label: string;
}

interface ActionAlternative {
  id: string;
  label: string;
  honestyNote: string;
  consequence: string;
  readinessImpact: "none" | "reduced" | "path_change";
}

interface InterviewStep {
  id: string;
  kind: StepKind;
  title: string;
  prompt: string;
  inputType: InputType;
  options?: EnumOption[];
  evidenceKind?: string;
  required?: boolean;
  whyAmazonWantsIt?: string;
  declineAlternatives?: ActionAlternative[];
}

interface CaseFile {
  kind: ViolationKind;
  state: string;
  rootCause?: string;
  timelineEvents: Array<{ date: string; description: string }>;
  priorAppealCount: number;
  evidenceSlots: Record<string, { present: boolean; disqualified?: boolean }>;
  actionItems: Array<{
    id: string;
    label: string;
    evidenceSlots: string[];
    status: "todo" | "in_progress" | "done";
    declined?: { reason: string; at: string };
  }>;
  attemptCount: number;
}

interface InterviewProgress {
  current: number;
  total: number;
  pendingEvidence: number;
}

const KIND_LABELS: Record<ViolationKind, string> = {
  INAUTHENTIC_DOCUMENTS: "Inauthentic documents",
  RELATED_ACCOUNT: "Related account",
  POLICY: "Policy violation",
  INTELLECTUAL_PROPERTY: "Intellectual property",
  LISTING: "Listing violation",
  FUNDS: "Funds hold",
  UNKNOWN: "Unknown / other",
};

interface InterviewFlowProps {
  initialKind?: ViolationKind;
  onComplete?: (caseFile: CaseFile) => void;
}

export function InterviewFlow({ initialKind, onComplete }: InterviewFlowProps) {
  const router = useRouter();
  const [kind, setKind] = useState<ViolationKind | undefined>(initialKind);
  const [caseFile, setCaseFile] = useState<CaseFile | null>(null);
  const [step, setStep] = useState<InterviewStep | null>(null);
  const [progress, setProgress] = useState<InterviewProgress | null>(null);
  const [complete, setComplete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [answerValue, setAnswerValue] = useState("");
  const [choiceId, setChoiceId] = useState<string | undefined>();
  const [showWhy, setShowWhy] = useState(false);
  const [declineMode, setDeclineMode] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineAltId, setDeclineAltId] = useState<string | undefined>();

  const vaultRef = useRef<Vault | null>(null);
  const [vaultReady, setVaultReady] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [unlockBusy, setUnlockBusy] = useState(false);
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  useEffect(() => {
    const initVault = async () => {
      try {
        const v = getBrowserVault();
        await v.open();
        vaultRef.current = v;
        const initialized = await v.isInitialized();
        if (!initialized) {
          await v.initWithPassphrase("default-default");
          setVaultReady(true);
          setVaultUnlocked(true);
          return;
        }
        const status = await v.status();
        if (status.state === "locked") {
          setVaultReady(true);
          setVaultUnlocked(false);
          return;
        }
        setVaultReady(true);
        setVaultUnlocked(true);
        try {
          const existing = await loadCaseFile(v);
          if (existing) {
            setShowResumeDialog(true);
          }
        } catch {
          // ignore
        }
      } catch {
        setVaultReady(true);
        setVaultUnlocked(true);
      }
    };
    void initVault();
  }, []);

  const resetAnswerState = useCallback(() => {
    setAnswerValue("");
    setChoiceId(undefined);
    setShowWhy(false);
    setDeclineMode(false);
    setDeclineReason("");
    setDeclineAltId(undefined);
  }, []);

  const callApi = useCallback(async (action: string, payload: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `Request failed (${res.status})`);
      }
      return await res.json();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const handleStart = useCallback(
    async (selectedKind: ViolationKind) => {
      setShowResumeDialog(false);
      const data = await callApi("start", { kind: selectedKind });
      if (!data) return;
      setKind(selectedKind);
      setCaseFile(data.caseFile);
      setStep(data.step);
      setProgress(data.progress);
      setComplete(data.complete);
      resetAnswerState();
      if (vaultRef.current && vaultUnlocked) {
        try {
          await saveCaseFile(vaultRef.current, data.caseFile as CoreCaseFile);
        } catch {
          // non-fatal
        }
      }
    },
    [callApi, resetAnswerState, vaultUnlocked],
  );

  const handleSubmit = useCallback(async () => {
    if (!caseFile || !step) return;

    let answer: Record<string, unknown> = { stepId: step.id };

    if (declineMode) {
      answer.declined = true;
      answer.declineReason = declineReason || "User declined";
      answer.declineAlternativeId = declineAltId;
    } else {
      switch (step.inputType) {
        case "enum":
          if (!choiceId) return;
          answer.choiceId = choiceId;
          break;
        case "short_text":
        case "date":
        case "number":
          if (!answerValue.trim()) return;
          answer.value = answerValue.trim();
          break;
        case "file":
          answer.filePresent = true;
          break;
      }
    }

    const data = await callApi("answer", { caseFile, answer });
    if (!data) return;

    setCaseFile(data.caseFile);
    setStep(data.step);
    setProgress(data.progress);
    setComplete(data.complete);
    resetAnswerState();

    if (vaultRef.current && vaultUnlocked) {
      try {
        await saveCaseFile(vaultRef.current, data.caseFile as CoreCaseFile);
      } catch {
        // vault save failed — non-fatal, interview continues
      }
    }

    if (data.complete) {
      if (onComplete) onComplete(data.caseFile);
    }
  }, [
    caseFile,
    step,
    declineMode,
    declineReason,
    declineAltId,
    choiceId,
    answerValue,
    callApi,
    resetAnswerState,
    onComplete,
    vaultUnlocked,
  ]);

  const handleUnlock = useCallback(async () => {
    if (!vaultRef.current || passphrase.length < 8) {
      if (passphrase.length < 8) toast.error("Passphrase must be at least 8 characters");
      return;
    }
    setUnlockBusy(true);
    try {
      await vaultRef.current.unlock(passphrase);
      setPassphrase("");
      setVaultUnlocked(true);
      const existing = await loadCaseFile(vaultRef.current);
      if (existing) setShowResumeDialog(true);
    } catch (e) {
      toast.error("Unlock failed", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setUnlockBusy(false);
    }
  }, [passphrase]);

  const handleResume = useCallback(async () => {
    if (!vaultRef.current || !vaultUnlocked) return;
    try {
      const existing = await loadCaseFile(vaultRef.current);
      if (existing) {
        const next = nextStep(existing as any);
        const prog = interviewProgress(existing as any);
        setKind((existing as any).kind);
        setCaseFile(existing as unknown as CaseFile);
        setStep((next ?? undefined) as InterviewStep | null);
        setProgress(prog as InterviewProgress);
        setComplete(false);
        resetAnswerState();
      }
    } catch (e) {
      toast.error("Could not load case", {
        description: e instanceof Error ? e.message : "Unknown error",
      });
    } finally {
      setShowResumeDialog(false);
    }
  }, [vaultUnlocked, resetAnswerState]);

  const handleStartOver = useCallback(async () => {
    if (vaultRef.current && vaultUnlocked) {
      try {
        await deleteCaseFile(vaultRef.current);
      } catch {
        // ignore
      }
    }
    setShowResumeDialog(false);
  }, [vaultUnlocked]);

  const handleSaveAndExit = useCallback(async () => {
    if (vaultRef.current && vaultUnlocked && caseFile) {
      try {
        await saveCaseFile(vaultRef.current, caseFile as CoreCaseFile);
        toast.success("Case saved", { description: "Your progress has been saved to the vault." });
      } catch (e) {
        toast.error("Could not save case", {
          description: e instanceof Error ? e.message : "Unknown error",
        });
        return;
      }
    }
    router.push("/dashboard");
  }, [vaultUnlocked, caseFile, router]);

  if (!vaultReady) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-pulse rounded-full" />
            Preparing your vault…
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!vaultUnlocked) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Unlock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1">
              <h2 className="font-medium text-foreground">Unlock your vault</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Enter your passphrase to decrypt your case data. The key never leaves your device.
              </p>
              <div className="mt-3 flex flex-col gap-3">
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={passphrase}
                  onChange={(e) => setPassphrase(e.target.value)}
                  placeholder="Passphrase"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleUnlock();
                  }}
                />
                <Button
                  onClick={() => void handleUnlock()}
                  disabled={unlockBusy}
                  size="sm"
                  className="self-start"
                >
                  {unlockBusy ? <Loader2 className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                  Unlock
                </Button>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                <a href="/vault" className="text-primary underline-offset-4 hover:underline">
                  Need to set up or recover your vault?
                </a>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!kind) {
    return (
      <>
        <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
          <DialogContent>
            <DialogTitle>Resume your case?</DialogTitle>
            <DialogDescription>
              You have a saved case file in your vault. Resume where you left off, or start fresh.
            </DialogDescription>
            <DialogFooter>
              <Button variant="outline" onClick={() => void handleStartOver()}>
                Start over
              </Button>
              <Button onClick={() => void handleResume()}>Resume case</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            What kind of enforcement are you appealing? The engine tailors every step to this.
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(KIND_LABELS) as ViolationKind[]).map((k) => (
              <Button
                key={k}
                variant="outline"
                className="h-auto justify-start text-left"
                onClick={() => handleStart(k)}
                disabled={loading}
              >
                {KIND_LABELS[k]}
              </Button>
            ))}
          </div>
        </div>
      </>
    );
  }

  if (complete) {
    return (
      <Card className="border-success/40 bg-success/5">
        <CardContent className="pt-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-success" />
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">Interview complete</h3>
              <p className="text-sm text-muted-foreground">
                Your case file is ready. The composer will draft your POA from the facts you
                provided.
              </p>
              <Button asChild>
                <a href="/compose">Continue to composer</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!step) return null;

  return (
    <>
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent>
          <DialogTitle>Resume your case?</DialogTitle>
          <DialogDescription>
            You have a saved case file in your vault. Resume where you left off, or start fresh.
          </DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => void handleStartOver()}>
              Start over
            </Button>
            <Button onClick={() => void handleResume()}>Resume case</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {progress && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Step {progress.current} of {progress.total}
              </span>
              {progress.pendingEvidence > 0 && (
                <span>{progress.pendingEvidence} evidence item(s) pending</span>
              )}
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{
                  width: `${progress.total > 0 ? (progress.current / progress.total) * 100 : 0}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        <div className="lg:hidden">
          <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-backdrop-blur:bg-background/80 border-t border-border pb-[env(safe-area-inset-bottom)]">
            <div className="p-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>
                  Step {progress?.current} of {progress?.total}
                </span>
                <Button variant="ghost" size="sm" onClick={handleSaveAndExit} disabled={loading}>
                  <Save className="h-4 w-4" />
                  <span className="sr-only">Save &amp; exit</span>
                </Button>
              </div>
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={
                  loading || (!choiceId && !answerValue.trim() && step.inputType !== "file")
                }
              >
                {loading ? "Saving..." : "Continue"}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{step.prompt}</p>

                {step.whyAmazonWantsIt && (
                  <div className="rounded-lg border border-border bg-muted/30">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between p-3 text-left text-sm font-medium text-foreground"
                      onClick={() => setShowWhy(!showWhy)}
                      aria-expanded={showWhy}
                    >
                      <span className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-primary" />
                        Why does Amazon want this?
                      </span>
                      {showWhy ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                    {showWhy && (
                      <div className="border-t border-border p-3 text-sm text-muted-foreground">
                        {step.whyAmazonWantsIt}
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                {!declineMode ? (
                  <div className="space-y-4">
                    {step.inputType === "enum" && step.options && (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {step.options.map((opt) => (
                          <Button
                            key={opt.id}
                            variant={choiceId === opt.id ? "default" : "outline"}
                            className={cn(
                              "h-auto justify-start text-left",
                              choiceId === opt.id && "ring-2 ring-primary",
                            )}
                            onClick={() => setChoiceId(opt.id)}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    )}

                    {step.inputType === "short_text" && (
                      <Textarea
                        value={answerValue}
                        onChange={(e) => setAnswerValue(e.target.value)}
                        placeholder="Type your answer..."
                        rows={4}
                      />
                    )}

                    {step.kind === "intake_root_cause" && step.inputType === "short_text" && (
                      <FieldSuggester stepId={step.id} text={answerValue} />
                    )}

                    {step.inputType === "date" && (
                      <Input
                        type="date"
                        value={answerValue}
                        onChange={(e) => setAnswerValue(e.target.value)}
                      />
                    )}

                    {step.inputType === "number" && (
                      <Input
                        type="number"
                        value={answerValue}
                        onChange={(e) => setAnswerValue(e.target.value)}
                        placeholder="Enter a number"
                      />
                    )}

                    {step.inputType === "file" && (
                      <div className="rounded-lg border-2 border-dashed border-border bg-muted/20 p-6 text-center">
                        <FileUp className="mx-auto h-8 w-8 text-muted-foreground" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          File upload is simulated in this build. Click below to mark as attached.
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={handleSubmit}
                        disabled={
                          loading || (!choiceId && !answerValue.trim() && step.inputType !== "file")
                        }
                      >
                        {loading ? "Saving..." : "Continue"}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveAndExit}
                        disabled={loading}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        Save & exit
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => setDeclineMode(true)}
                        disabled={loading}
                      >
                        <XCircle className="mr-2 h-4 w-4" />I can&apos;t or won&apos;t provide this
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-lg border border-warning/40 bg-warning/5 p-4">
                    <p className="text-sm font-medium text-foreground">
                      That&apos;s okay — the engine will adapt. Choose an alternative or proceed
                      without it.
                    </p>

                    {step.declineAlternatives && step.declineAlternatives.length > 0 && (
                      <div className="space-y-2">
                        {step.declineAlternatives.map((alt) => (
                          <button
                            key={alt.id}
                            type="button"
                            className={cn(
                              "w-full rounded-lg border p-3 text-left transition-colors",
                              declineAltId === alt.id
                                ? "border-primary bg-primary/10"
                                : "border-border bg-background hover:border-primary/50",
                            )}
                            onClick={() => {
                              setDeclineAltId(alt.id);
                              setDeclineReason(alt.label);
                            }}
                          >
                            <div className="text-sm font-medium text-foreground">{alt.label}</div>
                            <div className="mt-1 text-xs text-muted-foreground">
                              {alt.honestyNote}
                            </div>
                            <div className="mt-1 text-xs text-warning">{alt.consequence}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    <Textarea
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      placeholder="Optional: explain why (stays in your case file only)"
                      rows={2}
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleSubmit} disabled={loading} variant="destructive">
                        Confirm and continue
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setDeclineMode(false);
                          setDeclineReason("");
                          setDeclineAltId(undefined);
                        }}
                        disabled={loading}
                      >
                        Go back
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </>
  );
}
