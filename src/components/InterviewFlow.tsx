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
  HelpCircle,
  Save,
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { FieldSuggester } from "@/components/FieldSuggester";
import { Stepper } from "@/components/Stepper";
import type { StepperStep } from "@/components/Stepper";
import { VaultGate } from "@/components/VaultGate";
import { APP } from "@/content/app";
import { cn } from "@/lib/utils";
import { formatTime } from "@/lib/format";
import { getBrowserVault } from "@/lib/vault/browser";
import {
  saveCaseFile,
  loadCaseFile,
  deleteCaseFile,
  loadCaseLog,
  saveCaseLog,
  CASE_ID,
} from "@/lib/caseStore";
import type { CaseLog } from "@/lib/caseStore";
import { FileDropZone } from "@/components/FileDropZone";
import type { VaultListItem } from "@/core/vault/vault";
import type { Vault } from "@/core/vault/vault";
import type { CaseFile as CoreCaseFile } from "@/core/interviewEngine";
import type { EvidenceKind } from "@/core/evidenceModel";
import { nextStep, interviewProgress } from "@/core/interviewEngine";
import { addFileToVault } from "@/lib/vault/addFileToVault";

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
  evidenceKind?: EvidenceKind;
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
  const [whyHintDismissed, setWhyHintDismissed] = useState(false);
  const [declineMode, setDeclineMode] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [declineAltId, setDeclineAltId] = useState<string | undefined>();

  const [saveState, setSaveState] = useState<
    { kind: "idle" } | { kind: "saved"; at: Date } | { kind: "failed"; message: string }
  >({ kind: "idle" });

  const vaultRef = useRef<Vault | null>(null);
  const [vaultReady, setVaultReady] = useState(false);
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [showVaultPicker, setShowVaultPicker] = useState(false);
  const [vaultRecords, setVaultRecords] = useState<VaultListItem[]>([]);
  const [ariaAnnounce, setAriaAnnounce] = useState("");

  /* eslint-disable react-hooks/exhaustive-deps -- announce only on step.id change */
  useEffect(() => {
    setAriaAnnounce(`${step?.title}. ${step?.prompt}`);
  }, [step?.id]);
  /* eslint-enable react-hooks/exhaustive-deps */
  const [showResumeDialog, setShowResumeDialog] = useState(false);

  useEffect(() => {
    const initVault = async () => {
      try {
        const v = getBrowserVault();
        await v.open();
        vaultRef.current = v;
        const initialized = await v.isInitialized();
        if (!initialized) {
          setVaultReady(true);
          setVaultUnlocked(false);
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
            const log = await loadCaseLog(v).catch(() => null);
            if (log?.whyHintDismissed) {
              setWhyHintDismissed(true);
            }
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

  const persistCaseFile = useCallback(
    async (cf: CaseFile) => {
      if (!vaultRef.current || !vaultUnlocked) return;
      try {
        await saveCaseFile(vaultRef.current, cf as CoreCaseFile);
        setSaveState({ kind: "saved", at: new Date() });
      } catch (e) {
        setSaveState({
          kind: "failed",
          message: e instanceof Error ? e.message : "Unknown error",
        });
      }
    },
    [vaultUnlocked],
  );

  const hasUnsavedAnswer = answerValue.trim() !== "" || choiceId !== undefined;

  useEffect(() => {
    if (!hasUnsavedAnswer) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedAnswer]);

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
        void persistCaseFile(data.caseFile);
      }
    },
    [callApi, resetAnswerState, vaultUnlocked, persistCaseFile],
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
      void persistCaseFile(data.caseFile);
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
    persistCaseFile,
  ]);

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

  const dismissWhyHint = useCallback(async () => {
    setWhyHintDismissed(true);
    setShowWhy(false);
    if (vaultRef.current && vaultUnlocked) {
      try {
        const log = await loadCaseLog(vaultRef.current).catch(() => null);
        if (log) {
          log.whyHintDismissed = true;
          await saveCaseLog(vaultRef.current, log);
        } else {
          const newLog: CaseLog = {
            state: "DECODED",
            attemptCount: caseFile?.attemptCount ?? 0,
            whyHintDismissed: true,
          };
          await saveCaseLog(vaultRef.current, newLog);
        }
      } catch {
        // ignore
      }
    }
  }, [vaultUnlocked, caseFile]);

  if (!vaultReady || !vaultUnlocked) {
    return (
      <VaultGate
        vault={vaultRef.current}
        onUnlocked={() => {
          setVaultReady(true);
          setVaultUnlocked(true);
          void (async () => {
            const v = vaultRef.current;
            if (!v) return;
            try {
              const existing = await loadCaseFile(v);
              if (existing) setShowResumeDialog(true);
            } catch {
              // ignore
            }
          })();
        }}
        onLocked={() => setVaultUnlocked(false)}
      >
        {() => null}
      </VaultGate>
    );
  }

  if (!kind) {
    return (
      <>
        <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
          <DialogContent>
            <DialogTitle>{APP.interview.resumePrompt.title}</DialogTitle>
            <DialogDescription>{APP.interview.resumePrompt.desc}</DialogDescription>
            <DialogFooter>
              <Button variant="outline" onClick={() => void handleStartOver()}>
                {APP.interview.resumePrompt.startOver}
              </Button>
              <Button onClick={() => void handleResume()}>
                {APP.interview.resumePrompt.resume}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground"> {APP.interview.kindPrompt}</p>
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
              <h3 className="font-medium text-foreground">{APP.interview.complete.title}</h3>
              <p className="text-sm text-muted-foreground">{APP.interview.complete.desc}</p>
              <Button asChild>
                <a href="/compose">{APP.interview.complete.continue}</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!step) return null;

  const stepperSteps: StepperStep[] = [
    {
      id: "intake_root_cause",
      label: "Root cause",
      state: !caseFile
        ? "todo"
        : caseFile.rootCause
          ? "done"
          : step.id === "intake_root_cause"
            ? "current"
            : "todo",
    },
    {
      id: "intake_timeline",
      label: "Timeline",
      state: !caseFile
        ? "todo"
        : caseFile.timelineEvents.length > 0
          ? "done"
          : step.id === "intake_timeline"
            ? "current"
            : "todo",
    },
    {
      id: "intake_prior_appeals",
      label: "Prior appeals",
      state:
        !caseFile || caseFile.priorAppealCount === 0
          ? "todo"
          : step.id === "intake_prior_appeals"
            ? "current"
            : "done",
    },
    ...(caseFile?.actionItems.map((a, i) => {
      const evidenceKind = a.evidenceSlots[0];
      const isActive = step.id === `evidence_${evidenceKind}`;
      let s: StepperStep["state"] = "todo";
      if (a.status === "done") s = "done";
      else if (a.declined) s = "skipped";
      else if (isActive) s = "current";
      return {
        id: `evidence_${evidenceKind}`,
        label: evidenceKind ? evidenceKind.replace(/_/g, " ") : `Evidence ${i + 1}`,
        state: s,
        ...(s === "skipped" ? { skippedReason: a.declined?.reason ?? "Declined" } : {}),
      } as StepperStep;
    }) ?? []),
  ];

  return (
    <>
      <Dialog open={showResumeDialog} onOpenChange={setShowResumeDialog}>
        <DialogContent>
          <DialogTitle>{APP.interview.resumePrompt.title}</DialogTitle>
          <DialogDescription>{APP.interview.resumePrompt.desc}</DialogDescription>
          <DialogFooter>
            <Button variant="outline" onClick={() => void handleStartOver()}>
              {APP.interview.resumePrompt.startOver}
            </Button>
            <Button onClick={() => void handleResume()}>{APP.interview.resumePrompt.resume}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="space-y-4">
        {progress && (
          <div className="space-y-2">
            <Stepper
              steps={stepperSteps}
              currentId={step?.id}
              progress={progress}
              className="md:max-w-xs"
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                Step {progress.current} of {progress.total}
              </span>
              {progress.pendingEvidence > 0 && (
                <span>
                  {APP.interview.pendingEvidence.replace(
                    "{count}",
                    String(progress.pendingEvidence),
                  )}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="md:hidden">
          <div
            className="fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-backdrop-blur:bg-background/80 border-t border-border pb-[env(safe-area-inset-bottom)]"
            data-no-print
            role="group"
            aria-label={APP.interview.stepControls}
          >
            <div className="p-4">
              <Button
                className="w-full"
                onClick={handleSubmit}
                disabled={
                  loading || (!choiceId && !answerValue.trim() && step.inputType !== "file")
                }
              >
                {loading ? APP.interview.saving : APP.interview.continue}
              </Button>
            </div>
          </div>
          <div className="h-16" />
        </div>

        <div aria-live="polite" aria-atomic className="sr-only">
          {ariaAnnounce}
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
                        {APP.interview.whyAmazonWants}
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

                {!whyHintDismissed && !caseFile && step.id === "intake_root_cause" && (
                  <div className="rounded-lg border border-border bg-muted/30 p-3 text-sm">
                    <p className="text-muted-foreground">{APP.interview.whyHint}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2"
                      onClick={() => void dismissWhyHint()}
                    >
                      {APP.interview.whyHintDismiss}
                    </Button>
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
                        autoComplete="off"
                        autoCapitalize="none"
                        autoCorrect="false"
                        spellCheck={false}
                        placeholder={APP.interview.answerPlaceholder}
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
                        placeholder={APP.interview.numberPlaceholder}
                      />
                    )}

                    {step.inputType === "file" && step.evidenceKind && vaultRef.current && (
                      <FileDropZone
                        onFile={async (file) => {
                          await addFileToVault(vaultRef.current!, file, {
                            evidenceKind: step.evidenceKind,
                            caseId: CASE_ID,
                          });
                        }}
                        disabled={loading}
                        hint={APP.interview.fileUpload.maxMb}
                      />
                    )}

                    {step.inputType === "file" && step.evidenceKind && vaultRef.current && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const recs = await vaultRef.current!.list({
                            evidenceKind: step.evidenceKind,
                          });
                          setVaultRecords(recs.filter((r) => r.kind !== "case"));
                          setShowVaultPicker(true);
                        }}
                        disabled={loading}
                      >
                        {APP.interview.fileUpload.alreadyHave}
                      </Button>
                    )}

                    {showVaultPicker && vaultRef.current && (
                      <Dialog open={showVaultPicker} onOpenChange={setShowVaultPicker}>
                        <DialogContent>
                          <DialogTitle>{APP.interview.fileUpload.pickFromVault}</DialogTitle>
                          <DialogDescription>
                            {vaultRecords.length === 0
                              ? APP.interview.fileUpload.noMatching
                              : "Select a record to mark as present."}
                          </DialogDescription>
                          <div className="space-y-2">
                            {vaultRecords.map((r) => (
                              <Button
                                key={r.id}
                                variant="outline"
                                className="w-full justify-start"
                                onClick={async () => {
                                  setShowVaultPicker(false);
                                  await handleSubmit();
                                }}
                              >
                                {r.name}
                              </Button>
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}

                    <div className="flex flex-wrap items-center gap-2">
                      <Button
                        onClick={handleSubmit}
                        disabled={
                          loading || (!choiceId && !answerValue.trim() && step.inputType !== "file")
                        }
                      >
                        {loading ? APP.interview.saving : APP.interview.continue}
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleSaveAndExit}
                        disabled={loading}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {APP.interview.saveAndExit}
                      </Button>
                      {step.inputType === "file" && step.evidenceKind && vaultRef.current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            const recs = await vaultRef.current!.list({
                              evidenceKind: step.evidenceKind,
                            });
                            setVaultRecords(recs.filter((r) => r.kind !== "case"));
                            setShowVaultPicker(true);
                          }}
                          disabled={loading}
                        >
                          {APP.interview.fileUpload.alreadyHave}
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        onClick={() => setDeclineMode(true)}
                        disabled={loading}
                      >
                        <XCircle className="mr-2 h-4 w-4" />
                        {APP.interview.declineButton}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 rounded-lg border border-warning/40 bg-warning/5 p-4">
                    <p className="text-sm font-medium text-foreground">
                      {APP.interview.declineNote}
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
                      placeholder={APP.interview.declinePlaceholder}
                      rows={2}
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button onClick={handleSubmit} disabled={loading} variant="destructive">
                        {APP.interview.confirmDecline}
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
                        {APP.interview.goBack}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {saveState.kind === "saved" && (
          <p className="text-xs text-muted-foreground">
            {APP.interview.saveStatus.saved.replace("{time}", formatTime(saveState.at))}
          </p>
        )}

        {saveState.kind === "failed" && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{APP.interview.saveStatus.failedTitle}</AlertTitle>
            <AlertDescription>{APP.interview.saveStatus.failedDesc}</AlertDescription>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                void persistCaseFile(caseFile!);
              }}
              disabled={loading}
            >
              {APP.interview.saveStatus.retry}
            </Button>
          </Alert>
        )}
      </div>
    </>
  );
}
