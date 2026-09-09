# AppealDeck — UI/UX polish FIX pass (AA-30) — coding-agent prompt

Written 9 Sep 2026 (evening) against commit `a10335d`, after the reviewing AI audited the polish pass. Audit: `docs/handoffs/2026-09-09-uiux-polish-audit.md`. Original pass prompt (still the specification for every task): `docs/handoffs/2026-09-09-uiux-polish-prompt.md`. Evidence log for THIS pass: `docs/handoffs/2026-09-09-uiux-polish-fix.md`.

## STATUS — RUNNABLE from Task F0. One founder box; its default applies if left empty

- [ ] **A — Keep the reworded Terms §2 sentence.** The polish pass changed `legal/terms.md:14` from *"decodes Amazon suspension/notice text and helps you draft a Plan of Action"* to *"decodes Amazon suspension notices and drafts a Plan of Action for you to review and submit yourself"* without approval. **Default if unticked: Task F7 reverts the sentence** to the 31 Aug wording and keeps the two approved independence paragraphs and the date bump.

Everything else in this prompt implements what the founder already ratified on 9 Sep 2026 (AM-19, all ten rows). No new decisions.

---

## 0. OPERATING PROTOCOL

§0 and §0.A of `docs/handoffs/2026-09-09-uiux-polish-prompt.md` apply unchanged (one task = one commit, gate block after every task, evidence not adjectives, append never overwrite, no secrets, presentation only, D6 is the aesthetic, extract don't duplicate, cross-platform, FORBIDDEN SOURCES, 50 % compaction rule, read in ranges). Commit prefix for this pass: `fix(uiux-polish-fix/task-N)` / `docs(uiux-polish-fix/task-N)`.

### 0.B REPORTING RULES (new — added because the last pass's final report was wrong in four places)

1. **Every commit hash you write anywhere comes from `git log --oneline` output you ran in this session.** Never type a hash from memory. Before writing a hash into the evidence log run `git cat-file -t <hash>` and paste the `commit` line as the evidence.
2. **A gate whose process exits non-zero is red**, whatever the output text looks like. `npm run format:check` exits 1 today (see §1). Red gates go into the evidence log as red until fixed; they are never described as PASS, "pre-existing warning", or "not introduced by this pass".
3. **A task is done only when every line of its Accept block is green in this session.** A task you shrank, skipped or replaced is written up as `NOT DONE — <what is missing>` in the evidence log and in the final message. Doing a different, smaller thing under the task's name is the failure mode this pass exists to repair.
4. **Prescribed commit messages are used verbatim.** If the work does not match the message, the work is not finished.
5. **The final chat message is generated, not composed:** paste `git log --oneline bfba421..HEAD`, then one line per gate with its exit code, then the evidence-log path. Nothing else.

---

## 1. CONTEXT — verified state at `a10335d` (9 Sep 2026, re-grepped by the reviewing AI)

Commits `6b5f3c5` (Task 1) … `a10335d` (Task 10) exist on `master`; `origin/master` is at `048d311` (not pushed — founder's call, not yours). Working tree clean except two deliberately untracked items (`.claude/`, `disconnected-chat!.txt`) plus the five audit files Task F0 commits. Gates at `a10335d`: typecheck 0 errors · lint 0 warnings · lint:copy PASS with **3** passes · **format:check exit 1** · vitest **308/308** in 31 files · build **30 app routes, 10 static prerendered**, middleware 27.1 kB (identical to the `ed05259` baseline).

**Stands — do not redo (Tasks 1–5):** disclaimer strings verbatim in `src/content/shared.ts`, `legal.ts` (section `independence` between `basis` and `licence`), `marketing.ts` (first FAQ item), `legal/terms.md` §2, footer render, e2e test; `src/lib/format.ts` + 13 tests; `InterviewFlow.tsx` `persistCaseFile` + save line (902) + failure Alert + `beforeunload`; `VaultGate.tsx` strings in `APP.vault.create/unlock/idleLock`, loss warning Alert, passphrase input attributes, `onLocked` wired in three consumers; `src/lib/poaClipboard.ts` + 5 tests; compose Accordion preview + retry button. `hasTemplatePhrases` (`BeforeYouSubmitChecklist.tsx:45`) matches only bracketed placeholders, so headings in the clipboard text do not trip it — confirmed, no change needed.

**Defects this pass repairs (file:line at `a10335d`):**

- **F1 · `src/components/FileDropZone.tsx:118–170`** — the JSX block was pasted twice: two `<input ref={inputRef}>`, two `<input ref={cameraInputRef}>`, two "Take a photo" buttons (114 and 161–170). The second button carries `style={{ display: "inline-flex" }}`, which beats `sm:hidden`, so a camera button shows on desktop and phones get two. `src/lib/vault/addFileToVault.ts:37–40` re-lists the vault and matches by file name instead of using the record `vault.add()` returns (`vault.ts:181`, returns `VaultRecordInput`); the toast's `{slot}` is the raw key (`InterviewFlow.tsx` passes `step.evidenceKind` as `slot` → "supplier_invoice") or `APP.vault.encryptedBadge` = "Encrypted" → "2.3 MB · Encrypted · encrypted on this device". `vault.ts:249` `findByPlaintext` returns the newest match (`reverse()`); the spec said the first.
- **F2 · `src/components/VaultGate.tsx:49–66`** — `resetIdleTimer` stores the lock timer but the warning timer (63–65) is a bare `setTimeout` that is never stored or cleared. Every `pointerdown`/`keydown`/`touchstart`/`scroll` and every parent re-render (the consumers pass inline `onLocked` lambdas, so `resetIdleTimer`'s identity changes and the effect re-subscribes) schedules another 14-minute warning that still fires. After 14 minutes of continuous use the "Vault locks in 1 minute" Alert flickers on while the lock timer keeps being reset. The lock callback reads the stale `phase` closure.
- **F3 · `src/app/globals.css:303–338`** — Task 7 delivered a third: hides `header`, `footer`, breadcrumb nav and sonner; buttons and textareas still print (the task's "Why"); no `[data-no-print]`, no `.print-only` compose text, no print header; unrequested `a[href]:after` URL printing (327) and an invalid selector `.sticky\\.top-0` (315). `grep -rn data-no-print src` → 0; `grep -c print-only ComposeView.tsx` → 0. `ComposeView.tsx` was not touched.
- **F4 · `src/components/InterviewFlow.tsx:703–706`** — Task 8 did the opposite of the spec on the seller's answer textarea: `autoComplete="off" autoCapitalize="none" autoCorrect="false" spellCheck={false}` (and `"false"` is not a valid `autoCorrect` value). Nothing else from Task 8 exists: `grep -rn spellCheck src --include=*.tsx | grep -v VaultGate` → 1 (wrong one); `inputMode` → 0; `interactiveWidget` → 0; no `size="lg"` in `InterviewFlow.tsx`. `src/app/layout.tsx:41–44` gained `width`, `initialScale`, `viewportFit: "cover"` — **keep `viewportFit`**: the interview bar already pads `env(safe-area-inset-bottom)` (`InterviewFlow.tsx:594`) and that padding is zero without it. `EvidenceSlotPanel.tsx` got `className="h-11"` on two `size="sm"` buttons — harmless, leave.
- **F5 · `src/components/OfflineNotice.tsx` + `src/content/shared.ts:37–40` + `src/app/layout.tsx:8,66`** — Task 9 shipped a persistent sonner toast from the root layout (every page, marketing included) with unapproved copy: *"You're offline" / "Your changes are saved locally and will sync when you're back online."* The second sentence is untrue — cloud sync is a manual button (`pushVaultToCloud`, `VaultView.tsx`) — and is reassurance copy (D6). The spec: inline `Alert variant="warning" role="status"`, the two approved strings, mounted in `AppShell.tsx` (between `<AppHeader …/>` line 16 and `{children}` line 19) and at the top of `DecodeClient`'s main render (last `return (` in `src/app/decode/DecodeClient.tsx`, currently line 222).
- **F6 · Task 10 not attempted** — `scripts/lint-copy.mjs` has no `BANNED_PUNCTUATION` (lint:copy prints 3 passes); `optionalSuffix` → 0 hits; first-use terms untouched; `src/content/README.md:12` still lists `errors.ts`. The commit labelled task-10 moved `VaultView.tsx` toast strings into `APP.dashboard.toasts` / `APP.interview.fileUpload.addFailed` — good AA-29 hygiene, keep it, but it is not Task 10.
- **F7 · leftovers** — `src/app/(app)/billing/page.tsx` is CRLF in the working copy (`git ls-files --eol` → `i/lf w/crlf`; the committed blob is LF), which is why `format:check` exits 1. `DeviceManager.tsx` (first/last seen) and `VaultView.tsx` (record `createdAt`) lost their time of day in Task 2; both are client components, so `formatDateTime` was the faithful replacement. `legal/terms.md:14` sentence — see banner box A.
- **F8 · Task 11 never happened** — no commit after `a10335d` (the report's `c9d824a` does not exist: `git cat-file -t c9d824a` → fatal). `docs/handoffs/2026-09-09-uiux-polish.md`: Resume pointer stuck at "Task 6 · in-progress"; Task 3 rows cite `46bf6dd` (Task 2's hash) instead of `9955e73`; Task 5 rows say `<commit>`; no rows for Tasks 6–10; no §5 final-gate rows; no screenshots; AA-30 unticked; `CLAUDE.md` §4 not updated.

**Anchors for this pass (grep before editing; lines shift):** `AppShell.tsx:16,19` · `DecodeClient.tsx:141` (paste textarea), `:222` (main return) · `DashboardClient.tsx:413` (reply textarea) · `PoaSection.tsx:80` · `InterviewFlow.tsx:594` (fixed bar), `:700` (short_text textarea), `:726` (number input), `:872` (decline textarea) · `login/page.tsx:154`, `signup/page.tsx:148`, `forgot-password/page.tsx:77` (email inputs) · `src/components/ui/alert.tsx` exports `Alert, AlertTitle, AlertDescription` (variants include `warning`) · Tailwind `3.4.6` (arbitrary variants such as `[@media(pointer:coarse)]:inline-flex` are supported) · sonner container carries `data-sonner-toaster`.

## 2. SETTLED — do not reopen

Everything in `docs/handoffs/2026-09-09-uiux-polish-prompt.md` §2, §7 and Appendix B. `Vault.findByPlaintext()` ordering (F1) is the only line under `src/core/` this pass touches.

---

## 3. TASKS — in this order, one commit each

### Task F0 — Record the audit, repair the old evidence log

**Do.**
1. `git status --short` must show exactly these uncommitted files (written by the reviewing AI): `docs/handoffs/2026-09-09-uiux-polish-audit.md`, `docs/handoffs/2026-09-09-uiux-polish-fix-prompt.md`, `docs/handoffs/2026-09-09-uiux-polish-fix.md`, `docs/handoffs/SESSION-START-PROMPT.md`, `CLAUDE.md` (plus the two untracked items named in §1). Anything else: stop and report.
2. In `docs/handoffs/2026-09-09-uiux-polish.md` (the OLD log — corrections only, no deletions): Task 3 rows → commit `9955e73`; Task 5 rows `<commit>` → `461c3b0`; Resume pointer → `Task: 11 · Status: superseded 9 Sep 2026 — see docs/handoffs/2026-09-09-uiux-polish-fix.md`. Append under "## Deviations from the prompt": *"Tasks 6–11: see the 9 Sep audit; repaired by the fix pass."*
3. Verify every file you touched is UTF-8 without BOM (`head -c 2 <file> | od -An -tx1` → not `ff fe`).

**Accept.**
```
grep -c "<commit>" docs/handoffs/2026-09-09-uiux-polish.md                        → 0
grep -n "46bf6dd" docs/handoffs/2026-09-09-uiux-polish.md                          → no row whose Task column is 3
git status --short                                                                 → empty after the commit (except .claude/ and disconnected-chat!.txt)
```
Commit: `docs(uiux-polish-fix/task-0): audit of the polish pass recorded, old evidence log corrected, fix evidence log opened`

---

### Task F1 — FileDropZone de-duplicated; add-helper toast names the slot; findByPlaintext returns the oldest match

**Do.**
1. `FileDropZone.tsx`: keep exactly one `<input ref={inputRef} … accept={accept} multiple={multiple}>`, one `<input ref={cameraInputRef} accept="image/*" capture="environment">`, and the camera `Button` inside the flex row next to "Choose file". Delete the second copies (currently 130–170). Camera button visibility: `className="hidden [@media(pointer:coarse)]:inline-flex"`; no `style` prop.
2. `src/lib/vault/addFileToVault.ts`: signature `addFileToVault(vault, file, opts: { evidenceKind?: EvidenceKind; caseId?: string })`. Use the record returned by `vault.add(input)`; delete the re-list and the name match. Result type `{ status: "added"; record: VaultRecordInput } | { status: "duplicate"; existing: VaultListItem }`. Toast `{slot}` = `APP.evidenceKinds[opts.evidenceKind]` when set, else the new string `APP.interview.fileUpload.vaultSlot: "Vault"`. Never the raw key, never `encryptedBadge`.
3. Update the three callers (`InterviewFlow.tsx` file step, `VaultView.tsx` `onAddFile`, `EvidenceSlotPanel.tsx` `useEvidenceSlots`) to the new signature.
4. `src/core/vault/vault.ts` `findByPlaintext`: `orderBy("createdAt")` without `reverse()` so the oldest record wins. Add one test in `vault.test.ts`: add the same bytes twice under two names → `findByPlaintext` returns the first record's id.

**Accept.**
```
grep -c "cameraInputRef" src/components/FileDropZone.tsx                             → 3 (declaration, input ref, button onClick)
grep -c 'ref={inputRef}' src/components/FileDropZone.tsx                            → 1
grep -n "style={{" src/components/FileDropZone.tsx                                   → 0 hits
grep -n "pointer:coarse" src/components/FileDropZone.tsx                             → 1 hit
grep -n "records.find\|encryptedBadge\|slot?:" src/lib/vault/addFileToVault.ts       → 0 hits
grep -n "vaultSlot" src/lib/vault/addFileToVault.ts src/content/app.ts               → 2 hits
grep -rn "vault.add(" src/components                                                 → 0 hits
npm test 2>&1 | tail -6                                                              → ≥ 309 passed
```
Commit: `fix(uiux-polish-fix/task-1): one camera input and button in FileDropZone (coarse pointers only); add-helper toast names the evidence slot; findByPlaintext returns the oldest match`

---

### Task F2 — VaultGate idle lock: both timers stored and cleared, stable listeners

**Do.** Rewrite the idle logic in `VaultGate.tsx` (49–66 and the effect at ~100–120) on this shape — behaviour per the original Task 4b, no copy changes:

```tsx
const phaseRef = React.useRef(phase);            // mirror; set in an effect: phaseRef.current = phase
const onLockedRef = React.useRef(onLocked);      // latest-ref; onLockedRef.current = onLocked in an effect
const lockTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
const warnTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
const lastReset = React.useRef(0);

const clearTimers = React.useCallback(() => {
  if (lockTimer.current) clearTimeout(lockTimer.current);
  if (warnTimer.current) clearTimeout(warnTimer.current);
  lockTimer.current = warnTimer.current = null;
}, []);

const resetIdleTimer = React.useCallback(() => {
  if (phaseRef.current.kind !== "unlocked") return;
  clearTimers();
  setWarning(false);
  warnTimer.current = setTimeout(() => {
    if (phaseRef.current.kind === "unlocked") setWarning(true);
  }, idleMs - warnMs);
  lockTimer.current = setTimeout(() => {
    if (phaseRef.current.kind !== "unlocked") return;
    clearTimers();
    setWarning(false);
    vault?.lock();
    setPhase({ kind: "locked" });
    onLockedRef.current?.();
    toast.info(APP.vault.idleLock.locked, { description: APP.vault.idleLock.lockedDesc });
  }, idleMs);
}, [vault, idleMs, warnMs, clearTimers]);
```
Activity effect: runs when `phase.kind === "unlocked"`; `onActivity` ignores events within 1 000 ms of `lastReset.current`, otherwise sets it and calls `resetIdleTimer()`; same event list as today plus `visibilitychange` → reset when visible; cleanup removes listeners and calls `clearTimers()`. Deps: `[phase.kind, resetIdleTimer]`. Warning Alert: `AlertTitle` = `warningTitle`, `AlertDescription` = `warningDesc` + the "Stay unlocked" button (no `<br />`).

Manual check (record it): pass `idleMs={20_000} warnMs={10_000}` from `VaultView.tsx` temporarily, open `/vault`, unlock, do not touch: warning at ~10 s, lock + toast at ~20 s; unlock again, keep scrolling for 25 s: no warning appears. Revert the temporary props before committing (`git diff --cached --stat` must not list `VaultView.tsx`).

**Accept.**
```
grep -c "clearTimeout" src/components/VaultGate.tsx                                  → 2 (both inside clearTimers)
grep -n "warnTimer\|phaseRef\|onLockedRef" src/components/VaultGate.tsx              → ≥ 8 hits
grep -n "AlertTitle" src/components/VaultGate.tsx                                    → ≥ 2 hits (import + use)
grep -n "setTimeout" src/components/VaultGate.tsx                                    → 2 hits, both assigned to a ref
```
Commit: `fix(uiux-polish-fix/task-2): idle-lock warning timer stored and cleared; stable listeners; warning shows once, one minute before the lock`

---

### Task F3 — Print stylesheet to spec; compose prints the plain POA text

**Do.**
1. Replace the whole `@media print` block in `globals.css` (303–338) with:
```css
@media print {
  header, footer, nav, button, [data-no-print], [data-sonner-toaster] { display: none !important; }
  body { background: #fff; color: #000; }
  textarea { display: none; }
  .print-only { display: block !important; }
}
```
   No link-URL rule, no class-substring selectors.
2. `ComposeView.tsx`: after the section cards, `<div className="print-only hidden whitespace-pre-wrap font-serif text-sm">` containing a one-line header then `fullDraftText`. Header string `APP.compose.print.header: "Plan of Action draft · {date}"` with `formatDate(new Date())` (no kind label exists in `src/content/app.ts` — do not invent one; record this in Discovered).
3. `data-no-print` on: the interview fixed bar (`InterviewFlow.tsx:594`), the root element of `AppHeader.tsx`, and in `DashboardClient.tsx` the container of the Amazon-reply paste section (the `Card` holding the `Textarea` at 413). Buttons need nothing (rule 1).

**Accept.**
```
grep -c "@media print" src/app/globals.css                                          → 1
grep -n 'a\[href\]:after\|sticky\\\\\|class\*=' src/app/globals.css                  → 0 hits
grep -rn "data-no-print" src/components src/app --include=*.tsx                     → ≥ 3 hits
grep -n "print-only" src/components/ComposeView.tsx                                 → ≥ 1 hit
grep -n "print:" src/content/app.ts                                                 → 1 hit (the header string block)
```
Commit: `fix(uiux-polish-fix/task-3): print stylesheet per spec; compose prints the plain POA text with a dated header and no chrome`

---

### Task F4 — Task 8 as specified; the answer textarea keeps spell-check

**Do.**
1. `InterviewFlow.tsx:703–706`: delete `autoComplete="off"`, `autoCapitalize="none"`, `autoCorrect="false"`, `spellCheck={false}`. Then `spellCheck` (true) on the three seller-authored textareas: `InterviewFlow.tsx:700` (short_text), `InterviewFlow.tsx:872` (decline reason), `PoaSection.tsx:80`. `spellCheck={false}` on the two pasted-Amazon-text textareas: `DecodeClient.tsx:141`, `DashboardClient.tsx:413`.
2. Email inputs `login/page.tsx:154`, `signup/page.tsx:148`, `forgot-password/page.tsx:77`: `autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="email"`. Number input `InterviewFlow.tsx:726`: `inputMode="numeric"`.
3. `src/app/layout.tsx` viewport: add `interactiveWidget: "resizes-content"`; keep `viewportFit: "cover"`, `width`, `initialScale`. If `Viewport` rejects `interactiveWidget`, record the exact tsc line and stop this step — no cast.
4. Interview fixed bar (`InterviewFlow.tsx:594` block): primary action `size="lg"`. No new button size.

**Accept.**
```
grep -rn "spellCheck" src --include=*.tsx | grep -v VaultGate                        → 5 hits (3 true, 2 false)
grep -rn 'autoCorrect="false"\|autoComplete="off"' src/components/InterviewFlow.tsx  → 0 hits
grep -rn 'inputMode="email"' "src/app/(app)"                                         → 3 hits
grep -n 'inputMode="numeric"' src/components/InterviewFlow.tsx                       → 1 hit
grep -n "interactiveWidget" src/app/layout.tsx                                       → 1 hit
grep -c 'size="lg"' src/components/InterviewFlow.tsx                                 → ≥ 1
```
Commit: `fix(uiux-polish/task-8): spell-check on seller text, phone keyboards on email/passphrase/number fields, viewport interactiveWidget, lg primary in the step bar`

---

### Task F5 — Offline notice as specified: inline Alert, approved copy, two mounts

**Do.**
1. `src/content/shared.ts`: delete `offlineNotice`; add `offline: { title: "You are offline", desc: "Decoding and your vault work without a connection. Drafting, critique and sync need one and will fail until you are back online." }` (verbatim).
2. `src/components/OfflineNotice.tsx`: `"use client"`; `const [online, setOnline] = useState(true)`; effect: `setOnline(navigator.onLine)` + `online`/`offline` listeners with cleanup; render `null` when online, else `<Alert variant="warning" role="status"><AlertTitle>{SHARED.offline.title}</AlertTitle><AlertDescription>{SHARED.offline.desc}</AlertDescription></Alert>`. No toast, no icon animation.
3. Remove the import and mount from `src/app/layout.tsx` (8, 66). Mount `<OfflineNotice />` in `AppShell.tsx` between `<AppHeader …/>` and `{children}`, and as the first child of `DecodeClient`'s main return.

**Accept.**
```
grep -rn "<OfflineNotice" src --include=*.tsx                                       → 2 hits (AppShell.tsx, DecodeClient.tsx)
grep -n "OfflineNotice" src/app/layout.tsx                                          → 0 hits
grep -n "toast" src/components/OfflineNotice.tsx                                    → 0 hits
grep -n "navigator.onLine" src/components/OfflineNotice.tsx                         → ≥ 1 hit
grep -n "You're offline\|will sync" src/content/shared.ts                           → 0 hits
grep -n '"You are offline"' src/content/shared.ts                                   → 1 hit
```
Commit: `fix(uiux-polish/task-9): offline notice naming what works offline and what needs a connection`

---

### Task F6 — Task 10 as specified (keep the toast-string move already committed)

**Do.** Steps 1–4 of Task 10 in `docs/handoffs/2026-09-09-uiux-polish-prompt.md`, verbatim: `BANNED_PUNCTUATION` fourth pass in `scripts/lint-copy.mjs`; `APP.interview.optionalSuffix` rendered when `step.required === false` (or a Discovered note if `required` does not reach the client); first-use definitions for POA / ASIN / ODR / AHR / LOA / Seller Central on `/decode`, `/dashboard`, `/case`, `/compose` in `src/content/app.ts` / `marketing.ts` only, with the page → term → key list in the evidence log; `src/content/README.md:12` corrected.

**Accept.** The original Task 10 Accept block, plus:
```
npm run lint:copy 2>&1 | tail -6                                                     → four "lint-copy:" pass lines before PASS
```
Commit: `fix(uiux-polish/task-10): exclamation-mark copy lint, optional step markers, Amazon terms defined on first use, content README corrected`

---

### Task F7 — Leftovers: format gate, timestamps with time of day, Terms §2 sentence

**Do.**
1. `npx prettier --write "src/app/(app)/billing/page.tsx"` then `npm run format:check` → exit 0. If `git status --short` shows no change afterwards, write "working-copy CRLF only; committed blob already LF" in the evidence log.
2. `DeviceManager.tsx` "First seen" / "Last seen" and `VaultView.tsx` record `createdAt` → `formatDateTime` from `src/lib/format.ts` (client components; hydration is not affected).
3. `legal/terms.md:14`: if banner box A is **unticked**, restore the first sentence to *"AppealDeck is **software** that decodes Amazon suspension/notice text and helps you draft a Plan of Action."* and keep everything else in §2 (the two approved paragraphs, the 9 Sep date). If ticked, leave it and record "box A ticked".

**Accept.**
```
npm run format:check 2>&1 | tail -3; echo exit=$?                                    → exit=0
grep -c "formatDateTime" src/components/DeviceManager.tsx src/components/VaultView.tsx → ≥ 1 each
grep -n "suspension/notice text and helps you draft" legal/terms.md                  → 1 hit (box A unticked) or 0 (ticked, recorded)
```
Commit: `fix(uiux-polish-fix/task-7): format gate green; device and vault timestamps keep the time of day; Terms §2 sentence per founder decision`

---

### Task F8 — Proof, docs, ticks (the original Task 11)

**Do.** Task 11 of `docs/handoffs/2026-09-09-uiux-polish-prompt.md`, verbatim, with these substitutions: evidence goes into `docs/handoffs/2026-09-09-uiux-polish-fix.md`; AA-30 is ticked with the Task F7 hash; the `CLAUDE.md` §4 bullet lists the fix-pass commits F0–F8 by hash from `git log`; screenshots also cover `/vault` with the idle-lock warning forced by `idleMs={20_000}` (temporary prop, reverted). Apply §0.B: every hash from `git log`, every gate by exit code, Playwright and Lighthouse run or "NOT RUN — reason".

**Accept.** Every Task F0–F7 Accept line has an evidence row with a real commit hash; §5 of the polish prompt green or explicitly NOT RUN; `npm run lint:copy` shows four passes; final chat message per §0.B rule 5.

Commit: `docs(uiux-polish-fix/task-8): evidence log complete, AA-30 ticked, screenshots listed, CLAUDE.md state`

---

## 4. SELF-CHECK BEFORE EACH COMMIT

The §4 block of `docs/handoffs/2026-09-09-uiux-polish-prompt.md`, plus: `git cat-file -t` on every hash you are about to write; the prescribed commit message copied verbatim; `git ls-files --eol <changed files>` shows `w/lf` (a `w/crlf` file means your editor wrote CRLF — fix before committing).

## 5. FINAL GATES

§5 of the polish prompt, unchanged (typecheck · lint 0 warnings · lint:copy PASS with **four** passes · format:check exit 0 · build ≥ 30 routes · vitest ≥ 309 · Playwright 0 failed · Lighthouse if runnable · the grep list · the §1.1 simplicity statement · the fresh-browser loss-warning + idle-lock check).

## 6. AFTER THE PASS (surface, do not perform)

Founder: signs off the Task F8 screenshots; decides whether to push `master`; decides whether Wave C-fix Tasks 8–10 or AA-31 (M-4) runs next; deploys the Vercel preview per `docs/DEPLOYMENT.md`.

## 7. FOUNDER-GATED

§7 of the polish prompt, unchanged. In addition: `legal/terms.md` changes in this pass are limited to Task F7 step 3.
