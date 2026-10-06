import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/decode/route";
import { MarkedNotice } from "@/components/MarkedNotice";
import { buildDecodeSpans } from "@/lib/decodeAnnotations";

/**
 * 6 Oct 2026: /api/decode returns offsets into `normalizedText`, not into what the seller typed.
 * A page that marked the typed string would highlight the wrong characters on any paste that the
 * normaliser changed. These tests run a messy paste through the real route and the real marks.
 */
const MESSY = [
  "Date: 12 September 2026",
  "Subject: Your Amazon&nbsp;seller account",
  "",
  "Your listings were removed for policy violations. Please provide the supplier",
  "invoices for the affected ASINs, and a plan of action that explains the",
  "root cause. You may appeal within 90 days of this notice.",
].join("\n");

async function decodeMessy() {
  const req = new Request("http://localhost:3000/api/decode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: MESSY }),
  }) as unknown as NextRequest;
  const res = await POST(req);
  expect(res.status).toBe(200);
  return (await res.json()) as Record<string, any>;
}

describe("decode marks line up with normalizedText", () => {
  it("changes the text, so typed offsets would be wrong", async () => {
    const body = await decodeMessy();
    expect(body.normalizedText).not.toBe(MESSY);
    expect(body.normalizedText).not.toContain("&nbsp;");
    expect(body.normalizedText).not.toContain(" ");
  });

  it("marks the phrase the response names, on the normalized text", async () => {
    const body = await decodeMessy();
    const spans = buildDecodeSpans(body.responseType, body.entities);
    expect(spans.length).toBeGreaterThan(0);
    for (const s of spans) {
      expect(s.end).toBeLessThanOrEqual(body.normalizedText.length);
      expect(body.normalizedText.slice(s.start, s.end).trim().length).toBeGreaterThan(0);
    }
    // Each risk mark is a phrase inside a clause the response itself quotes.
    const quotes = (
      body.responseType.matches as Array<{ quote: string; start: number; end: number }>
    ).map((m) => m.quote.replace(/…$/, ""));
    for (const s of spans.filter((x) => x.tone === "risk")) {
      const marked = body.normalizedText.slice(s.start, s.end);
      expect(quotes.some((q) => q.includes(marked))).toBe(true);
    }
    // The requested record is marked where the notice says it, in its own words.
    const clear = spans.filter((x) => x.tone === "clear");
    expect(clear.some((s) => /invoice/i.test(body.normalizedText.slice(s.start, s.end)))).toBe(
      true,
    );
  });

  it("renders those marks around the right words", async () => {
    const body = await decodeMessy();
    const html = renderToStaticMarkup(
      <MarkedNotice
        text={body.normalizedText}
        spans={buildDecodeSpans(body.responseType, body.entities)}
        label="Your notice, marked up"
      />,
    );
    const marked = [...html.matchAll(/<mark[^>]*>([^<]*)<\/mark>/g)].map((m) => m[1]!);
    expect(marked.length).toBeGreaterThan(0);
    expect(marked.some((t) => /invoice/i.test(t))).toBe(true);
    // Every marked string is real text of the notice that was decoded.
    for (const t of marked) {
      expect(body.normalizedText.replace(/&/g, "&amp;")).toContain(t);
    }
  });
});
