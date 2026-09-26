import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeadlineChipList } from "@/components/DeadlineChip";
import { MarkedNotice, type NoticeSpan } from "@/components/MarkedNotice";
import { runDecode, RESPONSE_TYPE_LABELS } from "@/core";
import { proposedRequirements } from "@/core/workspace";
import { HOME } from "@/content/marketing";
import { DECODE } from "@/content/marketing";
import { WORKSPACE } from "@/content/workspace";
import { SAMPLE_NOTICE_TEXT } from "@/content/sampleNotice";

/**
 * The product as the hero (26 Sep 2026, from the prototype). This is not a picture of a decode:
 * the sample notice is run through the same `runDecode` the `/api/decode` route uses, at render
 * time, and what appears on the right is that result. If the decoder changes, the home page
 * changes with it, so the front page can never show a result the product would not produce.
 *
 * Deadline dates follow the route's rule exactly: a countdown is shown only when the day comes
 * from the notice itself (`dueOn`); a window with no stated start is described, not counted.
 */
export function HeroDecoderDemo() {
  const text = SAMPLE_NOTICE_TEXT;
  const result = runDecode(text, {});
  const label = RESPONSE_TYPE_LABELS[result.responseType.type];
  const deadlines = result.deadlines.map((d) => ({ ...d, dueAt: d.dueOn ? d.dueAt : null }));
  const records = proposedRequirements(
    { notice: text, formInstructions: "", revision: 1 },
    result.classification.kind,
  );
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

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
      <div className="grid lg:grid-cols-2">
        <div className="flex flex-col gap-4 border-b border-border p-5 sm:p-7 lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3">
            <p className="text-eyebrow uppercase text-muted-foreground">{demo.noticeEyebrow}</p>
            <Badge variant="info" size="sm">
              {DECODE.sampleBadge}
            </Badge>
          </div>
          <MarkedNotice
            text={text}
            spans={spans}
            label={demo.noticeEyebrow}
            className="max-h-[26rem] overflow-y-auto pr-2"
          />
          <Link
            href="/decode"
            className="rounded-md border border-dashed border-input px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {demo.pasteYourOwn}
          </Link>
        </div>

        <div className="flex flex-col gap-5 p-5 sm:p-7">
          <div className="flex items-center justify-between gap-3">
            <p className="text-eyebrow uppercase text-muted-foreground">{demo.resultEyebrow}</p>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
              <Check className="size-3.5" aria-hidden />
              {demo.readFromText}
            </span>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{demo.askingFor}</p>
            <p className="mt-1 text-h3 leading-tight text-foreground sm:text-[1.75rem]">{label}</p>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {result.responseType.reason}
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <p className="text-xs text-muted-foreground">{demo.whenDue}</p>
            <div className="mt-2">
              {deadlines.length > 0 ? (
                <DeadlineChipList deadlines={deadlines} />
              ) : (
                <p className="text-sm text-muted-foreground">{DECODE.result.noDeadline}</p>
              )}
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{demo.recordsTitle}</p>
            <ol className="hairline-rows mt-2">
              {records.slice(0, 4).map((record, i) => (
                <li key={record.label} className="flex items-center gap-3 py-2.5 text-sm">
                  <span
                    aria-hidden
                    className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 font-mono text-xs text-primary"
                  >
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 font-medium text-foreground">{record.label}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {record.source === "matrix"
                      ? WORKSPACE.inferred.badge
                      : DECODE.result.recordsAsked}
                  </span>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-auto flex flex-wrap gap-3 pt-2">
            <Button asChild size="lg">
              <Link href="/decode">
                {demo.primaryCta}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/decode">{demo.secondaryCta}</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
