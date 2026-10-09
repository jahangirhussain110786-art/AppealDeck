"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WORKSPACE as C } from "@/content/workspace";
import { APP } from "@/content/app";
import { isViolationKind, type ViolationKind } from "@/core/violationKinds";

/**
 * The AI second reading of a notice the rules could not place, offered on the case's first screen
 * (9 Oct 2026), for a seller who typed or pasted the notice here without visiting /decode.
 *
 * It asks the same `/api/decode` route the decode page uses, so the same caps and the same
 * refusals apply: it never reads a reply, a warning, a message with scam signals or an allegation
 * about documents, and it says nothing when the model is off or a cap is reached. What comes back
 * is a proposal with the sentence that decided it, applied only when the seller presses the
 * button, through the same override that records their own choice.
 */
export function SecondReading({
  notice,
  active,
  busy,
  onUse,
}: {
  notice: string;
  /** False once the kind is placed, the case is confirmed, or there is too little to read. */
  active: boolean;
  busy: boolean;
  onUse: (kind: ViolationKind) => Promise<boolean>;
}) {
  // Remembers which notice it was read from, so an edit to the notice hides a stale reading
  // without resetting state inside the effect.
  const [found, setFound] = useState<{
    notice: string;
    kind: ViolationKind;
    quote: string;
  } | null>(null);
  const reading = found && found.notice === notice ? found : null;
  const R = C.request.secondReading;

  useEffect(() => {
    if (!active) return;
    const controller = new AbortController();
    // Not on every keystroke: one request once the seller has stopped typing.
    const timer = setTimeout(async () => {
      try {
        const res = await fetch("/api/decode", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: notice }),
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as {
          suggestedKind?: { kind: string; quote: string };
        };
        const s = data.suggestedKind;
        if (s && isViolationKind(s.kind) && s.kind !== "UNKNOWN" && s.quote)
          setFound({ notice, kind: s.kind, quote: s.quote });
      } catch {
        // No reading is the same as the first screen before this existed.
      }
    }, 1500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [notice, active]);

  if (!active || !reading) return null;
  return (
    <Alert>
      <AlertDescription className="space-y-2">
        <span className="block">
          {R.lead.replace("{kind}", APP.violationKinds[reading.kind])}{" "}
          <span className="text-muted-foreground">
            {R.from} “{reading.quote}”
          </span>
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={async () => {
            if (await onUse(reading.kind)) setFound(null);
          }}
        >
          {R.use}
        </Button>
      </AlertDescription>
    </Alert>
  );
}
