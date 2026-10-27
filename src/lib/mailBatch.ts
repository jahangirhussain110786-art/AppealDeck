/**
 * Shared shape of the mail cron jobs (27 Oct 2026 audit): each run has a time budget and sends a few
 * emails at once instead of one by one.
 *
 * The jobs run inside a 60-second function limit. Up to 200 emails sent serially, each allowed a
 * 5-second provider timeout, can need far longer than that, and a run killed part-way delays every
 * later row to the next day. Now a run stops starting new work once its budget is spent (the rows it
 * did not reach are untouched and go first next time) and sends several at once.
 */

/** Leaves the rest of the 60-second limit for the work already in flight and the response. */
export const RUN_BUDGET_MS = 40_000;
/** Emails in flight at once: a clear speed-up, and well under any provider's concurrency limit. */
export const SEND_CONCURRENCY = 5;

export interface BatchResult {
  /** Items whose handler was started. */
  started: number;
  /** Items left alone because the time budget ran out first. */
  unreached: number;
}

/**
 * Runs `handle` over `items`, at most `concurrency` at a time, and starts no new item once `now()`
 * has passed `deadline`. Items already started always finish. Handlers must not throw: an item's
 * failure is its own business, and one failure must never stop the others.
 */
export async function runBatch<T>(
  items: readonly T[],
  handle: (item: T) => Promise<void>,
  options: { deadline: number; concurrency?: number; now?: () => number },
): Promise<BatchResult> {
  const now = options.now ?? Date.now;
  const width = Math.max(1, Math.min(options.concurrency ?? SEND_CONCURRENCY, items.length));
  let next = 0;
  let started = 0;
  const worker = async () => {
    while (next < items.length && now() < options.deadline) {
      const item = items[next++] as T;
      started++;
      await handle(item);
    }
  };
  await Promise.all(Array.from({ length: width }, worker));
  return { started, unreached: items.length - started };
}
