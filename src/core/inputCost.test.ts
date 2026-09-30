import { describe, expect, it } from "vitest";
import { runDecode, assessNoticeAuthenticity } from "./index";
import { receiptDateOf } from "./noticeDate";
import { checkWordingLock } from "./wordingLock";

/**
 * Cost of hostile input (30 Sep 2026).
 *
 * `/api/decode` is public and takes up to 50,000 characters, and the decoder also runs in the
 * browser as a seller types. Two patterns were quadratic: the header reader (every blank line
 * swallowed all the blank lines after it) and the address pattern in the authenticity check (it
 * restarted at every word boundary of a long dotted string). Fifty thousand blank lines cost five
 * seconds of CPU; a long hostname-shaped paste cost three. Nothing failed, which is how it lasted:
 * no test used a large or hostile input.
 *
 * The ceilings are absolute and generous — the fixed code takes tens of milliseconds, the old code
 * took seconds even on a fast machine — so a slow CI runner does not make these flaky, while a
 * return to quadratic behaviour fails every time.
 */

const BODY_LIMIT = 50_000;
const MARKER =
  "Amazon Services — Account Deactivated (Section 3: Inauthentic Items). You have 17 days to submit a Plan of Action. ";
const CEILING_MS = 1500;

const rep = (unit: string) =>
  (MARKER + unit.repeat(Math.ceil(BODY_LIMIT / unit.length))).slice(0, BODY_LIMIT);

function elapsed(run: () => unknown): number {
  const start = performance.now();
  run();
  return performance.now() - start;
}

describe("hostile input stays cheap", () => {
  const shapes: Record<string, string> = {
    "blank lines": rep("\n"),
    "spaces and line breaks": rep(" \n"),
    "windows line breaks": rep("\r\n"),
    "quoted blank lines": rep(">\n"),
    "a long dotted host": rep("a."),
    "a long hyphenated host": "http://" + rep("a-"),
    "one long word": rep("a"),
  };

  for (const [name, text] of Object.entries(shapes)) {
    it(`decodes ${name} quickly`, () => {
      expect(elapsed(() => runDecode(text, {}))).toBeLessThan(CEILING_MS);
    });
    it(`checks ${name} for authenticity quickly`, () => {
      expect(elapsed(() => assessNoticeAuthenticity(text))).toBeLessThan(CEILING_MS);
    });
  }

  it("checks the wording lock on one long word quickly", () => {
    // The wording route accepts 12,000 characters. The old patterns took ~900 ms on this; the
    // bounded ones take ~25 ms, so the ceiling is tighter than the others while leaving ample room.
    const word = "a".repeat(12_000);
    expect(elapsed(() => checkWordingLock(word, word + " b"))).toBeLessThan(400);
  });
});

describe("the bounded patterns still find what they are for", () => {
  it("reads a header that follows many blank lines", () => {
    const raw = `${"\n".repeat(500)}Date: 1 September 2026\nYour account is deactivated.`;
    expect(receiptDateOf(raw)).toBe("2026-09-01");
  });

  it("reads a quoted, indented header", () => {
    expect(receiptDateOf("> \t Sent: 3 October 2026\n> Your account is deactivated.")).toBe(
      "2026-10-03",
    );
  });

  it("still names a foreign address", () => {
    const found = assessNoticeAuthenticity(
      "Amazon Services — Account Deactivated. Reply to reinstate@amazon-appeals.example.com today.",
    ).signals.find((s) => s.id === "non_amazon_sender");
    expect(found?.match).toContain("reinstate@amazon-appeals.example.com");
  });

  it("still catches a changed date, address and name", () => {
    const original =
      "I sent 40 units to Globex Ltd on 12 March 2026; write to ops@globex.example.com.";
    const changed =
      "I sent 45 units to Initech on 12 March 2026; write to ops@initech.example.com.";
    const result = checkWordingLock(original, changed);
    expect(result.ok).toBe(false);
    expect(result.added).toEqual(expect.arrayContaining(["45", "ops@initech.example.com"]));
    expect(result.dropped).toEqual(expect.arrayContaining(["40", "ops@globex.example.com"]));
  });

  it("still passes a rewrite that keeps every fact", () => {
    const original = "We shipped 40 units on 12 March 2026 under order 111-2222222-3333333.";
    const rewrite = "On 12 March 2026 we shipped 40 units, under order 111-2222222-3333333.";
    expect(checkWordingLock(original, rewrite).ok).toBe(true);
  });
});
