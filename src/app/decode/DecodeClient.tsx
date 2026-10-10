"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { m } from "framer-motion";
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
import { canTranslateToEnglish, translateToEnglish } from "@/lib/translate";
import { trackFunnelEvent, FUNNEL_EVENTS } from "@/lib/analytics";
import { handlePaste, stripInvisibleChars } from "@/lib/idNormalize";
import { assessNoticeLikeness } from "@/lib/noticeLikeness";
import { buildNoticeAnnotations, buildDecodeSpans } from "@/lib/decodeAnnotations";
import { stashPendingNotice } from "@/lib/pendingNotice";
import { noteProposal } from "@/lib/secondReadingProposal";
import {
  peekDecodeDraft,
  clearDecodeDraft,
  saveSessionPaste,
  markSessionPasteLeaving,
  loadSessionPaste,
  clearSessionPaste,
} from "@/lib/decodeDraft";
import { CountdownRing } from "@/components/marketing/ProductPanels";
import { WORKSPACE } from "@/content/workspace";
import { proposedRequirements } from "@/core/workspace";
import { DECODE } from "@/content/marketing";
import { APP } from "@/content/app";
import { AccentWord } from "@/components/ui/accent-word";
import { SAMPLE_NOTICE_TEXT } from "@/content/sampleNotice";
import { cn } from "@/lib/utils";
import {
  ENTITY_LABELS,
  formatDay,
  parseNotice,
  type ViolationKind,
  type ResponseType,
  type ExtractedEntity,
} from "@/core";
import type { DeadlineLike } from "@/components/DeadlineChip";
import { useAdoptPrehydration } from "@/lib/useAdoptPrehydration";

/** Wire shape of `/api/decode`: `dueAt` arrives as an ISO string, not a `Date`. */
type DecodeResponse = {
  kind: ViolationKind;
  confidence: "deterministic" | "llm-needed";
  /** The second reading of a notice the rules could not place, with the sentence that decided it. */
  suggestedKind?: { kind: ViolationKind; quote: string };
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
  /**
   * 6 Oct 2026. The text that was decoded: the paste with tabs, entities, quote markers and hard
   * line breaks cleaned up. EVERY offset in this response (entities, matches, deadline spans)
   * refers to this string, so it is the text the page shows, marks and hands to the case, never
   * the string the seller typed. Optional so a response cached before this shipped still renders.
   */
  normalizedText?: string;
  receivedOn?: string | null;
  /** One calm sentence per shape check, in the order they were found. */
  notes?: Array<{ id: string; message: string }>;
  multipleNotices?: boolean;
  notEnforcement?: boolean;
  notEnforcementKind?: "warning" | "listing_removal";
  looksLikeReply?: { category: string; message: string; partial?: boolean; openAsks?: string[] };
};

/** What a refused paste (422) says about itself. */
type DecodeError = {
  message: string;
  /** The paste was the seller's own appeal, not Amazon's message. */
  sellerText: boolean;
  /** A shape the product could name (language, damaged text): the message already says what to do. */
  named: boolean;
  /** A language refusal the seller may override: "read it anyway" resends with `force`. */
  canContinue: boolean;
  /** The language the refusal named, so the browser can be asked to translate it. */
  language?: { code: string; name: string };
};

/** Longest the decoder is waited for. The server answers in well under a second; this is for a stalled connection. */
const DECODE_TIMEOUT_MS = 30_000;

type Status = "empty" | "loading" | "error" | "result";

/** Notes the result shows in a card of their own, so they are not repeated in the notes list. */
const NOTE_SHOWN_ELSEWHERE = new Set(["looks_like_reply", "not_enforcement"]);

const STAGGER = 0.04;

const charFmt = new Intl.NumberFormat("en-US", { useGrouping: true });

export default function DecodeClient() {
  // v5: a notice pasted into the home page's tool arrives here in memory. It is read at first
  // render and decoded straight away, because the seller already pressed Decode there.
  const [text, setText] = useState(() => peekDecodeDraft()?.text ?? "");
  const adoptNotice = useAdoptPrehydration(setText);
  const [status, setStatus] = useState<Status>(() => (peekDecodeDraft() ? "loading" : "empty"));
  const [result, setResult] = useState<DecodeResponse | null>(null);
  const [decodedText, setDecodedText] = useState("");
  // The result replaces the form, so the button that was just pressed leaves the page and focus would
  // fall back to the top of the document, silent for a screen reader. Move it to the new heading.
  useEffect(() => {
    if (status !== "result" && status !== "error") return;
    const heading = document.querySelector<HTMLElement>("main h1");
    if (!heading) return;
    heading.tabIndex = -1;
    heading.focus({ preventScroll: false });
  }, [status]);
  const [error, setError] = useState<DecodeError | null>(null);
  const [usingSample, setUsingSample] = useState(() => peekDecodeDraft()?.sample ?? false);

  const likeness = useMemo(() => assessNoticeLikeness(text), [text]);
  const guidance = result ? guidanceFor(result.kind) : null;
  const showHint = text.trim().length >= 40 && Boolean(likeness.hint);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    await submitText(text);
  }

  async function submitText(value: string, force = false) {
    if (!value.trim()) return;
    const submitted = value.trim();
    setStatus("loading");
    setError(null);
    trackFunnelEvent(FUNNEL_EVENTS.decoderSession);
    // A request that never answers would leave the button spinning for good.
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DECODE_TIMEOUT_MS);
    try {
      const res = await fetch("/api/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(force ? { text: submitted, force: true } : { text: submitted }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        // Rate-limited or the server's own trouble: nothing is wrong with the paste, so the page
        // must not suggest it was not a notice (7 Oct 2026).
        const serverSide = res.status === 429 || res.status >= 500;
        setError({
          // One calm message, written by the API for this exact paste. Nothing is appended to it.
          message:
            body.message ??
            body.error ??
            (serverSide ? DECODE.result.errorServer : DECODE.result.errorHint),
          sellerText: body.looksLikeSellerText === true,
          named: serverSide || body.supported === false || body.garbled === true,
          canContinue: body.canContinue === true && body.supported === false,
          language:
            typeof body.language === "string" && body.supported === false
              ? { code: body.language, name: String(body.languageName ?? body.language) }
              : undefined,
        });
        setStatus("error");
        return;
      }
      const raw: DecodeResponse = await res.json();
      // A second reading (9 Oct 2026) stands in for "not clearly classified". It is only a starting
      // point: the case's first screen asks the seller to confirm or change it, and the sentence
      // that decided it is shown with the result so they can judge it.
      const second = raw.kind === "UNKNOWN" ? raw.suggestedKind : undefined;
      const data: DecodeResponse = second
        ? { ...raw, kind: second.kind, confidence: "llm-needed" }
        : raw;
      setResult(data);
      // The decoded string, not the typed one: every offset in `data` points into it.
      setDecodedText(data.normalizedText ?? submitted);
      setStatus("result");
      saveSessionPaste(value, true);
      trackFunnelEvent(FUNNEL_EVENTS.decodeCompleted, { kind: data.kind });
      if (second)
        trackFunnelEvent(FUNNEL_EVENTS.secondReadingShown, { where: "decode", kind: second.kind });
    } catch {
      setError({
        message: controller.signal.aborted ? DECODE.result.errorSlow : DECODE.result.errorNetwork,
        sellerText: false,
        named: true,
        canContinue: false,
      });
      setStatus("error");
    } finally {
      clearTimeout(timer);
    }
  }

  const startedDraft = useRef(false);
  useEffect(() => {
    if (startedDraft.current) return;
    startedDraft.current = true;
    const draft = peekDecodeDraft();
    clearDecodeDraft();
    if (draft) {
      void submitText(draft.text);
      return;
    }
    // Back from "Open case workspace": the module variable above is gone, the tab's copy is not.
    // Read after mount, never in a state initialiser, so the server and first client render agree.
    restoreKeptPaste();
  });

  function restoreKeptPaste() {
    const kept = loadSessionPaste();
    if (!kept) return;
    setText(kept.text);
    if (kept.decoded) {
      setStatus("loading");
      void submitText(kept.text);
    }
  }

  function handleSample() {
    setText(SAMPLE_NOTICE_TEXT);
    saveSessionPaste(SAMPLE_NOTICE_TEXT);
    setUsingSample(true);
    setStatus("empty");
    setResult(null);
  }

  function handleClear() {
    setText("");
    clearSessionPaste();
    setUsingSample(false);
    setStatus("empty");
    setResult(null);
  }

  function handleReset() {
    setText("");
    clearSessionPaste();
    setUsingSample(false);
    setStatus("empty");
    setResult(null);
    setDecodedText("");
    setError(null);
  }

  /** Back to the box with the paste still in it, and the cursor there. */
  // Translation by the browser's own on-device translator, where it has one. Nothing is sent
  // anywhere to translate; the English text is then decoded like any pasted notice.
  // The language the browser has said it can translate, so a refusal in another language never
  // shows a button that would fail.
  const [translatableLanguage, setTranslatableLanguage] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [translatedFrom, setTranslatedFrom] = useState<string | null>(null);
  const refusedLanguage = error?.language?.code;
  const canTranslate = Boolean(refusedLanguage) && translatableLanguage === refusedLanguage;
  useEffect(() => {
    let live = true;
    if (refusedLanguage)
      void canTranslateToEnglish(refusedLanguage).then(
        (ok) => live && ok && setTranslatableLanguage(refusedLanguage),
      );
    return () => {
      live = false;
    };
  }, [refusedLanguage]);

  async function translateAndDecode() {
    if (!error?.language) return;
    setTranslating(true);
    const out = await translateToEnglish(text, error.language.code);
    setTranslating(false);
    if (!out.ok) {
      setError({
        ...error,
        message: DECODE.result.translateFailed,
        canContinue: error.canContinue,
      });
      return;
    }
    setText(out.text);
    setTranslatedFrom(error.language.name);
    void submitText(out.text);
  }

  function editPasted() {
    setStatus("empty");
    requestAnimationFrame(() => document.getElementById("notice")?.focus());
  }

  /** For the seller's own letter: an empty box, ready for Amazon's message. */
  function pasteAmazonInstead() {
    setText("");
    clearSessionPaste();
    setUsingSample(false);
    editPasted();
  }

  const canSubmit = text.trim().length > 0;

  // Decoding is a subsequent action on a form that's already on screen, not a fresh page load —
  // the submit button's own spinner (below) is the loading state; a full skeleton card appearing
  // underneath an already-visible, already-spinning button is redundant noise, not a helpful
  // signal (14 Sep 2026 founder direction: a click that replaces content in place shows loading
  // in the button, not a skeleton wipe).
  let main: React.ReactNode = null;
  if (status === "result" && result) {
    main = (
      <>
        {translatedFrom && (
          <Alert variant="warning" className="mb-4 bg-card">
            <AlertDescription>
              {DECODE.result.translatedNote.replace("{language}", translatedFrom)}
            </AlertDescription>
          </Alert>
        )}
        <ResultView result={result} guidance={guidance!} text={decodedText} />
      </>
    );
  } else if (status === "error") {
    main = (
      <ErrorView
        message={error?.message ?? DECODE.result.errorFallback}
        // A paste with no recognisable parts gets one extra line; a language or damaged-text
        // refusal and the seller's own letter already say exactly what to do.
        hint={error && !error.named && !error.sellerText ? DECODE.result.errorNotNotice : undefined}
        sellerText={error?.sellerText ?? false}
        canContinue={error?.canContinue ?? false}
        onContinue={() => void submitText(text, true)}
        canTranslate={canTranslate}
        translating={translating}
        onTranslate={() => void translateAndDecode()}
        onEdit={editPasted}
        onPasteInstead={pasteAmazonInstead}
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
                  className="inline-flex min-h-11 items-center text-sm text-muted-foreground transition-colors hover:text-foreground"
                >
                  <span aria-hidden>← </span>
                  {DECODE.result.decodeAnother}
                </button>
                <h1 className="mt-4 text-balance text-[clamp(2.4rem,1.4rem+3.2vw,3.875rem)] font-semibold leading-[1.02] tracking-[-0.04em] text-foreground">
                  {DECODE.result.headline[headlineKey(result)].lead}{" "}
                  <AccentWord className="text-primary">
                    {DECODE.result.headline[headlineKey(result)].accent}
                  </AccentWord>
                </h1>
                {/* Plain words for the two terms a first-time seller meets here. */}
                {result.responseType?.type === "PLAN_OF_ACTION" &&
                  headlineKey(result) === "PLAN_OF_ACTION" && (
                    <p className="mt-4 max-w-prose text-base leading-relaxed text-muted-foreground">
                      {DECODE.result.planOfActionGloss}
                    </p>
                  )}
                {(/account health/i.test(decodedText) || result.deadlines.length === 0) && (
                  <p className="mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                    {DECODE.result.accountHealthGloss}
                  </p>
                )}
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
            <>
              <ResultFacts result={result} guidance={guidance} text={decodedText} />
              {/* Directly under the three answers, so it is on screen without scrolling at 390 px.
                  A reply or a warning has no case to open as a plan, so it offers its own actions
                  in the result below instead. */}
              {!result.looksLikeReply && !result.notEnforcement && (
                <div className="mt-6">
                  <Button asChild size="lg">
                    <Link
                      href={`/case?kind=${result.kind}&view=overview`}
                      onClick={() => {
                        markSessionPasteLeaving();
                        stashPendingNotice(decodedText, result.deadlines);
                        noteSecondReadingUse(result);
                      }}
                    >
                      {DECODE.result.startPoaCta}
                      <ArrowRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              )}
            </>
          )}

          {status !== "result" && (
            <div className="mt-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_17rem]">
              <form
                onSubmit={handleSubmit}
                className="light max-w-tool rounded-[22px] bg-card p-2 text-foreground shadow-stage"
              >
                <div className="overflow-hidden rounded-2xl border border-border focus-within:ring-2 focus-within:ring-ring">
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
                    ref={adoptNotice}
                    placeholder={DECODE.textarea.placeholder}
                    value={text}
                    // The full normaliser runs on a paste and on the server, never per keystroke.
                    onPaste={(e) =>
                      handlePaste(e, (value) => {
                        setText(value);
                        saveSessionPaste(value);
                        if (value.length < 1) setStatus("empty");
                      })
                    }
                    onChange={(e) => {
                      const value = stripInvisibleChars(e.target.value);
                      setText(value);
                      saveSessionPaste(value);
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
                      {showHint ? likeness.hint : ""}
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

/**
 * What the headline says. A gated case is never headed with a response the case will not prepare,
 * and a verification notice says what it is even when it names no response type.
 */
/** R-2: the seller took the AI's proposed kind into a case; counted, and noted for confirmation. */
function noteSecondReadingUse(result: DecodeResponse): void {
  if (!result.suggestedKind) return;
  trackFunnelEvent(FUNNEL_EVENTS.secondReadingUsed, { where: "decode" });
  noteProposal(result.suggestedKind.kind);
}

function headlineKey(result: DecodeResponse): keyof typeof DECODE.result.headline {
  if (result.severityGated) return "GATED";
  if ((result.authenticity?.length ?? 0) > 0) return "SUSPECT";
  // Not a request for a response: say what it is before anything else (6 Oct 2026).
  if (result.looksLikeReply) return "REPLY";
  if (result.notEnforcement) {
    return result.notEnforcementKind === "listing_removal" ? "LISTING" : "WARNING";
  }
  if (result.kind === "VERIFICATION") return "VERIFICATION";
  return result.responseType?.type ?? "UNDETERMINED";
}

/**
 * An all-numeric date near "by / before / until" (or the header date the parser found) that reads
 * two ways, 12/10/2026 being 12 October or 10 December. Null when there is none or it is settled.
 */
function ambiguousDateIn(
  text: string,
  parsed: ReturnType<typeof parseNotice> | null,
): { written: string; a: string; b: string } | null {
  const m =
    /\b(?:by|before|until|no later than|on or before)\s+(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})\b/i.exec(
      text,
    );
  if (m) {
    const x = Number(m[1]);
    const y = Number(m[2]);
    const year = Number(m[3]);
    if (x >= 1 && x <= 12 && y >= 1 && y <= 12 && x !== y) {
      const iso = (mo: number, d: number) =>
        `${year}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      return {
        written: `${m[1]}/${m[2]}/${m[3]}`,
        a: iso(y, x), // day first: x is the day
        b: iso(x, y), // month first: x is the month
      };
    }
  }
  const header = parsed?.ambiguousReceipt;
  if (header) {
    const [a, b] = header;
    const [yy, mm, dd] = a.split("-");
    return { written: `${dd}/${mm}/${yy}`, a, b };
  }
  return null;
}

/** The answer, before any detail: what the reply is, when it is due, whether it looks forged. */
function ResultFacts({
  result,
  guidance,
  text,
}: {
  result: DecodeResponse;
  guidance: ReturnType<typeof guidanceFor>;
  text: string;
}) {
  const r = DECODE.result;
  const firstDue = result.deadlines.find((d) => d.dueAt && d.dueOn);
  // A stated length with no start date runs from receipt: show the length, never a made-up day.
  // A 17-day window is shown as the length the notice states ("17 days, from when you got the
  // notice"), not as a date and not as policy: the deadline list below still says to verify it.
  const parsed = firstDue ? null : parseNotice(text);
  const windowDays =
    parsed &&
    parsed.statedWindowDays !== null &&
    result.deadlines.some((d) => d.kind === "appeal_window" && d.startsOnReceipt)
      ? parsed.statedWindowDays
      : null;
  const flagged = (result.authenticity?.length ?? 0) > 0;
  const isReply = Boolean(result.looksLikeReply);
  // A numeric date that could be read two ways is shown as written, with both readings. Never
  // counted into a deadline (the engine does not), so this is a note, not a due date.
  const ambiguous = firstDue || windowDays !== null ? null : ambiguousDateIn(text, parsed);
  return (
    <div
      className={cn(
        "mt-10 grid gap-3.5",
        !isReply && "md:grid-cols-[1.3fr_1fr_1fr]",
        isReply && "md:max-w-sm",
      )}
    >
      {/* A pasted Amazon reply has no "problem" to classify and no reply-due date: only the scam check applies. */}
      {!isReply && (
        <>
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
              {result.suggestedKind && (
                <>
                  {/* R-3: an AI proposal is marked as one, not shown like a rule-read kind. */}
                  <span className="mt-1.5 inline-flex items-center rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning ring-1 ring-inset ring-warning/30">
                    {r.factAiReading}
                  </span>
                  <span className="mt-1 line-clamp-2 block text-xs text-muted-foreground">
                    {r.factReadFrom} “{result.suggestedKind.quote}”
                  </span>
                </>
              )}
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
                  : windowDays !== null
                    ? r.factWindow.replace("{n}", String(windowDays))
                    : ambiguous
                      ? r.factAmbiguousShort
                      : r.factNoDate}
              </span>
              {windowDays !== null && (
                <span className="block text-xs text-muted-foreground">{r.factWindowNote}</span>
              )}
              {ambiguous && (
                <span className="block text-xs text-muted-foreground">
                  {r.factAmbiguous
                    .replace("{date}", ambiguous.written)
                    .replace("{a}", formatDay(ambiguous.a))
                    .replace("{b}", formatDay(ambiguous.b))}
                </span>
              )}
            </span>
          </div>
        </>
      )}
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

function ErrorView({
  message,
  hint,
  sellerText,
  canContinue,
  canTranslate,
  translating,
  onTranslate,
  onEdit,
  onContinue,
  onPasteInstead,
}: {
  message: string;
  hint?: string;
  sellerText: boolean;
  canContinue: boolean;
  canTranslate: boolean;
  translating: boolean;
  onTranslate: () => void;
  onEdit: () => void;
  onContinue: () => void;
  onPasteInstead: () => void;
}) {
  return (
    // On a solid card, like the warnings in the result: the column rises over the navy stage and
    // the alert's see-through tint left its title dark red on dark navy.
    <div className="rounded-lg bg-card shadow-card">
      <Alert variant="destructive">
        <AlertTitle>{DECODE.result.errorTitle}</AlertTitle>
        {/* Said once: the API's message is written for this paste and already says what to do. */}
        <AlertDescription>{message}</AlertDescription>
        {hint && <AlertDescription className="mt-2">{hint}</AlertDescription>}
        <div className="mt-3 flex flex-wrap gap-2">
          {canTranslate ? (
            <Button
              size="sm"
              onClick={onTranslate}
              disabled={translating}
              className="h-auto min-h-9 whitespace-normal"
            >
              {translating ? DECODE.result.translating : DECODE.result.translate}
            </Button>
          ) : null}
          {canContinue ? (
            <Button size="sm" onClick={onContinue} className="h-auto min-h-9 whitespace-normal">
              {DECODE.result.errorContinue}
            </Button>
          ) : null}
          {sellerText ? (
            <Button size="sm" onClick={onPasteInstead} className="h-auto min-h-9 whitespace-normal">
              {DECODE.result.errorSellerAction}
            </Button>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-auto min-h-9 whitespace-normal"
          >
            {DECODE.result.errorEdit}
          </Button>
        </div>
      </Alert>
    </div>
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
  const carryNotice = () => {
    markSessionPasteLeaving();
    stashPendingNotice(text, result.deadlines);
    noteSecondReadingUse(result);
  };
  const r = DECODE.result;
  // Requested records already appear under "What to gather"; listing them again here was noise.
  const details = (result.entities ?? []).filter((e) => e.kind !== "requested_record");
  // 26 Sep 2026: the seller's notice stays on screen beside the decision, with the phrases that
  // decided the response and the records it names marked in place. Every span is an offset the
  // engine reported into this same text, so nothing is marked that the notice does not say.
  const spans = useMemo<NoticeSpan[]>(
    () => buildDecodeSpans(result.responseType, result.entities),
    [result],
  );
  // The two answers that are not a plan: Amazon's reply to an appeal, and a warning or a single
  // listing. Neither gets a response plan, a records list or "open the case" as if one existed.
  const notAPlan = Boolean(result.looksLikeReply || result.notEnforcement);
  const notes = (result.notes ?? []).filter((n) => !NOTE_SHOWN_ELSEWHERE.has(n.id));
  const shapeMessage = result.notes?.find((n) => n.id === "not_enforcement")?.message;
  const decodedOn = result.receivedOn ? formatDay(result.receivedOn) : null;

  /**
   * 25 Sep 2026: the result is one numbered answer in the order a seller acts on it — what to
   * send, by when, with what. A "Low" severity badge used to sit on every notice that was not
   * gated (the badge had only two values), which told a seller whose account had just been
   * deactivated that the matter was minor. Severity is shown only where it changes what the seller
   * must do: the professional-help warning.
   */
  return (
    <m.div
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
      {/*
        On a solid card (29 Sep 2026): the result column rises over the navy stage, and the alert's
        see-through tint let its title sit dark-on-navy — the most important warning on the page was
        the one line nobody could read. Found decoding a researched phishing email. A wrapper, not a
        class on the Alert: `cn`'s merge dropped `bg-card` there and the tint stayed see-through.
      */}
      {result.authenticity && result.authenticity.length > 0 && (
        <div className="rounded-lg bg-card shadow-card">
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
        </div>
      )}
      {/*
        Shape notes (6 Oct 2026): one calm line for each thing the decoder noticed about the paste
        itself, in the order it found them. They are shown as the API wrote them, with no special
        case per id, on a solid card for the same reason as the warning above.
      */}
      {notes.length > 0 && (
        <div className="rounded-lg bg-card shadow-card">
          <Alert variant="info">
            <ul className="space-y-2">
              {notes.map((n, i) => (
                <li key={`${n.id}-${i}`}>
                  <AlertDescription>{n.message}</AlertDescription>
                  {n.id === "multiple_notices" && (
                    <AlertDescription className="mt-1 font-medium">
                      {decodedOn
                        ? r.multipleDecoded.replace("{date}", decodedOn)
                        : r.multipleDecodedNoDate}
                    </AlertDescription>
                  )}
                </li>
              ))}
            </ul>
          </Alert>
        </div>
      )}
      {result.severityGated && (
        <div className="rounded-lg bg-card shadow-card">
          <Alert variant="warning">
            <AlertTitle>{r.gatedTitle}</AlertTitle>
            <AlertDescription>{guidance.severityNote ?? r.gatedFallback}</AlertDescription>
          </Alert>
        </div>
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
          {result.looksLikeReply && (
            <Card className="space-y-3 p-5 sm:p-6">
              <h2 className="text-[1.1875rem] font-semibold tracking-[-0.02em]">{r.replyTitle}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">{r.replyBody}</p>
              {result.looksLikeReply.partial &&
                (result.looksLikeReply.openAsks?.length ?? 0) > 0 && (
                  <ul className="list-disc space-y-1 pl-4 text-sm text-foreground/85">
                    {result.looksLikeReply.openAsks!.map((ask) => (
                      <li key={ask}>{ask}</li>
                    ))}
                  </ul>
                )}
              <div className="flex flex-wrap items-center gap-2">
                <Button asChild size="lg">
                  <Link href="/case?view=history" onClick={markSessionPasteLeaving}>
                    {r.replyOpen}
                    <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </Button>
                <CopyButton text={text} label={r.replyCopy} />
              </div>
            </Card>
          )}
          {!result.looksLikeReply && result.notEnforcement && (
            <Card className="space-y-3 p-5 sm:p-6">
              <h2 className="text-[1.1875rem] font-semibold tracking-[-0.02em]">
                {r.notEnforcementTitle}
              </h2>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {shapeMessage ?? r.notEnforcementTitle}
              </p>
              <Button asChild variant="outline">
                <Link href={`/case?kind=${result.kind}&view=overview`} onClick={carryNotice}>
                  {r.saveAnyway}
                </Link>
              </Button>
            </Card>
          )}
          {!notAPlan && (
            <>
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
                {result.suggestedKind && (
                  <p className="border-b border-border bg-warning/10 px-5 py-3 text-xs leading-relaxed text-foreground">
                    {r.recordsFromAi}
                  </p>
                )}
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
                            <span className="block font-semibold text-foreground">
                              {record.label}
                            </span>
                            <span className="block text-sm text-muted-foreground">
                              {record.source === "matrix" ? r.recordInferred : r.recordNamed}
                            </span>
                          </span>
                          {/* Ours, and said so — never passed off as something Amazon wrote. */}
                          <Badge
                            variant={record.source === "matrix" ? "info" : "secondary"}
                            size="sm"
                          >
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
                    <h2 className="text-[1.1875rem] font-semibold tracking-[-0.02em]">
                      {r.saveTitle}
                    </h2>
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
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {guidance.summary}
                </p>
                {result.responseType && (
                  <div className="mt-4 border-t border-border pt-4">
                    <h3 className="text-xs font-semibold text-muted-foreground">
                      {r.responseTypeTitle}
                    </h3>
                    <p className="mt-1 font-semibold text-foreground">
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
                    <h3 className="text-xs font-semibold text-muted-foreground">
                      {r.entitiesTitle}
                    </h3>
                    <ul className="flex flex-wrap gap-2">
                      {details.map((e) => (
                        <li
                          key={`${e.kind}-${e.start}`}
                          className="inline-flex items-baseline gap-1.5 rounded-md border border-border bg-surface-2/60 px-2 py-1 text-xs"
                        >
                          <span className="text-muted-foreground">{ENTITY_LABELS[e.kind]}</span>
                          <span className="font-mono tabular-nums text-foreground">{e.value}</span>
                          {e.ambiguous && (
                            <span className="text-warning">{r.entitiesAmbiguous}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-muted-foreground">{r.entitiesNote}</p>
                  </div>
                )}
              </Card>
            </>
          )}
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
    </m.div>
  );
}
