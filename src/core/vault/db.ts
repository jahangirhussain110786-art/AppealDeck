import Dexie, { type Table } from "dexie";
import {
  VAULT_DB_NAME,
  VAULT_DB_VERSION,
  type VaultKeyStore,
  type VaultRecordInput,
} from "./schema";
import { VAULT_ENVELOPE_VERSION } from "./envelope";

export class VaultDB extends Dexie {
  records!: Table<VaultRecordInput, string>;
  meta!: Table<{ key: typeof VAULT_DB_NAME; value: VaultKeyStore }, typeof VAULT_DB_NAME>;

  constructor(name: string = VAULT_DB_NAME) {
    super(name);
    this.version(VAULT_DB_VERSION).stores({
      records: "id, kind, evidenceKind, caseId, createdAt, schemaVersion",
      meta: "key",
    });
  }
}

export function freshMeta(_provider: {
  getRandomValues: (b: Uint8Array) => Uint8Array;
}): VaultKeyStore {
  return {
    mode: { kind: "wrapped", verifiedAt: new Date(0).toISOString() },
    version: VAULT_ENVELOPE_VERSION,
    createdAt: new Date().toISOString(),
  };
}
