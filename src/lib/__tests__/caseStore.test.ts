import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Vault } from "@/core/vault/vault";
import { VaultDB } from "@/core/vault/db";
import { CASE_ID, CASE_FILE_NAME, CASE_LOG_NAME } from "@/lib/caseStore";
import { saveCaseFile, loadCaseFile, saveCaseLog, loadCaseLog } from "@/lib/caseStore";
import type { CaseFile } from "@/core/interviewEngine";
import { createCaseFile } from "@/core/interviewEngine";
import type { CaseLog } from "@/lib/caseStore";

function provider() {
  return {
    subtle: webcrypto.subtle,
    getRandomValues: webcrypto.getRandomValues.bind(webcrypto),
  } as unknown as Parameters<typeof Vault>[0];
}

function newVault(): { vault: Vault; dbName: string } {
  const dbName = `appealdeck-casestore-test-${Math.random().toString(36).slice(2, 10)}`;
  const v = new Vault(provider(), new VaultDB(dbName));
  return { vault: v, dbName };
}

describe("caseStore", () => {
  let v: Vault;
  let dbName: string;

  beforeEach(async () => {
    ({ vault: v, dbName } = newVault());
    await v.open();
    await v.initWithPassphrase("super-secret-pass");
  });

  afterEach(async () => {
    await v.close();
    await indexedDB.deleteDatabase(dbName);
  });

  describe("saveCaseFile / loadCaseFile", () => {
    it("roundtrips a fresh case file", async () => {
      const file = createCaseFile("POLICY");
      await saveCaseFile(v, file);
      const loaded = await loadCaseFile(v);
      expect(loaded).toEqual(file);
    });

    it("returns null when no case file exists", async () => {
      expect(await loadCaseFile(v)).toBeNull();
    });

    it("upserts: second save replaces the first record", async () => {
      const file1 = createCaseFile("POLICY");
      file1.rootCause = "Original root cause";
      await saveCaseFile(v, file1);

      const file2: CaseFile = { ...file1, rootCause: "Updated root cause" };
      await saveCaseFile(v, file2);

      const loaded = await loadCaseFile(v);
      expect(loaded?.rootCause).toBe("Updated root cause");

      const list = await v.list({ caseId: CASE_ID });
      expect(list.filter((r) => r.name === CASE_FILE_NAME)).toHaveLength(1);
    });

    it("stores under the fixed caseId with kind 'case'", async () => {
      const file = createCaseFile("POLICY");
      await saveCaseFile(v, file);
      const list = await v.list({ caseId: CASE_ID });
      const rec = list.find((r) => r.name === CASE_FILE_NAME);
      expect(rec).toBeDefined();
      expect(rec!.caseId).toBe(CASE_ID);
      expect(rec!.kind).toBe("case");
    });
  });

  describe("saveCaseLog / loadCaseLog", () => {
    it("roundtrips a case log", async () => {
      const log: CaseLog = { state: "DECODED", attemptCount: 1 };
      await saveCaseLog(v, log);
      expect(await loadCaseLog(v)).toEqual(log);
    });

    it("returns null when no case log exists", async () => {
      expect(await loadCaseLog(v)).toBeNull();
    });

    it("upserts: second save replaces the first record", async () => {
      const log1: CaseLog = { state: "SUBMITTED", attemptCount: 1 };
      await saveCaseLog(v, log1);

      const log2: CaseLog = {
        state: "REJECTED",
        attemptCount: 2,
        lastReply: { category: "needs_more_information", at: "2026-01-01T00:00:00.000Z" },
      };
      await saveCaseLog(v, log2);

      const loaded = await loadCaseLog(v);
      expect(loaded).toEqual(log2);

      const list = await v.list({ caseId: CASE_ID });
      expect(list.filter((r) => r.name === CASE_LOG_NAME)).toHaveLength(1);
    });
  });

  describe("independence", () => {
    it("saves case file and case log as separate records", async () => {
      const file = createCaseFile("POLICY");
      await saveCaseFile(v, file);

      const log: CaseLog = { state: "DECODED", attemptCount: 1 };
      await saveCaseLog(v, log);

      const list = await v.list({ caseId: CASE_ID });
      expect(list.filter((r) => r.name === CASE_FILE_NAME)).toHaveLength(1);
      expect(list.filter((r) => r.name === CASE_LOG_NAME)).toHaveLength(1);

      const loadedFile = await loadCaseFile(v);
      const loadedLog = await loadCaseLog(v);
      expect(loadedFile).toEqual(file);
      expect(loadedLog).toEqual(log);
    });

    it("deleting case file does not affect case log", async () => {
      const file = createCaseFile("POLICY");
      await saveCaseFile(v, file);

      const log: CaseLog = { state: "DECODED", attemptCount: 1 };
      await saveCaseLog(v, log);

      const list = await v.list({ caseId: CASE_ID });
      const fileRec = list.find((r) => r.name === CASE_FILE_NAME);
      if (fileRec) await v.delete(fileRec.id);

      expect(await loadCaseFile(v)).toBeNull();
      expect(await loadCaseLog(v)).toEqual(log);
    });
  });
});
