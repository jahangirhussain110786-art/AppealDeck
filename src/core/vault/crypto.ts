import {
  AES_IV_LENGTH_BYTES,
  AES_KEY_LENGTH_BITS,
  PBKDF2_HASH,
  PBKDF2_ITERATIONS,
  SALT_LENGTH_BYTES,
  VAULT_ENVELOPE_VERSION,
  VaultCryptoError,
  type EncryptionEnvelope,
  type KdfParams,
  type WrappedDek,
} from "./envelope";

export type SubtleCryptoLike = {
  importKey: SubtleCrypto["importKey"];
  deriveBits: SubtleCrypto["deriveBits"];
  deriveKey: SubtleCrypto["deriveKey"];
  encrypt: SubtleCrypto["encrypt"];
  decrypt: SubtleCrypto["decrypt"];
  generateKey: SubtleCrypto["generateKey"];
  exportKey: SubtleCrypto["exportKey"];
  digest: SubtleCrypto["digest"];
};

export interface WebCryptoLike {
  getRandomValues: <T extends ArrayBufferView>(arr: T) => T;
  subtle: SubtleCryptoLike;
}

export function getSubtleCrypto(provider: WebCryptoLike): SubtleCryptoLike {
  return provider.subtle;
}

export function toBase64(bytes: Uint8Array): string {
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i] as number);
  }
  return btoa(binary);
}

export function fromBase64(b64: string): Uint8Array {
  if (typeof Buffer !== "undefined") {
    const buf = Buffer.from(b64, "base64");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  }
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

export function randomBytes(provider: WebCryptoLike, length: number): Uint8Array {
  if (length <= 0) {
    throw new VaultCryptoError("INVALID_INPUT", "randomBytes length must be > 0");
  }
  const out = new Uint8Array(length);
  provider.getRandomValues(out);
  return out;
}

export function assertProvider(provider: unknown): WebCryptoLike {
  if (
    !provider ||
    typeof provider !== "object" ||
    typeof (provider as { getRandomValues?: unknown }).getRandomValues !== "function" ||
    !(provider as { subtle?: unknown }).subtle
  ) {
    throw new VaultCryptoError("KEY_DERIVATION_FAILED", "WebCrypto provider is not available");
  }
  return provider as WebCryptoLike;
}

export async function importPassphraseKey(
  provider: WebCryptoLike,
  passphrase: string,
): Promise<CryptoKey> {
  if (typeof passphrase !== "string" || passphrase.length === 0) {
    throw new VaultCryptoError("INVALID_INPUT", "Passphrase must be a non-empty string");
  }
  const enc = new TextEncoder();
  const bytes = enc.encode(passphrase);
  return provider.subtle.importKey("raw", bytes as BufferSource, { name: "PBKDF2" }, false, [
    "deriveBits",
    "deriveKey",
  ]);
}

export function newKdfParams(provider: WebCryptoLike, iters = PBKDF2_ITERATIONS): KdfParams {
  const salt = randomBytes(provider, SALT_LENGTH_BYTES);
  return {
    kdf: "PBKDF2-SHA-256",
    iters,
    salt: toBase64(salt),
  };
}

export async function deriveDek(
  provider: WebCryptoLike,
  passphrase: string,
  params: KdfParams,
): Promise<CryptoKey> {
  if (params.kdf !== "PBKDF2-SHA-256") {
    throw new VaultCryptoError("KEY_DERIVATION_FAILED", `Unsupported KDF: ${params.kdf}`);
  }
  const baseKey = await importPassphraseKey(provider, passphrase);
  return provider.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: fromBase64(params.salt) as BufferSource,
      iterations: params.iters,
      hash: PBKDF2_HASH,
    },
    baseKey,
    { name: "AES-GCM", length: AES_KEY_LENGTH_BITS },
    false,
    ["encrypt", "decrypt"],
  );
}

export function generateDek(provider: WebCryptoLike): Promise<CryptoKey> {
  return provider.subtle.generateKey({ name: "AES-GCM", length: AES_KEY_LENGTH_BITS }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export function exportRawKey(provider: WebCryptoLike, key: CryptoKey): Promise<Uint8Array> {
  return provider.subtle.exportKey("raw", key).then((buf: ArrayBuffer) => new Uint8Array(buf));
}

export function importRawDek(provider: WebCryptoLike, raw: Uint8Array): Promise<CryptoKey> {
  return provider.subtle.importKey("raw", raw as BufferSource, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encryptString(
  provider: WebCryptoLike,
  key: CryptoKey,
  plaintext: string,
  associatedData?: Uint8Array,
): Promise<EncryptionEnvelope> {
  if (typeof plaintext !== "string") {
    throw new VaultCryptoError("INVALID_INPUT", "Plaintext must be a string");
  }
  const enc = new TextEncoder();
  const iv = randomBytes(provider, AES_IV_LENGTH_BYTES);
  let ctBuf: ArrayBuffer;
  try {
    ctBuf = await provider.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource, additionalData: associatedData as BufferSource },
      key,
      enc.encode(plaintext) as BufferSource,
    );
  } catch (cause) {
    throw new VaultCryptoError(
      "ENCRYPT_FAILED",
      cause instanceof Error ? cause.message : "Encryption failed",
    );
  }
  const result: EncryptionEnvelope = {
    v: VAULT_ENVELOPE_VERSION,
    alg: "AES-GCM",
    iv: toBase64(iv),
    ct: toBase64(new Uint8Array(ctBuf)),
  };
  if (associatedData) {
    result.ad = toBase64(associatedData);
  }
  return result;
}

export async function decryptString(
  provider: WebCryptoLike,
  key: CryptoKey,
  envelope: EncryptionEnvelope,
  associatedData?: Uint8Array,
): Promise<string> {
  if (envelope.v !== VAULT_ENVELOPE_VERSION) {
    throw new VaultCryptoError(
      "ENVELOPE_TOO_NEW",
      `Envelope version ${envelope.v} is newer than the running app (${VAULT_ENVELOPE_VERSION})`,
    );
  }
  if (envelope.alg !== "AES-GCM") {
    throw new VaultCryptoError("ENVELOPE_CORRUPT", `Unsupported algorithm: ${envelope.alg}`);
  }
  const iv = fromBase64(envelope.iv);
  const ct = fromBase64(envelope.ct);
  const ad = associatedData ?? (envelope.ad ? fromBase64(envelope.ad) : undefined);
  let plainBuf: ArrayBuffer;
  try {
    plainBuf = await provider.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource, additionalData: ad as BufferSource },
      key,
      ct as BufferSource,
    );
  } catch {
    throw new VaultCryptoError(
      "WRONG_PASSPHRASE",
      "Decryption failed (wrong key or tampered data)",
    );
  }
  return new TextDecoder().decode(plainBuf);
}

export async function encryptBytes(
  provider: WebCryptoLike,
  key: CryptoKey,
  data: Uint8Array,
): Promise<EncryptionEnvelope> {
  if (!(data instanceof Uint8Array)) {
    throw new VaultCryptoError("INVALID_INPUT", "Ciphertext input must be a Uint8Array");
  }
  const iv = randomBytes(provider, AES_IV_LENGTH_BYTES);
  let ctBuf: ArrayBuffer;
  try {
    ctBuf = await provider.subtle.encrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      data as BufferSource,
    );
  } catch (cause) {
    throw new VaultCryptoError(
      "ENCRYPT_FAILED",
      cause instanceof Error ? cause.message : "Encryption failed",
    );
  }
  return {
    v: VAULT_ENVELOPE_VERSION,
    alg: "AES-GCM",
    iv: toBase64(iv),
    ct: toBase64(new Uint8Array(ctBuf)),
  };
}

export async function decryptBytes(
  provider: WebCryptoLike,
  key: CryptoKey,
  envelope: EncryptionEnvelope,
): Promise<Uint8Array> {
  if (envelope.v !== VAULT_ENVELOPE_VERSION) {
    throw new VaultCryptoError(
      "ENVELOPE_TOO_NEW",
      `Envelope version ${envelope.v} is newer than the running app (${VAULT_ENVELOPE_VERSION})`,
    );
  }
  if (envelope.alg !== "AES-GCM") {
    throw new VaultCryptoError("ENVELOPE_CORRUPT", `Unsupported algorithm: ${envelope.alg}`);
  }
  const iv = fromBase64(envelope.iv);
  const ct = fromBase64(envelope.ct);
  let plainBuf: ArrayBuffer;
  try {
    plainBuf = await provider.subtle.decrypt(
      { name: "AES-GCM", iv: iv as BufferSource },
      key,
      ct as BufferSource,
    );
  } catch {
    throw new VaultCryptoError(
      "WRONG_PASSPHRASE",
      "Decryption failed (wrong key or tampered data)",
    );
  }
  return new Uint8Array(plainBuf);
}

export async function wrapDek(
  provider: WebCryptoLike,
  dek: CryptoKey,
  passphrase: string,
  kdf: KdfParams,
): Promise<WrappedDek> {
  const raw = await exportRawKey(provider, dek);
  const kek = await deriveDek(provider, passphrase, kdf);
  return encryptBytes(provider, kek, raw).then((env) => ({
    v: VAULT_ENVELOPE_VERSION,
    alg: "AES-GCM",
    iv: env.iv,
    ct: env.ct,
    kdf,
  }));
}

export async function unwrapDek(
  provider: WebCryptoLike,
  passphrase: string,
  wrapped: WrappedDek,
): Promise<CryptoKey> {
  if (wrapped.v !== VAULT_ENVELOPE_VERSION) {
    throw new VaultCryptoError(
      "ENVELOPE_TOO_NEW",
      `Wrapped-DEK version ${wrapped.v} is newer than the running app`,
    );
  }
  const kek = await deriveDek(provider, passphrase, wrapped.kdf);
  let raw: Uint8Array;
  try {
    raw = await decryptBytes(provider, kek, {
      v: wrapped.v,
      alg: wrapped.alg,
      iv: wrapped.iv,
      ct: wrapped.ct,
    });
  } catch (cause) {
    if (cause instanceof VaultCryptoError && cause.code === "WRONG_PASSPHRASE") {
      throw new VaultCryptoError("WRONG_PASSPHRASE", "Passphrase did not unlock the DEK");
    }
    throw cause;
  }
  return importRawDek(provider, raw);
}

export async function generateDeviceKey(provider: WebCryptoLike): Promise<CryptoKey> {
  return provider.subtle.generateKey({ name: "AES-GCM", length: AES_KEY_LENGTH_BITS }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function wrapDekWithKey(
  provider: WebCryptoLike,
  dek: CryptoKey,
  kek: CryptoKey,
): Promise<EncryptionEnvelope> {
  const raw = await exportRawKey(provider, dek);
  return encryptBytes(provider, kek, raw);
}

export async function unwrapDekWithKey(
  provider: WebCryptoLike,
  kek: CryptoKey,
  env: EncryptionEnvelope,
): Promise<CryptoKey> {
  const raw = await decryptBytes(provider, kek, env);
  return importRawDek(provider, raw);
}
