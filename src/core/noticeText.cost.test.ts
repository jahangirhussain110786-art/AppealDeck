import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/decode/route";
import { runDecode, assessNoticeAuthenticity } from "./index";
import { analyzeReply } from "./responseAnalyzer";
import {
  assessGarbled,
  assessNotEnforcement,
  detectMultipleNotices,
  looksLikeSellerText,
  normalizeNoticeText,
  repairOcrText,
  splitNotices,
} from "./noticeText";
import { genericWindowsOf } from "./noticeParser";
import { detectLanguage } from "../lib/language";

/**
 * Cost of hostile input for the 6 Oct 2026 decoder additions. `/api/decode` is public and takes
 * 50,000 characters, so every new pass (the normaliser, the shape detectors, the wider authenticity
 * rules, the generic window patterns) is run on the shapes that made earlier patterns quadratic.
 * Ceilings are absolute and generous: the code takes tens of milliseconds, a quadratic one seconds.
 */
const LIMIT = 50_000;
const CEILING_MS = 1500;
const MARKER = "Amazon Services - Account Deactivated. You may appeal within 30 days. ";
const rep = (unit: string) =>
  (MARKER + unit.repeat(Math.ceil(LIMIT / unit.length))).slice(0, LIMIT);

function elapsed(run: () => unknown): number {
  const start = performance.now();
  run();
  return performance.now() - start;
}

const shapes: Record<string, string> = {
  "blank lines": rep("\n"),
  "spaces and line breaks": rep(" \n"),
  "quoted lines": rep("> a\n"),
  "a long dotted host": rep("a."),
  "a long hyphenated host": "http://" + rep("a-"),
  "repeated schemes": rep("https://"),
  "bare domains": rep("a.com/ "),
  "one long word": rep("a"),
  "repeated header labels": rep("Date: To: From: "),
  "repeated tags": rep("<b>"),
  "repeated entities": rep("&amp;"),
  "repeated markdown": rep("**__"),
  "gift cards": rep("gift cards pay "),
  codes: rep("send the code "),
  "ASIN fragments": rep("B0 AB "),
  digits: rep("1 "),
  windows: rep("within 5 days "),
  "hyphen breaks": rep("a-\nb"),
  "wrapped lines": rep("word\nword "),
  "email shapes": rep("a@b "),
  "numbers and slashes": rep("1/1/"),
};

describe("the decoder's new passes stay cheap on hostile input", () => {
  for (const [name, text] of Object.entries(shapes)) {
    it(`handles ${name}`, () => {
      expect(
        elapsed(() => {
          const normalized = normalizeNoticeText(text);
          runDecode(normalized, {});
          assessNoticeAuthenticity(normalized);
          analyzeReply(normalized);
          genericWindowsOf(normalized);
          assessGarbled(normalized);
          repairOcrText(normalized);
          assessNotEnforcement(normalized);
          detectMultipleNotices(normalized);
          splitNotices(normalized);
          looksLikeSellerText(normalized);
          detectLanguage(normalized);
        }),
      ).toBeLessThan(CEILING_MS);
    });
  }

  it("answers the route quickly on the worst shapes", async () => {
    for (const name of [
      "blank lines",
      "a long dotted host",
      "bare domains",
      "wrapped lines",
      "gift cards",
    ]) {
      const req = new Request("http://localhost:3000/api/decode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: shapes[name] }),
      }) as unknown as NextRequest;
      const start = performance.now();
      await POST(req);
      expect(performance.now() - start, name).toBeLessThan(CEILING_MS);
    }
  });
});
