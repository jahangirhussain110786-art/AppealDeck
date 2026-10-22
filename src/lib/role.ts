"use client";

import { useSyncExternalStore } from "react";

/**
 * What brings a visitor here (22 Oct 2026): a seller with an account problem, a professional who
 * writes appeals for clients, or someone who sends sellers to good tools. It only changes which
 * pricing page is shown first. It never hides a page, never gates a feature, and is held on the
 * visitor's own device: nothing about it is sent to AppealDeck, so it is not personal data we hold.
 */
export const ROLES = ["seller", "pro", "partner"] as const;
export type Role = (typeof ROLES)[number];

export const ROLE_KEY = "appealdeck.role";
const ROLE_EVENT = "appealdeck:role";

export function parseRole(raw: unknown): Role | null {
  return typeof raw === "string" && (ROLES as readonly string[]).includes(raw)
    ? (raw as Role)
    : null;
}

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function readRole(store: Storage | null = storage()): Role | null {
  try {
    return parseRole(store?.getItem(ROLE_KEY));
  } catch {
    return null;
  }
}

/** Remember the role, or forget it with null. Tells every mounted component on the page. */
export function writeRole(role: Role | null, store: Storage | null = storage()): void {
  try {
    if (role) store?.setItem(ROLE_KEY, role);
    else store?.removeItem(ROLE_KEY);
  } catch {
    // Blocked storage: the choice just is not remembered.
  }
  if (typeof window !== "undefined") window.dispatchEvent(new Event(ROLE_EVENT));
}

function subscribe(onChange: () => void) {
  window.addEventListener(ROLE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(ROLE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The remembered role; null on the server and on first paint, so the page never mismatches. */
export function useRole(): Role | null {
  return useSyncExternalStore(
    subscribe,
    () => readRole(),
    () => null,
  );
}

/** The pricing page for a role. */
export const ROLE_HOME: Record<Role, string> = {
  seller: "/pricing",
  pro: "/for-professionals",
  partner: "/partners",
};
