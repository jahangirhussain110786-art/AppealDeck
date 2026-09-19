// In-memory bridge for client-side navigation: never persist raw notices in browser storage.
import type { SerializedDeadline } from "@/core";
import type { DeadlineLike } from "@/components/DeadlineChip";

export type PendingNotice = { text: string; deadlines: SerializedDeadline[] };
let pending: PendingNotice | undefined;
export function stashPendingNotice(text: string, deadlines: readonly DeadlineLike[] = []): void {
  pending = {
    text,
    deadlines: deadlines.map((d) => ({
      ...d,
      dueAt: d.dueAt ? new Date(d.dueAt).toISOString() : null,
    })),
  };
}
export function peekPendingNotice(): PendingNotice | undefined {
  return pending;
}
export function clearPendingNotice(saved: PendingNotice): void {
  if (pending === saved) pending = undefined;
}
