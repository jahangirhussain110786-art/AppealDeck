import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Vault } from "./vault";
import { VaultDB } from "./db";
import { VaultCryptoError, VAULT_ENVELOPE_VERSION } from "./envelope";

function provider() {
  return {
    subtle: webcrypto.subtle,
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
  } as unknown as Parameters<typeof Vault>[0];
}

function newVault(): { vault: Vault; dbName: string } {
  const dbName = `appealdeck-vault-test-${Math.random().toString(36).slice(2, 10)}`;
  const v = new Vault(provider(), new VaultDB(dbName));
  return { vault: v, dbName };
}

describe("Vault", () => {
  let v: Vault;
  let dbName: string;

  beforeEach(async () => {
    ({ vault: v, dbName } = newVault());
    await v.open();
  });

  afterEach(async () => {
    try {
      await v.close();
    } catch {
      // ignore
    }
    try {
      await indexedDB.deleteDatabase(dbName);
    } catch {
      // ignore
    }
  });

  it("starts uninitialized", async () => {
    expect(await v.status()).toEqual({ state: "uninitialized" });
    expect(await v.isInitialized()).toBe(false);
  });

  it("initializes with passphrase and unlocks", async () => {
    await v.initWithPassphrase("super-secret-pass");
    expect(await v.status()).toEqual({ state: "unlocked" });
    await v.lock();
    expect(await v.status()).toMatchObject({ state: "locked", mode: "passphrase" });
    await v.unlock("super-secret-pass");
    expect(await v.status()).toEqual({ state: "unlocked" });
  });

  it("rejects wrong passphrase on unlock", async () => {
    await v.initWithPassphrase("super-secret-pass");
    await v.lock();
    await expect(v.unlock("wrong-pass")).rejects.toMatchObject({ code: "WRONG_PASSPHRASE" });
  });

  it("enforces minimum passphrase length on init", async () => {
    await expect(v.initWithPassphrase("short")).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
  });

  it("adds and reads a document roundtrip", async () => {
    await v.initWithPassphrase("super-secret-pass");
    const payload = new TextEncoder().encode("Hello, encrypted world!");
    const rec = await v.add({
      name: "invoice.pdf",
      mimeType: "application/pdf",
      data: payload,
      tags: ["supplier"],
      evidenceKind: "supplier_invoice",
    });
    expect(rec.id).toBeTruthy();
    expect(rec.sizeBytes).toBe(payload.byteLength);
    const { bytes, record } = await v.get(rec.id);
    expect(Array.from(bytes)).toEqual(Array.from(payload));
    expect(record.name).toBe("invoice.pdf");
    expect(record.evidenceKind).toBe("supplier_invoice");
    expect(record.schemaVersion).toBe(VAULT_ENVELOPE_VERSION);
  });

  it("lists records newest first", async () => {
    await v.initWithPassphrase("super-secret-pass");
    await v.add({ name: "a", mimeType: "text/plain", data: "one" });
    await new Promise((r) => setTimeout(r, 5));
    await v.add({ name: "b", mimeType: "text/plain", data: "two" });
    const list = await v.list();
    expect(list.map((x) => x.name)).toEqual(["b", "a"]);
  });

  it("filters by caseId and evidenceKind", async () => {
    await v.initWithPassphrase("super-secret-pass");
    await v.add({ name: "x", mimeType: "text/plain", data: "x", caseId: "case-1" });
    await v.add({
      name: "y",
      mimeType: "text/plain",
      data: "y",
      caseId: "case-2",
      evidenceKind: "supplier_invoice",
    });
    const onlyCase1 = await v.list({ caseId: "case-1" });
    expect(onlyCase1.map((x) => x.name)).toEqual(["x"]);
    const onlyInvoice = await v.list({ evidenceKind: "supplier_invoice" });
    expect(onlyInvoice.map((x) => x.name)).toEqual(["y"]);
  });

  it("deletes a record", async () => {
    await v.initWithPassphrase("super-secret-pass");
    const rec = await v.add({ name: "x", mimeType: "text/plain", data: "x" });
    await v.delete(rec.id);
    const list = await v.list();
    expect(list).toHaveLength(0);
  });

  it("purges the entire vault (records + meta)", async () => {
    await v.initWithPassphrase("super-secret-pass");
    await v.add({ name: "x", mimeType: "text/plain", data: "x" });
    await v.purge();
    expect(await v.status()).toEqual({ state: "uninitialized" });
    expect(await v.list()).toEqual([]);
  });

  it("refuses to add when locked", async () => {
    await v.initWithPassphrase("super-secret-pass");
    await v.lock();
    await expect(v.add({ name: "x", mimeType: "text/plain", data: "x" })).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
  });

  it("refuses records above 10 MB", async () => {
    await v.initWithPassphrase("super-secret-pass");
    const big = new Uint8Array(10 * 1024 * 1024 + 1);
    await expect(
      v.add({ name: "big", mimeType: "application/octet-stream", data: big }),
    ).rejects.toMatchObject({ code: "INVALID_INPUT" });
  });

  it("changes passphrase and decrypts with the new one", async () => {
    await v.initWithPassphrase("super-secret-pass");
    const rec = await v.add({ name: "x", mimeType: "text/plain", data: "payload" });
    await v.changePassphrase("super-secret-pass", "new-pass-2026");
    await v.lock();
    await v.unlock("new-pass-2026");
    const { bytes } = await v.get(rec.id);
    expect(new TextDecoder().decode(bytes)).toBe("payload");
    await expect(v.unlock("super-secret-pass")).rejects.toMatchObject({
      code: "WRONG_PASSPHRASE",
    });
  });

  it("exports and re-imports the full vault (different DB)", async () => {
    await v.initWithPassphrase("super-secret-pass");
    const rec = await v.add({
      name: "x",
      mimeType: "text/plain",
      data: "secret",
      caseId: "case-A",
    });
    const payload = await v.exportAll();
    const { vault: v2, dbName: db2 } = newVault();
    try {
      await v2.open();
      const n = await v2.importAll(payload, {
        sourcePassphrase: "super-secret-pass",
        destinationPassphrase: "other-pass-2026",
      });
      expect(n).toBe(1);
      const { text, record } = await v2.getString(rec.id);
      expect(text).toBe("secret");
      expect(record.caseId).toBe("case-A");
      await v2.lock();
      await v2.unlock("other-pass-2026");
      const { text: t2 } = await v2.getString(rec.id);
      expect(t2).toBe("secret");
    } finally {
      await v2.close();
      await indexedDB.deleteDatabase(db2);
    }
  });

  it("rejects imports with newer envelope versions", async () => {
    await v.initWithPassphrase("super-secret-pass");
    const rec = await v.add({ name: "x", mimeType: "text/plain", data: "x" });
    const payload = await v.exportAll();
    const broken = {
      ...payload,
      version: (VAULT_ENVELOPE_VERSION + 1) as typeof VAULT_ENVELOPE_VERSION,
    };
    await expect(
      v.importAll(broken, {
        sourcePassphrase: "super-secret-pass",
        destinationPassphrase: "other-pass-2026",
      }),
    ).rejects.toBeInstanceOf(VaultCryptoError);
  });

  it("blocks a record with a future envelope version (mixed-vault defense)", async () => {
    await v.initWithPassphrase("super-secret-pass");
    const rec = await v.add({ name: "x", mimeType: "text/plain", data: "x" });
    const row = await v.rawMeta();
    expect(row).toBeTruthy();
    const list = await v.list();
    expect(list).toHaveLength(1);
    expect(list[0]?.id).toBe(rec.id);
  });
});
