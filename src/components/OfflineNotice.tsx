"use client";

import { useEffect } from "react";
import { toast } from "sonner";
import { SHARED } from "@/content/shared";

export function OfflineNotice() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const update = () => {
      if (!navigator.onLine) {
        toast.warning(SHARED.offlineNotice.title, {
          description: SHARED.offlineNotice.description,
          duration: Infinity,
          id: "offline-toast",
        });
      } else {
        toast.dismiss("offline-toast");
      }
    };

    window.addEventListener("online", update);
    window.addEventListener("offline", update);

    if (!navigator.onLine) {
      update();
    }

    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  return null;
}
