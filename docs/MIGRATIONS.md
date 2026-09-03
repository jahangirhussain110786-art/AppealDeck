# Vault Migrations — strategy + per-release checklist

**Why this file exists / when to use it.** The encrypted evidence vault is the product's memory. A botched schema or envelope change on user data is unrecoverable harm. This file converts `02-BUILD-PLAN-AMENDMENTS.md` AM-13 (which in turn summarises `03-TECHNICAL-RISK-CONTROLS.md` TRC-04) into a one-page contract for the AI assistant and the founder to follow on every release that touches the vault. The migration harness at `src/core/vault/migration.test.ts` is the acceptance test that proves the contract holds.

**Status (3 Sep 2026).** v1 ships with envelope version 1 (AES-GCM, 12-byte IV, 256-bit key, optional AD). The 10k-record harness PASSES in ~5s on a developer laptop. The Dexie `upgrade()` function never calls WebCrypto; the (currently empty) `db.on('ready')` hook is wired and ready for the first re-encryption job.

---

## 1. The contract (binding on every release that touches the vault)

1. **No WebCrypto inside `upgrade()`.** IndexedDB transactions are synchronous; async work fails silently or aborts the upgrade. The Dexie `version(N).upgrade(tx)` block may only set synchronous row markers (e.g., `isEncrypted: 0` on rows needing re-encryption). All actual crypto runs in `db.on('ready')`, held open with `Dexie.waitFor()` so the app cannot race ahead of migration.
2. **Versioned encryption envelope.** Every encrypted field carries `{v, alg, iv, ct, ad?}`. The read path dispatches on `v`. Old and new envelope formats co-exist on disk; the old key/path is removed only after 100% of records are confirmed migrated.
3. **Never change primary keys.** Primary-key changes are unfixable for an encrypted vault. Breaking schema changes go export → new database → import. The `exportAll()` / `importAll()` API on `Vault` is the only supported path for PK changes.
4. **No stacked legacy version blocks.** When a third envelope version ships, the second's reader is deleted (not retained "just in case"). Rollback of the app is treated as a fresh-install scenario in QA.
5. **`schemaVersion` marker.** A `schemaVersion` field on every record is the read-path switch. A `schemaVersion` marker in `chrome.storage.local` (web: IndexedDB key `appealdeck-vault:schemaVersion`) detects stale clients and triggers the guided export/import path.
6. **The 10k-record harness runs in CI on every release that touches the vault schema or envelope.** Zero records lost, every record decrypts, mixed-envelope reads work mid-migration, fresh install on the new version works.
7. **New key-derivation or cipher MUST be a new envelope version, not a swap of v1.** The user's data must keep decrypting with the old key path until the new path is fully adopted; the old key never goes away mid-flight.
8. **`localStorage` is forbidden in the vault module.** TRC-03 acceptance check (d). Confirmed by the absence of `localStorage` references in `src/core/vault/` and `src/lib/vault/`.
9. **Ciphertext-only sync.** The Supabase sync (`src/lib/vault/browser.ts`) uploads a JSON envelope containing only the wrapped DEK + encrypted records. Plaintext never crosses the network.
10. **One change per release.** If two envelope versions land in the same release, the migration harness is invalid; roll back, land them sequentially.

---

## 2. Per-release checklist (paste into the release PR description)

- [ ] Envelope version bumped (only if the field shape or algorithm changed) and `VAULT_ENVELOPE_VERSION` updated.
- [ ] `src/core/vault/envelope.ts` change documented inline with date + reason.
- [ ] `src/core/vault/db.ts` `version()` chain updated; new version's `upgrade(tx)` is sync-only.
- [ ] If a re-encryption is needed: `db.on('ready')` holds the work inside `Dexie.waitFor()`.
- [ ] `importRawDek` `extractable` decision reviewed (must remain `true` if re-wrap is required by the new flow).
- [ ] 10k-record harness passes locally: `npx vitest run src/core/vault/migration.test.ts`.
- [ ] `npm test` is green (all 159 tests).
- [ ] `npm run typecheck`, `npm run lint`, `npm run format:check`, `npm run build` all green.
- [ ] If Supabase RLS changed: new migration applied + tested with two users (one cannot read the other's `vault/{userId}/*`).
- [ ] `docs/MIGRATIONS.md` updated to record this release's envelope version bump and migration story.

---

## 3. Today's design (v1, shipped 3 Sep 2026)

- **Envelope:** `{v: 1, alg: "AES-GCM", iv: base64(12B), ct: base64, ad?: base64}` — see `src/core/vault/envelope.ts`.
- **KDF:** PBKDF2-SHA-256, 310,000 iterations, 16-byte salt (per OWASP 2023+ guidance).
- **Key model:** passphrase → KEK (via PBKDF2) → wraps a randomly generated 256-bit DEK → DEK encrypts records. The wrapped DEK is stored on disk; the KEK is recomputed from the passphrase on unlock and never persisted.
- **Two-mode key (TRC-03):** passphrase mode is the default and the only one shipped. A "wrapped" mode (DEK stored in `chrome.storage.local` / IndexedDB without a passphrase) is implemented in `Vault.initWrapped()` but not exposed in the UI — the UI defaults to the safer passphrase mode.
- **Schema:** `records` (id, kind, evidenceKind, caseId, createdAt, schemaVersion, ciphertext, plaintextHash) + `meta` (key: `appealdeck-vault`, value: mode + wrappedDek + kdf).
- **Sync:** `appealdeck-vault` bucket, owner-scoped via `auth.uid()::text` folder prefix; RLS policies on `storage.objects` (`vault_owner_select/insert/update/delete`).
- **Size cap:** 10 MB per record (per v1.0 §9.1 expectation; UI surfaces this as the upload limit).
- **No remote code, no remote selectors** — sync is data only, per TRC-10.

---

## 4. How to add a new envelope version (worked example)

Suppose we want to move from AES-GCM to AES-GCM-SIV (nonce-misuse resistance).

1. Bump `VAULT_ENVELOPE_VERSION` to `2` in `src/core/vault/envelope.ts`.
2. Add `alg: "AES-GCM-SIV"` to the `EncryptionEnvelope` union.
3. Implement `encryptV2` / `decryptV2` in `src/core/vault/crypto.ts`; the read path dispatches on `envelope.v`.
4. The `Vault.add()` write path picks the current `VAULT_ENVELOPE_VERSION`; old records stay on v1 until migrated.
5. The `db.on('ready')` hook in `src/core/vault/db.ts` (currently empty) is where the v1→v2 re-encryption job will live, wrapped in `Dexie.waitFor()`. Re-wrap each record: decrypt with v1 KEK, encrypt with v2 DEK, mark the row's `schemaVersion` = 2.
6. The 10k harness in `migration.test.ts` is updated: build a v1 vault, run the migration against the same DB, assert all 10,000 records now decrypt under the v2 key with zero loss.
7. Until 100% of records are migrated, the old KEK + v1 decrypt path is retained. After full migration, the v1 read path can be deleted in a follow-up release.
8. New release ships; old clients keep reading their v1 records because the `schemaVersion` field tells the app which path to use. Fresh installs on v2 only need the v2 path.

---

## 5. Known unknowns (watch list)

- **DEK rotation cadence.** The passphrase change path re-wraps the DEK but does not re-encrypt records (the DEK doesn't change, only its wrapping). Record-level key rotation is not yet specified; deferred to a future release.
- **Per-case scoped DEKs.** Today the vault is one-DEK-per-account. A future design may want one DEK per `caseId` so that compromising one case's passphrase doesn't expose other cases. Not required for v1; design left for v2.
- **Cross-device merge.** Today `pushVaultToCloud` overwrites the cloud snapshot. A future change may keep a per-device log for conflict-free merging; deferred.
- **Tamper detection beyond AES-GCM auth tag.** AES-GCM fails closed on tamper (decrypt returns the WRONG_PASSPHRASE error) which the UI surfaces as "wrong passphrase." A future release may add a per-record HMAC over the plaintext hash for a sharper error message.
