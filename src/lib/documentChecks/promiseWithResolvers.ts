/**
 * `Promise.withResolvers`, for browsers that lack it (30 Sep 2026).
 *
 * pdf.js calls it unguarded, in both its page code and its worker. Chrome added it in 119 and
 * Safari in 17.4, while the site itself supports browsers back to Safari 16.4, so on those the
 * on-device reading failed with "Promise.withResolvers is not a function" and the seller was told
 * only that we "could not make out" their document. Neither pdf.js build polyfills it (the legacy
 * one does not either: checked, by removing the function and importing each).
 *
 * This covers the page. The worker is a separate realm that no page script can patch, so
 * `scripts/copy-reader-assets.mjs` writes the same few lines beside pdf.js's worker and serves a
 * wrapper that loads them first. Keep the two in step.
 */
export function ensurePromiseWithResolvers(): void {
  const target = Promise as unknown as { withResolvers?: unknown };
  if (typeof target.withResolvers === "function") return;
  target.withResolvers = function withResolvers<T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}
