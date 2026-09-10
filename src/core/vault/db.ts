import Dexie, { type Table } from "dexie";
import {
  VAULT_DB_NAME,
  VAULT_DB_VERSION,
  type VaultKeyStore,
  type VaultRecordInput,
} from "./schema";

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
