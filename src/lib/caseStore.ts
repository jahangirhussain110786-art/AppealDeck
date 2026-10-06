"use client";

import type { Vault } from "@/core/vault/vault";
import type { CaseFile } from "@/core/caseFile";
import { isSubmitted, type CaseState, type ReplyCategory } from "@/core/caseState";
import type { EvidenceKind } from "@/core/evidenceModel";
import type { ViolationKind } from "@/core";
import { repairStoredDeadlines } from "@/core/deadlinesModel";
import { syncCaseReminder } from "./reminderSync";

export const CASE_FILE_NAME = "case_file";
export const CASE_LOG_NAME = "case_log";
const ACTIVE_CASE_POINTER_NAME = "active_case_pointer";
const CASE_INDEX_NAME = "case_index";
const PENDING_ACTIVE_CASE_KEY = "appealdeck-pending-active-case";

/**
 * Which case the seller just chose, recorded synchronously so the choice survives a navigation
 * that outruns the vault write (22 Sep 2026 fix).
 *
 * The durable pointer lives in the vault, and writing it is asynchronous: `vault.atomic` has to
 * find, delete and re-add an encrypted record in IndexedDB. Selecting a case in the dashboard's
 * case list started that write and returned immediately, so a seller who clicked a case and then
 * clicked Case in the header within the same breath loaded the case they had just switched away
 * from — and could then edit the wrong case, in a product whose whole promise is not losing their
 * work. Under load this is not rare: it reproduces in 2 of 3 runs of
 * `decode-continuity.spec.ts:130` at four workers.
 *
 * `sessionStorage` is written synchronously, so the intent is already durable when navigation
 * begins. It is a short-lived marker of intent, never a second source of truth: the next
 * resolution adopts it into the vault pointer and any pointer write clears it, so a vault and a
 * marker can never disagree for longer than one read. Per-tab by nature, which is correct — a
 * case switch in one tab is not an instruction to the others.
 */
function markPendingActiveCase(caseId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(PENDING_ACTIVE_CASE_KEY, caseId);
  } catch {
    // Storage unavailable (private browsing, quota). The vault write still runs; the seller
    // simply loses the protection against outrunning it. Never block a case switch over this.
  }
}

function readPendingActiveCase(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem(PENDING_ACTIVE_CASE_KEY);
  } catch {
    return null;
  }
}

function clearPendingActiveCase(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(PENDING_ACTIVE_CASE_KEY);
  } catch {
    // Nothing to do — a marker we cannot clear is re-validated on every read anyway.
  }
}

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
  /** True once the seller has archived this case from the case list (see `setCaseArchived`).
   * The case file and log are untouched — archiving only changes how the case list displays it. */
  archived?: boolean;
}

export interface CaseLog {
  reminderAt?: string;
  /**
   * AA-40: the seller has opted in to an email when `reminderAt` arrives. Opt-in per case, and the
   * only thing that causes any case-related data to reach the server outside a decode or a draft.
   * Absent or false means the reminder stays entirely on this device.
   */
  emailReminder?: boolean;
  /**
   * AA-40: when this case was last opened by the seller. Written on open, read before writing, so
   * the dashboard can say what came due while they were away. Absent on a case never reopened.
   */
  lastSeenAt?: string;
  /**
   * AA-40: the case is blocked on a third party the seller does not control — a supplier who has
   * not sent an invoice, a rights owner who has not answered. Recorded by the seller, never
   * inferred: the product cannot know whether an email was actually sent.
   */
  waitingOn?: {
    /** Free text, e.g. "my supplier" or "the rights owner". Shown back verbatim. */
    party: string;
    /** ISO date the seller started waiting. */
    since: string;
    /** ISO date to chase. Drives a clock item exactly like a reminder does. */
    followUpAt?: string;
    note?: string;
  };
  state: CaseState;
  attemptCount: number;
  submittedAt?: string;
  /**
   * The seller said they sent a response outside this product ("mark as sent"). No submission is
   * recorded for it, so without this the log had nothing saying "something was sent" and taking an
   * outcome back moved the case to INTAKE instead of waiting. Counted by `hadSubmission`.
   */
  markedSentAt?: string;
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
  /**
   * What the seller says happened with this case, recorded by their own explicit choice — never
   * inferred, never verified against Amazon. Always presented to the seller as self-reported.
   */
  resolution?: { status: "reinstated" | "rejected" | "withdrawn"; at: string };
}

// Both lookups ask for `kind: "case"` records only (30 Sep 2026). A case file, a case log, the
// active-case pointer and the case index are all written with that kind — since the first version
// of this store — and are a few kilobytes of JSON. They used to be found by listing the whole
// vault, which reads every attached file's bytes too; see `Vault.list`.
async function findRecordId(vault: Vault, name: string, caseId: string): Promise<string | null> {
  const list = await vault.list({ caseId, kind: "case" });
  const found = list.find((r) => r.name === name);
  return found?.id ?? null;
}

/** Finds a vault-wide (non-per-case) bookkeeping record by name — the active-case pointer and
 * the case index both live outside any one case's `caseId` scope, since they describe the whole
 * vault. */
async function findMetaRecordId(vault: Vault, name: string): Promise<string | null> {
  const list = await vault.list({ kind: "case" });
  const found = list.find((r) => r.name === name && !r.caseId);
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
  // Delete-then-add in one transaction (6 Oct 2026). Outside one, a second tab reading between the
  // two steps found no pointer. Safe to nest: Dexie joins a call made inside an outer `atomic`.
  await vault.atomic(async () => {
    const existing = await findMetaRecordId(vault, ACTIVE_CASE_POINTER_NAME);
    if (existing) await vault.delete(existing);
    await vault.addString({
      name: ACTIVE_CASE_POINTER_NAME,
      mimeType: "application/json",
      data: JSON.stringify({ caseId }),
      kind: "case",
    });
  });
  // Only now. Clearing the marker before this point drops the safety net while the vault is still
  // mid-write: this function deletes the old pointer before adding the new one, and a navigation
  // that lands in that window leaves a vault with no pointer at all and nothing left to recover
  // the seller's choice from. Cleared last, whichever path wrote the pointer — including
  // `saveCaseFile`, so starting a new case still cannot be undone by a marker for an older one.
  clearPendingActiveCase();
}

async function readCaseIndex(vault: Vault): Promise<CaseIndexEntry[]> {
  const id = await findMetaRecordId(vault, CASE_INDEX_NAME);
  if (!id) return [];
  try {
    const { text } = await vault.getString(id);
    const parsed: unknown = JSON.parse(text);
    if (Array.isArray(parsed)) return parsed as CaseIndexEntry[];
  } catch {
    // Fall through to the rebuild below.
  }
  // The index exists but cannot be read. Returning [] here let the next save write an index with one
  // entry, so every other case dropped off the dashboard list while its records stayed in the vault.
  // The case files themselves are the source of truth: list them instead.
  return rebuildCaseIndex(vault);
}

async function rebuildCaseIndex(vault: Vault): Promise<CaseIndexEntry[]> {
  const rebuilt: CaseIndexEntry[] = [];
  try {
    for (const item of await vault.list({ kind: "case" })) {
      if (item.name !== CASE_FILE_NAME || !item.caseId) continue;
      try {
        const { text } = await vault.getString(item.id);
        const parsed = JSON.parse(text) as { kind?: ViolationKind; createdAt?: string };
        if (parsed.kind) {
          rebuilt.push({
            id: item.caseId,
            kind: parsed.kind,
            createdAt: parsed.createdAt ?? item.createdAt,
          });
        }
      } catch {
        // One unreadable case file must not hide the others.
      }
    }
  } catch {
    return [];
  }
  return rebuilt;
}

async function writeCaseIndex(vault: Vault, index: CaseIndexEntry[]): Promise<void> {
  await vault.atomic(async () => {
    const existing = await findMetaRecordId(vault, CASE_INDEX_NAME);
    if (existing) await vault.delete(existing);
    await vault.addString({
      name: CASE_INDEX_NAME,
      mimeType: "application/json",
      data: JSON.stringify(index),
      kind: "case",
    });
  });
}

/** Merges rather than replaces, so a plain re-save of the case file (which never knows about
 * `archived`) can't silently un-archive a case the seller archived earlier. */
async function upsertCaseIndexEntry(vault: Vault, entry: CaseIndexEntry): Promise<void> {
  const index = await readCaseIndex(vault);
  const next = index.some((e) => e.id === entry.id)
    ? index.map((e) => (e.id === entry.id ? { ...e, ...entry } : e))
    : [...index, entry];
  await writeCaseIndex(vault, next);
}

/** Archives or reopens a case from the case list without touching its file or log. */
export async function setCaseArchived(
  vault: Vault,
  caseId: string,
  archived: boolean,
): Promise<void> {
  await vault.atomic(async () => {
    const index = await readCaseIndex(vault);
    if (!index.some((e) => e.id === caseId)) throw new Error("Case not found");
    await writeCaseIndex(
      vault,
      index.map((e) => (e.id === caseId ? { ...e, archived } : e)),
    );
  });
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
  // A switch whose vault write was outrun by navigation is completed here, before anything reads
  // the pointer. Validated against the index first: a marker naming a case this vault does not
  // have is discarded rather than allowed to strand the seller on nothing.
  const pending = readPendingActiveCase();
  if (pending) {
    // Validated against a real case file — the same check `setActiveCaseId` makes — not merely
    // against the index. A marker naming a case this vault cannot actually load is discarded
    // rather than allowed to strand the seller on nothing.
    if (await findRecordId(vault, CASE_FILE_NAME, pending)) {
      await writeActivePointer(vault, pending);
      return pending;
    }
    clearPendingActiveCase();
  }

  const pointed = await readActivePointer(vault);
  if (pointed) {
    // A pointer to a case that was deleted in another tab would show "no case" while others exist.
    // Only when the named case has neither a file nor a log, and the index still lists others.
    const hasFile = await findRecordId(vault, CASE_FILE_NAME, pointed);
    const hasLog = hasFile ? null : await findRecordId(vault, CASE_LOG_NAME, pointed);
    if (hasFile || hasLog) return pointed;
    const others = (await readCaseIndex(vault)).filter((e) => e.id !== pointed);
    if (others.length === 0) return pointed;
    const newest = [...others].sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]!;
    await writeActivePointer(vault, newest.id);
    return newest.id;
  }

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
 * without loading each full case file. Used by DashboardClient and WorkspaceSummary's case list. */
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
  // Synchronous, and deliberately before the first `await`: by the time this returns to the click
  // handler the choice is already recorded, so a navigation that beats the vault write still
  // lands on the case the seller picked.
  markPendingActiveCase(caseId);
  // The marker is deliberately left in place if this throws. A failure here is either a case that
  // does not exist — which the next resolution validates and discards on its own — or a vault
  // write that did not land, which is exactly the case the marker is for: dropping it would turn
  // a recoverable failure into a silently wrong case. The caller surfaces the error.
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
  // Deadlines saved before 23 Sep 2026 may carry a window counted from a click rather than from
  // the notice. Corrected here, on the one read path, so no screen or reminder ever sees one — see
  // `repairStoredDeadlines`. The corrected shape is written back by the next save.
  const deadlines = repairStoredDeadlines(parsed.deadlines);
  return {
    ...parsed,
    id: parsed.id ?? caseId,
    createdAt: parsed.createdAt ?? new Date(0).toISOString(),
    ...(deadlines ? { deadlines } : {}),
  };
}

/**
 * Saves a case's log. Pass `forCaseId` whenever the log was loaded for a known case: without it the
 * log is written to whichever case is active NOW, so a seller who switched case (in the sidebar or
 * another tab) after the screen loaded would have this case's log written over the other one's.
 */
export async function saveCaseLog(vault: Vault, log: CaseLog, forCaseId?: string): Promise<void> {
  return vault.atomic(async () => {
    const caseId = forCaseId ?? (await resolveOrCreateActiveCaseId(vault));
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

export async function loadCaseLog(vault: Vault, requestedCaseId?: string): Promise<CaseLog | null> {
  const caseId = requestedCaseId ?? (await resolveActiveCaseId(vault));
  if (!caseId) return null;
  const id = await findRecordId(vault, CASE_LOG_NAME, caseId);
  if (!id) return null;
  const { text } = await vault.getString(id);
  return JSON.parse(text) as CaseLog;
}

/**
 * Deletes one case from this browser completely: its file, its log and every document attached to
 * it, and its entry in the case list. Returns how many documents went with it.
 *
 * Added 24 Sep 2026. The privacy policy says a case stays in the browser "until you delete" it,
 * and nothing in the product could: the vault page hides case records, the dashboard only
 * archives, and the only delete helper (`deleteCaseFile`, called by nothing) removed the file and
 * log but left the case's documents in the vault with no case to belong to.
 *
 * One transaction, so a failure part-way leaves the case whole rather than half-deleted. If it was
 * the active case, the newest remaining case becomes active, so the dashboard opens on a real case
 * instead of an empty page while others still exist.
 */
export async function deleteCase(vault: Vault, caseId: string): Promise<{ documents: number }> {
  /*
    6 Oct 2026: the server's reminder row was cancelled only by a caller that knew the seller was
    signed in, so a case deleted after the sign-in lapsed left an email going out about it. Best
    effort and never blocking: whenever the log says an email reminder was ever switched on, ask the
    server to drop it. A refusal (signed out, offline) changes nothing about the deletion.
  */
  try {
    const log = await loadCaseLog(vault, caseId);
    if (log?.emailReminder && typeof fetch === "function")
      await syncCaseReminder({ caseRef: caseId, kind: "UNKNOWN", enabled: false });
  } catch {
    // Not being able to cancel must never keep a seller from deleting their own case.
  }
  return vault.atomic(async () => {
    const records = await vault.list({ caseId });
    for (const r of records) await vault.delete(r.id);
    await removeCaseIndexEntry(vault, caseId);

    if ((await readActivePointer(vault)) === caseId) {
      const pointerId = await findMetaRecordId(vault, ACTIVE_CASE_POINTER_NAME);
      if (pointerId) await vault.delete(pointerId);
      const [newest] = [...(await readCaseIndex(vault))].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      );
      if (newest) await writeActivePointer(vault, newest.id);
    }
    if (readPendingActiveCase() === caseId) clearPendingActiveCase();
    return { documents: records.filter((r) => r.kind === "document").length };
  });
}

/**
 * The state a case file should hold once `log` is saved, or `null` when it already holds it.
 *
 * Recording an outcome writes the new state into the log, but the clock, the "waiting on Amazon"
 * card and the case summary all read the case file's own state, so a settled case kept saying it
 * was waiting until something else rewrote the file (6 Oct 2026). Only the two outcome-driven
 * moves are made here: a recorded outcome settles the file, and clearing it moves a settled file
 * back to waiting (if anything was sent) or intake. Any other state is left to the workspace.
 */
export function fileStateAfterLog(
  file: Pick<CaseFile, "state"> & { workspace?: { submissions: readonly { source?: string }[] } },
  log: Pick<CaseLog, "resolution" | "attemptCount" | "submittedAt" | "markedSentAt">,
): CaseState | null {
  if (log.resolution) {
    const next: CaseState = log.resolution.status === "reinstated" ? "APPROVED" : "CLOSED";
    return next === file.state ? null : next;
  }
  if (file.state !== "APPROVED" && file.state !== "CLOSED") return null;
  return hadSubmission(log, file.workspace) ? "SUBMITTED" : "INTAKE";
}

/**
 * Whether anything was sent to Amazon on this case: a recorded submission, a response the seller
 * marked as sent outside the product, or a non-zero attempt count. One definition, read by both the
 * log writer (`logWithOutcome`) and the file-state writer (`fileStateAfterLog`) — they used to
 * compute it differently, so recording an outcome and taking it back on a "marked as sent" case
 * lost the waiting state (6 Oct 2026).
 */
export function hadSubmission(
  log: Pick<CaseLog, "attemptCount" | "submittedAt" | "markedSentAt"> | null | undefined,
  workspace?: { submissions: readonly { source?: string }[] },
): boolean {
  return (
    (log?.attemptCount ?? 0) > 0 ||
    log?.submittedAt !== undefined ||
    log?.markedSentAt !== undefined ||
    Boolean(workspace?.submissions.some((s) => s.source !== "prior"))
  );
}

/**
 * Whether a case has moved past preparing its first response: waiting on Amazon, in a later round,
 * or ended. Reviewing the notice on such a case is bookkeeping and must not send it back to INTAKE
 * (6 Oct 2026: a marketplace change on a waiting case lost "waiting on Amazon").
 */
export function isPastSubmission(state: CaseState): boolean {
  return isSubmitted(state) || state === "APPROVED" || state === "CLOSED";
}

/**
 * The case file a workspace commit writes. The file-level fields (`state`, `kind`, `deadlines`, and
 * anything else that is not the workspace) are taken from what is on disk, never from the copy a tab
 * loaded earlier: the commit's conflict check compares only the workspace, so a stale tab that wrote
 * its own `state` back quietly turned a recorded CLOSED into SUBMITTED while the log still said
 * rejected (6 Oct 2026). Whatever the commit itself names — a state, a kind, deadlines — still wins.
 */
export function fileForCommit(
  current: CaseFile,
  disk: CaseFile | null | undefined,
  workspace: NonNullable<CaseFile["workspace"]>,
  named: {
    state?: CaseState;
    deadlines?: CaseFile["deadlines"];
    kind?: CaseFile["kind"];
    kindSetBy?: CaseFile["kindSetBy"];
  },
): CaseFile {
  const base = disk && disk.id === current.id ? disk : current;
  return {
    ...base,
    workspace,
    state: named.state ?? base.state,
    ...(named.deadlines !== undefined ? { deadlines: named.deadlines } : {}),
    ...(named.kind !== undefined ? { kind: named.kind } : {}),
    ...(named.kindSetBy !== undefined ? { kindSetBy: named.kindSetBy } : {}),
  };
}

/**
 * A commit that would move a case out of a recorded outcome (APPROVED / CLOSED with a
 * `resolution`) into a working state — a new submission, a new revision, intake — is refused,
 * because the log would go on saying the case ended while a round restarted. The seller takes the
 * outcome back first, an explicit step that cannot lose the outcome record silently.
 */
export function outcomeBlocksStateChange(
  currentState: CaseState,
  log: Pick<CaseLog, "resolution"> | null | undefined,
  nextState: CaseState | undefined,
): boolean {
  if (!nextState || !log?.resolution) return false;
  const settled = (s: CaseState) => s === "APPROVED" || s === "CLOSED";
  return settled(currentState) && !settled(nextState);
}

/**
 * Saves the log, then keeps the case file's state in step with the outcome it records. Written as
 * two saves rather than one transaction because `saveCaseFile` opens its own; the file is re-read
 * after the log is saved so a state change never overwrites newer workspace content.
 */
export async function saveCaseLogAndState(
  vault: Vault,
  log: CaseLog,
  forCaseId?: string,
): Promise<void> {
  await saveCaseLog(vault, log, forCaseId);
  const file = await loadCaseFile(vault, forCaseId);
  if (!file) return;
  const next = fileStateAfterLog(file, log);
  if (next && next !== file.state) await saveCaseFile(vault, { ...file, state: next });
}
