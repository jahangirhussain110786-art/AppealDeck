"use client";

import { useEffect } from "react";

/**
 * Names the browser tab for as long as it is on screen, then puts the previous name back (G-60).
 * Someone with five cases open in five tabs needs the tab to say which case it is. Renders nothing.
 */
export function TabTitle({ title }: { title: string }) {
  useEffect(() => {
    const before = document.title;
    document.title = `${title} · AppealDeck`;
    return () => {
      document.title = before;
    };
  }, [title]);
  return null;
}
