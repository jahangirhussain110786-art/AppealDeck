import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearSessionPaste,
  loadSessionPaste,
  markSessionPasteLeaving,
  saveSessionPaste,
} from "@/lib/decodeDraft";

/** A minimal sessionStorage: the project runs unit tests in node, with no DOM. */
function fakeStorage(failWrites = false) {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => {
      if (failWrites) throw new Error("quota");
      data.set(k, v);
    },
    removeItem: (k: string) => void data.delete(k),
  };
}

describe("decode session paste (Back button memory)", () => {
  let storage = fakeStorage();
  beforeEach(() => {
    storage = fakeStorage();
    vi.stubGlobal("window", { sessionStorage: storage });
  });
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the pasted text and whether it was decoded, once the seller has left for a case", () => {
    saveSessionPaste("Your account was suspended", true);
    markSessionPasteLeaving();
    expect(loadSessionPaste()).toEqual({ text: "Your account was suspended", decoded: true });
  });

  it("does not bring an old paste back on a fresh visit", () => {
    saveSessionPaste("an earlier notice", true);
    expect(loadSessionPaste()).toBeUndefined();
  });

  it("restores only once", () => {
    saveSessionPaste("a notice", true);
    markSessionPasteLeaving();
    expect(loadSessionPaste()?.text).toBe("a notice");
    expect(loadSessionPaste()).toBeUndefined();
  });

  it("forgets it when cleared, or when the box is emptied", () => {
    saveSessionPaste("some notice");
    markSessionPasteLeaving();
    clearSessionPaste();
    expect(loadSessionPaste()).toBeUndefined();
    saveSessionPaste("some notice");
    saveSessionPaste("   ");
    expect(loadSessionPaste()).toBeUndefined();
  });

  it("never throws when storage holds junk or refuses writes", () => {
    storage.data.set("appealdeck.decode.paste", "{not json");
    expect(loadSessionPaste()).toBeUndefined();
    vi.stubGlobal("window", { sessionStorage: fakeStorage(true) });
    expect(() => saveSessionPaste("text")).not.toThrow();
  });

  it("never throws when there is no storage at all", () => {
    vi.stubGlobal("window", {});
    expect(() => saveSessionPaste("text")).not.toThrow();
    expect(loadSessionPaste()).toBeUndefined();
    expect(() => clearSessionPaste()).not.toThrow();
  });
});
