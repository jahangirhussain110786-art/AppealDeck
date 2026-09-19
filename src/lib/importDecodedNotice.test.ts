import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Vault } from "@/core/vault/vault";
import { VaultDB } from "@/core/vault/db";
import { importDecodedNotice } from "./importDecodedNotice";
import { loadCaseFile, saveCaseFile, listCases } from "./caseStore";
import { stashPendingNotice, peekPendingNotice, clearPendingNotice } from "./pendingNotice";

describe("decoded notice continuity", () => {
  let vault: Vault;
  let db: VaultDB;
  beforeEach(async () => {
    db = new VaultDB(`decode-intake-${crypto.randomUUID()}`);
    vault = new Vault(
      {
        subtle: webcrypto.subtle,
        getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
      } as unknown as Parameters<typeof Vault>[0],
      db,
    );
    await vault.open();
    await vault.initWithPassphrase("test-only-passphrase");
  });
  afterEach(async () => {
    await vault.close();
    await db.delete();
  });

  it("persists the first notice and deadlines before any user review", async () => {
    const pending = {
      text: "Please provide supplier invoices for your affected products.",
      deadlines: [{ kind: "appeal_window" as const, dueAt: null, label: "Confirm the deadline" }],
    };
    const file = await importDecodedNotice(vault, pending, "POLICY");
    expect((await loadCaseFile(vault))?.workspace?.notice).toBe(pending.text);
    expect(file.deadlines).toEqual(pending.deadlines);
    expect(file.workspace?.confirmed).toBe(false);
    expect(file.workspace?.requirements[0].label).toBe("Supplier invoice");
  });
  it("resumes saved edits for the same decode while preserving a different active case", async () => {
    const original = {
      text: "Please provide the supplier invoice for this listing.",
      deadlines: [],
    };
    const first = await importDecodedNotice(vault, original, "POLICY");
    first.workspace!.explanation = "Saved response facts";
    await saveCaseFile(vault, first);
    const other = await importDecodedNotice(
      vault,
      { text: "A separate notice with another request.", deadlines: [] },
      "UNKNOWN",
    );
    const resumed = await importDecodedNotice(vault, original, "POLICY");
    expect(resumed.id).toBe(first.id);
    expect(resumed.workspace?.explanation).toBe("Saved response facts");
    expect(await listCases(vault)).toHaveLength(2);
    expect((await loadCaseFile(vault, other.id))?.workspace?.notice).toContain("separate");
    expect((await loadCaseFile(vault))?.id).toBe(first.id);
  });
  it("keeps pending data until acknowledged and does not clear a newer handoff", () => {
    stashPendingNotice("first");
    const old = peekPendingNotice()!;
    expect(peekPendingNotice()).toBe(old);
    stashPendingNotice("second");
    clearPendingNotice(old);
    expect(peekPendingNotice()?.text).toBe("second");
    clearPendingNotice(peekPendingNotice()!);
    expect(peekPendingNotice()).toBeUndefined();
  });
  it("preserves a decoded notice longer than the old 12,000-character handoff limit", async () => {
    const text = "Notice detail. ".repeat(1000) + "Please provide your supplier invoice.";
    stashPendingNotice(text);
    const pending = peekPendingNotice()!;
    const file = await importDecodedNotice(vault, pending, "POLICY");
    clearPendingNotice(pending);
    expect((await loadCaseFile(vault))?.workspace?.notice).toBe(text);
    expect(file.workspace?.requirements).toHaveLength(1);
  });
});
