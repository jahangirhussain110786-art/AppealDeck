"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { GUEST_REMINDER } from "@/content/guestReminder";
import { formatDay } from "@/core/noticeDate";
import { daysUntilDay } from "@/lib/format";
import type { DeadlineLike } from "@/components/DeadlineChip";
import type { ViolationKind } from "@/core/violationKinds";

/**
 * The date a reminder can be about: a cut-off the notice itself states, still ahead. The date a
 * funds appeal OPENS is not a cut-off, an indefinite hold has no date, and a window with no stated
 * day has nothing to count to, so none of those offers a reminder.
 */
export function reminderDate(deadlines: readonly DeadlineLike[], now: Date): string | null {
  const days = deadlines
    .filter((d) => d.dueOn && !d.isIndefinite && d.kind !== "funds_appeal_eligible")
    .map((d) => d.dueOn!)
    .filter((day) => daysUntilDay(day, now) >= 1)
    .sort();
  return days[0] ?? null;
}

type Phase = "idle" | "sending" | "pending" | "already" | "error";

export function ReminderSignup({
  deadlines,
  kind,
}: {
  deadlines: readonly DeadlineLike[];
  kind: ViolationKind;
}) {
  const f = GUEST_REMINDER.form;
  const day = reminderDate(deadlines, new Date());
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  if (!day) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (phase === "sending") return;
    setPhase("sending");
    setMessage("");
    try {
      const res = await fetch("/api/guest-reminder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, kind, dueOn: day, consent: agreed }),
      });
      const data = (await res.json().catch(() => null)) as { status?: string } | null;
      if (res.ok && data?.status === "pending") return setPhase("pending");
      if (res.ok && data?.status === "already") return setPhase("already");
      setPhase("error");
      setMessage(
        res.status === 400
          ? f.invalid
          : res.status === 422
            ? f.tooLate
            : res.status === 409
              ? f.limit
              : res.status === 429
                ? f.tooMany
                : f.unavailable,
      );
    } catch {
      setPhase("error");
      setMessage(f.unavailable);
    }
  }

  const done = phase === "pending" || phase === "already";
  return (
    <section
      aria-labelledby="reminder-title"
      className="mt-4 rounded-2xl border border-border bg-surface-1 p-4"
      data-testid="reminder-signup"
    >
      <h3 id="reminder-title" className="flex items-center gap-2 text-sm font-semibold">
        <BellRing aria-hidden className="size-4 text-primary" />
        {f.title}: {formatDay(day)}
      </h3>
      {done ? (
        <p role="status" className="mt-2 text-sm text-muted-foreground">
          {phase === "pending" ? f.pending : f.already}
        </p>
      ) : (
        <form onSubmit={submit} className="mt-2 space-y-3" noValidate>
          <p className="text-sm text-muted-foreground">{f.body}</p>
          <div>
            <label htmlFor="reminder-email" className="mb-1 block text-xs font-medium">
              {f.emailLabel}
            </label>
            <Input
              id="reminder-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder={f.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              maxLength={254}
            />
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="reminder-consent"
              checked={agreed}
              onCheckedChange={(v) => setAgreed(v === true)}
              className="mt-0.5"
            />
            <label htmlFor="reminder-consent" className="text-xs text-muted-foreground">
              {f.consent}{" "}
              <Link href="/privacy" className="font-medium text-link underline underline-offset-2">
                {f.privacyLink}
              </Link>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" size="sm" disabled={phase === "sending" || !agreed || !email}>
              {phase === "sending" ? f.sending : f.submit}
            </Button>
            {phase === "error" && message && (
              <p role="alert" className="text-sm text-destructive">
                {message}
              </p>
            )}
          </div>
        </form>
      )}
    </section>
  );
}
