import { useEffect, useSyncExternalStore } from "react";

/**
 * What the visitor is doing right now, as one short key such as "decode.reading" (see `SITUATIONS` in
 * `src/content/guide.ts`). A page that knows its own state says so with `useGuideSituation`, and Dex in
 * the corner changes his line, his mood and, now and then, a small gesture. The page owns the state;
 * Dex only listens, and drops back to the page's own line when the page stops saying anything.
 */
let current: string | null = null;
const listeners = new Set<() => void>();

function set(key: string | null) {
  if (key === current) return;
  current = key;
  listeners.forEach((l) => l());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  return () => {
    listeners.delete(onChange);
  };
}

/** Called by a page: this is the situation while the page is on screen. Pass null for "nothing special". */
export function useGuideSituation(key: string | null) {
  useEffect(() => {
    set(key);
  }, [key]);
  // When the page goes away, so does what it said.
  useEffect(() => () => set(null), []);
}

/** A component that says nothing on screen and only reports a situation, for pages that cannot call a hook early. */
export function GuideSignal({ situation }: { situation: string | null }): null {
  useGuideSituation(situation);
  return null;
}

/** Called by Dex: the situation now, or null. */
export function useCurrentSituation(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => null,
  );
}
