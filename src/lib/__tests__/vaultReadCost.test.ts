import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Vault } from "@/core/vault/vault";
import { VaultDB } from "@/core/vault/db";
import {
  saveCaseFile,
  loadCaseFile,
  saveCaseLog,
  listCases,
  setCaseArchived,
  getActiveCaseId,
} from "@/lib/caseStore";
import { createCaseFile } from "@/core/caseFile";

/**
 * What the vault reads (30 Sep 2026).
 *
 * A record's encrypted file is stored in the same IndexedDB row as its name and dates, so reading a
 * row reads the file. Looking up the small bookkeeping records — the case file, the log, the active
 * pointer, the case index — used to list the whole vault, so every case save read every attached
 * file four times over, and every dashboard load three times plus once per case. Nothing failed and
 * no test used a vault with files in it; it showed only as a slower page for exactly the sellers who
 * had gathered the most evidence.
 *
 * Counting rows read is the property that matters, and it does not depend on how fast the machine
 * is, so it is asserted directly (Dexie's `reading` hook fires once per row it hands back).
 */

function provider() {
  return {
    subtle: webcrypto.subtle,
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
  } as unknown as ConstructorParameters<typeof Vault>[0];
}

describe("vault read cost", () => {
  let db: VaultDB;
  let v: Vault;
  let dbName: string;
  let read: string[];

  beforeEach(async () => {
    dbName = `appealdeck-readcost-test-${Math.random().toString(36).slice(2, 10)}`;
    db = new VaultDB(dbName);
    v = new Vault(provider(), db);
    await v.open();
    await v.initWithPassphrase("super-secret-pass");
    read = [];
    db.records.hook("reading", (row) => {
      read.push(`${row.kind}:${row.name}`);
      return row;
    });
  });

  afterEach(async () => {
    await v.close();
    await indexedDB.deleteDatabase(dbName);
  });

  async function attachEvidence(caseId: string, count: number) {
    for (let i = 0; i < count; i++) {
      await v.add({
        name: `invoice-${caseId}-${i}.pdf`,
        mimeType: "application/pdf",
        data: new Uint8Array(2048).fill(i + 1),
        kind: "document",
        caseId,
      });
    }
  }

  const evidenceRead = () => read.filter((r) => r.startsWith("document:"));

  it("saving a case reads no attached file", async () => {
    const file = createCaseFile("POLICY");
    await saveCaseFile(v, file);
    await attachEvidence(file.id, 6);
    read = [];

    await saveCaseFile(v, { ...file });

    expect(evidenceRead()).toEqual([]);
    expect(read.length).toBeGreaterThan(0); // it did read the bookkeeping records
  });

  it("loading a case, its log and the case list reads no attached file", async () => {
    const file = createCaseFile("POLICY");
    await saveCaseFile(v, file);
    await saveCaseLog(v, { submissions: [] } as never);
    await attachEvidence(file.id, 6);
    read = [];

    expect((await loadCaseFile(v))?.id).toBe(file.id);
    expect(await getActiveCaseId(v)).toBe(file.id);
    expect((await listCases(v)).map((c) => c.id)).toEqual([file.id]);
    await setCaseArchived(v, file.id, true);

    expect(evidenceRead()).toEqual([]);
  });

  it("other cases' files stay untouched too", async () => {
    const a = createCaseFile("POLICY");
    const b = createCaseFile("FUNDS");
    await saveCaseFile(v, a);
    await attachEvidence(a.id, 4);
    await saveCaseFile(v, b);
    await attachEvidence(b.id, 4);
    read = [];

    await loadCaseFile(v, a.id);
    await saveCaseFile(v, { ...b });

    expect(evidenceRead()).toEqual([]);
  });

  it("a duplicate check stops at the first match instead of reading everything", async () => {
    await attachEvidence("c1", 8);
    read = [];

    // The very first record added is byte-identical to this: the oldest, so the first one visited.
    const found = await v.findByPlaintext(new Uint8Array(2048).fill(1));

    expect(found?.name).toBe("invoice-c1-0.pdf");
    expect(read).toEqual(["document:invoice-c1-0.pdf"]);
  });
});

describe("Vault.list is unchanged for its callers", () => {
  let db: VaultDB;
  let v: Vault;
  let dbName: string;

  beforeEach(async () => {
    dbName = `appealdeck-listorder-test-${Math.random().toString(36).slice(2, 10)}`;
    db = new VaultDB(dbName);
    v = new Vault(provider(), db);
    await v.open();
    await v.initWithPassphrase("super-secret-pass");
  });

  afterEach(async () => {
    await v.close();
    await indexedDB.deleteDatabase(dbName);
  });

  it("lists newest first and breaks ties by id, descending — as the createdAt index did", async () => {
    await v.add({ name: "one.pdf", mimeType: "application/pdf", data: new Uint8Array([1]) });
    await v.add({ name: "two.pdf", mimeType: "application/pdf", data: new Uint8Array([2]) });
    // Records that share a date (a merge or import keeps the source's dates).
    const shared = "2020-01-01T00:00:00.000Z";
    for (const id of ["aaa", "mmm", "zzz"]) {
      const [any] = await db.records.toArray();
      await db.records.put({ ...any!, id, name: `tie-${id}.pdf`, createdAt: shared });
    }

    const oracle = (await db.records.orderBy("createdAt").reverse().toArray()).map((r) => r.id);
    expect((await v.list()).map((r) => r.id)).toEqual(oracle);
  });

  it("filters by kind, case and evidence kind, alone and together", async () => {
    await v.add({
      name: "case.json",
      mimeType: "application/json",
      data: "{}",
      kind: "case",
      caseId: "c1",
    });
    await v.add({
      name: "pointer",
      mimeType: "application/json",
      data: "{}",
      kind: "case",
    });
    await v.add({
      name: "inv.pdf",
      mimeType: "application/pdf",
      data: new Uint8Array([9]),
      kind: "document",
      caseId: "c1",
      evidenceKind: "supplier_invoice",
    });
    await v.add({
      name: "other.pdf",
      mimeType: "application/pdf",
      data: new Uint8Array([8]),
      kind: "document",
      caseId: "c2",
      evidenceKind: "supplier_invoice",
    });

    const names = async (f?: Parameters<Vault["list"]>[0]) =>
      (await v.list(f)).map((r) => r.name).sort();
    expect(await names()).toEqual(["case.json", "inv.pdf", "other.pdf", "pointer"]);
    expect(await names({ kind: "case" })).toEqual(["case.json", "pointer"]);
    expect(await names({ caseId: "c1" })).toEqual(["case.json", "inv.pdf"]);
    expect(await names({ caseId: "c1", kind: "case" })).toEqual(["case.json"]);
    expect(await names({ evidenceKind: "supplier_invoice" })).toEqual(["inv.pdf", "other.pdf"]);
    expect(await names({ caseId: "c2", evidenceKind: "supplier_invoice" })).toEqual(["other.pdf"]);
    expect(await names({ kind: "letter" })).toEqual([]);
  });

  it("returns metadata only, never the encrypted bytes", async () => {
    await v.add({ name: "a.pdf", mimeType: "application/pdf", data: new Uint8Array([1, 2, 3]) });
    const [item] = await v.list();
    expect(item).not.toHaveProperty("ciphertext");
  });
});
