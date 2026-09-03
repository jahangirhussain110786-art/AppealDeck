export const VAULT_DB_NAME = "appealdeck-vault" as const;
export const VAULT_DB_VERSION = 1 as const;

export type VaultRecordKind = "document" | "case" | "note" | "letter" | "other";

export interface VaultRecordInput {
  id: string;
  kind: VaultRecordKind;
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  evidenceKind?: string;
  caseId?: string;
  ciphertext: import("./envelope").EncryptionEnvelope;
  plaintextHash: string;
  schemaVersion: typeof import("./envelope").VAULT_ENVELOPE_VERSION;
}

export interface VaultKeyStore {
  mode: import("./envelope").KeyMode;
  wrappedDek?: import("./envelope").WrappedDek;
  kdf?: import("./envelope").KdfParams;
  version: typeof import("./envelope").VAULT_ENVELOPE_VERSION;
  createdAt: string;
}

export interface VaultMeta {
  key: typeof VAULT_DB_NAME;
  value: VaultKeyStore;
}
