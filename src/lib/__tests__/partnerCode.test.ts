import { describe, expect, it } from "vitest";
import {
  PARTNER_CODE_DAYS,
  PARTNER_CODE_KEY,
  forgetPartnerCode,
  parsePartnerCode,
  readPartnerCode,
  rememberPartnerCode,
} from "../partnerCode";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, String(v)),
  };
}

const DAY = 24 * 60 * 60 * 1000;

describe("partner codes", () => {
  it("accepts a usable code and normalises it to upper case", () => {
    expect(parsePartnerCode("anna-2026")).toBe("ANNA-2026");
    expect(parsePartnerCode("  ENABLERS_ISB ")).toBe("ENABLERS_ISB");
  });

  it("refuses anything that is not a short code", () => {
    for (const bad of [
      "",
      "ab",
      "a".repeat(33),
      "has space",
      "semi;colon",
      "-start",
      "<script>",
      12,
      null,
    ])
      expect(parsePartnerCode(bad), String(bad)).toBeNull();
  });

  it("keeps a code for 60 days and then forgets it", () => {
    const store = memoryStorage();
    const t0 = Date.UTC(2026, 9, 22);
    expect(rememberPartnerCode("anna", t0, store)).toBe("ANNA");
    expect(readPartnerCode(t0 + (PARTNER_CODE_DAYS - 1) * DAY, store)).toBe("ANNA");
    expect(readPartnerCode(t0 + PARTNER_CODE_DAYS * DAY, store)).toBeNull();
    // an expired entry is removed, not left behind
    expect(store.getItem(PARTNER_CODE_KEY)).toBeNull();
  });

  it("lets the first partner keep the sale until the window ends, then the next can take it", () => {
    const store = memoryStorage();
    const t0 = Date.UTC(2026, 9, 22);
    rememberPartnerCode("first", t0, store);
    expect(rememberPartnerCode("second", t0 + 5 * DAY, store)).toBe("FIRST");
    expect(readPartnerCode(t0 + 5 * DAY, store)).toBe("FIRST");
    expect(rememberPartnerCode("second", t0 + 61 * DAY, store)).toBe("SECOND");
  });

  it("ignores a bad code in a link and keeps the good one already held", () => {
    const store = memoryStorage();
    const t0 = Date.UTC(2026, 9, 22);
    rememberPartnerCode("good", t0, store);
    expect(rememberPartnerCode("<bad>", t0 + DAY, store)).toBe("GOOD");
  });

  it("drops a damaged or tampered entry", () => {
    const store = memoryStorage();
    store.setItem(PARTNER_CODE_KEY, "{not json");
    expect(readPartnerCode(Date.now(), store)).toBeNull();
    store.setItem(PARTNER_CODE_KEY, JSON.stringify({ code: "<x>", at: Date.now() }));
    expect(readPartnerCode(Date.now(), store)).toBeNull();
    store.setItem(PARTNER_CODE_KEY, JSON.stringify({ code: "OK1", at: Date.now() + 5 * DAY }));
    expect(readPartnerCode(Date.now(), store), "a date in the future is not trusted").toBeNull();
  });

  it("lets the seller remove it", () => {
    const store = memoryStorage();
    rememberPartnerCode("anna", Date.now(), store);
    forgetPartnerCode(store);
    expect(readPartnerCode(Date.now(), store)).toBeNull();
  });

  it("does nothing, and does not throw, when storage is unavailable", () => {
    expect(rememberPartnerCode("anna", Date.now(), null)).toBeNull();
    expect(readPartnerCode(Date.now(), null)).toBeNull();
    const throwing = {
      getItem() {
        throw new Error("blocked");
      },
      setItem() {
        throw new Error("blocked");
      },
      removeItem() {
        throw new Error("blocked");
      },
    } as unknown as Storage;
    expect(rememberPartnerCode("anna", Date.now(), throwing)).toBeNull();
    expect(readPartnerCode(Date.now(), throwing)).toBeNull();
  });
});
