"use client";

import { useState, useEffect, useMemo, Fragment } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Ban, Check, ClipboardPaste, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CaseStateBadge } from "@/components/CaseStateBadge";
import { DeadlineChipList } from "@/components/DeadlineChip";
import { LocalFirstBadge } from "@/components/LocalFirstBadge";
import { EmptyState } from "@/components/EmptyState";
import { CopyButton } from "@/components/CopyButton";
import { OfflineNotice } from "@/components/OfflineNotice";
import { CasePreview } from "@/components/CasePreview";
import { AnnotationCard } from "@/components/AnnotationCard";
import { guidanceFor } from "@/core/guidance";
import { trackFunnelEvent, FUNNEL_EVENTS } from "@/lib/analytics";
import { assessNoticeLikeness } from "@/lib/noticeLikeness";
import { buildNoticeAnnotations, segmentNoticeText } from "@/lib/decodeAnnotations";
import { DECODE } from "@/content/marketing";
import { SHARED } from "@/content/shared";
import { APP } from "@/content/app";
import { SAMPLE_NOTICE_TEXT } from "@/content/sampleNotice";
import type { ViolationKind } from "@/core";
import type { DeadlineLike } from "@/components/DeadlineChip";

/** Wire shape of `/api/decode`: `dueAt` arrives as an ISO string, not a `Date`. */
type DecodeResponse = {
  kind: ViolationKind;
  confidence: "deterministic" | "llm-needed";
  deadlines: DeadlineLike[];
  severityGated: boolean;
};

type Status = "empty" | "loading" | "error" | "result";

const STAGGER = 0.04;

const charFmt = new Intl.NumberFormat("en-US", { useGrouping: true });

export default function DecodeClient() {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<Status>("empty");
  const [result, setResult] = useState<DecodeResponse | null>(null);
  const [decodedText, setDecodedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usingSample, setUsingSample] = useState(false);

  const likeness = useMemo(() => assessNoticeLikeness(text), [text]);
  const guidance = result ? guidanceFor(result.kind) : null;
  const showHint = text.trim().length >= 40 && Boolean(likeness.hint);

  useEffect(() => {
    if (text.length < 1) setStatus("empty");
  }, [text]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 1) return;
    const submitted = text.trim();
    setStatus("loading");
    setError(null);
    try {
      const res = await fetch("/api/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: submitted }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error ?? DECODE.result.errorHint);
        setStatus("error");
        return;
      }
      const data: DecodeResponse = await res.json();
      setResult(data);
      setDecodedText(submitted);
      setStatus("result");
      trackFunnelEvent(FUNNEL_EVENTS.decodeCompleted, { kind: data.kind });
    } catch {
      setError(DECODE.result.errorNetwork);
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
    main = <ResultView result={result} guidance={guidance!} text={decodedText} />;
  } else if (status === "loading") {
    main = <LoadingView />;
  } else if (status === "error") {
    main = (
      <ErrorView
        message={error ?? DECODE.result.errorFallback}
        onRetry={() => setStatus("empty")}
      />
    );
  } else {
    main = (
      <div className="rounded-lg border border-dashed border-border p-8">
        <EmptyState
          icon={ClipboardPaste}
          title={DECODE.emptyState.title}
          description={DECODE.emptyState.description}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 py-12">
      <OfflineNotice />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-h1 text-foreground">{DECODE.pageTitle}</h1>
          <p className="mt-2 max-w-prose text-base text-muted-foreground">
            {DECODE.pageDescription}
          </p>
        </div>
        <LocalFirstBadge className="hidden sm:inline-flex" />
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="notice" className="text-sm font-medium text-foreground">
              {DECODE.textarea.label}
            </label>
            <p className="text-xs tabular-nums text-muted-foreground" data-tn>
              {charFmt.format(text.length)} characters
            </p>
          </div>
          <Textarea
            id="notice"
            placeholder={DECODE.textarea.placeholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            spellCheck={false}
            aria-describedby="notice-hint"
            className="min-h-[14rem] font-mono text-sm leading-relaxed"
          />
          <div id="notice-hint" className="sr-only" aria-live="polite">
            {likeness.hint ?? ""}
          </div>

          {usingSample && (
            <div className="flex items-center gap-2">
              <Badge variant="info">{DECODE.sampleBadge}</Badge>
              <Button type="button" variant="link" size="sm" onClick={handleClear}>
                {DECODE.clearButton}
              </Button>
            </div>
          )}

          {showHint && (
            <Alert variant="info">
              <AlertTitle>{DECODE.noticeLikenessTitle}</AlertTitle>
              <AlertDescription>{likeness.hint}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" size="lg" disabled={status === "loading" || !canSubmit}>
              {status === "loading" && <RefreshCw className="animate-spin" />}
              {DECODE.submitButton}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleSample}
              disabled={status === "loading"}
            >
              {DECODE.sampleButton}
            </Button>
          </div>
        </form>
      </Card>

      {main}
    </div>
  );
}

function LoadingView() {
  return (
    <Card className="space-y-4 p-6">
      <div className="flex items-center gap-3">
        <Skeleton className="h-5 w-24 rounded-full" />
        <Skeleton className="h-5 w-32 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="grid gap-3 md:grid-cols-2">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </Card>
  );
}

function ErrorView({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Alert variant="destructive">
      <AlertTitle>{DECODE.result.errorTitle}</AlertTitle>
      <AlertDescription>
        {message} {DECODE.result.errorHint}
      </AlertDescription>
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
  text,
}: {
  result: DecodeResponse;
  guidance: ReturnType<typeof guidanceFor>;
  text: string;
}) {
  const severity = result.severityGated ? ("high" as const) : ("low" as const);

  const annotations = useMemo(
    () => buildNoticeAnnotations(text, result.kind, DECODE.annotations),
    [text, result.kind],
  );
  const segments = useMemo(() => segmentNoticeText(text, annotations), [text, annotations]);
  const hasAnnotations = annotations.length > 0;

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
      <div className={hasAnnotations ? "grid items-start gap-4 lg:grid-cols-[1.6fr_1fr]" : ""}>
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <SeverityBadge severity={severity} />
              <CaseStateBadge kind={result.kind} />
              <h2 className="text-h3 text-foreground">{guidance.title}</h2>
            </div>
            <CopyButton text={guidance.summary} label={DECODE.result.copySummary} />
          </div>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{guidance.summary}</p>

          {hasAnnotations && (
            <div className="mt-5 rounded-md border border-border/70 bg-surface-2 p-4">
              <p className="text-eyebrow uppercase text-muted-foreground">
                {DECODE.result.annotatedNoticeLabel}
              </p>
              <p className="mt-2 whitespace-pre-wrap font-mono text-sm leading-loose text-foreground">
                {segments.map((seg, i) =>
                  seg.tag ? (
                    <mark key={i} className={seg.tag === "risky" ? "hl-risk" : "hl-clear"}>
                      {seg.text}
                    </mark>
                  ) : (
                    <Fragment key={i}>{seg.text}</Fragment>
                  ),
                )}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="warning" size="sm">
                  {DECODE.result.legendRisky}
                </Badge>
                <Badge variant="success" size="sm">
                  {DECODE.result.legendClear}
                </Badge>
              </div>
            </div>
          )}

          <div className="mt-4">
            <DeadlineChipList deadlines={result.deadlines} />
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-md border border-border/70 bg-surface-2 p-4">
              <p className="text-eyebrow uppercase text-success">{DECODE.result.doNow}</p>
              <ul className="mt-2 space-y-1.5">
                {guidance.triage.doNow.map((d, i) => (
                  <li key={`now-${i}`} className="flex gap-2 text-sm text-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-md border border-border/70 bg-surface-2 p-4">
              <p className="text-eyebrow uppercase text-warning">{DECODE.result.doNot}</p>
              <ul className="mt-2 space-y-1.5">
                {guidance.triage.doNot.map((d, i) => (
                  <li key={`not-${i}`} className="flex gap-2 text-sm text-foreground">
                    <Ban className="mt-0.5 size-4 shrink-0 text-warning" />
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-5">
            <CtaAfterResult result={result} guidance={guidance} />
          </div>
        </Card>

        {hasAnnotations && (
          <div className="flex flex-col gap-4">
            <p className="text-eyebrow uppercase text-muted-foreground">
              {DECODE.result.whatThisMeans}
            </p>
            {annotations.map((a) => (
              <AnnotationCard key={a.id} tag={a.tag} heading={a.heading} body={a.body} />
            ))}
            <Button size="lg" className="justify-center" asChild>
              <a href={`/case?kind=${result.kind}`}>
                {DECODE.result.startPoaCta}
                <ArrowRight className="size-4" aria-hidden />
              </a>
            </Button>
          </div>
        )}
      </div>

      <CasePreview kind={result.kind} />
      <Button asChild size="lg">
        <a href={`/case?kind=${result.kind}`}>{APP.access.casePreview.startCta}</a>
      </Button>
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
    <div className="rounded-md border border-border/70 bg-surface-2 p-5">
      <p className="text-sm font-medium text-foreground">{DECODE.result.ctaTitle}</p>
      <p className="mt-1 text-sm text-muted-foreground">{DECODE.result.ctaDesc}</p>
      <div className="mt-3 flex items-center gap-3">
        <Button size="sm" asChild>
          <a href="/pricing">{SHARED.cta}</a>
        </Button>
        <span className="text-xs text-muted-foreground">{DECODE.result.ctaNote}</span>
      </div>
    </div>
  );
}
