"use client";

import { useEffect, useState } from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { SHARED } from "@/content/shared";

/**
 * Inline notice shown only while the browser reports no connection.
 * State starts as "online" so the server render and the first client render match;
 * the real value is read from navigator.onLine in an effect.
 */
export function OfflineNotice({ className }: { className?: string }) {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setOnline(navigator.onLine);
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

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
