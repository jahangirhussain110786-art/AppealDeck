"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { GUEST_REMINDER } from "@/content/guestReminder";

type Outcome =
  "idle" | "working" | "done" | "already" | "stopped" | "expired" | "unknown" | "error";

/** The button that confirms or stops a reminder. Nothing happens until it is pressed. */
export function ReminderAction({ action, token }: { action: "confirm" | "stop"; token: string }) {
  const p = GUEST_REMINDER.page;
  const [outcome, setOutcome] = useState<Outcome>("idle");

  async function press() {
    setOutcome("working");
    try {
      const res = await fetch(
        action === "stop" ? "/api/guest-reminder/stop" : "/api/guest-reminder/confirm",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        },
      );
      const data = (await res.json().catch(() => null)) as { status?: string } | null;
      if (!res.ok && res.status !== 400) return setOutcome("error");
      const s = data?.status;
      if (s === "confirmed" || s === "stopped") setOutcome("done");
      else if (s === "already") setOutcome("already");
      else if (s === "expired") setOutcome("expired");
      else if (s === "unknown") setOutcome("unknown");
      else setOutcome("error");
    } catch {
      setOutcome("error");
    }
  }

  const text: Record<Exclude<Outcome, "idle" | "working">, string> = {
    done: action === "stop" ? p.stop.done : p.confirm.done,
    already: p.confirm.already,
    stopped: p.confirm.stopped,
    expired: p.confirm.expired,
    unknown: p.unknown,
    error: p.error,
  };
  const finished = outcome !== "idle" && outcome !== "working" && outcome !== "error";
  return (
    <div className="mt-4 space-y-5">
      {!finished && (
        <>
          <p className="text-muted-foreground">
            {action === "stop" ? p.stop.body : p.confirm.body}
          </p>
          <Button onClick={press} disabled={outcome === "working"}>
            {outcome === "working"
              ? p.working
              : action === "stop"
                ? p.stop.button
                : p.confirm.button}
          </Button>
        </>
      )}
      {outcome !== "idle" && outcome !== "working" && (
        <p role="status" className="text-foreground">
          {text[outcome]}
        </p>
      )}
      <p>
        <Link href="/decode" className="text-sm font-medium text-link underline underline-offset-2">
          {p.back}
        </Link>
      </p>
    </div>
  );
}
