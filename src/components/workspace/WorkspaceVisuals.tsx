import type { ReactNode } from "react";
import {
  Check,
  ChevronDown,
  Circle,
  Clock,
  MinusCircle,
  FilePenLine,
  FolderOpen,
  History,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

export const VIEW_ICONS: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  evidence: FolderOpen,
  response: FilePenLine,
  history: History,
};

// v5 (26 Sep 2026): a neutral tile with a fine ring, as in the prototype's gather rows and file
// table; only the icon carries the tone, so a page of tiles no longer reads as a colour chart.
const tones = {
  primary: "bg-surface-2 text-primary ring-border",
  info: "bg-surface-2 text-info ring-border",
  warning: "bg-surface-2 text-warning ring-border",
};

export function IconTile({
  icon: Icon,
  tone = "primary",
  className,
}: {
  icon: LucideIcon;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-[10px] ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      <Icon className="size-5" aria-hidden />
    </span>
  );
}

/** Native disclosure: keyboard accessible, no extra client state, and content stays available. */
export function DetailDisclosure({
  title,
  children,
  className,
  open,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  open?: boolean;
}) {
  return (
    <details
      className={cn("group rounded-lg border border-border/70 bg-surface-1/70", className)}
      open={open}
    >
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg px-4 py-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180 motion-reduce:transition-none"
          aria-hidden
        />
      </summary>
      <div className="px-4 pb-4 text-sm leading-relaxed text-muted-foreground">{children}</div>
    </details>
  );
}

const STRIP_STATUS = {
  reviewed: { icon: Check, tone: "text-success", label: "Reviewed" },
  needed: { icon: Circle, tone: "text-muted-foreground", label: "To add" },
  waiting: { icon: Clock, tone: "text-warning", label: "Waiting" },
  cannot_obtain: { icon: MinusCircle, tone: "text-warning", label: "Can't get it" },
} as const;

/**
 * The whole document list at a glance: a bar for how far along, one chip per record with its state
 * as an icon and a word (never colour alone). A tap opens that record's card.
 */
export function DocumentStrip({
  items,
  activeId,
  onSelect,
}: {
  items: { id: string; label: string; status: keyof typeof STRIP_STATUS }[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const done = items.filter((i) => i.status === "reviewed" || i.status === "cannot_obtain").length;
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Progress
          value={Math.round((done / Math.max(items.length, 1)) * 100)}
          aria-label={`${done} of ${items.length} documents ready`}
          className="h-2.5"
        />
        <span className="shrink-0 text-sm font-medium tabular-nums">
          {done}/{items.length}
        </span>
      </div>
      <ul className="flex flex-wrap gap-2">
        {items.map((item) => {
          const s = STRIP_STATUS[item.status] ?? STRIP_STATUS.needed;
          const Icon = s.icon;
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={activeId === item.id ? "true" : undefined}
                className={cn(
                  "inline-flex min-h-9 max-w-[16rem] items-center gap-1.5 rounded-full px-3 text-sm ring-1 ring-inset ring-border transition-colors hover:bg-surface-2",
                  activeId === item.id && "bg-surface-2 font-medium ring-primary",
                )}
              >
                <Icon className={cn("size-4 shrink-0", s.tone)} aria-hidden />
                <span className="truncate">
                  {item.label}
                  <span className="sr-only"> — {s.label}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
