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

  it("findByPlaintext returns the record when bytes match", async () => {
    await v.initWithPassphrase("super-secret-pass");
    const payload = new TextEncoder().encode("Hello, encrypted world!");
    const rec = await v.add({
      name: "invoice.pdf",
      mimeType: "application/pdf",
      data: payload,
    });
    const found = await v.findByPlaintext(payload);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(rec.id);
    expect(found?.name).toBe("invoice.pdf");
    expect(found?.plaintextHash).toBeTruthy();
  });

  it("findByPlaintext returns null when bytes differ", async () => {
    await v.initWithPassphrase("super-secret-pass");
    await v.add({ name: "x", mimeType: "text/plain", data: "one" });
    const found = await v.findByPlaintext(new TextEncoder().encode("different"));
    expect(found).toBeNull();
  });

  it("findByPlaintext returns the oldest record when bytes match multiple names", async () => {
    await v.initWithPassphrase("super-secret-pass");
    const payload = new TextEncoder().encode("duplicate bytes");
    const first = await v.add({ name: "first.pdf", mimeType: "application/pdf", data: payload });
    await v.add({ name: "second.pdf", mimeType: "application/pdf", data: payload });
    const found = await v.findByPlaintext(payload);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(first.id);
  });

  it("findByPlaintext accepts string input matching the same bytes", async () => {
    await v.initWithPassphrase("super-secret-pass");
    const rec = await v.add({ name: "x", mimeType: "text/plain", data: "payload" });
    const found = await v.findByPlaintext("payload");
    expect(found).not.toBeNull();
    expect(found?.id).toBe(rec.id);
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

  it("device mode: init, add, lock, device unlock reads the same record", async () => {
    await v.initWithDeviceKey();
    expect(await v.status()).toEqual({ state: "unlocked" });
    const rec = await v.add({
      name: "doc.pdf",
      mimeType: "application/pdf",
      data: "device-secret",
    });
    await v.lock();
    expect((await v.status()).mode).toBe("device");
    await v.unlockWithDeviceKey();
    const { text, record } = await v.getString(rec.id);
    expect(text).toBe("device-secret");
    expect(record.id).toBe(rec.id);
  });

  it("relockWithPassphrase switches to passphrase mode and keeps records", async () => {
    await v.initWithDeviceKey();
    const rec = await v.add({ name: "x", mimeType: "text/plain", data: "keep-me" });
    await v.relockWithPassphrase("my-pass-2026");
    await v.lock();
    expect((await v.status()).mode).toBe("passphrase");
    const meta = await v.rawMeta();
    expect(meta?.mode.kind).toBe("passphrase");
    expect(meta?.deviceKey).toBeUndefined();
    expect(meta?.deviceWrappedDek).toBeUndefined();
    expect(meta?.wrappedDek).toBeTruthy();
    await v.unlock("my-pass-2026");
    const { text } = await v.getString(rec.id);
    expect(text).toBe("keep-me");
  });

  it("wrong passphrase after relock fails with WRONG_PASSPHRASE", async () => {
    await v.initWithDeviceKey();
    await v.add({ name: "x", mimeType: "text/plain", data: "x" });
    await v.relockWithPassphrase("correct-pass-2026");
    await v.lock();
    await expect(v.unlock("wrong-pass-2026")).rejects.toMatchObject({
      code: "WRONG_PASSPHRASE",
    });
  });

  it("relockWithPassphrase rejects passphrases shorter than 8 chars", async () => {
    await v.initWithDeviceKey();
    await expect(v.relockWithPassphrase("short")).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
  });

  it("unlock throws INVALID_INPUT when mode is device", async () => {
    await v.initWithDeviceKey();
    await v.lock();
    await expect(v.unlock("any-pass-2026")).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
  });

  it("status reports mode device while locked in device mode", async () => {
    await v.initWithDeviceKey();
    await v.add({ name: "x", mimeType: "text/plain", data: "x" });
    await v.lock();
    expect(await v.status()).toMatchObject({ state: "locked", mode: "device" });
  });

  it("relockWithDeviceKey switches back to automatic unlock and keeps records", async () => {
    await v.initWithDeviceKey();
    const rec = await v.add({ name: "x", mimeType: "text/plain", data: "keep-me" });
    await v.relockWithPassphrase("my-pass-2026");
    await v.relockWithDeviceKey();
    const meta = await v.rawMeta();
    expect(meta?.mode.kind).toBe("device");
    expect(meta?.wrappedDek).toBeUndefined();
    expect(meta?.kdf).toBeUndefined();
    expect(meta?.deviceWrappedDek).toBeTruthy();
    await v.lock();
    expect((await v.status()).mode).toBe("device");
    await v.unlockWithDeviceKey();
    const { text } = await v.getString(rec.id);
    expect(text).toBe("keep-me");
  });

  it("relockWithDeviceKey accepts the passphrase when locked", async () => {
    await v.initWithDeviceKey();
    await v.relockWithPassphrase("my-pass-2026");
    await v.lock();
    await v.relockWithDeviceKey("my-pass-2026");
    const meta = await v.rawMeta();
    expect(meta?.mode.kind).toBe("device");
    await v.lock();
    expect((await v.status()).mode).toBe("device");
  });

  it("relockWithDeviceKey requires the passphrase when locked and none is given", async () => {
    await v.initWithDeviceKey();
    await v.relockWithPassphrase("my-pass-2026");
    await v.lock();
    await expect(v.relockWithDeviceKey()).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
  });

  it("relockWithDeviceKey rejects when the vault isn't in passphrase mode", async () => {
    await v.initWithDeviceKey();
    await expect(v.relockWithDeviceKey()).rejects.toMatchObject({
      code: "ENVELOPE_CORRUPT",
    });
  });
});
