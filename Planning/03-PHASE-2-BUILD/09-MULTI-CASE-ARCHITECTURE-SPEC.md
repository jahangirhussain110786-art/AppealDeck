# 09-MULTI-CASE-ARCHITECTURE-SPEC — moving off the single hardcoded case

> Planning only. No code changed by this document. Written because the founder asked directly
> in chat (14 Sep 2026) to make AppealDeck "a true functional Operating System for sellers to
> use," not "a wordy website" — this is the largest structural gap that framing surfaced, and it
> touches nearly every page plus real vault data, so it gets a plan reviewed before any schema
> work starts, rather than a drive-by fix.

## 0. Why this exists

The same session fixed a contained bug in the same spirit (deadlines computed at decode time
were discarded instead of carried to Dashboard — `docs/handoffs/` git log, commit `08d6739`).
Investigating further for the same "OS not website" framing found something structural, not
cosmetic: **`CASE_ID` is a fixed constant** (`"appealdeck-case-1"`, `src/lib/caseStore.ts:7`),
referenced identically by every page that touches a case. The product can hold exactly **one
case, ever, per seller's vault.** That is the real ceiling on ever being an operating system for
a seller's account health rather than a single-use appeal-drafting tool — an OS manages an
ongoing relationship with the user's situation; this manages one transaction.

## 1. What "one case" currently means, precisely (grounded in code, not inferred)

- `CaseFile` and `CaseLog` are each stored as a single vault record, located by **name**
  (`case_file`, `case_log`) via `findRecordId()` (`caseStore.ts`) — there is no list of cases
  anywhere in the schema, just "the one record with this name."
- Starting a new case (`InterviewFlow.tsx`'s `handleStart` → `createCaseFile()` →
  `saveCaseFile()`) always writes under the same `CASE_ID`. `saveCaseFile()` **deletes the
  existing record by name before writing the new one** (`caseStore.ts:36-48`). A seller who
  resolves case #1 and is suspended again later has no path to a second case that doesn't
  destroy the first — today, starting a new case *is* destroying the old one.
- Everything built on top of this — the `05-CASE-OS-SPEC.md` state machine (whose own §5 calls
  itself "the OS claim"), `responseAnalyzer.ts`, `outcomeModel.ts`, the deadline persistence just
  shipped — assumes exactly one active case exists. None of that logic needs to change; it only
  needs to be told *which* case.
- The vault's storage layer **already supports per-case scoping** — evidence records carry a
  `caseId`, and `vault.list({ caseId })` is already how `findRecordId()` filters. Only the
  application layer hardcodes the one value it ever passes. This materially lowers the risk here:
  the partition key already exists and is already exercised by the current single-case path: the
  fix is removing a constant, not inventing a new storage primitive.

## 2. What "OS" requires here, concretely

- A second (or third) case when a new violation happens, without losing or overwriting the first.
- A history to look back on — what happened last time, what worked — which is also what the
  opt-in outcome model (EF-5, `outcomeModel.ts`) is already half-built to use, once more than one
  case's worth of outcomes can exist for the same seller.
- One home surface that shows "all your cases," the way Dashboard today shows "your one case."

## 3. Proposed shape (draft — for review, not final)

- Replace the fixed `CASE_ID` constant with a real per-case identifier (`caseId`, e.g. a
  ULID/UUID generated once in `createCaseFile()`) carried on the case file itself and used as the
  vault partition key already in use today.
- Add a small index record (name `case_index`, kind `"case"`) listing
  `{ id, kind, createdAt, state }` for every case in the vault — cheap to keep in sync (append on
  create, patch `state` on save) and is what a "Your Cases" list reads without loading every full
  case file.
- `caseStore.ts`'s functions (`loadCaseFile`, `saveCaseFile`, `loadCaseLog`, `saveCaseLog`) take
  an explicit `caseId` instead of the implicit constant. A small `getActiveCaseId()` /
  `setActiveCaseId()` pair (one more small vault record, or a plain local preference) tracks
  "which case is Dashboard/Compose/Vault currently showing" — single-case callers barely change
  shape, they resolve the active id once instead of importing a constant.
- **Migration.** Every existing vault has exactly one case under the old fixed `CASE_ID`. A
  one-time migration reads that record, assigns it a real generated id, writes the index entry,
  and leaves every evidence record's existing `caseId` linkage untouched. This is the same shape
  of problem the vault's v1→v2 crypto migration already solved and proved
  (`src/core/vault/migration.test.ts` — "10k-record migration harness... zero loss") — reuse that
  harness's pattern and rigor rather than inventing a new migration approach.

## 4. UI implications (sketch, not committed)

- Dashboard gains a lightweight case switcher / "Your Cases" list once more than one exists; with
  exactly one case (true for every seller today), the experience is pixel-identical to now — no
  new UI weight for the common case.
- `/case`, `/compose`, `/vault` all resolve "the active case" the same way Dashboard does — a
  shared resolution step, not a per-page redesign.
- Starting a new case becomes an explicit choice ("Start a new case" vs. "Resume [kind], started
  [date]"), instead of the current always-overwrite.

## 5. Proposed phasing

1. **P0 — data layer only.** Real `caseId`, index record, migration written and tested against
   the existing 10k-record harness pattern. No visible UI change — single-case behavior is
   bit-for-bit identical; this phase is purely about making the next ones possible without risk
   to existing data.
2. **P1 — Dashboard case list.** Read-only "Your Cases"; switching sets the active id.
3. **P2 — explicit new-case flow + cross-case features.** "Start a new case," and — once real
   outcome data exists — honest, opt-in-only history/comparison across a seller's own cases
   (never aggregate "win rate" marketing; D6 still governs).

## 6. Risks / open questions for the founder

- **Real user vault data.** Anyone with a case in production goes through the migration path
  above. This needs the same rigor as the v1→v2 crypto migration before it touches a real
  seller's vault — not a smaller bar because it's "just an ID."
- **Scope vs. the standing feature freeze.** `05-CASE-OS-SPEC.md` §5 records a feature freeze
  after AM-17 "until first paid Passes + opt-in outcomes exist... further depth is bought with
  outcome data, not speculation (D10 is the arbiter)." This spec doesn't override that freeze on
  its own authority — it exists because the founder raised the "OS, not website" direction
  directly in chat; whether multi-case work jumps ahead of that gate is a founder call, not
  assumed here.
- **AM / decision-log entry.** Per house practice, this gets its own AM-XX number and a
  `docs/DECISIONS.md` entry only once the founder actually ratifies a direction here — deliberately
  left unassigned in this draft.

## Definition of done (for this planning pass only)

- [x] Founder has read this spec and approved it directly in chat (14 Sep 2026: "whatever you
      have found to fix, just fix this, i approve you") rather than asking for changes.
- [x] **P0 shipped** (commit `e8f9c37`): `CaseFile` carries a real `id`/`createdAt`
      (`core/interviewEngine.ts`); `caseStore.ts` rewritten around real per-case ids with a case
      index + active-case pointer, `listCases()`/`getActiveCaseId()` exported read-only; every
      existing call site's signature is unchanged (no ripple through ComposeView/DashboardClient/
      VaultView); migration is zero-data-movement — a pre-migration vault's old fixed
      `"appealdeck-case-1"` id is adopted as that case's permanent id on first read, nothing is
      moved, deleted, or re-keyed (proven by a test that seeds a literal pre-migration record and
      asserts it is byte-for-byte untouched). `InterviewFlow.tsx`'s evidence-upload caseId now
      uses the real active case's id instead of the old constant — a genuine correctness fix the
      old code needed regardless. Gates: tsc 0 · eslint 0 · lint-copy PASS · format 0 · vitest
      431/431 · build 33 routes · Playwright chromium 54/54 (including the live signed-out
      interview + dashboard flow).
- [x] **P1 (case-switcher UI) — done, recorded 24 Sep 2026 (gap C-08).** The dashboard lists and switches cases, the workspace has a "New case" action, evidence is listed per case (`src/lib/caseEvidence.ts` filters by `caseId`), and a case can be deleted with its files (`deleteCase`, 24 Sep). The paragraph below is the 14 Sep state, kept as history: With exactly one case per seller today (true until a
      UI exists to start a second one), behavior is unchanged end-to-end — this was P0's explicit
      goal. Also not yet touched in P1's scope: evidence listing elsewhere
      (`EvidenceSlotPanel`'s own uploads, `ComposeView`'s `withVaultEvidence`) still reads the
      whole vault rather than filtering by the active case's id — harmless only because no second
      case exists anywhere in the UI yet to create the ambiguity; genuinely needed once P1 ships.
- [x] Recorded as **AM-29** (24 Sep 2026) in `02-BUILD-PLAN-AMENDMENTS.md` and in `docs/DECISIONS.md`. Original item: AM-XX entry + `docs/DECISIONS.md` entry for this pass, once the founder wants it recorded
      alongside the other AM amendments (not blocking further work — founder approval already
      given directly in chat).
