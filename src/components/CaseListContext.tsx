"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CaseSummary } from "@/lib/caseSummary";

/**
 * The sidebar's list of cases (v5, 26 Sep 2026). The cases live in the seller's encrypted vault,
 * and only a page that has already opened the vault can read them, so the sidebar never opens it
 * itself: the dashboard and the case page publish what they read, with a way to switch to another
 * case, and the sidebar shows it. On a page that has not read the vault the list keeps the last
 * one published, and a case links to the dashboard instead.
 */
interface CaseList {
  cases: CaseSummary[] | null;
  open: ((id: string) => Promise<void>) | null;
}

const Ctx = createContext<{
  list: CaseList;
  publish: (list: CaseList) => void;
}>({ list: { cases: null, open: null }, publish: () => {} });

export function CaseListProvider({ children }: { children: ReactNode }) {
  const [list, publish] = useState<CaseList>({ cases: null, open: null });
  const value = useMemo(() => ({ list, publish }), [list]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCaseList(): CaseList {
  return useContext(Ctx).list;
}

/** Publishes a page's cases to the sidebar while that page is open. */
export function usePublishCases(
  cases: CaseSummary[] | null,
  open: ((id: string) => Promise<void>) | null,
): void {
  const { publish } = useContext(Ctx);
  useEffect(() => {
    if (!cases) return;
    publish({ cases, open });
    return () => publish({ cases, open: null });
  }, [cases, open, publish]);
}
