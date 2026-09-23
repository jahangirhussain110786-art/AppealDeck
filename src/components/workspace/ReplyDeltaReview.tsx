"use client";
import { ArrowRightLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { IconTile } from "./WorkspaceVisuals";
import {
  computeReplyDelta,
  type ReplyChange,
  type ReplyDeltaItem,
  type Workspace,
} from "@/core/workspace";
import { WORKSPACE as C } from "@/content/workspace";

/**
 * B-03: what an Amazon reply actually changes, shown before it is applied.
 *
 * Until 23 Sep 2026 "Use reply for a new revision" reset **every** requirement to needed, and the
 * seller redid their whole evidence review. The median real case is multi-round, so the product
 * destroyed the most work exactly where it promised to save the most. The spec has always asked
 * for this: "a new reply generates a proposed delta: what Amazon requested, what is already
 * covered, what conflicts and what task reopens. Confirm before applying; retain the old one."
 *
 * This writes nothing and decides nothing. It groups the seller's own requirements by what the
 * reply does to them, quotes Amazon's sentence wherever the reply raised one, and stops.
 */

/** Reopened first: it is the only group that costs the seller work on this round. */
const ORDER: ReplyChange[] = ["reopened", "added", "outstanding", "carried"];

const TONE: Record<ReplyChange, "warning" | "info" | "secondary" | "success"> = {
  reopened: "warning",
  added: "info",
  outstanding: "secondary",
  carried: "success",
};

export function ReplyDeltaReview({
  workspace,
  replyId,
}: {
  workspace: Workspace;
  replyId: string;
}) {
  const delta = computeReplyDelta(workspace, replyId);
  if (!delta) return null;

  const groups = ORDER.map((change) => ({
    change,
    items: delta.items.filter((i) => i.change === change),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-1 p-4">
      <div className="flex items-start gap-3">
        <IconTile icon={ArrowRightLeft} tone="info" />
        <div>
          <p className="text-sm font-medium text-foreground">{C.replyDelta.title}</p>
          <p className="text-xs text-muted-foreground">{C.replyDelta.help}</p>
        </div>
      </div>
      {groups.length === 0 ? (
        <p className="text-sm text-muted-foreground">{C.replyDelta.none}</p>
      ) : (
        groups.map((group) => (
          <div key={group.change} className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={TONE[group.change]} size="sm">
                {C.replyDelta[group.change].label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {C.replyDelta[group.change].help}
              </span>
            </div>
            <ul className="space-y-1.5">
              {group.items.map((item) => (
                <ReplyDeltaRow key={item.requirement.id} item={item} />
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}

function ReplyDeltaRow({ item }: { item: ReplyDeltaItem }) {
  return (
    <li className="rounded-row border border-border/60 bg-surface-2 px-3 py-2 text-sm">
      <p className="font-medium text-foreground">{item.requirement.label}</p>
      {item.requirement.filename && (
        <p className="font-mono text-xs text-muted-foreground">{item.requirement.filename}</p>
      )}
      {/* Amazon's own sentence, verbatim — the same rule the rest of this model follows. */}
      {item.replyQuote && (
        <p className="mt-1 text-xs italic text-muted-foreground">“{item.replyQuote}”</p>
      )}
    </li>
  );
}
