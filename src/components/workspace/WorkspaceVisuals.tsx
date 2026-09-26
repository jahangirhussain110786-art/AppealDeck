import type { ReactNode } from "react";
import {
  ChevronDown,
  FilePenLine,
  FolderOpen,
  History,
  LayoutDashboard,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
