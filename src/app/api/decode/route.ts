import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  runDecode,
  isSeverityGated,
  RESPONSE_TYPE_LABELS,
  assessNoticeAuthenticity,
  analyzeReply,
} from "@/core";
import { findUnreadableIds } from "@/core/entities";
import { rateLimitDecode, rateLimitDecodeAi, tooManyRequestsResponse } from "@/lib/ratelimit";
import { isGeminiConfigured } from "@/lib/llm/gemini";
import { classifyNotice } from "@/lib/llm/classifyNotice";
import {
  countReading,
  getRememberedReading,
  locateQuote,
  readingKey,
  rememberReading,
} from "@/lib/secondReadingStore";
import { hasD6Allegation } from "@/core/violationKinds";
import { receiptDateOf } from "@/core/noticeDate";
import {
  GARBLED_MESSAGE,
  GARBLED_REPAIRED_MESSAGE,
  LOOKS_LIKE_REPLY_MESSAGE,
  MULTIPLE_NOTICES_MESSAGE,
  NOT_A_NOTICE_MISSING,
  NOT_A_NOTICE_SHORT,
  NOT_ENFORCEMENT_LISTING_MESSAGE,
  NOT_ENFORCEMENT_WARNING_MESSAGE,
  SELLER_TEXT_MESSAGE,
  ambiguousReceiptMessage,
  businessDaysMessage,
  nonEnglishMessage,
  unreadableIdMessage,
} from "@/core/noticeMessages";
import {
  assessGarbled,
  assessNotEnforcement,
  detectMultipleNotices,
  looksLikeSellerText,
  normalizeNoticeText,
  repairOcrText,
  splitNotices,
} from "@/core/noticeText";
import { detectLanguage } from "@/lib/language";
import { noticeMarkerHits } from "@/lib/noticeLikeness";

export const dynamic = "force-dynamic";

const DecodeBody = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Field 'text' is required.")
    .max(50_000, "Notice text exceeds 50,000 character limit."),
  /** "Continue anyway": skips the language refusal for a seller who knows the notice is readable. */
  force: z.boolean().optional(),
});

/** Why a paste was refused, in the seller's terms. The page already shows `error` for any 422. */
function refuse(message: string, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, message, ...extra }, { status: 422 });
}

/**
 * Phrases only a reply to something the seller already sent uses: a reference to their earlier
 * appeal, plan, submission or request. "We have reviewed your account" and "We have received your
 * request" open a first-contact notice as often as a reply, so they no longer count on their own
 * (7 Oct 2026: a first notice was told "this looks like Amazon's reply" and lost its performance
 * record).
 */
const REPLY_MARKERS =
  /\byour (?:appeal|plan of action|POA|submission|reply|response)\b|\bwe(?:'ve| have) (?:reviewed|received) your (?:appeal|plan of action|POA|submission|reply|response|request to reinstate|documents?|invoices?)\b|\bthank you for (?:your (?:appeal|plan of action|submission|reply|response)|submitting|providing)\b|\bregarding your (?:appeal|case)\b/i;
const REQUESTING_REPLY_MARKERS =
  /\bthank you for (?:your (?:appeal|plan of action|submission|reply|response|documents?|invoices?)|submitting|providing)\b|\bwe(?:'ve| have) (?:reviewed|received) your (?:appeal|plan of action|POA|submission|reply|response|documents?|invoices?)\b/i;
/** Categories that, with a reply marker, mean "this is Amazon answering something you sent". */
const REPLY_CATEGORIES = new Set([
  "reinstated",
  "needs_more_information",
  "final_decision_negative",
]);
const REFUSAL_CATEGORIES = new Set(["needs_more_information", "final_decision_negative"]);

interface Note {
  id: string;
  message: string;
}

export async function POST(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "0.0.0.0";
  const rate = await rateLimitDecode(ip);
  if (!rate.success) return tooManyRequestsResponse(rate);

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = DecodeBody.safeParse(body);
  if (!parsed.success) {
    const first = parsed.error.issues[0]?.message ?? "Invalid body.";
    const tooLong = parsed.error.issues.some((i) => i.code === "too_big");
    return NextResponse.json({ error: first }, { status: tooLong ? 413 : 400 });
  }

  /*
    One normaliser before anything reads the text (6 Oct 2026): tabs, non-breaking spaces, HTML
    entities, markdown bold, quote markers, soft hyphens and hard-wrapped lines each silently cost a
    paste its window, its receipt date or its whole classification. The text that was normalised is
    the text that is decoded, so every offset returned below refers to `normalizedText` — the caller
    shows and highlights that string, not the one that was typed.
  */
  let working = normalizeNoticeText(parsed.data.text).trim();

  const language = detectLanguage(working);
  if (!language.supported && !parsed.data.force) {
    return refuse(nonEnglishMessage(language.name), {
      language: language.code,
      languageName: language.name,
      supported: false,
      // The detector is a word-frequency guess. A seller who can see the notice is English may
      // send it again with `force: true` and have it decoded as written.
      canContinue: true,
    });
  }

  if (looksLikeSellerText(working)) {
    return refuse(SELLER_TEXT_MESSAGE, { looksLikeSellerText: true });
  }

  // Text damaged by OCR: try a cheap repair, and keep it only when it makes the notice readable.
  const damage = assessGarbled(working);
  let garbledRepaired = false;
  if (damage.garbled) {
    const repaired = repairOcrText(working);
    const better =
      noticeMarkerHits(repaired) > noticeMarkerHits(working) ||
      (receiptDateOf(repaired) !== null && receiptDateOf(working) === null);
    if (better) {
      working = repaired;
      garbledRepaired = true;
    }
  }

  if (working.length < 50) {
    return refuse(damage.garbled ? GARBLED_MESSAGE : NOT_A_NOTICE_SHORT, {
      ...(damage.garbled ? { garbled: true } : {}),
    });
  }
  if (noticeMarkerHits(working) < 2) {
    return refuse(damage.garbled ? GARBLED_MESSAGE : NOT_A_NOTICE_MISSING, {
      ...(damage.garbled ? { garbled: true } : {}),
    });
  }

  const notes: Note[] = [];

  // Two or more messages in one paste: decode the most recent and say so, rather than presenting
  // one kind as the whole story.
  let decodeText = working;
  let offset = 0;
  const multipleNotices = detectMultipleNotices(working);
  if (multipleNotices) {
    const segments = splitNotices(working).filter((s) => s.text.trim().length >= 40);
    if (segments.length > 1) {
      const dated = segments
        .map((s) => ({ s, day: receiptDateOf(s.text) }))
        .filter((x): x is { s: (typeof segments)[number]; day: string } => x.day !== null)
        .sort((a, b) => b.day.localeCompare(a.day));
      const chosen = dated[0]?.s ?? segments[0]!;
      decodeText = chosen.text;
      offset = chosen.start;
    }
    notes.push({ id: "multiple_notices", message: MULTIPLE_NOTICES_MESSAGE });
  }
  if (damage.garbled) {
    notes.push({
      id: "garbled",
      message: garbledRepaired ? GARBLED_REPAIRED_MESSAGE : GARBLED_MESSAGE,
    });
  }

  // No receipt date passed. This was `new Date()`, which counted every stated window from the
  // moment of decoding; the `dueAt: null` guard below kept that from ever reaching the seller, at
  // the cost of also discarding a real date. The notice's own header date is now used when it has
  // one; otherwise the window is described as running from the day it was received.
  const result = runDecode(decodeText, {});

  const enforcement = assessNotEnforcement(decodeText);
  if (enforcement.notEnforcement) {
    notes.push({
      id: "not_enforcement",
      message:
        enforcement.kind === "listing_removal"
          ? NOT_ENFORCEMENT_LISTING_MESSAGE
          : NOT_ENFORCEMENT_WARNING_MESSAGE,
    });
  }

  // An Amazon reply pasted here: tell the page, so it can offer the reply flow.
  const reply = analyzeReply(decodeText);
  const looksLikeReply =
    reply.category !== "unrecognized" &&
    ((REPLY_CATEGORIES.has(reply.category) && REPLY_MARKERS.test(decodeText)) ||
      ((reply.category === "document_request" || reply.category === "identity_verification") &&
        REQUESTING_REPLY_MARKERS.test(decodeText)))
      ? {
          category: reply.category,
          message: LOOKS_LIKE_REPLY_MESSAGE,
          ...(reply.partial ? { partial: true as const, openAsks: reply.openAsks ?? [] } : {}),
        }
      : null;
  if (looksLikeReply) notes.push({ id: "looks_like_reply", message: LOOKS_LIKE_REPLY_MESSAGE });

  const businessDays = result.parsed.statedBusinessDays;
  if (businessDays !== null) {
    notes.push({ id: "business_days", message: businessDaysMessage(businessDays) });
  }
  const ambiguousReceipt = result.parsed.ambiguousReceipt;
  if (ambiguousReceipt) {
    notes.push({ id: "ambiguous_receipt", message: ambiguousReceiptMessage(ambiguousReceipt) });
  }

  const idHints = findUnreadableIds(decodeText).map((hint) => ({
    ...hint,
    start: hint.start + offset,
    end: hint.end + offset,
    message: unreadableIdMessage(hint.value),
  }));
  for (const hint of idHints) notes.push({ id: "unreadable_id", message: hint.message });

  // A warning or a refusal asks the seller for no performance records, so none are raised for it.
  const dropPerformance =
    enforcement.notEnforcement ||
    (looksLikeReply !== null && REFUSAL_CATEGORIES.has(looksLikeReply.category));
  const entities = result.entities
    .filter(
      (e) =>
        !(
          dropPerformance &&
          e.kind === "requested_record" &&
          e.value === "Sales or performance report"
        ),
    )
    .map((e) => (offset === 0 ? e : { ...e, start: e.start + offset, end: e.end + offset }));

  /*
    A second reading, only for a notice the rules could not place (9 Oct 2026). Not for a reply, a
    warning, a message with scam signals or an allegation the gate already handles; never when the
    model is off or a daily cap is reached, in which case the answer is exactly what it was before.
    The reading is a proposal: the client uses it as the starting kind, the seller confirms it on
    the case's first screen, and it cannot set or clear the falsified-documents gate.
  */
  let suggestedKind: { kind: string; quote: string } | undefined;
  /*
    R-4 (10 Oct 2026): when a reading would have been offered but cannot be, say why, so the case
    page stops asking after every typing pause. "off": no model on this server. "capped": today's
    allowance is used. Absent when no reading applies or one was attempted.
  */
  let secondReading: "off" | "capped" | undefined;
  if (
    result.classification.kind === "UNKNOWN" &&
    !looksLikeReply &&
    !enforcement.notEnforcement &&
    assessNoticeAuthenticity(working).signals.length === 0 &&
    !hasD6Allegation(decodeText)
  ) {
    if (!isGeminiConfigured()) {
      secondReading = "off";
    } else {
      // R-5: a notice read before is answered from memory, without spending today's allowance.
      const key = readingKey(decodeText);
      const remembered = await getRememberedReading(key);
      if (remembered) {
        await countReading("remembered");
        if (remembered.kind !== "NONE" && remembered.end <= decodeText.length)
          suggestedKind = {
            kind: remembered.kind,
            quote: decodeText.slice(remembered.start, remembered.end),
          };
      } else if (await rateLimitDecodeAi(ip)) {
        const second = await classifyNotice(decodeText);
        if (second.ok) {
          suggestedKind = { kind: second.kind, quote: second.quote };
          const at = locateQuote(decodeText, second.quote);
          if (at) await rememberReading(key, { kind: second.kind, ...at });
          await countReading("proposed");
        } else {
          if (second.reason === "none") await rememberReading(key, { kind: "NONE" });
          await countReading(second.reason);
        }
      } else {
        secondReading = "capped";
        await countReading("capped");
      }
    }
  }

  return NextResponse.json({
    ...(suggestedKind ? { suggestedKind } : {}),
    ...(secondReading ? { secondReading } : {}),
    kind: result.classification.kind,
    confidence: result.classification.confidence,
    language: language.code,
    supported: true,
    /** The text that was decoded. Every `start`/`end` below is an offset into this string. */
    normalizedText: working,
    /*
      A date is only sent when it was counted from a date the notice itself carries.

      This used to null every `dueAt`, because the call above passed `new Date()` and a window
      counted from the moment of decoding must never be shown as the seller's deadline. That guard
      was right, but blunt: it also threw away a real date the notice stated in its own header, and
      the chip then said "Date not stated" beside a notice that plainly gives ninety days.

      Kept as a guard rather than dropped, now precise instead of blanket. `dueOn` is set only when
      the day comes from the notice — a date it states, or a length counted from its own header
      date — so a regression that reintroduced a made-up start date would still never reach the
      seller as a countdown.
    */
    deadlines: result.deadlines.map((deadline) => ({
      ...deadline,
      dueAt: deadline.dueOn ? deadline.dueAt : null,
    })),
    receivedOn: result.parsed.receivedOn,
    severityGated: isSeverityGated(result.classification.kind),
    // AA-39: the decision itself. Without this the free decoder can still only describe a notice,
    // which is the part Amazon's own Seller Assistant now does for nothing.
    responseType: {
      type: result.responseType.type,
      label: RESPONSE_TYPE_LABELS[result.responseType.type],
      reason: result.responseType.reason,
      competing: result.responseType.competing.map((t) => RESPONSE_TYPE_LABELS[t]),
      // Only the notice's own spans are meaningful to the caller; form-instruction matches carry
      // -1 offsets because the form text is not what the page is highlighting.
      matches: result.responseType.matches
        .filter((m) => m.start >= 0)
        .slice(0, 5)
        .map((m) => ({ ...m, start: m.start + offset, end: m.end + offset })),
    },
    // Capped so a pathological notice cannot return an unbounded payload.
    entities: entities.slice(0, 60),
    // #87: things worth checking before the seller acts on this message. Never a verdict — see
    // src/core/noticeAuthenticity.ts. Empty for the overwhelming majority of real notices.
    // Read over the whole paste, not only the message that was decoded: a lure in the other half of
    // a two-message paste is still in front of the seller.
    authenticity: assessNoticeAuthenticity(working).signals,
    // Shape checks (6 Oct 2026). Each is present only when it applies; `notes` carries the sentence
    // to show for every one of them, in the order they were found.
    ...(multipleNotices ? { multipleNotices: true } : {}),
    ...(damage.garbled ? { garbled: true, garbledRepaired } : {}),
    ...(enforcement.notEnforcement
      ? { notEnforcement: true, notEnforcementKind: enforcement.kind }
      : {}),
    ...(looksLikeReply ? { looksLikeReply } : {}),
    ...(businessDays !== null ? { statedBusinessDays: businessDays } : {}),
    ...(ambiguousReceipt ? { ambiguousReceipt } : {}),
    ...(idHints.length > 0 ? { idHints } : {}),
    notes,
  });
}
