"use client";

import { useSyncExternalStore } from "react";
import { PARTNER_CODE_EVENT, readPartnerCode } from "@/lib/partnerCode";

function subscribe(onChange: () => void) {
  window.addEventListener(PARTNER_CODE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(PARTNER_CODE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The partner code still inside its 60 days; null on the server and on first paint. */
export function usePartnerCode(): string | null {
  return useSyncExternalStore(
    subscribe,
    () => readPartnerCode(),
    () => null,
  );
}
