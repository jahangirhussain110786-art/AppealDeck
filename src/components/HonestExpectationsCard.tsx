import Link from "next/link";
import {
  ClipboardCheck,
  FilePenLine,
  FileSearch,
  FolderOpen,
  Info,
  LockKeyhole,
  Send,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SHARED } from "@/content/shared";
import type { ExpectationItem } from "@/core/guidance";
import { IconTile } from "@/components/workspace/WorkspaceVisuals";

const ICONS: Record<ExpectationItem["kind"], LucideIcon> = {
  notice: FileSearch,
  records: FolderOpen,
  response: FilePenLine,
  review: ClipboardCheck,
  submit: Send,
  privacy: LockKeyhole,
};

export function HonestExpectationsCard({
  summary,
  weDo,
  weDoNot,
  whatToDo,
  severityNote,
  className,
}: {
  summary: string;
  weDo?: readonly ExpectationItem[];
  weDoNot?: readonly ExpectationItem[];
  whatToDo?: readonly string[];
  severityNote?: string;
  className?: string;
}) {
  const twoColumn = weDo !== undefined || weDoNot !== undefined;
  return (
    <section
      aria-label="How AppealDeck helps"
      className={cn(
        "overflow-hidden rounded-xl border border-border/80 bg-card shadow-card",
        className,
      )}
    >
      {twoColumn ? (
        <>
          <div className="workspace-hero flex items-center gap-4 border-b border-border/70 p-5 sm:px-6">
            <IconTile icon={ShieldCheck} />
            <div>
              <p className="text-eyebrow text-primary">{SHARED.expectations.eyebrow}</p>
              <h2 className="mt-1 tracking-[-0.03em] text-2xl font-semibold leading-tight text-foreground sm:text-3xl">
                {SHARED.expectations.title}
              </h2>
            </div>
          </div>
          <div className="grid sm:grid-cols-2">
            {[
              { title: SHARED.expectations.weDo, items: weDo ?? [], tone: "primary" as const },
              { title: SHARED.expectations.weDoNot, items: weDoNot ?? [], tone: "info" as const },
            ].map(({ title, items, tone }) => (
              <div
                key={title}
                className="p-5 even:border-t even:border-border/70 even:bg-surface-2/40 sm:p-6 sm:even:border-l sm:even:border-t-0"
              >
                <h3 className="mb-5 text-xs font-semiboldr text-muted-foreground">{title}</h3>
                <ul className="space-y-5">
                  {items.map((item) => (
                    <li key={item.kind} className="flex items-start gap-3">
                      <IconTile
                        icon={ICONS[item.kind]}
                        tone={tone}
                        className="size-9 [&>svg]:size-4"
                      />
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                        <p className="mt-1 max-w-prose text-sm leading-relaxed text-muted-foreground">
                          {item.description}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border/70 bg-surface-2/40 px-5 py-4 sm:px-6">
            <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden />
              {summary}
            </p>
            <Link
              href="/privacy"
              className="rounded-sm text-xs font-medium text-foreground underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              How your data is handled
            </Link>
          </div>
        </>
      ) : (
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-3">
            <IconTile icon={Info} tone="info" />
            <p className="text-sm leading-relaxed text-foreground">{summary}</p>
          </div>
          {whatToDo && (
            <ol className="mt-5 space-y-3">
              {whatToDo.map((step, i) => (
                <li key={step} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <span className="grid size-6 shrink-0 place-items-center rounded-md bg-surface-2 font-mono text-xs text-foreground">
                    {i + 1}
                  </span>
                  <p className="pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      {severityNote && (
        <p className="border-t border-border/70 bg-warning/5 px-5 py-4 text-sm text-foreground sm:px-6">
          {severityNote}
        </p>
      )}
    </section>
  );
}
