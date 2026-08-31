"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { runDecode } from "@/core";
import type { DecodeResult } from "@/core";
import { guidanceFor } from "@/core";
import type { Confidence } from "@/core";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

function formatDue(dueAt: Date | null): string {
  return dueAt ? dateFmt.format(dueAt) : "Date not stated — verify in your Account Health dashboard";
}

function daysUntil(dueAt: Date | null): string {
  if (!dueAt) return "";
  const ms = dueAt.getTime() - Date.now();
  const days = Math.ceil(ms / 86_400_000);
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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-100">Decode your notice</h1>
      <p className="mt-2 text-sm text-gray-400">
        Paste your Amazon deactivation or policy notice. Everything runs in your browser — we do not store it.
      </p>

      <label htmlFor="notice" className="mt-4 block text-sm font-medium text-gray-300">
        Notice text
      </label>
      <textarea
        id="notice"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mt-2 h-64 w-full rounded-lg border border-edge bg-panel p-3 text-sm text-gray-100 outline-none focus:border-accent focus:ring-2 focus:ring-accent/40"
        placeholder="Paste the notice text here…"
        aria-describedby="notice-hint"
      />
      <p id="notice-hint" className="mt-1 text-xs text-gray-500">
        For best results, include the full notice with the violation section and any stated dates.
      </p>

      <button
        type="button"
        onClick={handleDecode}
        disabled={!canDecode}
        className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Decode
      </button>

      {error && (
        <p role="alert" className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {decoded && !result && !error && (
        <p className="mt-8 text-sm text-gray-400">
          No structured result — try pasting more of the notice, or check your Account Health dashboard for the exact
          appeal window.
        </p>
      )}

      {result && guidance && (
        <section aria-live="polite" className="mt-8 space-y-6">
          <div className="rounded-lg border border-edge bg-panel p-4">
            <h2 className="text-lg font-semibold text-gray-100">What this looks like</h2>
            <p className="mt-1 text-sm text-gray-300">
              Detected issue: <span className="font-medium text-accent">{guidance.title}</span>
            </p>
            <p className="mt-1 text-sm text-gray-400">
              Match confidence: {CONFIDENCE_LABEL[result.classification.confidence]}
            </p>
            {result.classification.severityGated && (
              <p className="mt-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-2 text-sm text-amber-200">
                Severity-gated — routed to professional help, never sold or auto-drafted.
              </p>
            )}
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-100">Deadlines</h2>
            <ul className="mt-2 space-y-2">
              {result.deadlines.map((d, i) => (
                <li key={i} className="rounded-lg border border-edge bg-panel p-3 text-sm text-gray-300">
                  <span className="text-gray-100">{d.label}</span>
                  <span className="mt-1 block text-xs text-gray-500">
                    {formatDue(d.dueAt)} {daysUntil(d.dueAt)}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-100">What to do next</h2>
            <p className="mt-1 text-sm text-gray-400">{guidance.summary}</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-300">
              {guidance.whatToDo.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-edge bg-panel p-4">
            <h2 className="text-base font-semibold text-gray-100">Want a drafted Plan of Action?</h2>
            <p className="mt-1 text-sm text-gray-400">
              The free decoder shows you the shape of the problem. The $199 Appeal Pass drafts a Plan of Action you
              edit and submit yourself — no automation, no guarantees.
            </p>
            <Link
              href="/pricing"
              className="mt-4 inline-block rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-black"
            >
              See the Appeal Pass
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
