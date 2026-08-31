"use client";

import { useState } from "react";
import { runDecode } from "@/core";
import type { DecodeResult } from "@/core";

export default function DecodePage() {
  const [text, setText] = useState("");
  const [result, setResult] = useState<DecodeResult | null>(null);

  function handleDecode() {
    const res = runDecode(text, { noticeReceivedAt: new Date() });
    setResult(res);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-gray-100">Decode your notice</h1>
      <p className="mt-2 text-sm text-gray-400">
        Paste your Amazon deactivation or policy notice. Everything runs in your browser — we do not store it.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="mt-4 h-64 w-full rounded-lg border border-edge bg-panel p-3 text-sm text-gray-100 outline-none focus:border-accent"
        placeholder="Paste the notice text here…"
      />
      <button
        onClick={handleDecode}
        className="mt-4 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-black"
      >
        Decode
      </button>

      {result && (
        <section className="mt-8 space-y-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">What this looks like</h2>
            <p className="mt-1 text-sm text-gray-300">
              Detected issue:{" "}
              <span className="font-medium text-accent">{result.classification.kind}</span>
              {result.classification.severityGated &&
                " (severity-gated — routed to professional help, never sold)"}
            </p>
            <p className="mt-1 text-sm text-gray-400">Confidence: {result.classification.confidence}</p>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-100">Deadlines</h2>
            <ul className="mt-2 space-y-2">
              {result.deadlines.map((d, i) => (
                <li key={i} className="rounded-lg border border-edge bg-panel p-3 text-sm text-gray-300">
                  <span className="text-gray-100">{d.label}</span>
                  {d.dueAt && (
                    <span className="block text-xs text-gray-500">
                      Due: {d.dueAt.toISOString().slice(0, 10)}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h2 className="text-lg font-semibold text-gray-100">Signals found</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-gray-400">
              {result.parsed.kindHints.map((k) => (
                <li key={k}>{k}</li>
              ))}
              {result.parsed.mentionsFunds && <li>mentions funds on hold</li>}
              {result.parsed.mentionsSellerChallenge && <li>mentions Seller Challenge</li>}
            </ul>
          </div>
        </section>
      )}
    </main>
  );
}
