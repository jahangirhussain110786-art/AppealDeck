import "fake-indexeddb/auto";
import { webcrypto } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Vault } from "@/core/vault/vault";
import { VaultDB } from "@/core/vault/db";
import {
  CASE_FILE_NAME,
  CASE_LOG_NAME,
  saveCaseFile,
  loadCaseFile,
  saveCaseLog,
  loadCaseLog,
  deleteCaseFile,
  listCases,
  getActiveCaseId,
  setActiveCaseId,
  setCaseArchived,
} from "@/lib/caseStore";
import type { CaseFile } from "@/core/caseFile";
import { createCaseFile } from "@/core/caseFile";
import type { CaseLog } from "@/lib/caseStore";

/** The literal every seller's vault used before multi-case support (14 Sep 2026) — real
 * historical data, not a stand-in. Not imported from caseStore.ts (it's private there); hardcoded
 * here so the test documents and proves against the actual string a pre-migration vault has,
 * independent of the module's own internal naming. */
const LEGACY_CASE_ID = "appealdeck-case-1";

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

    it("upserts: second save of the same case replaces the first record", async () => {
      const file1 = createCaseFile("POLICY");
      file1.rootCause = "Original root cause";
      await saveCaseFile(v, file1);

      const file2: CaseFile = { ...file1, rootCause: "Updated root cause" };
      await saveCaseFile(v, file2);

      const loaded = await loadCaseFile(v);
      expect(loaded?.rootCause).toBe("Updated root cause");

      const list = await v.list({ caseId: file1.id });
      expect(list.filter((r) => r.name === CASE_FILE_NAME)).toHaveLength(1);
    });

    it("stores under the case's own real id, with kind 'case'", async () => {
      const file = createCaseFile("POLICY");
      await saveCaseFile(v, file);
      const list = await v.list({ caseId: file.id });
      const rec = list.find((r) => r.name === CASE_FILE_NAME);
      expect(rec).toBeDefined();
      expect(rec!.caseId).toBe(file.id);
      expect(rec!.kind).toBe("case");
    });
  });

  describe("saveCaseLog / loadCaseLog", () => {
    it("roundtrips a case log even with no case file yet", async () => {
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

      const activeCaseId = await getActiveCaseId(v);
      const list = await v.list({ caseId: activeCaseId! });
      expect(list.filter((r) => r.name === CASE_LOG_NAME)).toHaveLength(1);
    });
  });

  describe("independence", () => {
    it("saves case file and case log as separate records under the same case", async () => {
      const file = createCaseFile("POLICY");
      await saveCaseFile(v, file);

      const log: CaseLog = { state: "DECODED", attemptCount: 1 };
      await saveCaseLog(v, log);

      const list = await v.list({ caseId: file.id });
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

      const list = await v.list({ caseId: file.id });
      const fileRec = list.find((r) => r.name === CASE_FILE_NAME);
      if (fileRec) await v.delete(fileRec.id);

      expect(await loadCaseFile(v)).toBeNull();
      expect(await loadCaseLog(v)).toEqual(log);
    });
  });

  // 14 Sep 2026 multi-case fix (Planning/03-PHASE-2-BUILD/09-MULTI-CASE-ARCHITECTURE-SPEC.md P0):
  // a vault can now hold more than one case, and a pre-migration vault (a fixed, hardcoded case
  // id) must resolve correctly with no data ever moved or rewritten.
  describe("multi-case support", () => {
    it("starting a second case does not delete or corrupt the first case's data", async () => {
      const caseA = createCaseFile("POLICY");
      caseA.rootCause = "Case A's root cause";
      await saveCaseFile(v, caseA);

      const caseB = createCaseFile("INTELLECTUAL_PROPERTY");
      caseB.rootCause = "Case B's root cause";
      await saveCaseFile(v, caseB);

      // The active case is now B (the most recently saved) — but A's own record, addressed by
      // its own id, is untouched.
      expect((await loadCaseFile(v))?.id).toBe(caseB.id);
      const aRecord = await v.list({ caseId: caseA.id });
      expect(aRecord.find((r) => r.name === CASE_FILE_NAME)).toBeDefined();
      const { text } = await v.getString(aRecord.find((r) => r.name === CASE_FILE_NAME)!.id);
      expect((JSON.parse(text) as CaseFile).rootCause).toBe("Case A's root cause");
    });

    it("listCases() surfaces every case in the vault, newest first", async () => {
      const caseA = createCaseFile("POLICY");
      await saveCaseFile(v, caseA);
      const caseB = createCaseFile("FUNDS");
      await saveCaseFile(v, caseB);

      const cases = await listCases(v);
      expect(cases.map((c) => c.id)).toEqual([caseB.id, caseA.id]);
      expect(cases.find((c) => c.id === caseA.id)?.kind).toBe("POLICY");
      expect(cases.find((c) => c.id === caseB.id)?.kind).toBe("FUNDS");
    });

    it("self-heals a pre-migration vault by adopting the legacy id, moving no data", async () => {
      // Simulate a real seller's vault from before 14 Sep 2026: a case file written under the
      // old fixed id, with no `id`/`createdAt` field at all (those fields did not exist yet).
      const legacyFile = {
        kind: "POLICY",
        state: "DECODED",
        timelineEvents: [],
        priorAppealCount: 0,
        evidenceSlots: {},
        actionItems: [],
        attemptCount: 0,
        rootCause: "Pre-migration seller's real answer",
      };
      await v.addString({
        name: CASE_FILE_NAME,
        mimeType: "application/json",
        data: JSON.stringify(legacyFile),
        caseId: LEGACY_CASE_ID,
        kind: "case",
      });

      const loaded = await loadCaseFile(v);
      expect(loaded?.rootCause).toBe("Pre-migration seller's real answer");
      expect(loaded?.id).toBe(LEGACY_CASE_ID);
      expect(await getActiveCaseId(v)).toBe(LEGACY_CASE_ID);

      // The original record itself was never touched — same id, same content, still there.
      const stillThere = await v.list({ caseId: LEGACY_CASE_ID });
      expect(stillThere.filter((r) => r.name === CASE_FILE_NAME)).toHaveLength(1);

      const cases = await listCases(v);
      expect(cases).toEqual([
        { id: LEGACY_CASE_ID, kind: "POLICY", createdAt: expect.any(String) },
      ]);
    });

    it("deleteCaseFile clears the active pointer so a fresh case starts genuinely clean", async () => {
      const file = createCaseFile("POLICY");
      await saveCaseFile(v, file);
      await deleteCaseFile(v);

      expect(await loadCaseFile(v)).toBeNull();
      expect(await getActiveCaseId(v)).toBeNull();
      expect(await listCases(v)).toEqual([]);
    });

    it("setCaseArchived marks a case archived without touching its file or log", async () => {
      const file = createCaseFile("POLICY");
      await saveCaseFile(v, file);
      await saveCaseLog(v, { state: "DECODED", attemptCount: 0 });

      await setCaseArchived(v, file.id, true);
      expect((await listCases(v)).find((c) => c.id === file.id)?.archived).toBe(true);
      expect((await loadCaseFile(v))?.id).toBe(file.id);
      expect(await loadCaseLog(v)).toEqual({ state: "DECODED", attemptCount: 0 });

      await setCaseArchived(v, file.id, false);
      expect((await listCases(v)).find((c) => c.id === file.id)?.archived).toBe(false);
    });

    it("re-saving an archived case's file does not silently un-archive it", async () => {
      const file = createCaseFile("POLICY");
      await saveCaseFile(v, file);
      await setCaseArchived(v, file.id, true);

      file.rootCause = "A later edit to an archived case";
      await saveCaseFile(v, file);

      expect((await listCases(v)).find((c) => c.id === file.id)?.archived).toBe(true);
    });

    it("setCaseArchived rejects an id that isn't in the case index", async () => {
      await expect(setCaseArchived(v, "does-not-exist", true)).rejects.toThrow();
    });

    it("loadCaseLog(vault, caseId) reads a specific case's log regardless of which is active", async () => {
      const caseA = createCaseFile("POLICY");
      await saveCaseFile(v, caseA);
      await saveCaseLog(v, { state: "DECODED", attemptCount: 1 });

      const caseB = createCaseFile("FUNDS");
      await saveCaseFile(v, caseB);
      await saveCaseLog(v, { state: "REMEDIATION", attemptCount: 2 });

      expect(await loadCaseLog(v, caseA.id)).toEqual({ state: "DECODED", attemptCount: 1 });
      expect(await loadCaseLog(v, caseB.id)).toEqual({ state: "REMEDIATION", attemptCount: 2 });
      expect(await loadCaseLog(v)).toEqual({ state: "REMEDIATION", attemptCount: 2 });
    });
  });
  /**
   * The case switch that outran its own vault write (22 Sep 2026 fix).
   *
   * Writing the active-case pointer means finding, deleting and re-adding an encrypted record,
   * so it is not instant. A seller who picked a case and navigated in the same breath used to
   * land on the case they had just left, and could then edit the wrong one. The choice is now
   * recorded synchronously in `sessionStorage` and adopted on the next read.
   */
  describe("a case switch that is outrun by navigation", () => {
    /** The literal key the fix writes. Hardcoded, like LEGACY_CASE_ID above, so the test proves
     *  against the real string rather than against the module's own private constant. */
    const PENDING_KEY = "appealdeck-pending-active-case";
    let map: Map<string, string>;

    beforeEach(() => {
      map = new Map<string, string>();
      const storage = {
        getItem: (k: string) => map.get(k) ?? null,
        setItem: (k: string, v: string) => map.set(k, v),
        removeItem: (k: string) => map.delete(k),
      };
      vi.stubGlobal("window", { sessionStorage: storage });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("records the choice before its first await, so navigation cannot beat it", async () => {
      const caseA = createCaseFile("POLICY");
      await saveCaseFile(v, caseA);
      const caseB = createCaseFile("FUNDS");
      await saveCaseFile(v, caseB);

      // Deliberately not awaited: this is the instant the browser starts navigating away.
      const inFlight = setActiveCaseId(v, caseA.id);
      expect(map.get(PENDING_KEY)).toBe(caseA.id);
      await inFlight;
    });

    it("resolves to the chosen case when the write never landed", async () => {
      const caseA = createCaseFile("POLICY");
      await saveCaseFile(v, caseA);
      const caseB = createCaseFile("FUNDS");
      await saveCaseFile(v, caseB);
      expect(await getActiveCaseId(v)).toBe(caseB.id);

      // The switch was recorded, then the page went away before the vault write completed.
      map.set(PENDING_KEY, caseA.id);

      expect(await getActiveCaseId(v)).toBe(caseA.id);
      expect((await loadCaseFile(v))?.id).toBe(caseA.id);
      // Adopted into the vault, so the marker has done its job and is gone.
      expect(map.has(PENDING_KEY)).toBe(false);
      expect(await getActiveCaseId(v)).toBe(caseA.id);
    });

    it("discards a marker naming a case this vault does not have", async () => {
      const caseB = createCaseFile("FUNDS");
      await saveCaseFile(v, caseB);
      map.set(PENDING_KEY, "a-case-from-some-other-vault");

      expect(await getActiveCaseId(v)).toBe(caseB.id);
      expect(map.has(PENDING_KEY)).toBe(false);
    });

    it("lets a newly started case win over a stale marker", async () => {
      const caseA = createCaseFile("POLICY");
      await saveCaseFile(v, caseA);
      map.set(PENDING_KEY, caseA.id);

      const caseC = createCaseFile("LISTING");
      await saveCaseFile(v, caseC);

      expect(await getActiveCaseId(v)).toBe(caseC.id);
    });

    it("does not act on a marker for a case that has no file", async () => {
      const caseA = createCaseFile("POLICY");
      await saveCaseFile(v, caseA);

      await expect(setActiveCaseId(v, "does-not-exist")).rejects.toThrow();
      // The failed switch may leave its marker; what matters is that resolution refuses it and
      // the seller stays on a real case rather than being moved to nothing.
      expect(await getActiveCaseId(v)).toBe(caseA.id);
      expect(map.has(PENDING_KEY)).toBe(false);
    });

    /**
     * The hazard this fix originally shipped with. `writeActivePointer` deletes the old pointer
     * before adding the new one, so a write that dies part-way leaves a vault with no pointer at
     * all. Clearing the marker before that write completed — which is what the first version of
     * this fix did — threw away the only remaining record of the seller's choice.
     */
    it("keeps the marker when the pointer write dies part-way, so the next read repairs it", async () => {
      const caseA = createCaseFile("POLICY");
      await saveCaseFile(v, caseA);
      const caseB = createCaseFile("FUNDS");
      await saveCaseFile(v, caseB);

      const realAddString = v.addString.bind(v);
      const spy = vi
        .spyOn(v, "addString")
        .mockRejectedValueOnce(new Error("page went away mid-write"));

      await expect(setActiveCaseId(v, caseA.id)).rejects.toThrow();
      expect(map.get(PENDING_KEY)).toBe(caseA.id);

      spy.mockRestore();
      void realAddString;
      // Next read: the marker still names the seller's choice, so it is honoured and repaired.
      expect(await getActiveCaseId(v)).toBe(caseA.id);
      expect(map.has(PENDING_KEY)).toBe(false);
    });
  });
});
