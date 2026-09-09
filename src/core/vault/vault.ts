import { VaultDB } from "./db";
import type { VaultRecordInput, VaultKeyStore } from "./schema";
import {
  VAULT_ENVELOPE_VERSION,
  VaultCryptoError,
  type EncryptionEnvelope,
  type KdfParams,
  type KeyMode,
  type WrappedDek,
} from "./envelope";
import {
  decryptBytes,
  encryptBytes,
  generateDek,
  getSubtleCrypto,
  newKdfParams,
  unwrapDek,
  wrapDek,
  type WebCryptoLike,
} from "./crypto";

const PLAINTEXT_HASH_VERSION = 1 as const;

export type VaultStatus =
  | { state: "uninitialized" }
  | { state: "locked"; mode: KeyMode["kind"]; hasWrapped: boolean }
  | { state: "unlocked" }
  | { state: "needs_migration"; fromVersion: number; toVersion: number };

export interface VaultListItem {
  id: string;
  kind: VaultRecordInput["kind"];
  name: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  evidenceKind?: string;
  caseId?: string;
  schemaVersion: number;
  plaintextHash: string;
}

export interface AddDocumentInput {
  name: string;
  mimeType: string;
  data: Uint8Array | string;
  tags?: string[];
  evidenceKind?: string;
  caseId?: string;
  kind?: VaultRecordInput["kind"];
}

const MAX_RECORD_BYTES = 10 * 1024 * 1024;

export class Vault {
  private readonly db: VaultDB;
  private readonly provider: WebCryptoLike;
  private dek: CryptoKey | null = null;

  constructor(provider: WebCryptoLike, db?: VaultDB) {
    this.provider = provider;
    getSubtleCrypto(provider);
    this.db = db ?? new VaultDB();
  }

  async open(): Promise<void> {
    await this.db.open();
  }

  async close(): Promise<void> {
    this.dek = null;
    this.db.close();
  }

  async status(): Promise<VaultStatus> {
    const meta = await this.db.meta.get("appealdeck-vault" as never);
    if (!meta) {
      return { state: "uninitialized" };
    }
    if (this.dek) {
      return { state: "unlocked" };
    }
    return {
      state: "locked",
      mode: meta.value.mode.kind,
      hasWrapped: Boolean(meta.value.wrappedDek),
    };
  }

  async isInitialized(): Promise<boolean> {
    const m = await this.db.meta.get("appealdeck-vault" as never);
    return Boolean(m);
  }

  async initWithPassphrase(passphrase: string): Promise<void> {
    if (!passphrase || passphrase.length < 8) {
      throw new VaultCryptoError("INVALID_INPUT", "Passphrase must be at least 8 characters");
    }
    const kdf = newKdfParams(this.provider);
    const dek = await generateDek(this.provider);
    const wrapped = await wrapDek(this.provider, dek, passphrase, kdf);
    const meta: VaultKeyStore = {
      mode: { kind: "passphrase", kdf, verifiedAt: new Date().toISOString() },
      kdf,
      wrappedDek: wrapped,
      version: VAULT_ENVELOPE_VERSION,
      createdAt: new Date().toISOString(),
    };
    await this.db.meta.put({ key: "appealdeck-vault" as never, value: meta });
    this.dek = dek;
  }

  async initWrapped(passphrase: string): Promise<void> {
    if (!passphrase || passphrase.length < 8) {
      throw new VaultCryptoError("INVALID_INPUT", "Passphrase must be at least 8 characters");
    }
    const kdf = newKdfParams(this.provider);
    const dek = await generateDek(this.provider);
    const wrapped = await wrapDek(this.provider, dek, passphrase, kdf);
    const meta: VaultKeyStore = {
      mode: { kind: "wrapped", verifiedAt: new Date().toISOString() },
      kdf,
      wrappedDek: wrapped,
      version: VAULT_ENVELOPE_VERSION,
      createdAt: new Date().toISOString(),
    };
    await this.db.meta.put({ key: "appealdeck-vault" as never, value: meta });
    this.dek = dek;
  }

  async unlock(passphrase: string): Promise<void> {
    const row = await this.db.meta.get("appealdeck-vault" as never);
    if (!row) {
      throw new VaultCryptoError("INVALID_INPUT", "Vault is not initialized");
    }
    if (!row.value.wrappedDek || !row.value.kdf) {
      throw new VaultCryptoError("ENVELOPE_CORRUPT", "Vault metadata is missing a wrapped DEK");
    }
    const dek = await unwrapDek(this.provider, passphrase, row.value.wrappedDek);
    this.dek = dek;
  }

  lock(): void {
    this.dek = null;
  }

  isUnlocked(): boolean {
    return this.dek !== null;
  }

  async changePassphrase(oldPassphrase: string, newPassphrase: string): Promise<void> {
    if (!newPassphrase || newPassphrase.length < 8) {
      throw new VaultCryptoError("INVALID_INPUT", "New passphrase must be at least 8 characters");
    }
    const row = await this.db.meta.get("appealdeck-vault" as never);
    if (!row || !row.value.wrappedDek) {
      throw new VaultCryptoError("INVALID_INPUT", "Vault is not initialized");
    }
    const dek = await unwrapDek(this.provider, oldPassphrase, row.value.wrappedDek);
    const kdf = newKdfParams(this.provider);
    const wrapped = await wrapDek(this.provider, dek, newPassphrase, kdf);
    const next: VaultKeyStore = {
      ...row.value,
      kdf,
      wrappedDek: wrapped,
      mode: { ...row.value.mode, verifiedAt: new Date().toISOString() },
    };
    await this.db.meta.put({ key: "appealdeck-vault" as never, value: next });
    this.dek = dek;
  }

  private requireDek(): CryptoKey {
    if (!this.dek) {
      throw new VaultCryptoError("INVALID_INPUT", "Vault is locked — unlock first");
    }
    return this.dek;
  }

  async add(input: AddDocumentInput): Promise<VaultRecordInput> {
    const dek = this.requireDek();
    const data = typeof input.data === "string" ? new TextEncoder().encode(input.data) : input.data;
    if (data.byteLength > MAX_RECORD_BYTES) {
      throw new VaultCryptoError(
        "INVALID_INPUT",
        `Record exceeds max size of ${MAX_RECORD_BYTES} bytes`,
      );
    }
    const envelope = await encryptBytes(this.provider, dek, data);
    const hash = await sha256Base64(this.provider, data);
    const now = new Date().toISOString();
    const record: VaultRecordInput = {
      id: cryptoRandomId(this.provider),
      kind: input.kind ?? "document",
      name: input.name,
      mimeType: input.mimeType,
      sizeBytes: data.byteLength,
      createdAt: now,
      updatedAt: now,
      tags: input.tags ?? [],
      ...(input.evidenceKind ? { evidenceKind: input.evidenceKind } : {}),
      ...(input.caseId ? { caseId: input.caseId } : {}),
      ciphertext: envelope,
      plaintextHash: `${PLAINTEXT_HASH_VERSION}.${hash}`,
      schemaVersion: VAULT_ENVELOPE_VERSION,
    };
    await this.db.records.put(record);
    return record;
  }

  async addString(
    input: Omit<AddDocumentInput, "data"> & { data: string },
  ): Promise<VaultRecordInput> {
    return this.add(input);
  }

  async get(id: string): Promise<{ record: VaultRecordInput; bytes: Uint8Array }> {
    const dek = this.requireDek();
    const record = await this.db.records.get(id);
    if (!record) {
      throw new VaultCryptoError("INVALID_INPUT", `No record with id ${id}`);
    }
    const bytes = await decryptBytes(this.provider, dek, record.ciphertext);
    return { record, bytes };
  }

  async getString(id: string): Promise<{ record: VaultRecordInput; text: string }> {
    const { record, bytes } = await this.get(id);
    return { record, text: new TextDecoder().decode(bytes) };
  }

  async list(filter?: { caseId?: string; evidenceKind?: string }): Promise<VaultListItem[]> {
    let q = this.db.records.orderBy("createdAt").reverse();
    const all = await q.toArray();
    const items: VaultListItem[] = [];
    for (const r of all) {
      if (filter?.caseId && r.caseId !== filter.caseId) continue;
      if (filter?.evidenceKind && r.evidenceKind !== filter.evidenceKind) continue;
      items.push(toListItem(r));
    }
    return items;
  }

  async findByPlaintext(data: Uint8Array | string): Promise<VaultListItem | null> {
    const bytes = typeof data === "string" ? new TextEncoder().encode(data) : data;
    const hash = await sha256Base64(this.provider, bytes);
    const target = `${PLAINTEXT_HASH_VERSION}.${hash}`;
    const all = await this.db.records.orderBy("createdAt").toArray();
    for (const r of all) {
      if (r.plaintextHash === target) return toListItem(r);
    }
    return null;
  }

  async delete(id: string): Promise<void> {
    await this.db.records.delete(id);
  }

  async purge(): Promise<void> {
    await this.db.transaction("rw", this.db.records, this.db.meta, async () => {
      await this.db.records.clear();
      await this.db.meta.clear();
    });
    this.dek = null;
  }

  async exportAll(): Promise<{
    version: typeof VAULT_ENVELOPE_VERSION;
    records: VaultRecordInput[];
    meta: VaultKeyStore;
  }> {
    const records = await this.db.records.toArray();
    const row = await this.db.meta.get("appealdeck-vault" as never);
    if (!row) {
      throw new VaultCryptoError("INVALID_INPUT", "No meta to export");
    }
    return {
      version: VAULT_ENVELOPE_VERSION,
      records,
      meta: row.value,
    };
  }

  async importAll(
    payload: {
      version: number;
      records: VaultRecordInput[];
      meta: VaultKeyStore;
    },
    options: { sourcePassphrase: string; destinationPassphrase: string },
  ): Promise<number> {
    if (payload.version > VAULT_ENVELOPE_VERSION) {
      throw new VaultCryptoError(
        "ENVELOPE_TOO_NEW",
        `Import version ${payload.version} is newer than the running app`,
      );
    }
    if (!payload.meta.wrappedDek) {
      throw new VaultCryptoError("ENVELOPE_CORRUPT", "Import payload is missing a wrapped DEK");
    }
    const dek = await unwrapDek(this.provider, options.sourcePassphrase, payload.meta.wrappedDek);
    const newKdf = newKdfParams(this.provider);
    const newWrapped = await wrapDek(this.provider, dek, options.destinationPassphrase, newKdf);
    const nextMeta: VaultKeyStore = {
      mode: { kind: "passphrase", kdf: newKdf, verifiedAt: new Date().toISOString() },
      kdf: newKdf,
      wrappedDek: newWrapped,
      version: VAULT_ENVELOPE_VERSION,
      createdAt: new Date().toISOString(),
    };
    let n = 0;
    await this.db.transaction("rw", this.db.records, this.db.meta, async () => {
      await this.db.meta.put({ key: "appealdeck-vault" as never, value: nextMeta });
      for (const r of payload.records) {
        const env: EncryptionEnvelope = r.ciphertext;
        if (env.v !== VAULT_ENVELOPE_VERSION) {
          throw new VaultCryptoError(
            "ENVELOPE_TOO_NEW",
            `Record ${r.id} has envelope version ${env.v}, not supported`,
          );
        }
        await this.db.records.put(r);
        n += 1;
      }
    });
    this.dek = dek;
    return n;
  }

  async rawMeta(): Promise<VaultKeyStore | null> {
    const row = await this.db.meta.get("appealdeck-vault" as never);
    return row?.value ?? null;
  }

  async rewrapFromWrapped(
    providedWrapped: WrappedDek,
    passphrase: string,
    newKdf?: KdfParams,
  ): Promise<WrappedDek> {
    const dek = await unwrapDek(this.provider, passphrase, providedWrapped);
    const kdf = newKdf ?? newKdfParams(this.provider);
    return wrapDek(this.provider, dek, passphrase, kdf);
  }

  async sha256Base64Self(data: Uint8Array): Promise<string> {
    return sha256Base64(this.provider, data);
  }
}

function toListItem(r: VaultRecordInput): VaultListItem {
  return {
    id: r.id,
    kind: r.kind,
    name: r.name,
    mimeType: r.mimeType,
    sizeBytes: r.sizeBytes,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    tags: r.tags,
    evidenceKind: r.evidenceKind,
    caseId: r.caseId,
    schemaVersion: r.schemaVersion,
    plaintextHash: r.plaintextHash,
  };
}

function cryptoRandomId(provider: WebCryptoLike): string {
  const bytes = new Uint8Array(16);
  provider.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256Base64(provider: WebCryptoLike, data: Uint8Array): Promise<string> {
  const buf = await provider.subtle.digest("SHA-256", data as BufferSource);
  const bytes = new Uint8Array(buf);
  if (typeof Buffer !== "undefined") {
    return Buffer.from(bytes).toString("base64");
  }
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) bin += String.fromCharCode(bytes[i] as number);
  return btoa(bin);
}
