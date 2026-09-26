import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeadlineChipList } from "@/components/DeadlineChip";
import { MarkedNotice, type NoticeSpan } from "@/components/MarkedNotice";
import { runDecode, RESPONSE_TYPE_LABELS } from "@/core";
import { assessNoticeAuthenticity } from "@/core/noticeAuthenticity";
import { HOME, DECODE } from "@/content/marketing";
import { SAMPLE_NOTICE_TEXT } from "@/content/sampleNotice";

/**
 * The first feature panel on the home page. Not a picture of a decode: the sample notice is run
 * through the same `runDecode` the `/api/decode` route uses, at render time, so the front page
 * can never show a result the product would not produce (the rule from the 26 Sep hero demo,
 * kept when v5 moved the demo into the feature switcher).
 *
 * Deadlines follow the route's rule exactly: a countdown only when the day comes from the notice
 * itself (`dueOn`); a window with no stated start is described, not counted.
 */
export function DecodePanel() {
  const text = SAMPLE_NOTICE_TEXT;
  const result = runDecode(text, {});
  const label = RESPONSE_TYPE_LABELS[result.responseType.type];
  const deadlines = result.deadlines.map((d) => ({ ...d, dueAt: d.dueOn ? d.dueAt : null }));
  const spans: NoticeSpan[] = [
    ...result.responseType.matches
      .filter((m) => m.start >= 0)
      .slice(0, 5)
      .map((m) => ({ start: m.start, end: m.end, tone: "risk" as const, title: label })),
    ...result.entities
      .filter((e) => e.kind === "requested_record")
      .map((e) => ({ start: e.start, end: e.end, tone: "clear" as const, title: e.value })),
  ];
  const demo = HOME.demo;
  const flagged = assessNoticeAuthenticity(text).signals.length > 0;

  return (
    <div className="grid items-start gap-4 md:grid-cols-[1.1fr_0.9fr]">
      <div className="rounded-2xl bg-card p-5 shadow-lift">
        <div className="mb-3 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">{demo.noticeEyebrow}</p>
          <Badge variant="info" size="sm">
            {DECODE.sampleBadge}
          </Badge>
        </div>
        <MarkedNotice
          text={text}
          spans={spans}
          label={demo.noticeEyebrow}
          className="max-h-72 overflow-y-auto pr-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-3">
        <div className="rounded-2xl bg-card p-5 shadow-lift">
          <p className="text-xs text-muted-foreground">{demo.askingFor}</p>
          <p className="mt-1 text-lg font-semibold leading-snug tracking-tight text-foreground">
            {label}
          </p>
        </div>
        <div className="rounded-2xl bg-card p-5 shadow-lift">
          <p className="mb-2 text-xs text-muted-foreground">{demo.whenDue}</p>
          {deadlines.length > 0 ? (
            <DeadlineChipList deadlines={deadlines} />
          ) : (
            <p className="text-sm text-muted-foreground">{DECODE.result.noDeadline}</p>
          )}
        </div>
        {/* v5: the scam check, run on the same sample text, exactly as /decode runs it. */}
        <div className="flex items-center gap-3 rounded-2xl bg-card px-5 py-4 shadow-lift">
          <span
            aria-hidden
            className={
              flagged
                ? "grid size-9 place-items-center rounded-xl bg-warning/15"
                : "grid size-9 place-items-center rounded-xl bg-success/15"
            }
          >
            <ShieldCheck className={flagged ? "size-4 text-warning" : "size-4 text-success"} />
          </span>
          <span>
            <span className="block text-xs text-muted-foreground">{DECODE.result.factScam}</span>
            <span className="block font-semibold text-foreground">
              {flagged ? DECODE.result.factScamFlagged : DECODE.result.factScamClear}
            </span>
          </span>
        </div>
        <p className="px-1 text-xs text-muted-foreground">{demo.readFromText}</p>
      </div>
    </div>
  );
}
