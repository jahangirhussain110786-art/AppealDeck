import { describe, expect, it } from "vitest";
import { readingMinutes } from "../readingTime";

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

describe("readingMinutes", () => {
  it("estimates at roughly 220 words a minute, rounded", () => {
    expect(readingMinutes(words(660))).toBe(3);
    expect(readingMinutes(words(1100))).toBe(5);
  });

  it("never claims a one-minute read", () => {
    expect(readingMinutes("Short.")).toBe(2);
    expect(readingMinutes({})).toBe(2);
    expect(readingMinutes(undefined)).toBe(2);
  });

  it("counts words in nested section bodies, point lists and intro", () => {
    const nested = {
      intro: words(220),
      sections: [{ body: words(330) }, { points: [words(165), words(165)] }],
    };
    expect(readingMinutes(nested)).toBe(readingMinutes(words(880)));
  });
});
