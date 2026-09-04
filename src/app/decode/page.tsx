"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { AlertTriangle, ArrowRight, CalendarClock, ListChecks } from "lucide-react";
import { runDecode } from "@/core";
import type { DecodeResult } from "@/core";
import { guidanceFor } from "@/core";
import type { Confidence } from "@/core";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDue(dueAt: Date | null): string {
  return dueAt
    ? dateFmt.format(dueAt)
    : "Date not stated — verify in your Account Health dashboard";
}

function daysUntil(dueAt: Date | null): string {
  if (!dueAt) return "";
  const days = Math.ceil((dueAt.getTime() - Date.now()) / 86_400_000);
  if (days > 0) return `(${days} day${days === 1 ? "" : "s"} left)`;
  if (days === 0) return "(due today)";
  return `(${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue)`;
}

const CONFIDENCE_LABEL: Record<Confidence, string> = {
  deterministic: "Rule-based match (high confidence)",
  "llm-needed": "Unclear — needs expert review",
};

export default function DecodePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<DecodeResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [decoded, setDecoded] = useState(false);

  function handleDecode() {
    setError(null);
    try {
      const res = runDecode(text, { noticeReceivedAt: new Date() });
      setResult(res);
      setDecoded(true);
    } catch (e) {
      setResult(null);
      setError(e instanceof Error ? e.message : "Could not decode that notice.");
    }
  }

  const guidance = useMemo(
    () => (result ? guidanceFor(result.classification.kind) : null),
    [result],
  );
  const canDecode = text.trim().length > 0;

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader mode="marketing" />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-12">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Decode your notice
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Paste your Amazon deactivation or policy notice. Everything runs in your browser — we do
          not store it.
        </p>

        <label htmlFor="notice" className="mt-6 block text-sm font-medium text-foreground">
          Notice text
        </label>
        <Textarea
          id="notice"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="mt-2 h-64"
          placeholder="Paste the notice text here…"
          aria-describedby="notice-hint"
        />
        <p id="notice-hint" className="mt-1 text-xs text-muted-foreground">
          For best results, include the full notice with the violation section and any stated dates.
        </p>

        <Button
          type="button"
          onClick={handleDecode}
          disabled={!canDecode}
          size="lg"
          className="mt-4"
        >
          Decode
        </Button>

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        {decoded && !result && !error && (
          <p className="mt-8 text-sm text-muted-foreground">
            No structured result — try pasting more of the notice, or check your Account Health
            dashboard for the exact appeal window.
          </p>
        )}

        {result && guidance && (
          <motion.div
            aria-live="polite"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="mt-8 space-y-6"
          >
            <Card>
              <CardContent className="pt-5">
                <h2 className="text-lg font-semibold text-foreground">What this looks like</h2>
                <p className="mt-1 text-sm text-foreground">
                  Detected issue: <span className="font-medium text-primary">{guidance.title}</span>
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Match confidence: {CONFIDENCE_LABEL[result.classification.confidence]}
                </p>
                {result.classification.severityGated && (
                  <p className="mt-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-sm text-amber-300">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Severity-gated — routed to professional help, never sold or auto-drafted.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <CalendarClock className="h-5 w-5 text-primary" /> Deadlines
                </h2>
                <ul className="mt-3 space-y-2">
                  {result.deadlines.map((d, i) => (
                    <li
                      key={i}
                      className="rounded-lg border border-border bg-background/40 p-3 text-sm text-foreground"
                    >
                      <span>{d.label}</span>
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {formatDue(d.dueAt)} {daysUntil(d.dueAt)}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-5">
                <h2 className="flex items-center gap-2 text-lg font-semibold text-foreground">
                  <ListChecks className="h-5 w-5 text-primary" /> What to do next
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{guidance.summary}</p>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-foreground">
                  {guidance.whatToDo.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-5">
                <h2 className="text-base font-semibold text-foreground">
                  Want a drafted Plan of Action?
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  The free decoder shows you the shape of the problem. The $199 Appeal Pass drafts a
                  Plan of Action you edit and submit yourself — no automation, no outcome promises.
                </p>
                <Button asChild className="mt-4">
                  <Link href="/pricing">
                    See the Appeal Pass <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}
