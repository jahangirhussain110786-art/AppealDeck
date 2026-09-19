"use client";

import type { Vault } from "@/core/vault/vault";
import type { CaseFile } from "@/core/interviewEngine";
import type { CaseState, ReplyCategory } from "@/core/caseState";
import type { EvidenceKind } from "@/core/evidenceModel";
import type { ViolationKind } from "@/core";

export const CASE_FILE_NAME = "case_file";
export const CASE_LOG_NAME = "case_log";
const ACTIVE_CASE_POINTER_NAME = "active_case_pointer";
const CASE_INDEX_NAME = "case_index";

/**
 * The single fixed id every vault used before multi-case support (14 Sep 2026 fix) — every
 * seller's vault before this date has exactly one case, stored under this literal string.
 * Never regenerated and no data is ever moved off it: the first time a pre-migration vault is
 * read under the new scheme, this id is simply adopted as that case's permanent identifier going
 * forward (see `resolveActiveCaseId`). This keeps the migration risk-free — no vault record is
 * rewritten, deleted, or re-keyed to migrate a seller's existing case.
 */
const LEGACY_CASE_ID = "appealdeck-case-1";

/** One entry per case in a vault — enough to render a case list without loading every full
 * case file. Kept in sync by `saveCaseFile` on every save; never the source of truth for a
 * case's own data (the case_file record is), just an index over it. */
export interface CaseIndexEntry {
  id: string;
  kind: ViolationKind;
  createdAt: string;
}

export interface CaseLog {
  reminderAt?: string;
  state: CaseState;
  attemptCount: number;
  submittedAt?: string;
  /** Readiness score (0-100) at the moment `submittedAt` was recorded — a snapshot, not
   * recomputed later. Feeds the EF-5 opt-in outcome record's `readinessAtSubmit` field
   * (src/core/outcomeModel.ts). Absent on cases submitted before this field existed. */
  readinessAtSubmit?: number;
  lastReply?: {
    category: ReplyCategory;
    at: string;
    /**
     * Evidence kinds `analyzeReply()` (src/core/responseAnalyzer.ts) found Amazon's reply
     * explicitly asking for — e.g. a reply that says "provide your government-issued ID" yields
     * `["identity_doc"]`. Carried through so the evidence UI can prioritize exactly what Amazon
     * named instead of only ever re-showing the original, generic requirement list (14 Sep 2026
     * founder direction: "a true humanized flow-full resolution from identifying the issue to
     * taking needed actions").
     */
    extractedAsks?: EvidenceKind[];
  };
  whyHintDismissed?: boolean;
  /** True once the seller has dismissed the opening "what matters for this case" guidance
   * banner (AM-24, 12 Sep 2026) — shown once at the start of the interview, not re-shown. */
  guidanceDismissed?: boolean;
  /** True once the seller has responded (either way) to the opt-in outcome-sharing prompt for
   * this case, so it's asked at most once per terminal reply. */
  outcomePromptResolved?: boolean;
}

async function findRecordId(vault: Vault, name: string, caseId: string): Promise<string | null> {
  const list = await vault.list({ caseId });
  const found = list.find((r) => r.name === name);
  return found?.id ?? null;
}

/** Finds a vault-wide (non-per-case) bookkeeping record by name — the active-case pointer and
 * the case index both live outside any one case's `caseId` scope, since they describe the whole
 * vault. */
async function findMetaRecordId(vault: Vault, name: string): Promise<string | null> {
  const list = await vault.list();
  const found = list.find((r) => r.name === name && r.kind === "case" && !r.caseId);
  return found?.id ?? null;
}

async function readActivePointer(vault: Vault): Promise<string | null> {
  const id = await findMetaRecordId(vault, ACTIVE_CASE_POINTER_NAME);
  if (!id) return null;
  try {
    const { text } = await vault.getString(id);
    const parsed = JSON.parse(text) as { caseId?: string };
    return parsed.caseId ?? null;
  } catch {
    return null;
  }
}

async function writeActivePointer(vault: Vault, caseId: string): Promise<void> {
  const existing = await findMetaRecordId(vault, ACTIVE_CASE_POINTER_NAME);
  if (existing) await vault.delete(existing);
  await vault.addString({
    name: ACTIVE_CASE_POINTER_NAME,
    mimeType: "application/json",
    data: JSON.stringify({ caseId }),
    kind: "case",
  });
}

async function readCaseIndex(vault: Vault): Promise<CaseIndexEntry[]> {
  const id = await findMetaRecordId(vault, CASE_INDEX_NAME);
  if (!id) return [];
  try {
    const { text } = await vault.getString(id);
    const parsed: unknown = JSON.parse(text);
    return Array.isArray(parsed) ? (parsed as CaseIndexEntry[]) : [];
  } catch {
    return [];
  }
}

async function writeCaseIndex(vault: Vault, index: CaseIndexEntry[]): Promise<void> {
  const existing = await findMetaRecordId(vault, CASE_INDEX_NAME);
  if (existing) await vault.delete(existing);
  await vault.addString({
    name: CASE_INDEX_NAME,
    mimeType: "application/json",
    data: JSON.stringify(index),
    kind: "case",
  });
}

async function upsertCaseIndexEntry(vault: Vault, entry: CaseIndexEntry): Promise<void> {
  const index = await readCaseIndex(vault);
  const next = index.some((e) => e.id === entry.id)
    ? index.map((e) => (e.id === entry.id ? entry : e))
    : [...index, entry];
  await writeCaseIndex(vault, next);
}

async function removeCaseIndexEntry(vault: Vault, caseId: string): Promise<void> {
  const index = await readCaseIndex(vault);
  const next = index.filter((e) => e.id !== caseId);
  if (next.length !== index.length) await writeCaseIndex(vault, next);
}

/**
 * Read-only resolution of which case id loads/deletes should use — `null` if the vault has no
 * case at all (a genuinely fresh vault). Self-heals a pre-migration vault the first time it is
 * touched under the new scheme: if no active-case pointer exists yet but a `case_file` or
 * `case_log` record exists under the old fixed `LEGACY_CASE_ID`, that id is adopted as the
 * case's permanent identifier and the pointer (plus, best-effort, the index) is written — no
 * record is moved, deleted, or re-keyed to do this.
 */
async function resolveActiveCaseId(vault: Vault): Promise<string | null> {
  const pointed = await readActivePointer(vault);
  if (pointed) return pointed;

  const legacyList = await vault.list({ caseId: LEGACY_CASE_ID });
  const legacyFile = legacyList.find((r) => r.name === CASE_FILE_NAME);
  const hasLegacyCase = legacyFile || legacyList.some((r) => r.name === CASE_LOG_NAME);
  if (!hasLegacyCase) return null;

  await writeActivePointer(vault, LEGACY_CASE_ID);
  if (legacyFile) {
    try {
      const { text } = await vault.getString(legacyFile.id);
      const parsed = JSON.parse(text) as { kind?: ViolationKind; createdAt?: string };
      if (parsed.kind) {
        await upsertCaseIndexEntry(vault, {
          id: LEGACY_CASE_ID,
          kind: parsed.kind,
          createdAt: parsed.createdAt ?? legacyFile.createdAt,
        });
      }
    } catch {
      // Index backfill is a nicety — never fail case resolution over it.
    }
  }
  return LEGACY_CASE_ID;
}

/** Like `resolveActiveCaseId`, but establishes a fresh active case (a new id, pointer written
 * immediately) when the vault genuinely has none yet, instead of returning `null`. Used by
 * `saveCaseLog` so a log can be saved before any case file exists — which real app usage never
 * does (a case file is always created first), but the function's own contract should not assume
 * that ordering. */
async function resolveOrCreateActiveCaseId(vault: Vault): Promise<string> {
  const existing = await resolveActiveCaseId(vault);
  if (existing) return existing;
  const id = crypto.randomUUID();
  await writeActivePointer(vault, id);
  return id;
}

/** Read-only list of every case in this vault, newest first — enough for a "Your Cases" surface
 * without loading each full case file. Not yet wired into any UI (P1, per
 * Planning/03-PHASE-2-BUILD/09-MULTI-CASE-ARCHITECTURE-SPEC.md); exported now so the data has
 * been real and tested since the day multi-case support landed. */
export async function listCases(vault: Vault): Promise<CaseIndexEntry[]> {
  await resolveActiveCaseId(vault); // self-heals a pre-migration vault into the index first
  const index = await readCaseIndex(vault);
  return [...index].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Read-only accessor for which case id is currently active, if any. */
export async function getActiveCaseId(vault: Vault): Promise<string | null> {
  return resolveActiveCaseId(vault);
}

export async function setActiveCaseId(vault: Vault, caseId: string): Promise<void> {
  await vault.atomic(async () => {
    if (!(await findRecordId(vault, CASE_FILE_NAME, caseId))) throw new Error("Case not found");
    await writeActivePointer(vault, caseId);
  });
}

export async function saveCaseFile(vault: Vault, caseFile: CaseFile): Promise<void> {
  return vault.atomic(async () => {
    const caseId = caseFile.id;
    const existing = await findRecordId(vault, CASE_FILE_NAME, caseId);
    if (existing) {
      await vault.delete(existing);
    }
    await vault.addString({
      name: CASE_FILE_NAME,
      mimeType: "application/json",
      data: JSON.stringify(caseFile),
      caseId,
      kind: "case",
    });
    // A real case file is authoritative: it becomes (or confirms) the active case, and its entry
    // in the index is kept current — regardless of what, if anything, resolved as active before.
    await writeActivePointer(vault, caseId);
    await upsertCaseIndexEntry(vault, {
      id: caseId,
      kind: caseFile.kind,
      createdAt: caseFile.createdAt,
    });
  });
}

export async function loadCaseFile(
  vault: Vault,
  requestedCaseId?: string,
): Promise<CaseFile | null> {
  const caseId = requestedCaseId ?? (await resolveActiveCaseId(vault));
  if (!caseId) return null;
  const id = await findRecordId(vault, CASE_FILE_NAME, caseId);
  if (!id) return null;
  const { text } = await vault.getString(id);
  const parsed = JSON.parse(text) as CaseFile;
  // Pre-migration case files were written with no `id`/`createdAt` field at all — backfill both
  // rather than hand every caller an object that doesn't match the `CaseFile` type it's typed as.
  return {
    ...parsed,
    id: parsed.id ?? caseId,
    createdAt: parsed.createdAt ?? new Date(0).toISOString(),
  };
}

export async function saveCaseLog(vault: Vault, log: CaseLog): Promise<void> {
  return vault.atomic(async () => {
    const caseId = await resolveOrCreateActiveCaseId(vault);
    const existing = await findRecordId(vault, CASE_LOG_NAME, caseId);
    if (existing) {
      await vault.delete(existing);
    }
    await vault.addString({
      name: CASE_LOG_NAME,
      mimeType: "application/json",
      data: JSON.stringify(log),
      caseId,
      kind: "case",
    });
  });
}

export async function loadCaseLog(vault: Vault): Promise<CaseLog | null> {
  const caseId = await resolveActiveCaseId(vault);
  if (!caseId) return null;
  const id = await findRecordId(vault, CASE_LOG_NAME, caseId);
  if (!id) return null;
  const { text } = await vault.getString(id);
  return JSON.parse(text) as CaseLog;
}

export async function deleteCaseFile(vault: Vault): Promise<void> {
  return vault.atomic(async () => {
    const caseId = await resolveActiveCaseId(vault);
    if (!caseId) return;
    const id = await findRecordId(vault, CASE_FILE_NAME, caseId);
    if (id) await vault.delete(id);
    const logId = await findRecordId(vault, CASE_LOG_NAME, caseId);
    if (logId) await vault.delete(logId);
    // "Start over" discards the case entirely — nothing should still point at a case with no file,
    // so the next save (a fresh createCaseFile()) starts genuinely clean rather than colliding
    // with a stale pointer/index entry for a case that no longer exists.
    const pointerId = await findMetaRecordId(vault, ACTIVE_CASE_POINTER_NAME);
    if (pointerId) await vault.delete(pointerId);
    await removeCaseIndexEntry(vault, caseId);
  });
}

export async function deleteCaseLog(vault: Vault): Promise<void> {
  return vault.atomic(async () => {
    const caseId = await resolveActiveCaseId(vault);
    if (!caseId) return;
    const id = await findRecordId(vault, CASE_LOG_NAME, caseId);
    if (id) await vault.delete(id);
  });
}
