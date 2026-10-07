import { describe, expect, it } from "vitest";
import { identifierContext } from "./noticeText";

/** The implementation this replaced (7 Oct 2026): correct, but quadratic on one long unbroken word. */
function reference(text: string, at: number, length: number): boolean {
  const before = text[at - 1];
  const after = text[at + length];
  if (before === "=" || before === "_" || after === "=" || after === "_") return true;
  const wordStart = Math.max(text.lastIndexOf(" ", at), text.lastIndexOf("\n", at)) + 1;
  return /^(?:https?:\/\/|www\.)/i.test(text.slice(wordStart, wordStart + 8));
}

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}
const PIECES = [
  "https://",
  "http://",
  "www.",
  "abcd",
  "x9Z0",
  "a=",
  "_",
  " ",
  " ",
  "\n",
  "A1B2C3",
  ".",
];

describe("identifierContext matches the straightforward search", () => {
  it("agrees on thousands of random texts, asking in increasing offset order", () => {
    const rand = rng(7);
    for (let n = 0; n < 400; n++) {
      let text = "";
      const pieces = 5 + Math.floor(rand() * 40);
      for (let i = 0; i < pieces; i++) text += PIECES[Math.floor(rand() * PIECES.length)];
      const check = identifierContext(text);
      for (const m of text.matchAll(/[A-Za-z0-9]{4,40}/g)) {
        expect(check(m.index!, m[0].length), JSON.stringify(text) + "@" + m.index).toBe(
          reference(text, m.index!, m[0].length),
        );
      }
    }
  });

  it("still gives the right answer when asked out of order", () => {
    const text = "see https://example.com/abcd1234 and abcd1234 here";
    const check = identifierContext(text);
    const at = [
      text.indexOf("abcd1234", 30),
      text.indexOf("example"),
      text.indexOf("abcd1234", 30),
    ];
    for (const i of at) expect(check(i, 8)).toBe(reference(text, i, 8));
  });
});
