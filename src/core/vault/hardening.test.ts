import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { afterEach, describe, expect, it } from "vitest";
import { Vault, VaultAlreadyInitializedError } from "./vault";
import { VaultDB } from "./db";
import {
  deriveDek,
  encryptBytes,
  exportRawKey,
  generateDek,
  newKdfParams,
  unwrapDek,
  wrapDek,
} from "./crypto";
import { PBKDF2_ITERATIONS, VaultCryptoError } from "./envelope";

const subtle = webcrypto.subtle;
function provider() {
  return {
    subtle,
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
  } as unknown as ConstructorParameters<typeof Vault>[0];
}

const dbs: VaultDB[] = [];
function vaultOn(name = `hardening-${crypto.randomUUID()}`, p = provider()) {
  const db = new VaultDB(name);
  dbs.push(db);
  return { vault: new Vault(p, db), db, name };
}
afterEach(async () => {
  for (const db of dbs.splice(0)) {
    db.close();
    await db.delete();
  }
});

describe("first sign-in race between two tabs", () => {
  it("copyIntoEmpty refuses to overwrite a key another tab already wrote", async () => {
    const guest = vaultOn().vault;
    await guest.open();
    await guest.initWithDeviceKey();
    await guest.addString({ name: "g", mimeType: "text/plain", data: "guest" });

    const { vault: tabB, name } = vaultOn();
    await tabB.open();
    await tabB.initWithDeviceKey(); // tab B holds its own DEK on the still-empty account DB

    const tabA = vaultOn(name).vault;
    await tabA.open();
    await expect(tabA.copyIntoEmpty(guest)).rejects.toBeInstanceOf(VaultAlreadyInitializedError);
    // Tab B's key was not replaced: what it writes afterwards is readable after a fresh unlock.
    const mine = await tabB.addString({ name: "b", mimeType: "text/plain", data: "from B" });
    const fresh = vaultOn(name).vault;
    await fresh.open();
    await fresh.unlockWithDeviceKey();
    expect((await fresh.getString(mine.id)).text).toBe("from B");
  });

  it("importAll refuses when the key store changes while the backup is being verified", async () => {
    const source = vaultOn().vault;
    await source.open();
    await source.initWithDeviceKey();
    await source.addString({ name: "x", mimeType: "text/plain", data: "x" });
    const backup = await source.exportPortable("backup password");

    // A provider whose second decrypt (the first record) lets "another tab" initialise the target.
    const { vault: other, name } = vaultOn();
    let calls = 0;
    const slowSubtle = Object.fromEntries(
      (
        [
          "importKey",
          "deriveBits",
          "deriveKey",
          "encrypt",
          "decrypt",
          "generateKey",
          "exportKey",
          "digest",
        ] as const
      ).map((k) => [k, (subtle[k] as (...a: unknown[]) => unknown).bind(subtle)]),
    ) as Record<string, unknown>;
    const realDecrypt = slowSubtle.decrypt as (...a: unknown[]) => Promise<ArrayBuffer>;
    slowSubtle.decrypt = async (...args: unknown[]) => {
      calls += 1;
      if (calls === 2) {
        await other.open();
        await other.initWithDeviceKey();
      }
      return realDecrypt(...args);
    };
    const target = vaultOn(name, {
      subtle: slowSubtle,
      getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
    } as never).vault;
    await target.open();
    await expect(
      target.importAll(backup, {
        sourcePassphrase: "backup password",
        destinationPassphrase: "restored password",
      }),
    ).rejects.toBeInstanceOf(VaultAlreadyInitializedError);
    expect((await other.rawMeta())?.mode.kind).toBe("device");
  });
});

describe("passphrase normalisation", () => {
  const composed = "café passphrase";
  const decomposed = "café passphrase";

  it("unlocks a vault with either spelling of the same characters", async () => {
    const { vault } = vaultOn();
    await vault.open();
    await vault.initWithPassphrase(composed);
    vault.lock();
    await vault.unlock(decomposed);
    expect(vault.isUnlocked()).toBe(true);
  });

  it("still unlocks a vault keyed on the raw decomposed text before normalisation existed", async () => {
    const p = provider();
    const dek = await generateDek(p);
    const kdf = newKdfParams(p);
    const kek = await deriveDek(p, decomposed, kdf); // old behaviour: raw text, no NFC
    const sealed = await encryptBytes(p, kek, await exportRawKey(p, dek));
    const legacy = { v: 1 as const, alg: "AES-GCM" as const, iv: sealed.iv, ct: sealed.ct, kdf };
    await expect(unwrapDek(p, decomposed, legacy)).resolves.toBeTruthy();
    await expect(unwrapDek(p, "something else entirely", legacy)).rejects.toMatchObject({
      code: "WRONG_PASSPHRASE",
    });
  });
});

describe("key derivation strength", () => {
  it("uses 600k iterations for new keys", () => {
    expect(PBKDF2_ITERATIONS).toBe(600_000);
    expect(newKdfParams(provider()).iters).toBe(600_000);
  });

  it("a key wrapped at the earlier 310k count, with its stored count, still unwraps", async () => {
    const p = provider();
    const dek = await generateDek(p);
    const kdf = newKdfParams(p, 310_000);
    const wrapped = await wrapDek(p, dek, "old vault passphrase", kdf);
    expect(wrapped.kdf.iters).toBe(310_000);
    await expect(unwrapDek(p, "old vault passphrase", wrapped)).resolves.toBeTruthy();
  });
});

describe("records are bound to their id", () => {
  it("rejects ciphertext moved under another record's id", async () => {
    const { vault, db } = vaultOn();
    await vault.open();
    await vault.initWithDeviceKey();
    const a = await vault.addString({ name: "a", mimeType: "text/plain", data: "A secret" });
    const b = await vault.addString({ name: "b", mimeType: "text/plain", data: "B secret" });
    const rowA = await db.records.get(a.id);
    await db.records.update(b.id, { ciphertext: rowA!.ciphertext });
    await expect(vault.get(b.id)).rejects.toMatchObject({ code: "ENVELOPE_CORRUPT" });
    // Forging the id label does not help: the tag was computed over the original id.
    await db.records.update(b.id, { ciphertext: { ...rowA!.ciphertext, ad: b.id } });
    await expect(vault.get(b.id)).rejects.toBeInstanceOf(VaultCryptoError);
    expect((await vault.getString(a.id)).text).toBe("A secret");
  });

  it("still reads records written before ids were bound (no ad)", async () => {
    const { vault, db } = vaultOn();
    await vault.open();
    await vault.initWithPassphrase("super-secret-pass");
    const rec = await vault.addString({ name: "n", mimeType: "text/plain", data: "legacy body" });
    // Re-seal the same bytes the old way: no associated data, no `ad` field.
    const dek = (vault as unknown as { dek: CryptoKey }).dek;
    const old = await encryptBytes(provider(), dek, new TextEncoder().encode("legacy body"));
    expect(old.ad).toBeUndefined();
    await db.records.update(rec.id, { ciphertext: old });
    expect((await vault.getString(rec.id)).text).toBe("legacy body");
  });
});

describe("changePassphrase on a device-mode vault", () => {
  it("says what is wrong instead of 'not initialized'", async () => {
    const { vault } = vaultOn();
    await vault.open();
    await vault.initWithDeviceKey();
    const err = await vault.changePassphrase("anything-here", "another-pass-1").catch((e) => e);
    expect(err).toBeInstanceOf(VaultCryptoError);
    expect(err.code).toBe("INVALID_INPUT");
    expect(err.message).toMatch(/no passphrase to change/);
    expect(err.message).not.toMatch(/not initialized/);
  });
});
