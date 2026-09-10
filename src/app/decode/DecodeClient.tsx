"use client";

import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { ClipboardPaste, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CaseStateBadge } from "@/components/CaseStateBadge";
import { DeadlineChipList } from "@/components/DeadlineChip";
import { LocalFirstBadge } from "@/components/LocalFirstBadge";
import { HonestExpectationsCard } from "@/components/HonestExpectationsCard";
import { EmptyState } from "@/components/EmptyState";
import { CopyButton } from "@/components/CopyButton";
import { OfflineNotice } from "@/components/OfflineNotice";
import { guidanceFor } from "@/core/guidance";
import { assessNoticeLikeness } from "@/lib/noticeLikeness";
import { DECODE } from "@/content/marketing";
import { SHARED } from "@/content/shared";
import { SAMPLE_NOTICE_TEXT } from "@/content/sampleNotice";
import type { ViolationKind } from "@/core";
import type { Deadline } from "@/core";

type DecodeResponse = {
  kind: ViolationKind;
  confidence: "deterministic" | "llm-needed";
  deadlines: Deadline[];
  severityGated: boolean;
};

type Status = "empty" | "loading" | "error" | "result";

const STAGGER = 0.04;

const charFmt = new Intl.NumberFormat("en-US", { useGrouping: true });

export default function DecodeClient() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("empty");
  const [result, setResult] = useState<DecodeResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usingSample, setUsingSample] = useState(false);

  const likeness = useMemo(() => assessNoticeLikeness(text), [text]);
  const guidance = result ? guidanceFor(result.kind) : null;

  useEffect(() => {
    if (text.length < 1) setStatus("empty");
  }, [text]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 1) return;
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(
          body.error ?? "Could not decode this notice. Please check the text and try again.",
        );
        setStatus("error");
        return;
      }
      const data: DecodeResponse = await res.json();
      setResult(data);
      setStatus("result");
    } catch (e) {
      setError("Network error. Please try again.");
      setStatus("error");
    }
  }

  function handleSample() {
    setText(SAMPLE_NOTICE_TEXT);
    setUsingSample(true);
    setStatus("empty");
    setResult(null);
  }

  function handleClear() {
    setText("");
    setUsingSample(false);
    setStatus("empty");
    setResult(null);
  }

  const canSubmit = text.trim().length > 0;

  let main: React.ReactNode;
  if (status === "result" && result) {
    main = <ResultView result={result} guidance={guidance!} />;
  } else if (status === "loading") {
    main = <LoadingView />;
  } else if (status === "error") {
    main = (
      <ErrorView message={error ?? "Something went wrong."} onRetry={() => setStatus("empty")} />
    );
  } else {
    main = (
      <EmptyState
        icon={ClipboardPaste}
        title={DECODE.emptyState.title}
        description={DECODE.emptyState.description}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12">
      <OfflineNotice />
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          {DECODE.pageTitle}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{DECODE.pageDescription}</p>
      </div>

      <LocalFirstBadge />

      <form onSubmit={handleSubmit} className="space-y-4">
        {usingSample && (
          <div className="flex items-center gap-2">
            <Badge variant="info">Sample notice — not yours</Badge>
            <Button type="button" variant="ghost" size="sm" onClick={handleClear}>
              Clear
            </Button>
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="notice" className="block text-sm font-medium text-foreground">
            {DECODE.textarea.label}
          </label>
          <Textarea
            id="notice"
            placeholder={DECODE.textarea.placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            aria-describedby="notice-hint"
            className="min-h-[180px] font-mono text-sm"
          />
          <div id="notice-hint" className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {likeness.hint ?? " "}
            </p>
            <p className="font-mono text-xs text-muted-foreground" data-tn>
              {charFmt.format(text.length)} characters
            </p>
          </div>
        </div>

        {likeness.hint && (
          <Alert variant="info">
            <AlertTitle>{DECODE.noticeLikenessTitle ?? "Before you decode"}</AlertTitle>
            <AlertDescription>{likeness.hint}</AlertDescription>
          </Alert>
        )}

        <div className="flex items-center gap-3">
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: STAGGER * 2 }}
          >
            <Button type="submit" variant="default" disabled={status === "loading" || !canSubmit}>
              {status === "loading" && <RefreshCw className="h-4 w-4 animate-spin" />}
              {DECODE.submitButton}
            </Button>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: STAGGER * 3 }}
          >
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSample}
              disabled={status === "loading"}
            >
              {DECODE.sampleButton}
            </Button>
          </motion.div>
        </div>
      </form>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.15 }}
      >
        {main}
      </motion.div>
    </div>
  );
}

function LoadingView() {
  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: STAGGER }}
    >
      <Skeleton className="h-7 w-3/4" />
      <Skeleton className="h-5 w-1/2" />
      <Skeleton className="h-20 w-full" />
    </motion.div>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>Could not decode</AlertTitle>
      <AlertDescription>{message} Paste the full Amazon notice and try again.</AlertDescription>
      <div className="mt-3">
        <Button variant="outline" size="sm" onClick={onRetry}>
          {SHARED.retryButton}
        </Button>
      </div>
    </Alert>
  );
}

function ResultView({
  result,
  guidance,
}: {
  result: DecodeResponse;
  guidance: ReturnType<typeof guidanceFor>;
}) {
  const severity = result.severityGated ? ("high" as const) : ("low" as const);

  return (
    <motion.div
      className="space-y-4"
      initial="hidden"
      animate="show"
      variants={{
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: STAGGER } },
      }}
    >
      <motion.div variants={{ show: { opacity: 1, y: 0 } }}>
        <SeverityBadge severity={severity} />
        <span className="ml-2 text-lg font-semibold text-foreground">{guidance.title}</span>
      </motion.div>

      <motion.div variants={{ show: { opacity: 1, y: 0 } }}>
        <CaseStateBadge kind={result.kind} />
      </motion.div>

      <motion.div variants={{ show: { opacity: 1, y: 0 } }}>
        <p className="text-muted-foreground">{guidance.summary}</p>
      </motion.div>

      <motion.div variants={{ show: { opacity: 1, y: 0 } }}>
        <DeadlineChipList deadlines={result.deadlines} />
      </motion.div>

      <motion.div variants={{ show: { opacity: 1, y: 0 } }} className="grid gap-3 md:grid-cols-2">
        <Alert variant="info">
          <AlertTitle>Do now</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc list-inside space-y-1 text-sm">
              {guidance.triage.doNow.map((d, i) => (
                <li key={`now-${i}`}>{d}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
        <Alert variant="warning">
          <AlertTitle>Do not</AlertTitle>
          <AlertDescription>
            <ul className="mt-1 list-disc list-inside space-y-1 text-sm">
              {guidance.triage.doNot.map((d, i) => (
                <li key={`not-${i}`}>{d}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      </motion.div>

      <motion.div variants={{ show: { opacity: 1, y: 0 } }}>
        <HonestExpectationsCard
          summary={guidance.summary}
          whatToDo={[
            guidance.triage.doNow[0] ?? "Review the deadlines.",
            ...(guidance.triage.doNot.length ? ["Avoid the listed pitfalls."] : []),
          ]}
        />
      </motion.div>

      <motion.div variants={{ show: { opacity: 1, y: 0 } }}>
        <CtaAfterResult result={result} guidance={guidance} />
      </motion.div>

      <motion.div variants={{ show: { opacity: 1, y: 0 } }} className="pt-2">
        <CopyButton text={guidance.summary} aria-label="Copy plain-English summary" />
      </motion.div>
    </motion.div>
  );
}

function CtaAfterResult({
  result,
  guidance,
}: {
  result: DecodeResponse;
  guidance: ReturnType<typeof guidanceFor>;
}) {
  if (result.severityGated) {
    return (
      <Alert variant="info">
        <AlertTitle>Severity-gated case type</AlertTitle>
        <AlertDescription>
          {guidance.severityNote ??
            "This case is routed to professional help. A self-serve draft is not available."}
        </AlertDescription>
      </Alert>
    );
  }
  return (
    <motion.div
      className="rounded-lg border border-border bg-surface-1 p-4"
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-sm font-medium text-foreground">Need more than the decoder?</p>
      <p className="mt-1 text-sm text-muted-foreground">
        Get the Appeal Pass to draft and critic-check a full Plan of Action.
      </p>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="default" size="sm" asChild>
          <a href="/pricing">{SHARED.cta ?? "See the Appeal Pass"}</a>
        </Button>
        <span className="text-xs text-muted-foreground">No timers. No scarcity. Read the FAQ.</span>
      </div>
    </motion.div>
  );
}
