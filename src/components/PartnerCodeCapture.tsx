"use client";

import { useEffect } from "react";
import { rememberPartnerCode } from "@/lib/partnerCode";

/**
 * Says nothing on screen. When a page is opened with `?ref=CODE`, keeps the code on this device for
 * 60 days (see `src/lib/partnerCode.ts`). Mounted once in the root layout so a link to any page works.
 * It reads the address directly rather than through `useSearchParams`, which would force every page
 * under the layout to wait for the client.
 */
export function PartnerCodeCapture(): null {
  useEffect(() => {
    try {
      const ref = new URLSearchParams(window.location.search).get("ref");
      if (ref) rememberPartnerCode(ref);
    } catch {
      // an address that cannot be read: no code, nothing breaks
    }
  }, []);
  return null;
}
