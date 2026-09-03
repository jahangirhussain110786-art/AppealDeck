export const VAULT_ENVELOPE_VERSION = 1 as const;

export const PBKDF2_ITERATIONS = 310_000;
export const PBKDF2_HASH = "SHA-256" as const;
export const AES_KEY_LENGTH_BITS = 256;
export const AES_IV_LENGTH_BYTES = 12;
export const SALT_LENGTH_BYTES = 16;

export interface EncryptionEnvelope {
  v: typeof VAULT_ENVELOPE_VERSION;
  alg: "AES-GCM";
  iv: string;
  ct: string;
  ad?: string;
}

export interface KdfParams {
  kdf: "PBKDF2-SHA-256";
  iters: number;
  salt: string;
}

export interface WrappedDek {
  v: typeof VAULT_ENVELOPE_VERSION;
  alg: "AES-GCM";
  iv: string;
  ct: string;
  kdf: KdfParams;
}

export type KeyMode =
  | { kind: "passphrase"; kdf: KdfParams; verifiedAt: string }
  | { kind: "wrapped"; verifiedAt: string };

export interface VaultConfig {
  mode: KeyMode;
  version: typeof VAULT_ENVELOPE_VERSION;
  createdAt: string;
}

export class VaultCryptoError extends Error {
  readonly code:
    | "WRONG_PASSPHRASE"
    | "ENVELOPE_TOO_NEW"
    | "ENVELOPE_CORRUPT"
    | "KEY_DERIVATION_FAILED"
    | "ENCRYPT_FAILED"
    | "DECRYPT_FAILED"
    | "INVALID_INPUT";
  constructor(code: VaultCryptoError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "VaultCryptoError";
  }
}
