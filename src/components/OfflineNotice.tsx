"use client";

import { useSyncExternalStore } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SHARED } from "@/content/shared";

function subscribe(onChange: () => void): () => void {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

/**
 * Inline notice shown only while the browser reports no connection.
 * Read with useSyncExternalStore: the server snapshot is "online", so the server render and the
 * first client render match, and the browser's real value takes over without an extra effect.
 */
export function OfflineNotice({ className }: { className?: string }) {
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  if (online) return null;

  return (
    <Alert variant="warning" role="status" className={className}>
      <div>
        <AlertTitle>{SHARED.offline.title}</AlertTitle>
        <AlertDescription>{SHARED.offline.desc}</AlertDescription>
      </div>
    </Alert>
  );
}
