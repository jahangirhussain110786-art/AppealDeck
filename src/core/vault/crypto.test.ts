import { describe, it, expect, beforeAll } from "vitest";
import { webcrypto } from "node:crypto";
import {
  decryptBytes,
  decryptString,
  encryptBytes,
  encryptString,
  exportRawKey,
  generateDek,
  importRawDek,
  deriveDek,
  newKdfParams,
  unwrapDek,
  wrapDek,
  fromBase64,
  toBase64,
} from "./crypto";
import { PBKDF2_ITERATIONS, VAULT_ENVELOPE_VERSION, VaultCryptoError } from "./envelope";

const provider = {
  subtle: webcrypto.subtle,
  getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
} as unknown as Parameters<typeof deriveDek>[0];

describe("vault crypto", () => {
  beforeAll(() => {
    if (!provider?.subtle) {
      throw new Error("Node webcrypto is unavailable in this environment");
    }
  });

  it("roundtrips a string under passphrase-derived key", async () => {
    const params = newKdfParams(provider);
    const key = await deriveDek(provider, "correct horse battery staple", params);
    const env = await encryptString(
      provider,
      key,
      "secret POA text",
      new TextEncoder().encode("context"),
    );
    const out = await decryptString(provider, key, env, new TextEncoder().encode("context"));
    expect(out).toBe("secret POA text");
  });

  it("fails clearly on wrong passphrase", async () => {
    const params = newKdfParams(provider);
    const key = await deriveDek(provider, "right", params);
    const env = await encryptString(provider, key, "secret");
    const wrong = await deriveDek(provider, "wrong", params);
    await expect(decryptString(provider, wrong, env)).rejects.toMatchObject({
      name: "VaultCryptoError",
      code: "WRONG_PASSPHRASE",
    });
  });

  it("rejects tampered ciphertext (AES-GCM auth tag)", async () => {
    const params = newKdfParams(provider);
    const key = await deriveDek(provider, "x", params);
    const env = await encryptString(provider, key, "secret");
    const ctBytes = fromBase64(env.ct);
    ctBytes[0] = ctBytes[0]! ^ 0xff;
    env.ct = toBase64(ctBytes);
    await expect(decryptString(provider, key, env)).rejects.toBeInstanceOf(VaultCryptoError);
  });

  it("rejects future envelope versions", async () => {
    const params = newKdfParams(provider);
    const key = await deriveDek(provider, "x", params);
    const env = await encryptString(provider, key, "secret");
    env.v = (VAULT_ENVELOPE_VERSION + 1) as typeof VAULT_ENVELOPE_VERSION;
    await expect(decryptString(provider, key, env)).rejects.toMatchObject({
      code: "ENVELOPE_TOO_NEW",
    });
  });

  it("roundtrips arbitrary bytes (file blob)", async () => {
    const params = newKdfParams(provider);
    const key = await deriveDek(provider, "x", params);
    const data = new Uint8Array(2048);
    for (let i = 0; i < data.length; i += 1) data[i] = (i * 7) & 0xff;
    const env = await encryptBytes(provider, key, data);
    const back = await decryptBytes(provider, key, env);
    expect(Array.from(back)).toEqual(Array.from(data));
  });

  it("wraps and unwraps a DEK roundtrip", async () => {
    const params = newKdfParams(provider);
    const dek = await generateDek(provider);
    const wrapped = await wrapDek(provider, dek, "passA", params);
    const back = await unwrapDek(provider, "passA", wrapped);
    const rawDek = await exportRawKey(provider, dek);
    const rawBack = await exportRawKey(provider, back);
    expect(toBase64(rawBack)).toBe(toBase64(rawDek));
  });

  it("wrap/unwrap fails clearly on wrong passphrase", async () => {
    const params = newKdfParams(provider);
    const dek = await generateDek(provider);
    const wrapped = await wrapDek(provider, dek, "passA", params);
    await expect(unwrapDek(provider, "passB", wrapped)).rejects.toMatchObject({
      code: "WRONG_PASSPHRASE",
    });
  });

  it("import-export raw key preserves bytes", async () => {
    const dek = await generateDek(provider);
    const raw = await exportRawKey(provider, dek);
    const back = await importRawDek(provider, raw);
    const raw2 = await exportRawKey(provider, back);
    expect(toBase64(raw2)).toBe(toBase64(raw));
  });

  it("newKdfParams uses the configured PBKDF2 iteration count", () => {
    const p = newKdfParams(provider);
    expect(p.iters).toBe(PBKDF2_ITERATIONS);
    expect(p.kdf).toBe("PBKDF2-SHA-256");
    expect(fromBase64(p.salt).length).toBe(16);
  });

  it("rejects empty passphrase", async () => {
    await expect(deriveDek(provider, "", newKdfParams(provider))).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
  });
});
