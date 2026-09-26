"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Ban, Check, FileSearch, FileText, RefreshCw, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatusPill } from "@/components/workspace/CaseOverview";
import { DeadlineChipList } from "@/components/DeadlineChip";
import { MarkedNotice, type NoticeSpan } from "@/components/MarkedNotice";
import { CopyButton } from "@/components/CopyButton";
import { OfflineNotice } from "@/components/OfflineNotice";
import { DetailDisclosure, VIEW_ICONS } from "@/components/workspace/WorkspaceVisuals";
import { guidanceFor } from "@/core/guidance";
import { trackFunnelEvent, FUNNEL_EVENTS } from "@/lib/analytics";
import { stripInvisibleChars } from "@/lib/idNormalize";
import { assessNoticeLikeness } from "@/lib/noticeLikeness";
import { buildNoticeAnnotations } from "@/lib/decodeAnnotations";
import { stashPendingNotice } from "@/lib/pendingNotice";
import { peekDecodeDraft, clearDecodeDraft } from "@/lib/decodeDraft";
import { CountdownRing } from "@/components/marketing/ProductPanels";
import { WORKSPACE } from "@/content/workspace";
import { proposedRequirements } from "@/core/workspace";
import { DECODE } from "@/content/marketing";
import { APP } from "@/content/app";
import { AccentWord } from "@/components/ui/accent-word";
import { SHARED } from "@/content/shared";
import { SAMPLE_NOTICE_TEXT } from "@/content/sampleNotice";
import { cn } from "@/lib/utils";
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
  // v5: a notice pasted into the home page's tool arrives here in memory. It is read at first
  // render and decoded straight away, because the seller already pressed Decode there.
  const [text, setText] = useState(() => peekDecodeDraft()?.text ?? "");
  const [status, setStatus] = useState<Status>(() => (peekDecodeDraft() ? "loading" : "empty"));
  const [result, setResult] = useState<DecodeResponse | null>(null);
  const [decodedText, setDecodedText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [usingSample, setUsingSample] = useState(() => peekDecodeDraft()?.sample ?? false);

  const likeness = useMemo(() => assessNoticeLikeness(text), [text]);
  const guidance = result ? guidanceFor(result.kind) : null;
  const showHint = text.trim().length >= 40 && Boolean(likeness.hint);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitText(text);
  }

  async function submitText(value: string) {
    if (!value.trim()) return;
    const submitted = value.trim();
    setStatus("loading");
    setError(null);
    trackFunnelEvent(FUNNEL_EVENTS.decoderSession);
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

  const startedDraft = useRef(false);
  useEffect(() => {
    if (startedDraft.current) return;
    startedDraft.current = true;
    const draft = peekDecodeDraft();
    clearDecodeDraft();
    if (draft) void submitText(draft.text);
  });

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

  const WRAP = "mx-auto w-full max-w-marketing px-4 sm:px-8";
  return (
    <div className="flex flex-col">
      <section className="stage dark text-foreground">
        <div className={cn(WRAP, "pb-28 pt-12 sm:pt-16")}>
          <OfflineNotice />
          <div className="flex flex-wrap items-end justify-between gap-4">
            {status === "result" && result ? (
              // v5 (26 Sep 2026, prototype decode.html): once decoded, the headline is the answer.
              <div className="max-w-4xl">
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span aria-hidden>← </span>
                  {DECODE.result.decodeAnother}
                </button>
                <h1 className="mt-4 text-balance text-[clamp(2.4rem,1.4rem+3.2vw,3.875rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-foreground">
                  {DECODE.result.headline[result.responseType?.type ?? "UNDETERMINED"].lead}{" "}
                  <AccentWord className="text-primary">
                    {DECODE.result.headline[result.responseType?.type ?? "UNDETERMINED"].accent}
                  </AccentWord>
                </h1>
              </div>
            ) : (
              <div className="max-w-3xl">
                <p className="mb-3 text-sm font-semibold text-primary">{DECODE.eyebrow}</p>
                <h1 className="text-balance text-[clamp(2.4rem,1.4rem+3.4vw,4.1rem)] font-semibold leading-[1.0] tracking-[-0.04em] text-foreground">
                  {DECODE.pageTitle}
                </h1>
                <p className="mt-4 max-w-prose text-lg leading-relaxed text-muted-foreground">
                  {DECODE.pageDescription}
                </p>
              </div>
            )}
          </div>

          {status === "result" && result && guidance && (
            <ResultFacts result={result} guidance={guidance} />
          )}

          {status !== "result" && (
            <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
              <form
                onSubmit={handleSubmit}
                className="light max-w-tool rounded-[22px] bg-card p-2 text-foreground shadow-stage"
              >
                <div className="overflow-hidden rounded-2xl border border-border">
                  <div className="flex items-center justify-between gap-2 border-b border-border/70 bg-surface-2 px-4 py-2.5">
                    <label htmlFor="notice" className="text-sm font-medium text-foreground">
                      {DECODE.textarea.label}
                    </label>
                    <p className="text-xs tabular-nums text-muted-foreground" data-tn>
                      {DECODE.charCounter.replace("{count}", charFmt.format(text.length))}
                    </p>
                  </div>
                  <Textarea
                    id="notice"
                    placeholder={DECODE.textarea.placeholder}
                    value={text}
                    onChange={(e) => {
                      const value = stripInvisibleChars(e.target.value);
                      setText(value);
                      // Emptied by typing: back to the empty state, as the clear button does.
                      if (value.length < 1) setStatus("empty");
                    }}
                    spellCheck={false}
                    aria-describedby="notice-help notice-hint"
                    className="min-h-[14rem] rounded-none border-0 font-mono text-sm leading-relaxed shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <div className="space-y-3 border-t border-border/70 bg-surface-2 px-4 py-3">
                    {/* Shown, not only written down (it sat unused until 24 Sep 2026): a pasted header
                      is what lets a deadline be counted from the notice's own date instead of
                      from receipt. */}
                    <p id="notice-help" className="text-xs text-muted-foreground">
                      {DECODE.textarea.hint}
                    </p>
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
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-xs text-muted-foreground">{DECODE.privacyNote}</p>
                      <div className="flex flex-wrap items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={handleSample}
                          disabled={status === "loading"}
                        >
                          {DECODE.sampleButton}
                        </Button>
                        <Button
                          type="submit"
                          size="lg"
                          disabled={status === "loading" || !canSubmit}
                        >
                          {status === "loading" && <RefreshCw className="animate-spin" />}
                          {DECODE.submitButton}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
              <div className="hidden justify-self-center rounded-[28px] bg-white p-6 shadow-stage lg:block">
                <Image
                  src="/illustrations/step-email.svg"
                  alt={DECODE.illustrationAlt}
                  width={240}
                  height={180}
                  className="h-auto w-56"
                  unoptimized
                />
              </div>
            </div>
          )}
        </div>
      </section>

      {main && <div className={cn(WRAP, "relative -mt-16 pb-10")}>{main}</div>}
    </div>
  );
}

/** The answer, before any detail: what the reply is, when it is due, whether it looks forged. */
function ResultFacts({
  result,
  guidance,
}: {
  result: DecodeResponse;
  guidance: ReturnType<typeof guidanceFor>;
}) {
  const r = DECODE.result;
  const firstDue = result.deadlines.find((d) => d.dueAt && d.dueOn);
  const flagged = (result.authenticity?.length ?? 0) > 0;
  return (
    <div className="mt-10 grid gap-3.5 md:grid-cols-[1.3fr_1fr_1fr]">
      <div className="flex items-center gap-4 rounded-[18px] bg-white/[0.05] p-5 ring-1 ring-inset ring-white/[0.08]">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white/[0.08]">
          <FileSearch aria-hidden className="size-5 text-primary" />
        </span>
        <span className="min-w-0">
          {/* The headline already says what to send; this tile names what it is about. */}
          <span className="block text-xs text-muted-foreground">{r.factProblem}</span>
          <span className="block text-lg font-semibold leading-snug tracking-tight">
            {result.kind === "UNKNOWN" ? guidance.title : APP.violationKinds[result.kind]}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-4 rounded-[18px] bg-primary/15 p-5 ring-1 ring-inset ring-primary/35">
        <CountdownRing size={48} tone="stage" />
        <span className="min-w-0">
          <span className="block text-xs font-semibold text-primary">{r.factDue}</span>
          <span className="block text-lg font-semibold leading-snug tracking-tight tabular-nums">
            {firstDue?.dueAt
              ? new Date(firstDue.dueAt).toLocaleDateString("en-GB", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                })
              : r.factNoDate}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-4 rounded-[18px] bg-white/[0.05] p-5 ring-1 ring-inset ring-white/[0.08]">
        <span
          className={cn(
            "grid size-12 shrink-0 place-items-center rounded-2xl",
            flagged ? "bg-warning/15" : "bg-success/15",
          )}
        >
          <ShieldAlert
            aria-hidden
            className={cn("size-5", flagged ? "text-warning" : "text-success")}
          />
        </span>
        <span className="min-w-0">
          <span className="block text-xs text-muted-foreground">{r.factScam}</span>
          <span className="block text-lg font-semibold leading-snug tracking-tight">
            {flagged ? r.factScamFlagged : r.factScamClear}
          </span>
        </span>
      </div>
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
  const annotations = useMemo(
    () => buildNoticeAnnotations(text, result.kind, DECODE.annotations),
    [text, result.kind],
  );
  const records = useMemo(
    // Revision 1: no case exists yet, and a workspace started from this notice begins there. These
    // records are a preview only — nothing here is saved until the seller starts a case.
    //
    // B-10, 24 Sep 2026: with the decoded kind, exactly as `importDecodedNotice` builds the case,
    // so the free decode shows the same list as the case it opens.
    () => proposedRequirements({ notice: text, formInstructions: "", revision: 1 }, result.kind),
    [text, result.kind],
  );
  const carryNotice = () => stashPendingNotice(text, result.deadlines);
  const r = DECODE.result;
  // Requested records already appear under "What to gather"; listing them again here was noise.
  const details = (result.entities ?? []).filter((e) => e.kind !== "requested_record");
  // 26 Sep 2026: the seller's notice stays on screen beside the decision, with the phrases that
  // decided the response and the records it names marked in place. Every span is an offset the
  // engine reported into this same text, so nothing is marked that the notice does not say.
  const spans = useMemo<NoticeSpan[]>(
    () => [
      ...(result.responseType?.matches ?? []).map((m) => ({
        start: m.start,
        end: m.end,
        tone: "risk" as const,
        title: result.responseType?.label,
      })),
      ...(result.entities ?? [])
        .filter((e) => e.kind === "requested_record")
        .map((e) => ({ start: e.start, end: e.end, tone: "clear" as const, title: e.value })),
    ],
    [result],
  );

  /**
   * 25 Sep 2026: the result is one numbered answer in the order a seller acts on it — what to
   * send, by when, with what. A "Low" severity badge used to sit on every notice that was not
   * gated (the badge had only two values), which told a seller whose account had just been
   * deactivated that the matter was minor. Severity is shown only where it changes what the seller
   * must do: the professional-help warning.
   */
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
      {/*
        #87: first, because if this message is a forgery nothing below it matters. It states no
        verdict — it cannot — and sends the seller to Seller Central, the one place that settles it.
      */}
      {result.authenticity && result.authenticity.length > 0 && (
        <Alert variant="warning">
          <ShieldAlert aria-hidden />
          <div className="space-y-3">
            <AlertTitle>{r.authenticityTitle}</AlertTitle>
            <AlertDescription>{r.authenticityLead}</AlertDescription>
            <div>
              <p className="text-eyebrow text-muted-foreground">{r.authenticityFound}</p>
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
            <AlertDescription className="font-medium">{r.authenticityAction}</AlertDescription>
          </div>
        </Alert>
      )}
      {result.severityGated && (
        <Alert variant="warning">
          <AlertTitle>{r.gatedTitle}</AlertTitle>
          <AlertDescription>{guidance.severityNote ?? r.gatedFallback}</AlertDescription>
        </Alert>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden lg:sticky lg:top-24">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0 border-b border-border px-5 py-3.5">
            <h2 className="text-[0.9375rem] font-semibold text-foreground">{r.markedTitle}</h2>
            <span className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="hl-risk inline-block size-3 rounded-sm" />
                {r.markedRisk}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span aria-hidden className="hl-clear inline-block size-3 rounded-sm" />
                {r.markedClear}
              </span>
            </span>
          </CardHeader>
          <CardContent className="px-6 py-6 sm:px-7">
            <MarkedNotice
              text={text}
              spans={spans}
              label={r.markedTitle}
              className="max-h-[70vh] overflow-y-auto pr-2 text-base leading-[1.8]"
            />
          </CardContent>
        </Card>

        {/* v5 (26 Sep 2026, prototype decode.html): what to gather, the way into a case, what to
            do and avoid now, and only then how we read the notice. */}
        <div className="space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-3.5">
              <h2 className="text-[0.9375rem] font-semibold">{r.recordsTitle}</h2>
              {records.length > 0 && (
                <StatusPill tone="mute">
                  {records.length === 1
                    ? r.recordsCountOne
                    : r.recordsCount.replace("{n}", String(records.length))}
                </StatusPill>
              )}
            </div>
            {records.length ? (
              <>
                <ul>
                  {records.map((record) => (
                    <li
                      key={record.label}
                      className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3.5 border-b border-border px-5 py-3.5 last:border-b-0"
                    >
                      <span className="inline-flex size-10 items-center justify-center rounded-[10px] bg-surface-2 ring-1 ring-inset ring-border">
                        <FileText aria-hidden className="size-5 text-foreground" />
                      </span>
                      <span className="min-w-0">
                        <span className="block font-semibold text-foreground">{record.label}</span>
                        <span className="block text-sm text-muted-foreground">
                          {record.source === "matrix" ? r.recordInferred : r.recordNamed}
                        </span>
                      </span>
                      {/* Ours, and said so — never passed off as something Amazon wrote. */}
                      <Badge variant={record.source === "matrix" ? "info" : "secondary"} size="sm">
                        {record.source === "matrix" ? WORKSPACE.inferred.badge : r.recordsAsked}
                      </Badge>
                    </li>
                  ))}
                </ul>
                <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
                  {r.recordsNote}
                </p>
              </>
            ) : (
              <p className="px-5 py-4 text-sm text-muted-foreground">{r.noRecords}</p>
            )}
          </Card>

          <Card className="overflow-hidden bg-[linear-gradient(180deg,hsl(var(--surface-1)),hsl(var(--primary)/0.06))]">
            <div className="grid items-center gap-x-4 gap-y-2 p-6 sm:grid-cols-[minmax(0,1fr)_8rem]">
              <div className="flex flex-col items-start gap-3.5">
                <h2 className="text-[1.1875rem] font-semibold tracking-[-0.02em]">{r.saveTitle}</h2>
                <Button asChild size="lg">
                  <Link href={`/case?kind=${result.kind}&view=overview`} onClick={carryNotice}>
                    {r.startPoaCta}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <p className="text-[0.84375rem] text-muted-foreground">{r.saveNote}</p>
              </div>
              <Image
                src="/illustrations/step-checklist.svg"
                alt=""
                width={128}
                height={110}
                className="-my-2 hidden h-auto w-32 sm:block"
                unoptimized
              />
            </div>
            <div className="space-y-3 border-t border-border px-6 py-4">
              <p className="text-xs text-muted-foreground">{r.jumpTo}</p>
              <nav aria-label="Case workspace views" className="mt-1 grid grid-cols-4 gap-1">
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
              <CopyButton text={guidance.summary} label={r.copySummary} />
            </div>
          </Card>

          {/* Shown open, not folded: the e2e and a panicking seller both need to see it at once. */}
          <Card className="p-5 sm:p-6">
            <h2 className="text-[0.9375rem] font-semibold">{r.triageTitle}</h2>
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {[
                { label: r.doNow, items: guidance.triage.doNow, icon: Check, bad: false },
                { label: r.doNot, items: guidance.triage.doNot, icon: Ban, bad: true },
              ].map(({ label, items, icon: Icon, bad }) => (
                <div key={label}>
                  <h3
                    className={cn(
                      "mb-2 flex items-center gap-2 text-sm font-semibold",
                      bad ? "text-destructive" : "text-success",
                    )}
                  >
                    <Icon aria-hidden className="size-4" />
                    {label}
                  </h3>
                  {/* All shown: each is one line, and "2 more actions" hid most of the advice. */}
                  <ul className="list-disc space-y-1.5 pl-4 text-sm leading-relaxed text-foreground/85">
                    {items.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="text-[0.9375rem] font-semibold">{r.howRead}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{guidance.summary}</p>
            {result.responseType && (
              <div className="mt-4 border-t border-border pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground">
                  {r.responseTypeTitle}
                </h3>
                <p className="mt-1 font-semibold text-foreground">{result.responseType.label}</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {result.responseType.reason}
                </p>
                {result.responseType.competing.length > 0 && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {r.responseTypeAlsoSeen}: {result.responseType.competing.join(", ")}
                  </p>
                )}
                {result.responseType.matches.length > 0 && (
                  <DetailDisclosure title={r.responseTypeSourceTitle} className="mt-3">
                    <div className="space-y-2">
                      {result.responseType.matches.map((m) => (
                        <blockquote
                          key={`${m.start}-${m.end}`}
                          className="border-l-2 border-primary/40 pl-3 text-xs italic"
                        >
                          {m.quote}
                        </blockquote>
                      ))}
                    </div>
                  </DetailDisclosure>
                )}
              </div>
            )}
            <div className="mt-4 border-t border-border pt-4">
              <h3 className="mb-2 text-xs font-semibold text-muted-foreground">
                {r.deadlinesTitle}
              </h3>
              {result.deadlines.length > 0 ? (
                <DeadlineChipList deadlines={result.deadlines} />
              ) : (
                <p className="text-sm text-muted-foreground">{r.noDeadline}</p>
              )}
            </div>
            {details.length > 0 && (
              <div className="mt-4 space-y-2 border-t border-border pt-4">
                <h3 className="text-xs font-semibold text-muted-foreground">{r.entitiesTitle}</h3>
                <ul className="flex flex-wrap gap-2">
                  {details.map((e) => (
                    <li
                      key={`${e.kind}-${e.start}`}
                      className="inline-flex items-baseline gap-1.5 rounded-md border border-border bg-surface-2/60 px-2 py-1 text-xs"
                    >
                      <span className="text-muted-foreground">{ENTITY_LABELS[e.kind]}</span>
                      <span className="font-mono tabular-nums text-foreground">{e.value}</span>
                      {e.ambiguous && <span className="text-warning">{r.entitiesAmbiguous}</span>}
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">{r.entitiesNote}</p>
              </div>
            )}
          </Card>
          <p className="px-1 text-[0.84375rem] text-muted-foreground">{r.notAdvice}</p>
        </div>
      </div>
      {annotations.length > 0 && (
        <DetailDisclosure title={r.wordingTitle}>
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
