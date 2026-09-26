// In-memory bridge from the home page's paste tool to /decode (v5, 26 Sep 2026). Like
// pendingNotice.ts, a raw notice is never written to browser storage or the URL: it lives in this
// module for one client-side navigation, is read when /decode first renders, and is cleared once
// the decode starts.
export type DecodeDraft = { text: string; sample: boolean };

let draft: DecodeDraft | undefined;

export function stashDecodeDraft(text: string, sample = false): void {
  draft = { text, sample };
}

/** Read without consuming, so a render (which may run twice in development) can use it. */
export function peekDecodeDraft(): DecodeDraft | undefined {
  return draft;
}

export function clearDecodeDraft(): void {
  draft = undefined;
}
