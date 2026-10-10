import { beforeEach, describe, expect, it, vi } from "vitest";
import { noteProposal, takeProposal } from "../secondReadingProposal";

describe("second reading proposal (R-2)", () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    vi.stubGlobal("sessionStorage", {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    });
  });

  it("is taken once, so each confirmation is counted once", () => {
    noteProposal("POLICY", 1_000);
    expect(takeProposal(2_000)).toBe("POLICY");
    expect(takeProposal(3_000)).toBeNull();
  });

  it("is not counted against a case confirmed more than an hour later", () => {
    noteProposal("FUNDS", 0);
    expect(takeProposal(60 * 60 * 1000 + 1)).toBeNull();
  });

  it("ignores anything unreadable", () => {
    sessionStorage.setItem("appealdeck:second-reading-proposal", "{not json");
    expect(takeProposal()).toBeNull();
  });
});
