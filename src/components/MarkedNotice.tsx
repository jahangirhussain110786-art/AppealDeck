import { cn } from "@/lib/utils";

export interface NoticeSpan {
  start: number;
  end: number;
  /** `risk`: a phrase that decided the response or the clock. `clear`: a record the seller must supply. */
  tone: "risk" | "clear";
  /** Read by assistive tech as the reason the phrase is marked. */
  title?: string;
}

/**
 * The seller's own notice, with the phrases the decoder acted on marked in place (26 Sep 2026,
 * from the prototype's "notice, marked up" panel). Every span is an offset into the real text —
 * `entities.ts` and `responseType.ts` guarantee `raw.slice(start, end)` is source text — so a mark
 * can never sit on words the notice does not contain. Overlapping spans keep the first by start
 * offset and drop the rest, so the text is never duplicated or cut.
 */
export function MarkedNotice({
  text,
  spans,
  className,
  label,
}: {
  text: string;
  spans: readonly NoticeSpan[];
  className?: string;
  /** Names the region for keyboard users: the panel scrolls, so it is focusable. */
  label: string;
}) {
  const ordered = [...spans]
    .filter((s) => s.start >= 0 && s.end > s.start && s.end <= text.length)
    .sort((a, b) => a.start - b.start);
  const parts: React.ReactNode[] = [];
  let cursor = 0;
  for (const span of ordered) {
    if (span.start < cursor) continue;
    if (span.start > cursor) parts.push(text.slice(cursor, span.start));
    parts.push(
      <mark
        key={`${span.start}-${span.end}`}
        className={span.tone === "risk" ? "hl-risk" : "hl-clear"}
        title={span.title}
      >
        {text.slice(span.start, span.end)}
      </mark>,
    );
    cursor = span.end;
  }
  if (cursor < text.length) parts.push(text.slice(cursor));
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className={cn(
        "whitespace-pre-wrap break-words rounded-md text-[0.9375rem] leading-relaxed text-foreground/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
    >
      {parts}
    </div>
  );
}
