// In-memory bridge from the home page's paste tool to /decode (v5, 26 Sep 2026). Like
// pendingNotice.ts, the hand-off is never written to the URL: it lives in this
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

/*
  Back-button memory (6 Oct 2026). Going from the result to "Open case workspace" and pressing Back
  left /decode empty: the module variable above does not survive a navigation back, and the seller
  had to find and paste the notice again. The pasted text is now also kept in sessionStorage, which
  belongs to this tab and is gone when the tab closes; it is cleared by the Clear / Decode another
  buttons. Every access is guarded, because storage can be unavailable or full.
*/
const SESSION_KEY = "appealdeck.decode.paste";

export type SessionPaste = { text: string; decoded: boolean };

/**
 * The paste is remembered only so that Back from "Open case workspace" can bring it back. It is
 * restored once, and only when the seller actually left for a case from this page. A fresh visit
 * to /decode (typing the address, a new tab, a later return) starts empty instead of silently
 * refilling an old notice.
 *
 * Two routes back, because Back can mean two things: inside the app the page and this module
 * survive, so the paste is held in memory; after a browser Back to a page that had to reload, the
 * tab's own copy is read, but only when the browser says this navigation is a back/forward one.
 */
let leavingPaste: SessionPaste | undefined;

export function saveSessionPaste(text: string, decoded = false): void {
  try {
    if (!text.trim()) {
      window.sessionStorage.removeItem(SESSION_KEY);
      return;
    }
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ text, decoded, leaving: false }));
  } catch {
    // Storage unavailable: the page works the same, only Back forgets the paste.
  }
}

/** Called when the seller follows a link from the result into a case: this paste may come back. */
export function markSessionPasteLeaving(): void {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<SessionPaste> & { leaving?: boolean };
    if (typeof parsed.text !== "string" || !parsed.text.trim()) return;
    leavingPaste = { text: parsed.text, decoded: parsed.decoded === true };
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ ...parsed, leaving: true }));
  } catch {
    // Nothing to mark.
  }
}

function isBackForwardNavigation(): boolean {
  try {
    const entry = window.performance?.getEntriesByType?.("navigation")?.[0] as
      PerformanceNavigationTiming | undefined;
    return entry?.type === "back_forward";
  } catch {
    return false;
  }
}

/** Reads the remembered paste and forgets it, so it is only ever restored once. */
export function loadSessionPaste(): SessionPaste | undefined {
  const inMemory = leavingPaste;
  leavingPaste = undefined;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (raw) window.sessionStorage.removeItem(SESSION_KEY);
    if (inMemory) return inMemory;
    if (!raw || !isBackForwardNavigation()) return undefined;
    const parsed = JSON.parse(raw) as Partial<SessionPaste> & { leaving?: boolean };
    if (parsed.leaving !== true) return undefined;
    if (typeof parsed.text !== "string" || !parsed.text.trim()) return undefined;
    return { text: parsed.text, decoded: parsed.decoded === true };
  } catch {
    return inMemory;
  }
}

export function clearSessionPaste(): void {
  leavingPaste = undefined;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // Nothing to clear.
  }
}
