import { describe, expect, it, vi } from "vitest";
import { canTranslateToEnglish, chunkForTranslation, translateToEnglish } from "../translate";

const fake = (state = "available", reply = (t: string) => `EN:${t}`) => ({
  availability: vi.fn().mockResolvedValue(state),
  create: vi.fn().mockResolvedValue({
    translate: vi.fn(async (t: string) => reply(t)),
    destroy: vi.fn(),
  }),
});

describe("translateToEnglish", () => {
  it("does nothing, and says so, when the browser has no translator", async () => {
    expect(await translateToEnglish("Hallo", "de", null)).toEqual({
      ok: false,
      reason: "no_browser_support",
    });
    expect(await canTranslateToEnglish("de", null)).toBe(false);
  });

  it("translates on the device and keeps line breaks", async () => {
    const api = fake();
    const out = await translateToEnglish("Zeile eins\nZeile zwei", "de", api);
    expect(out).toEqual({ ok: true, text: "EN:Zeile eins\nZeile zwei" });
    expect(api.create).toHaveBeenCalledWith({ sourceLanguage: "de", targetLanguage: "en" });
  });

  it("says the language is unavailable instead of failing in the middle", async () => {
    const api = fake("unavailable");
    expect(await translateToEnglish("x", "xx", api)).toEqual({
      ok: false,
      reason: "language_unavailable",
    });
    expect(api.create).not.toHaveBeenCalled();
  });

  it("reports a translator that throws as a failure and still cleans up", async () => {
    const destroy = vi.fn();
    const api = {
      availability: vi.fn().mockResolvedValue("available"),
      create: vi.fn().mockResolvedValue({
        translate: vi.fn().mockRejectedValue(new Error("model gone")),
        destroy,
      }),
    };
    expect(await translateToEnglish("Hallo", "de", api)).toEqual({ ok: false, reason: "failed" });
    expect(destroy).toHaveBeenCalled();
  });

  it("treats an availability check that throws as not available", async () => {
    const api = { availability: vi.fn().mockRejectedValue(new Error("x")), create: vi.fn() };
    expect(await canTranslateToEnglish("de", api)).toBe(false);
  });
});

describe("chunkForTranslation", () => {
  it("keeps short text whole and splits long text on line boundaries", () => {
    expect(chunkForTranslation("a\nb")).toEqual(["a\nb"]);
    const text = Array.from({ length: 10 }, (_, i) => `line ${i} ${"x".repeat(100)}`).join("\n");
    const chunks = chunkForTranslation(text, 350);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("\n")).toBe(text);
    for (const c of chunks) expect(c.length).toBeLessThanOrEqual(350);
  });

  it("cuts a single over-long line instead of refusing it", () => {
    const chunks = chunkForTranslation("y".repeat(7000), 3000);
    expect(chunks.map((c) => c.length)).toEqual([3000, 3000, 1000]);
  });
});
