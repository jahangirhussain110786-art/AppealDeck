"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Ban,
  Check,
  FileSearch,
  FolderOpen,
  RefreshCw,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { SeverityBadge } from "@/components/SeverityBadge";
import { CaseStateBadge } from "@/components/CaseStateBadge";
import { DeadlineChipList } from "@/components/DeadlineChip";
import { LocalFirstBadge } from "@/components/LocalFirstBadge";
import { CopyButton } from "@/components/CopyButton";
import { OfflineNotice } from "@/components/OfflineNotice";
import { DetailDisclosure, IconTile, VIEW_ICONS } from "@/components/workspace/WorkspaceVisuals";
import { guidanceFor } from "@/core/guidance";
import { trackFunnelEvent, FUNNEL_EVENTS } from "@/lib/analytics";
import { assessNoticeLikeness } from "@/lib/noticeLikeness";
import { buildNoticeAnnotations } from "@/lib/decodeAnnotations";
import { stashPendingNotice } from "@/lib/pendingNotice";
import { WORKSPACE } from "@/content/workspace";
import { proposedRequirements } from "@/core/workspace";
import { DECODE } from "@/content/marketing";
import { SHARED } from "@/content/shared";
import { APP } from "@/content/app";
import { SAMPLE_NOTICE_TEXT } from "@/content/sampleNotice";
import { ENTITY_LABELS, type ViolationKind, type ResponseType, type ExtractedEntity } from "@/core";
import type { DeadlineLike } from "@/components/DeadlineChip";

/** Wire shape of `/api/decode`: `dueAt` arrives as an ISO string, not a `Date`. */
type DecodeResponse = {
  kind: ViolationKind;
  confidence: "deterministic" | "llm-needed";
  deadlines: DeadlineLike[];
  severityGated: boolean;
  /** AA-39. Optional on the wire so a cached response from before this shipped still renders. */
  responseType?: {
    type: ResponseType;
    label: string;
    reason: string;
    competing: string[];
    matches: Array<{ quote: string; start: number; end: number }>;
  };
  entities?: ExtractedEntity[];
  /** #87. Optional on the wire so a response cached before this shipped still renders. */
  authenticity?: Array<{ id: string; label: string; detail: string; match: string }>;
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

  function handleReset() {
    setText("");
    setUsingSample(false);
    setStatus("empty");
    setResult(null);
    setDecodedText("");
    setError(null);
  }

  const canSubmit = text.trim().length > 0;

  // Decoding is a subsequent action on a form that's already on screen, not a fresh page load —
  // the submit button's own spinner (below) is the loading state; a full skeleton card appearing
  // underneath an already-visible, already-spinning button is redundant noise, not a helpful
  // signal (14 Sep 2026 founder direction: a click that replaces content in place shows loading
  // in the button, not a skeleton wipe).
  let main: React.ReactNode = null;
  if (status === "result" && result) {
    main = <ResultView result={result} guidance={guidance!} text={decodedText} />;
  } else if (status === "error") {
    main = (
      <ErrorView
        message={error ?? DECODE.result.errorFallback}
        onRetry={() => setStatus("empty")}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6 py-8 sm:py-10">
      <OfflineNotice />
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="mb-2 text-eyebrow uppercase text-primary">Notice decoder</p>
          <h1 className="font-accent text-h1 text-foreground">{DECODE.pageTitle}</h1>
          <p className="mt-2 max-w-prose text-base text-muted-foreground">
            {DECODE.pageDescription}
          </p>
        </div>
        <div className="flex w-full items-center justify-between gap-3">
          <LocalFirstBadge className="hidden sm:inline-flex" />
          {status === "result" && (
            <Button type="button" variant="outline" size="sm" onClick={handleReset}>
              {DECODE.decodeAnotherButton}
            </Button>
          )}
        </div>
      </div>

      {status !== "result" && (
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

            <p className="text-xs text-muted-foreground">
              Your notice is sent to AppealDeck for analysis. Nothing is sent to Amazon.
            </p>
            <div className="flex flex-wrap items-center gap-3">
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
      )}

      {main}
    </div>
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
  const records = useMemo(
    () => proposedRequirements({ notice: text, formInstructions: "" }),
    [text],
  );
  const carryNotice = () => stashPendingNotice(text, result.deadlines);

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
      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-start gap-3 border-b border-border/60 bg-surface-2/50">
            <IconTile icon={FileSearch} tone="info" />
            <div className="min-w-0 space-y-2">
              <p className="text-eyebrow uppercase text-muted-foreground">Notice brief</p>
              <h2 className="text-xl font-semibold leading-snug text-foreground">
                {guidance.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                <SeverityBadge severity={severity} />
                <CaseStateBadge kind={result.kind} className="text-foreground" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <p className="text-sm leading-relaxed text-muted-foreground">{guidance.summary}</p>
            {/*
              #87: placed above the decision, because if this message is a forgery then nothing
              below it matters and every minute spent answering it is spent helping a criminal.
              It states no verdict — it cannot — and its only instruction is to go and look in
              Seller Central, which is the one place that settles the question.
            */}
            {result.authenticity && result.authenticity.length > 0 && (
              <Alert variant="warning">
                <ShieldAlert aria-hidden />
                <div className="space-y-3">
                  <AlertTitle>{DECODE.result.authenticityTitle}</AlertTitle>
                  <AlertDescription>{DECODE.result.authenticityLead}</AlertDescription>
                  <div>
                    <p className="text-eyebrow uppercase text-muted-foreground">
                      {DECODE.result.authenticityFound}
                    </p>
                    <ul className="mt-2 space-y-2">
                      {result.authenticity.map((signal) => (
                        <li key={signal.id} className="text-sm">
                          <span className="font-medium text-foreground">{signal.label}</span>
                          <span className="block text-muted-foreground">{signal.detail}</span>
                          <span className="mt-1 block break-words font-mono text-xs text-muted-foreground">
                            {signal.match}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <AlertDescription className="font-medium">
                    {DECODE.result.authenticityAction}
                  </AlertDescription>
                </div>
              </Alert>
            )}
            {/*
              AA-39: the decision, placed above the deadlines because it changes what the seller
              does, not merely when. `UNDETERMINED` is shown as prominently as any other answer —
              "we could not tell, go and check the form" is a real result, not a failure to hide.
            */}
            {result.responseType && (
              <div className="space-y-2 rounded-lg border border-border bg-surface-2/40 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {DECODE.result.responseTypeTitle}
                </p>
                <p className="text-base font-semibold text-foreground">
                  {result.responseType.label}
                </p>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {result.responseType.reason}
                </p>
                {result.responseType.competing.length > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {DECODE.result.responseTypeAlsoSeen}: {result.responseType.competing.join(", ")}
                  </p>
                )}
                {result.responseType.matches.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {DECODE.result.responseTypeSourceTitle}
                    </p>
                    {result.responseType.matches.map((m) => (
                      <blockquote
                        key={`${m.start}-${m.end}`}
                        className="border-l-2 border-primary/40 pl-3 text-xs italic text-muted-foreground"
                      >
                        {m.quote}
                      </blockquote>
                    ))}
                  </div>
                )}
              </div>
            )}
            {result.entities && result.entities.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {DECODE.result.entitiesTitle}
                </p>
                <ul className="flex flex-wrap gap-2">
                  {result.entities.map((e) => (
                    <li
                      key={`${e.kind}-${e.start}`}
                      className="inline-flex items-baseline gap-1.5 rounded-md border border-border bg-surface-2/60 px-2 py-1 text-xs"
                    >
                      <span className="text-muted-foreground">{ENTITY_LABELS[e.kind]}</span>
                      <span className="font-mono tabular-nums text-foreground">{e.value}</span>
                      {e.ambiguous && (
                        <span className="text-warning">{DECODE.result.entitiesAmbiguous}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">{DECODE.result.entitiesNote}</p>
              </div>
            )}
            {result.deadlines.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {DECODE.result.deadlinesTitle}
                </p>
                <DeadlineChipList deadlines={result.deadlines} />
              </div>
            )}
            <CopyButton text={guidance.summary} label={DECODE.result.copySummary} />
          </CardContent>
        </Card>
        <Card className="workspace-hero border-primary/20">
          <CardHeader>
            <p className="text-eyebrow uppercase text-primary">Next / Your case</p>
            <CardTitle className="font-accent text-2xl font-medium">
              Turn the notice into a plan.
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Your notice and deadlines come with you.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild className="w-full">
              <Link href={`/case?kind=${result.kind}&view=overview`} onClick={carryNotice}>
                {DECODE.result.startPoaCta}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <nav aria-label="Case workspace views" className="grid grid-cols-4 gap-1">
              {Object.entries(WORKSPACE.tabs).map(([view, label]) => {
                const Icon = VIEW_ICONS[view] ?? FileSearch;
                return (
                  <Link
                    key={view}
                    href={`/case?kind=${result.kind}&view=${view}`}
                    onClick={carryNotice}
                    className="flex min-w-0 flex-col items-center gap-2 rounded-lg py-3 text-xs font-medium text-foreground transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <Icon className="size-5 text-primary" aria-hidden />
                    {label}
                  </Link>
                );
              })}
            </nav>
            <p className="border-t border-primary/15 pt-3 text-xs text-muted-foreground">
              Free to organize · You control submission
            </p>
          </CardContent>
        </Card>
      </div>
      {result.severityGated && (
        <Alert variant="warning">
          <AlertTitle>Professional review needed</AlertTitle>
          <AlertDescription>
            {guidance.severityNote ??
              "This case needs professional help. A self-serve draft is not available."}
          </AlertDescription>
        </Alert>
      )}
      <div className="grid items-start gap-4 md:grid-cols-2">
        {[
          {
            label: DECODE.result.doNow,
            items: guidance.triage.doNow,
            icon: Check,
            tone: "primary" as const,
          },
          {
            label: DECODE.result.doNot,
            items: guidance.triage.doNot,
            icon: Ban,
            tone: "warning" as const,
          },
        ].map(({ label, items, icon, tone }) => (
          <Card key={label} className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <IconTile icon={icon} tone={tone} />
              <h3 className="text-sm font-semibold text-foreground">{label}</h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">{items[0]}</p>
            {items.length > 1 && (
              <DetailDisclosure
                title={`${items.length - 1} more ${label === DECODE.result.doNow ? "actions" : "precautions"}`}
                className="mt-3 border-0 bg-surface-2/60"
              >
                <ul className="list-disc space-y-2 pl-4">
                  {items.slice(1).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </DetailDisclosure>
            )}
          </Card>
        ))}
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <IconTile icon={FolderOpen} tone="warning" />
            <div>
              <CardTitle>{APP.access.casePreview.title}</CardTitle>
              <p className="mt-1 text-xs text-muted-foreground">
                Detected in your notice · Confirm against the current response page
              </p>
            </div>
          </div>
          <span className="font-mono text-2xl text-foreground">{records.length}</span>
        </CardHeader>
        <CardContent>
          {records.length ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {records.map((record) => (
                <DetailDisclosure key={record.label} title={record.label}>
                  <p className="mb-2 text-xs uppercase tracking-wide">Source in your notice</p>
                  <blockquote className="border-l-2 border-info/40 pl-3">
                    {record.sourceQuote}
                  </blockquote>
                </DetailDisclosure>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No specific records detected. Check the notice and response page before adding tasks.
            </p>
          )}
        </CardContent>
      </Card>
      {annotations.length > 0 && (
        <DetailDisclosure title="Understand the wording in your notice">
          <div className="grid gap-4 pt-2 sm:grid-cols-2">
            {annotations.map((a) => (
              <div key={a.id} className="space-y-2 border-l-2 border-info/30 pl-3">
                <p className="text-xs font-medium text-info">{a.tag}</p>
                <h3 className="font-medium text-foreground">{a.heading}</h3>
                <p>{a.body}</p>
              </div>
            ))}
          </div>
        </DetailDisclosure>
      )}
    </motion.div>
  );
}
