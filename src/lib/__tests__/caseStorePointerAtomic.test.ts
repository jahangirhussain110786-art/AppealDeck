import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Vault } from "@/core/vault/vault";
import { VaultDB } from "@/core/vault/db";
import { getActiveCaseId } from "@/lib/caseStore";

function provider() {
  return {
    subtle: webcrypto.subtle,
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
  } as unknown as ConstructorParameters<typeof Vault>[0];
}

describe("active-case pointer writes", () => {
  let v: Vault;
  let dbName: string;

  beforeEach(async () => {
    dbName = `appealdeck-pointer-atomic-${Math.random().toString(36).slice(2, 10)}`;
    v = new Vault(provider(), new VaultDB(dbName));
    await v.open();
    await v.initWithPassphrase("super-secret-pass");
  });
  afterEach(async () => {
    await v.close();
    indexedDB.deleteDatabase(dbName);
  });

  it("adopts a pre-migration case by replacing the pointer inside one transaction", async () => {
    await v.addString({
      name: "case_file",
      mimeType: "application/json",
      data: JSON.stringify({ kind: "POLICY", createdAt: "2026-01-01T00:00:00.000Z" }),
      caseId: "appealdeck-case-1",
      kind: "case",
    });
    // The pointer and the index are each a delete followed by an add. Run outside a transaction, a
    // second tab reading between the two sees no pointer at all.
    const atomic = vi.spyOn(v, "atomic");
    expect(await getActiveCaseId(v)).toBe("appealdeck-case-1");
    expect(atomic).toHaveBeenCalled();
  });
});
