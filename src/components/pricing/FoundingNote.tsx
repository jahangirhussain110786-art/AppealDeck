"use client";

import { useEffect, useState } from "react";
import { PRICING } from "@/content/marketing";

type Count = { spotsLeft: number | null; total: number | null };

/**
 * The founding offer on the Account Pass: "N of 25 left", read from /api/founding using the configured
 * discount's actual redemption count. It shows nothing until the count has arrived and nothing at all when the offer
 * is off, sold out or the count cannot be read, so it never claims a spot that may not exist.
 */
export function FoundingNote({ className }: { className?: string }) {
  const [count, setCount] = useState<Count | null>(null);
  useEffect(() => {
    let alive = true;
    fetch("/api/founding")
      .then((r) => (r.ok ? (r.json() as Promise<Count>) : null))
      .then((data) => {
        if (alive && data) setCount(data);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);
  if (!count || count.spotsLeft === null || count.total === null || count.spotsLeft <= 0)
    return null;
  const f = PRICING.account.founding;
  return (
    <div className={className} data-testid="founding-note" role="status" aria-label={f.title}>
      <p className="text-sm font-semibold text-primary">
        {f.title}: {f.price}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {f.body.replace("{total}", String(count.total))}{" "}
        <span className="font-medium text-foreground tabular-nums">
          {f.left
            .replace("{left}", String(count.spotsLeft))
            .replace("{total}", String(count.total))}
          .
        </span>
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{f.partnerNote}</p>
    </div>
  );
}
