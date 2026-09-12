import { parseNotice } from "@/core";
import type { ViolationKind } from "@/core";

export type AnnotationTag = "risky" | "clear";

export interface NoticeAnnotation {
  id: string;
  tag: AnnotationTag;
  start: number;
  end: number;
  matchedText: string;
  heading: string;
  body: string;
}

export interface AnnotationCopy {
  unverifiableClaims: string;
  legacyWindow: string;
  ambiguousWindow: string;
  statedWindow: string;
  clearStructure: string;
}

function findFirst(re: RegExp, raw: string): { start: number; end: number; text: string } | null {
  const m = re.exec(raw);
  if (!m) return null;
  return { start: m.index, end: m.index + m[0].length, text: m[0] };
}

/**
 * Builds "what this means" annotation cards from phrases actually present in the
 * seller's own pasted notice (AM-22/V5, per Decode.dc.html). Every match is a real
 * substring of `raw`, located with the same intent as the regexes in
 * `src/core/noticeParser.ts` (re-applied here only to find a displayable span, not to
 * reclassify anything) -- this never invents a phrase, a deadline, or a policy claim
 * that isn't already in the text in front of the seller (D6).
 *
 * Degrades to fewer cards, never fabricated filler, when a given pattern isn't found --
 * the same "no filler" call this pass's mockup fixes already made for Decode.dc.html.
 */
export function buildNoticeAnnotations(
  raw: string,
  kind: ViolationKind,
  copy: AnnotationCopy,
): NoticeAnnotation[] {
  const parsed = parseNotice(raw);
  const out: NoticeAnnotation[] = [];

  if (kind === "INAUTHENTIC_DOCUMENTS" || parsed.kindHints.includes("INAUTHENTIC_DOCUMENTS")) {
    const m = findFirst(
      /inauthentic|not authentic|could not verify|documentation we could not verify/i,
      raw,
    );
    if (m) {
      out.push({
        id: "unverifiable-claims",
        tag: "risky",
        start: m.start,
        end: m.end,
        matchedText: m.text,
        heading: `"${m.text}"`,
        body: copy.unverifiableClaims,
      });
    }
  }

  if (parsed.legacySeventeenDay) {
    const m = findFirst(/17\s*days?/i, raw);
    if (m) {
      out.push({
        id: "legacy-window",
        tag: "risky",
        start: m.start,
        end: m.end,
        matchedText: m.text,
        heading: `"${m.text}" — verify this window is still current`,
        body: copy.legacyWindow,
      });
    }
  } else if (parsed.windowAmbiguous) {
    const m = findFirst(
      /appeal window shown in your[^.]*|verify in your notice[^.]*|may be closed/i,
      raw,
    );
    if (m) {
      out.push({
        id: "ambiguous-window",
        tag: "risky",
        start: m.start,
        end: m.end,
        matchedText: m.text,
        heading: "This notice doesn't state a fixed window",
        body: copy.ambiguousWindow,
      });
    }
  } else if (parsed.statedWindowDays !== null) {
    const m = findFirst(/\d+\s*days?/i, raw);
    if (m) {
      out.push({
        id: "stated-window",
        tag: "clear",
        start: m.start,
        end: m.end,
        matchedText: m.text,
        heading: `"${m.text}" — this notice's own window`,
        body: copy.statedWindow,
      });
    }
  }

  const structureMatch = findFirst(/root cause/i, raw);
  if (structureMatch) {
    out.push({
      id: "clear-structure",
      tag: "clear",
      start: structureMatch.start,
      end: structureMatch.end,
      matchedText: structureMatch.text,
      heading: "This part is clear",
      body: copy.clearStructure,
    });
  }

  const sorted = [...out].sort((a, b) => a.start - b.start);
  const nonOverlapping: NoticeAnnotation[] = [];
  let lastEnd = -1;
  for (const a of sorted) {
    if (a.start >= lastEnd) {
      nonOverlapping.push(a);
      lastEnd = a.end;
    }
  }
  return nonOverlapping.slice(0, 3);
}

export interface NoticeSegment {
  text: string;
  tag: AnnotationTag | null;
}

/** Splits `raw` into plain and highlighted segments for inline rendering. */
export function segmentNoticeText(raw: string, annotations: NoticeAnnotation[]): NoticeSegment[] {
  const spans = [...annotations].sort((a, b) => a.start - b.start);
  const segments: NoticeSegment[] = [];
  let cursor = 0;
  for (const s of spans) {
    if (s.start > cursor) segments.push({ text: raw.slice(cursor, s.start), tag: null });
    segments.push({ text: raw.slice(s.start, s.end), tag: s.tag });
    cursor = s.end;
  }
  if (cursor < raw.length) segments.push({ text: raw.slice(cursor), tag: null });
  return segments;
}
