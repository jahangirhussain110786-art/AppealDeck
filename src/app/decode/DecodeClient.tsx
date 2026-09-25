"use client";

import { useState, useMemo } from "react";
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
import { DeadlineChipList } from "@/components/DeadlineChip";
import { CopyButton } from "@/components/CopyButton";
import { OfflineNotice } from "@/components/OfflineNotice";
import { DetailDisclosure, IconTile, VIEW_ICONS } from "@/components/workspace/WorkspaceVisuals";
import { guidanceFor } from "@/core/guidance";
import { trackFunnelEvent, FUNNEL_EVENTS } from "@/lib/analytics";
import { stripInvisibleChars } from "@/lib/idNormalize";
import { assessNoticeLikeness } from "@/lib/noticeLikeness";
import { buildNoticeAnnotations } from "@/lib/decodeAnnotations";
import { stashPendingNotice } from "@/lib/pendingNotice";
import { WORKSPACE } from "@/content/workspace";
import { proposedRequirements } from "@/core/workspace";
import { DECODE } from "@/content/marketing";
import { SHARED } from "@/content/shared";
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || text.trim().length < 1) return;
    const submitted = text.trim();
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
        <div className="flex w-full items-center justify-end gap-3">
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
              className="min-h-[14rem] font-mono text-sm leading-relaxed"
            />
            {/* Shown, not only written down (it sat unused until 24 Sep 2026): a pasted header is
                what lets a deadline be counted from the notice's own date instead of "from
                receipt". */}
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

            <p className="text-xs text-muted-foreground">{DECODE.privacyNote}</p>
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
  const hasType = Boolean(result.responseType);
  // Requested records already appear under "What to gather"; listing them again here was noise.
  const details = (result.entities ?? []).filter((e) => e.kind !== "requested_record");

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
              <p className="text-eyebrow uppercase text-muted-foreground">{r.authenticityFound}</p>
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

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <Card className="overflow-hidden">
          <CardHeader className="flex-row items-start gap-3 border-b border-border/60 bg-surface-2/50">
            <IconTile icon={FileSearch} tone="info" />
            <div className="min-w-0 space-y-1">
              <p className="text-eyebrow uppercase text-muted-foreground">{r.briefEyebrow}</p>
              <h2 className="text-xl font-semibold leading-snug text-foreground">
                {guidance.title}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{guidance.summary}</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ol className="divide-y divide-border/60">
              {result.responseType && (
                <Step n={1} title={r.responseTypeTitle}>
                  <p className="text-base font-semibold text-foreground">
                    {result.responseType.label}
                  </p>
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
                </Step>
              )}
              <Step n={hasType ? 2 : 1} title={r.deadlinesTitle}>
                {result.deadlines.length > 0 ? (
                  <DeadlineChipList deadlines={result.deadlines} />
                ) : (
                  <p className="text-sm text-muted-foreground">{r.noDeadline}</p>
                )}
              </Step>
              <Step n={hasType ? 3 : 2} title={r.recordsTitle}>
                {records.length ? (
                  <>
                    <ul className="space-y-2">
                      {records.map((record) => (
                        <li
                          key={record.label}
                          className="flex flex-wrap items-center gap-2 text-sm"
                        >
                          <FolderOpen aria-hidden className="size-4 shrink-0 text-warning" />
                          <span className="font-medium text-foreground">{record.label}</span>
                          {/* Ours, and said so — never passed off as something Amazon wrote. */}
                          <Badge
                            variant={record.source === "matrix" ? "secondary" : "info"}
                            size="sm"
                          >
                            {record.source === "matrix" ? WORKSPACE.inferred.badge : r.recordsAsked}
                          </Badge>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-xs text-muted-foreground">{r.recordsNote}</p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">{r.noRecords}</p>
                )}
              </Step>
            </ol>
            {details.length > 0 && (
              <div className="space-y-2 border-t border-border/60 px-6 py-5">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {r.entitiesTitle}
                </p>
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
          </CardContent>
        </Card>

        <Card className="workspace-hero border-primary/20 lg:sticky lg:top-24">
          <CardHeader>
            <p className="text-eyebrow uppercase text-primary">{r.nextEyebrow}</p>
            <CardTitle className="font-accent text-2xl font-medium">{r.nextTitle}</CardTitle>
            <p className="text-sm text-muted-foreground">{r.nextDesc}</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button asChild size="lg" className="w-full">
              <Link href={`/case?kind=${result.kind}&view=overview`} onClick={carryNotice}>
                {r.startPoaCta}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <div>
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
            </div>
            <div className="border-t border-primary/15 pt-3">
              <CopyButton text={guidance.summary} label={r.copySummary} />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid items-start gap-4 md:grid-cols-2">
        {[
          { label: r.doNow, items: guidance.triage.doNow, icon: Check, tone: "primary" as const },
          { label: r.doNot, items: guidance.triage.doNot, icon: Ban, tone: "warning" as const },
        ].map(({ label, items, icon, tone }) => (
          <Card key={label} className="p-5">
            <div className="mb-3 flex items-center gap-3">
              <IconTile icon={icon} tone={tone} />
              <h3 className="text-sm font-semibold text-foreground">{label}</h3>
            </div>
            {/* All shown: each is one line, and "2 more actions" hid most of the advice. */}
            <ul className="list-disc space-y-2 pl-4 text-sm leading-relaxed text-muted-foreground">
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </Card>
        ))}
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

function Step({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <li className="flex gap-4 px-6 py-5">
      <span
        aria-hidden
        className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-sm text-primary"
      >
        {n}
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </h3>
        {children}
      </div>
    </li>
  );
}
