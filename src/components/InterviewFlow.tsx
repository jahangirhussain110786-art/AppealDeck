"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  FileUp,
  HelpCircle,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FieldSuggester } from "@/components/FieldSuggester";
import { cn } from "@/lib/utils";

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
      const data = await callApi("start", { kind: selectedKind });
      if (!data) return;
      setKind(selectedKind);
      setCaseFile(data.caseFile);
      setStep(data.step);
      setProgress(data.progress);
      setComplete(data.complete);
      resetAnswerState();
    },
    [callApi, resetAnswerState],
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

    if (data.complete) {
      try {
        sessionStorage.setItem("appealdeck:caseFile", JSON.stringify(data.caseFile));
      } catch {
        // storage full or unavailable — non-fatal
      }
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
  ]);

  if (!kind) {
    return (
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

                  <div className="flex flex-wrap gap-2">
                    <Button
                      onClick={handleSubmit}
                      disabled={
                        loading || (!choiceId && !answerValue.trim() && step.inputType !== "file")
                      }
                    >
                      {loading ? "Saving..." : "Continue"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                    <Button variant="ghost" onClick={() => setDeclineMode(true)} disabled={loading}>
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
  );
}
