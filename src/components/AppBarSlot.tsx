"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * The app's top bar (v5, 26 Sep 2026) belongs to the shell, but what it says belongs to the page:
 * the case page names its case there and shows whether the case is saved, the way the prototype
 * does. The shell renders two empty targets and a page fills them through this portal, so the bar
 * stays one element instead of every page drawing its own copy of it.
 *
 * Nothing renders until the target exists, which is after the first paint on the client; the bar
 * is a label and a status line, never the only place something important is said.
 */
export type AppBarTarget = "title" | "actions";

export const APP_BAR_IDS: Record<AppBarTarget, string> = {
  title: "app-bar-title",
  actions: "app-bar-actions",
};

const noop = () => () => {};

export function AppBarSlot({ target, children }: { target: AppBarTarget; children: ReactNode }) {
  const node = useSyncExternalStore(
    noop,
    () => document.getElementById(APP_BAR_IDS[target]),
    () => null,
  );
  return node ? createPortal(children, node) : null;
}
