# AppealDeck — UI/UX polish pass (AM-19 now-list · AA-30) — coding-agent prompt

Written 9 Sep 2026 against commit `ed05259`. Source of the verdicts: `docs/handoffs/2026-09-08-meta-ai-uiux-register.md` (§5 "now" list, §6 draft AM-19). Plain-language explanation for the founder: `docs/handoffs/2026-09-09-meta-ai-uiux-plain-guide.md`.

## STATUS — RUNNABLE from Task 1. All four boxes ticked by the founder on 9 Sep 2026 (in chat with the reviewing AI); Task 0 paperwork committed the same day as `bfba421`

- [x] **AM-19 ratified** (9 Sep 2026, all ten rows, no strikes). Register §6 rows #23–#32 accepted as written. To reject a row, strike it here and delete the matching task below before the agent starts. (Row → task: 23→1 · 24→3 · 25→4a · 26→5 · 27→2 · 28→6 · 29→7 · 30→4b · 31, 32 → Appendix B, M-4, not this pass.)
- [x] **Disclaimer wording approved as written** (9 Sep 2026; the agent copies these strings verbatim into `src/content/*` and `legal/terms.md`):
  - Footer line: *"AppealDeck is an independent service and is not affiliated with, endorsed by, or sponsored by Amazon.com, Inc. or its affiliates. Amazon and Seller Central are trademarks of Amazon.com, Inc. or its affiliates."*
  - Terms section "Independence from Amazon": *"AppealDeck is an independent service operated by Jhangir Hussain, trading as Hawlton, in Pakistan. It is not affiliated with, endorsed by, or sponsored by Amazon.com, Inc. or its affiliates. Amazon, Seller Central and related names are trademarks of Amazon.com, Inc. or its affiliates, used here only to describe the notices this software reads and the appeals it helps you draft."* / *"We never log in to Seller Central, never submit anything to Amazon for you, and have no access to your Amazon account."*
  - FAQ: **Q** *"Is AppealDeck part of Amazon?"* **A** *"No. AppealDeck is an independent service run by Jhangir Hussain, trading as Hawlton, in Pakistan. It is not affiliated with, endorsed by, or sponsored by Amazon. We use the Amazon name only to describe the notices our software reads and the appeals it drafts. We never log in to Seller Central and never submit anything to Amazon for you."*
- [x] **Vault idle auto-lock confirmed as security hygiene** (9 Sep 2026), exempt from the AM-17 feature freeze. Task 4b stays.
- [x] **Copy items ride AA-29** (9 Sep 2026): "(optional)" step markers and Amazon terms defined on first use per page — Task 10 steps 2–3 stay.

Ratified by Jhangir Hussain on 9 Sep 2026 — all four boxes, no strikes, wording approved as written. Task 0 (planning-layer paperwork) was performed by the reviewing AI the same day and committed as `bfba421`; the coding agent starts at Task 1.

---

## 0. OPERATING PROTOCOL (read first, follow for every task)

1. **Read `CLAUDE.md` §1–§3 first.** D1–D10 and FORBIDDEN SOURCES are absolute.
2. **One task = one commit**, in the order given. Message format: `fix(uiux-polish/task-N): <subject>`; docs tasks `docs(uiux-polish/task-N): …`. Sub-commits `task-Na`, `task-Nb` allowed for Tasks 2, 3, 4, 6. Never mix two tasks in one commit.
3. **Gate block after every task** (§4). A task is not done while any gate is red. A gate that was red before you started and that your task does not cover: say so in the evidence log, do not fix silently.
4. **Evidence, not adjectives.** For every Accept line paste the exact command and the one output line that proves it into `docs/handoffs/2026-09-09-uiux-polish.md` §"Evidence log" (columns: task · claim · command · output line · commit). Create that file in Task 0 with the sections `## Resume pointer`, `## Evidence log`, `## Discovered during this pass`, `## Deviations from the prompt`.
5. **Never claim a test passed that you did not run in this session.** If Playwright or Lighthouse cannot run, write "NOT RUN — reason". Do not tick the gate.
6. **Append, never overwrite,** `docs/DECISIONS.md`, `AGENTS.md`, `CLAUDE.md` §4, any handoff. If you are rewriting a file with history, stop.
7. **No secrets.** Before every commit: `git diff --cached | grep -inE "password|passphrase|secret|token|license_key|Dev-"` must show identifiers only.
8. **Presentation, copy, attributes, state feedback only.** No new API routes, no `/chat`, no SP-API, no engine decision changes. **The single permitted core addition** is Task 6's `Vault.findByPlaintext()` + `VaultListItem.plaintextHash` (exposes data the vault already stores; changes no decision). Nothing else under `src/core/` changes.
9. **D6 is the aesthetic.** No "guarantee", no percentages/hours/countdowns, no invented Amazon rules, no social proof, no reassurance copy, no exclamation marks. Every new user-facing string goes into `src/content/*.ts` (AA-29 rule; see `src/content/README.md`), then `npm run lint:copy` must PASS.
10. **Extract, don't duplicate.** If you write the same helper twice, it belongs in `src/lib/`.
11. **Discovered defects outside the current task** go to the evidence file §"Discovered" with `file:line`; do not fix inline.
12. **Stop and report** if a task needs founder text not in this prompt, reopens D1–D10 / AM-16–18, or the code contradicts a fact in §1 in a way that changes the fix.
13. **Cross-platform.** Founder is on Windows. Node scripts only in `package.json`/CI; no `rg`, no bash-only syntax in scripts. In a PowerShell session use `Select-Object -Last N` instead of `tail`, `Select-String` or the `grep` tool instead of shell `grep`, and **never** write files through the shell (heredocs/`echo >`/`Out-File` have re-encoded files to UTF-16 in this repo) — use your file-editing tool.
14. **FORBIDDEN SOURCES** (CLAUDE.md §3): never read or adapt them. `grep -rli superpower src e2e scripts` must stay empty.

### 0.A CONTEXT BUDGET & CONTINUITY (mandatory)

- **Compact at 50 %** of your window. Finish the sub-step, update the Resume pointer, then compact.
- **Read this prompt in pieces:** §0, §0.A, §1, §2 and Appendix A once; then only the task you are on. After a compaction: §0.A, the Resume pointer, the current task.
- **Grep before read; read in ranges** (±25 lines). Never print a file over ~150 lines. Sizes: `InterviewFlow.tsx` ~900, `VaultView.tsx` ~590, `DashboardClient.tsx` ~480, `ComposeView.tsx` ~320, `VaultGate.tsx` 267, `FileDropZone.tsx` 78, `DeadlineChip.tsx` ~160, `vault.ts` ~370, `lint-copy.mjs` ~170, `02-BUILD-PLAN-AMENDMENTS.md` ~300 (edit only the AM-19 insertion point and the DoD line, by grep + range), `06-PREMIUM-UI-UX-SPEC.md` ~230 (edit only §14, lines 192–217).
- **Tail every command:** `npm test 2>&1 | tail -8`, `npm run build 2>&1 | tail -20`, `npx tsc --noEmit 2>&1 | head -30`.
- **One file edit per step**, then `npm run typecheck 2>&1 | tail -5`.
- **Terse chat:** ≤ 3 lines between tool calls. Facts go in the evidence log, not the chat.

**Resume pointer** (top of `docs/handoffs/2026-09-09-uiux-polish.md`, updated after every sub-step, before every compaction and commit):
```
- Task: <N> · Sub-step: <letter> · Status: in-progress | blocked | done
- Last green gate: <command> at <commit or "uncommitted">
- Files open for this sub-step: <paths>
- Next command: <exact next thing to run or edit>
- Context usage at last update: <approx %>
```

---

## 1. CONTEXT — verified state at `ed05259` (9 Sep 2026)

Wave C-fix Tasks 0–7 are committed (`79f2e23` Task 7, `ed05259` a11y contrast fix). Gates at last record: vitest 281/281 (Task 6; re-count before Task 1), build 25 static pages + middleware, lint 0 warnings, lint:copy PASS. Facts this prompt relies on, each re-grepped today:

- **No independence/trademark statement anywhere.** `grep -rni affiliat src legal` → only `legal/terms.md:24` (an unrelated "affiliate relationship" clause). Footer is `src/components/SiteFooter.tsx` (two rows: `SHARED.footer.tagline` + nav; `SHARED.footer.neverSubmits`), strings in `src/content/shared.ts`. Terms render from `src/content/legal.ts` `LEGAL.terms.sections` (ids `basis, licence, restriction, termination, governing`, lines 72–117); `legal/terms.md` is the founder's markdown draft (§2 "What AppealDeck is — and is not", line 11–12). FAQ items are `{ q, a }` in `src/content/marketing.ts` `FAQ.items` (line 125+). Footer is mounted on `/`, `/pricing`, `/faq` and `LegalPage.tsx` only (not in `AppShell`).
- **Interview autosave is silent.** `src/components/InterviewFlow.tsx` saves after each step at 249 and 296, both inside `catch { /* non-fatal */ }`. Only Save & exit (353–362) reports success/failure via toast. Existing strings: `APP.interview.saving`, `saveAndExitToast` (`src/content/app.ts` 283–334). `VaultGate` is used at 393 with `onUnlocked`.
- **Passphrase creation never states unrecoverability.** `src/components/VaultGate.tsx` `VaultInitForm` (104–180) has hardcoded strings: "Set a vault passphrase" (132), the PBKDF2 paragraph (133–135), labels (139, 156), "Create vault"/"Creating…" (175), toast "Vault created" (118–120). Passphrase input has `autoComplete="new-password"` (143) but no `autoCapitalize`/`autoCorrect`/`spellCheck`. `VaultUnlockForm` starts at 188. Phase kinds: `loading | needs_init | locked | unlocked` (18). Props: `vault, children, onUnlocked?` (24–30). No idle timer anywhere (`grep -rni "idle\|autolock\|inactiv" src/components src/lib/vault` → only unrelated `"idle"` state names in `AuthCard.tsx`/`FieldSuggester.tsx`). `Vault.lock()` exists and is synchronous (`VaultView.tsx:121` calls it).
- **Compose clipboard drops headings.** `src/components/ComposeView.tsx:193–194` `mergedSections = draft.sections.map(...)`, `fullDraftText = mergedSections.join("\n\n")` (bodies only); `CopyButton` at 223; `BeforeYouSubmitChecklist` receives `draftText={fullDraftText}` (229). Error Alert (168–186) offers a `Link` to `/case` or `/billing`, no retry; `phase` is set by a load function you will find by grepping `setPhase({ kind: "error"`. `renderPoaText` in `src/core/composer.ts:226–235` emits `## ${heading}` for the API `rendered` field — **leave it**; the UI does not use it (confirm and record).
- **Dates are formatted six ways.** `DeadlineChip.tsx:9–17` hard-codes `en-US` and joins with `" | "` (line ~80); `src/app/(app)/billing/page.tsx:14`, `DashboardClient.tsx:75`, `DeviceManager.tsx:38`, `VaultView.tsx:431` use `Intl.DateTimeFormat(undefined, …)` ad hoc; `VerifiedStamp.tsx:15` uses `toLocaleDateString("en-US", …)`. Spec 06 §10.3 rule: *"14 Sep · in 10 days"*. `grep -rn timeZoneName src` → 0.
- **File input has no hygiene.** `src/components/FileDropZone.tsx` (78 lines): single `onFile(file)`, `<input type="file" hidden>` with no `accept`, `multiple` or `capture`; 10 MB cap; strings `APP.interview.fileUpload.*`. Three add paths call `vault.add(input)`: `InterviewFlow.tsx:701–716` (toast `"${file.name}" saved to vault`), `VaultView.tsx` `onAddFile` (toasts at 137/142, drop zone at 369), `EvidenceSlotPanel.tsx:68` (lists via `vault.list()` at 33).
- **Duplicate detection is nearly free.** `src/core/vault/vault.ts` stores `plaintextHash: \`${PLAINTEXT_HASH_VERSION}.${hash}\`` (line 204; constant `= 1` at 22; hash via `sha256Base64(this.provider, data)` at ~190 after the string→bytes conversion in `add()`). `VaultListItem` (30–42) does **not** expose it; `list()` (232–243) maps via `toListItem`. Tests: `src/core/vault/vault.test.ts`.
- **No print stylesheet.** `grep -rn "@media print" src` → 0. `src/app/globals.css` has `@media (prefers-reduced-motion: reduce)` at 198 and `.prose` styles after it.
- **Attributes absent.** `grep -rni "spellCheck\|inputMode\|autoCapitalize\|interactiveWidget\|navigator.onLine" src` → 0. Textareas: `PoaSection.tsx:80` (draft edit), `InterviewFlow.tsx:671` (short_text answer), `InterviewFlow.tsx:845` (decline reason), `DecodeClient.tsx:141` (pasted notice), `DashboardClient.tsx:410` (pasted Amazon reply). Email inputs: `login/page.tsx:155`, `signup/page.tsx:149`, `forgot-password/page.tsx:78`. Viewport export: `src/app/layout.tsx:40–45` (themeColor only). Interview fixed action bar: `InterviewFlow.tsx:565`. `Button` sizes: default `h-10`, `lg` `h-11`.
- **Interview steps carry `required?: boolean`** (`src/core/interviewEngine.ts:32`); the UI never renders an optional marker.
- **`scripts/lint-copy.mjs`** has `BANNED_PATTERNS` (26–40), `SOFT_PATTERNS`, `BANNED_NUMBERS` (47), colour gate; no punctuation rule. `src/content/**` has 0 exclamation marks today.
- **Docs drift:** `src/content/README.md` lists `errors.ts — loading text (exists)`; `src/content/` has no `errors.ts`.
- **Planning insertion points:** spec 06 §14 table ends at row 22 (line 217); `02-BUILD-PLAN-AMENDMENTS.md` AM-18 block (line 258) is the last amendment before `## 4. Facts in v1.0 that are RETIRED`; DoD line reads "All 29 action items AA-01…AA-29". `docs/DECISIONS.md` entries use `## YYYY-MM-DD — title` + `Decision / Alternatives / Rationale / Files affected / Decider`.

## 2. SETTLED DECISIONS (do not reopen)

D1–D10 (CLAUDE.md §2). AM-16 (evidence-first; readiness is never a prediction), AM-17 (case OS; no chat route; feature freeze until first paid Passes + opt-in outcomes), AM-18 (presentation waves; spec 06 §1.1 simplicity budget — one primary action per screen, ≤ 3 cards above the fold; §6 state quartet — one toast max, blocking errors are inline Alerts with retry; §10 content system — all strings in `src/content/`, banned-pattern lint; §14 verdicts 1–22). Register §4 "already decided" families are not re-argued. Sticky disclaimer bar, countdowns, approval scores, template tabs, `@evidence` pills, toast-per-save are **rejected** — do not build them "while you are in there".

---

## 3. TASKS — in this order, one commit each

### Task 0 — Record the ratification — ✅ DONE 9 Sep 2026 by the reviewing AI, committed `bfba421`

**Status.** Steps 1–5 below were performed on 9 Sep 2026 right after the founder ticked the banner. Baselines recorded in the evidence log: vitest 287/287 (29 files); build 30 app routes, 10 static prerendered, middleware 27.1 kB. Committed as `bfba421` on 9 Sep 2026 with the Accept block verified in the evidence log. Start at Task 1.

**Do.**
1. Create `docs/handoffs/2026-09-09-uiux-polish.md` with the four sections named in §0.4 and a filled Resume pointer. Run `npm test 2>&1 | tail -8` and `npm run build 2>&1 | tail -20` and record the **baseline** counts (tests, pages) in the evidence log.
2. Append to `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md`, directly after the AM-18 block and before `## 4. Facts in v1.0 that are RETIRED`:

```markdown
### AM-19 — UI/UX polish from the 5 Sep Meta AI brainstorm: table-stakes hygiene now, deterministic critic rules with M-4 (ratified <DD> Sep 2026)

**Provenance:** founder ↔ Meta AI transcript, 5 Sep 2026 (~295 raw suggestions), de-duplicated to 189 rows and grep-verified against `src/` in `docs/handoffs/2026-09-08-meta-ai-uiux-register.md`; plain-language digest `docs/handoffs/2026-09-09-meta-ai-uiux-plain-guide.md`. Verdicts recorded in spec 06 §14 rows #23–#32. 56 rows are AVOID with the rule each breaks (D6, D7, D9, §1.1, AM-16/17); GOOD/NICE rows tagged post-freeze are a recorded backlog, not a commitment.

**Scope guard:** presentation, copy, input attributes, state feedback and security hygiene only. One core addition: `Vault.findByPlaintext()` + `VaultListItem.plaintextHash`, exposing a hash the vault already stores — no decision logic changes. Rows #31–#32 touch the critic/evidence core and ride M-4 (AA-31), not the polish pass.

**What changes:** non-affiliation/trademark disclaimer (footer, Terms, FAQ); interview autosave status + surfaced vault-write failure + unsaved-answer guard; passphrase-unrecoverability disclosure; plain-heading clipboard text + "as pasted" preview + compose retry; one shared date/time formatter (absolute + relative + tz); file-input hygiene (`accept`, `multiple`, mobile capture, hash duplicate check, sized confirmation); print stylesheet; `spellCheck`/`inputMode`/`autoCapitalize`; viewport `interactiveWidget`; offline notice; vault idle auto-lock (15 min, 1 min warning); `!` copy lint, "(optional)" markers, Amazon terms defined on first use.

- [ ] **AA-30** UI/UX polish pass per `docs/handoffs/2026-09-09-uiux-polish-prompt.md` Tasks 1–11, evidence in `docs/handoffs/2026-09-09-uiux-polish.md`. — **Owner:** AI assistant (build), Founder (disclaimer wording, ratification) · **Cost:** $0 · **Deadline:** before first deploy · **Blocks:** M-W gate (rides the AM-18 gate).
- [ ] **AA-31** Deterministic critic rules (future tense in corrective actions, blame-shifting words, vague-time phrases, jargon swaps; warnings, never hard blocks); invoice issue-date capture + verified 365-day freshness flag; ASIN + case-ID extraction from the notice; seller override of the decoded type; root-cause category step; dated corrective-action rows; attachment references by filename in POA text; neutral character counter; ID paste normaliser. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** with M-4 · **Blocks:** M-4 gate.
```

   Then change the DoD line "All 29 action items AA-01…AA-29" → "All 31 action items AA-01…AA-31" and append "— 9 Sep 2026: AM-19 ratified; AA-30 OPEN (this pass), AA-31 rides M-4."
3. Append rows #23–#32 to spec 06 §14 (after line 217), copying the register §6 table rows verbatim with the verdict column as **Adopt** (now) for 23–30 and **Adopt** (M-4) for 31–32. Update the §14 heading to "…22 suggestions + AM-19 rows 23–32".
4. Append to `docs/DECISIONS.md`:

```markdown
## 2026-09-<DD> — AM-19 ratified: Meta AI UI/UX brainstorm → 13-item polish pass now, critic rules with M-4

- Decision: Adopt register rows #23–#32 (8 Sep register §6). Ship the ten presentation/hygiene items before first deploy (AA-30); defer the two core-touching rows to M-4 (AA-31). Everything else in the 189-row register stays a recorded backlog (GOOD/NICE, post-freeze) or AVOID.
- Alternatives: (1) Implement Meta AI's full list — rejected: 56 rows break D6/D7/D9/§1.1 (approval scores, countdowns, social proof, chat bubble, template tabs, Seller Central access). (2) Do nothing until after first sales — rejected: three rows are trust/data-integrity gaps (no independence statement; silent autosave failure; unrecoverable passphrase never disclosed). (3) A sticky disclaimer bar — rejected: §1.1; the footer line + Terms + FAQ carry the same fact.
- Rationale: one working day of copy, attributes and state feedback that closes real gaps without adding a nav item, a card above the fold or a second primary action; the freeze stands.
- Files affected: `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` (AM-19, AA-30/31, DoD), `06-PREMIUM-UI-UX-SPEC.md` §14 #23–#32, `docs/handoffs/2026-09-09-uiux-polish-prompt.md`, `docs/handoffs/2026-09-09-uiux-polish.md`, `CLAUDE.md` §4.
- Decider: Founder (ratification, <DD> Sep 2026); AI assistant (register, guide, prompt).
```
5. `CLAUDE.md` §4: one new bullet "**AM-19 ratified <DD> Sep 2026** — polish pass (AA-30) started; prompt `docs/handoffs/2026-09-09-uiux-polish-prompt.md`." Remove "review draft AM-19 … supply the disclaimer wording (A1)" from the BLOCKERS line.

**Accept.**
```
grep -n "AM-19" Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md      → ≥ 1 hit before "## 4. Facts"
grep -c "^| 2[3-9] \|^| 3[0-2] " Planning/03-PHASE-2-BUILD/06-PREMIUM-UI-UX-SPEC.md → 10
grep -n "AM-19 ratified" docs/DECISIONS.md                                   → 1 hit
test -f docs/handoffs/2026-09-09-uiux-polish.md                              → exists, Resume pointer filled, baseline row present
```
Commit: `docs(uiux-polish/task-0): ratify AM-19 (AA-30/AA-31), spec 06 §14 rows 23–32, decisions ledger, evidence log opened`

---

### Task 1 — Independence + trademark disclaimer (register A1)

**Why.** No statement of independence from Amazon exists in `src/` or `legal/` (§1). Nominative use of "Amazon" without it is a confusion exposure and a trust gap for sellers burned by fake "Amazon partners".

**Do.**
1. `src/content/shared.ts`: add `SHARED.footer.independence` = the approved footer line (banner box 2, verbatim).
2. `src/components/SiteFooter.tsx`: render it as a second `<p>` in the bottom row, after `neverSubmits`, same `text-xs text-muted-foreground`. No new row, no border, no icon.
3. `src/content/legal.ts`: insert a section `{ id: "independence", title: "Independence from Amazon", body: [<two approved paragraphs>] }` into `LEGAL.terms.sections` **after** `basis` and before `licence`. The TOC in `LegalPage.tsx` is generated from sections; verify it picks the new id up.
4. `legal/terms.md`: append the same two paragraphs to §2 ("What AppealDeck is — and is not"), no renumbering. Bump "Last updated" to today, keep "(draft)".
5. `src/content/marketing.ts` `FAQ.items`: add the approved Q/A as the **first** item (it is the first thing a suspicious seller checks).
6. `e2e/marketing.spec.ts`: add `test("footer states independence from Amazon")` → `/` has visible text `/not affiliated with/i`; `/terms` has `getByRole("heading", { name: /independence from amazon/i })` visible; `/faq` has visible text `/part of amazon/i`.

**Accept.**
```
grep -rni "not affiliated with" src/content src/components legal            → shared.ts, legal.ts, marketing.ts, terms.md (≥ 4 files)
grep -n "independence" src/content/legal.ts src/components/SiteFooter.tsx    → ≥ 2 hits
npm run lint:copy 2>&1 | tail -2                                             → PASS
npx playwright test e2e/marketing.spec.ts --reporter=dot 2>&1 | tail -5     → 0 failed (or "NOT RUN — reason")
```
Commit: `fix(uiux-polish/task-1): independence and trademark disclaimer in footer, Terms, FAQ and legal draft`

---

### Task 2 — One shared date/time formatter (register L4/R3/F3)

**Why.** Six ad-hoc formatters; `DeadlineChip` hard-codes `en-US` and `" | "`; no time-zone label anywhere; spec §10.3 requires "14 Sep · in 10 days".

**Do.**
1. Create `src/lib/format.ts` (pure, no React):
   - `formatDate(d: Date | string | null): string` → `"14 Sep 2026"` using a fixed English month table (deterministic on server and client; no `Intl` month names, which vary "Sep/Sept" by ICU). Null → `""` (callers keep their own "Date not stated" copy).
   - `formatTime(d, { tz = true })` → `"14:02 PKT"` via `Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", hour12: false, timeZoneName: tz ? "short" : undefined })` — **client-side only** (time zone depends on the device).
   - `formatDateTime(d)` → `"14 Sep 2026, 14:02 PKT"`.
   - `formatRelativeDays(target, now)` → move the exact logic of `DeadlineChip.formatRelative` (in N days / tomorrow / today / yesterday / N days ago) so behaviour does not change.
   - `formatDateWithRelative(target, now)` → `"14 Sep 2026 · in 10 days"` (middle dot, spaces).
   - `formatBytes(n)` → `"2.3 MB"` / `"840 KB"`; extract from wherever `VaultView.tsx` formats `sizeBytes` today (grep `sizeBytes`), replace that call.
2. Replace the six sites from §1 with the helpers. `DeadlineChip`: separator `" | "` → `" · "`; remove the module-level `en-US` formatter. Where a component is **server-rendered** with a timestamp, keep it date-only (no time, no tz) to avoid hydration mismatches; do not add `suppressHydrationWarning`.
3. Unit tests `src/lib/__tests__/format.test.ts`: fixed dates for `formatDate`, all five `formatRelativeDays` branches, `formatDateWithRelative`, `formatBytes` at 0 / 1 023 B / 2.3 MB.

**Accept.**
```
grep -rn "Intl.DateTimeFormat\|toLocaleDateString" src --include=*.tsx | grep -v __tests__  → 0 hits (Intl lives only in src/lib/format.ts)
grep -n '" | "' src/components/DeadlineChip.tsx                              → 0 hits
grep -c "it(" src/lib/__tests__/format.test.ts                               → ≥ 8
npm test 2>&1 | tail -6                                                      → count ≥ baseline + 8
```
Commit: `fix(uiux-polish/task-2): shared date/time/bytes formatter; six ad-hoc sites replaced; DeadlineChip on the spec format`

---

### Task 3 — Interview autosave status + surfaced failure + unsaved guard (register G2, G6)

**Why.** Saves at `InterviewFlow.tsx:249` and `:296` swallow errors; the seller has no signal that the case is (or is not) in the vault.

**Do.**
1. `src/content/app.ts` `APP.interview.saveStatus`: `saved: "Saved to vault · {time}"`, `failedTitle: "Your last answer was not saved to the vault"`, `failedDesc: "Your answer is still on screen. Retry the save, or continue and use Save & exit later."`, `retry: "Retry save"`.
2. `InterviewFlow.tsx`: add `saveState: { kind: "idle" } | { kind: "saved"; at: Date } | { kind: "failed"; message: string }`. One `persistCaseFile(caseFile)` helper wraps both `saveCaseFile` calls (249, 296): on success set `saved`; on failure set `failed` (never rethrow; never block the interview). Remove both `catch {}` blocks in favour of the helper.
3. Render below the step card, above the fixed bar: when `saved`, a single quiet line `text-xs text-muted-foreground` with `formatTime` from Task 2 (`aria-live="polite"` is already present on one region — reuse it; do **not** add a second live region). When `failed`, an inline `Alert variant="destructive"` with the title, description and a `Retry save` button that calls the helper again. No toast.
4. `beforeunload` guard: while `answerValue.trim() !== ""` or `choiceId` is set and the step has not been submitted, register a `beforeunload` handler (`e.preventDefault(); e.returnValue = ""`); remove it on submit/unmount. Browser text, no string needed.
5. Save & exit (353–362) keeps its toast (it is a user action).

**Accept.**
```
grep -n "// non-fatal\|// vault save failed" src/components/InterviewFlow.tsx  → 0 hits
grep -n "saveStatus" src/components/InterviewFlow.tsx src/content/app.ts        → ≥ 4 hits
grep -c "aria-live" src/components/InterviewFlow.tsx                            → unchanged from before the task (record both numbers)
grep -n "beforeunload" src/components/InterviewFlow.tsx                         → ≥ 2 hits (add + remove)
```
Commit: `fix(uiux-polish/task-3): interview shows saved-to-vault time, surfaces vault-write failure with retry, guards unsaved answers on tab close`

---

### Task 4 — VaultGate: passphrase-loss disclosure (4a) and idle auto-lock (4b)

**Why.** 4a: the create form explains the crypto but never the consequence (register G3). 4b: invoices and IDs stay decrypted in memory indefinitely on shared devices (register N2).

**Do — 4a.**
1. Move every hardcoded string in `VaultGate.tsx` (`VaultInitForm` 118–175, `VaultUnlockForm` 188+) into `APP.vault.create.*` / `APP.vault.unlock.*` (reuse `APP.interview.unlockPrompt` if it already covers the unlock copy — check first, do not duplicate).
2. Add `APP.vault.create.lossWarning`: *"If you forget this passphrase, nobody can recover your case data, including us. Cloud sync stores only encrypted copies. Write the passphrase down and keep it somewhere safe."* Render it as an `Alert variant="warning"` between the explanatory paragraph and the first input, so it is read before typing.
3. On both passphrase inputs (create, confirm, unlock): `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}` (keep `autoComplete`).

**Do — 4b.**
1. `VaultGateProps`: add `onLocked?: () => void`, `idleMs = 15 * 60_000`, `warnMs = 60_000`.
2. While `phase.kind === "unlocked"`: listen on `window` for `pointerdown`, `keydown`, `touchstart`, `scroll` (passive) and `visibilitychange` (reset on visible); each resets a single timer. At `idleMs - warnMs` set `warning = true`; at `idleMs` call `vault.lock()`, `setPhase({ kind: "locked" })`, `onLocked?.()`, and `toast.info(APP.vault.idleLock.locked, { description: APP.vault.idleLock.lockedDesc })`. Clear everything on unmount and on lock.
3. Warning UI: inline `Alert variant="warning"` above `children` with `APP.vault.idleLock.warningTitle` *"Vault locks in 1 minute"*, `warningDesc` *"No activity for 14 minutes. Any key press or tap keeps it unlocked."* and a button `stay` *"Stay unlocked"* (resets the timer). No countdown digits.
4. Wire `onLocked` in the three consumers that hold an unlocked flag: `InterviewFlow.tsx:393` (`setVaultUnlocked(false)`), `DashboardClient.tsx:276`, `VaultView.tsx:235`. `ComposeView.tsx:268` uses the render-prop form and needs nothing.
5. Test: if `@testing-library/react` is in `package.json`, add `src/components/__tests__/VaultGate.idle.test.tsx` with fake timers and `idleMs: 2000, warnMs: 1000` asserting warning → lock → `onLocked` called. If it is not installed, do **not** add the dependency; write "idle lock: manual check — <what you did>" in the evidence log.

**Accept.**
```
grep -n '"Set a vault passphrase"\|"Create vault"\|"Vault created"' src/components/VaultGate.tsx → 0 hits (strings now in content)
grep -n "lossWarning" src/components/VaultGate.tsx src/content/app.ts        → ≥ 2 hits
grep -n "autoCapitalize" src/components/VaultGate.tsx                        → ≥ 3 hits
grep -n "idleMs\|onLocked" src/components/VaultGate.tsx                      → ≥ 4 hits
grep -rn "onLocked" src/components/InterviewFlow.tsx src/components/DashboardClient.tsx src/components/VaultView.tsx → 3 hits
```
Commits: `fix(uiux-polish/task-4a): passphrase-loss disclosure before creation; VaultGate strings to content; passphrase input attributes` · `fix(uiux-polish/task-4b): vault idle auto-lock after 15 min with 1 min warning; onLocked wired`

---

### Task 5 — Compose: clipboard with plain headings, "as pasted" preview, retry (register C17, C18, G10)

**Why.** Copy all loses the three headings; the seller pastes an unstructured block into a plain textarea. The error Alert offers no retry.

**Do.**
1. Create `src/lib/poaClipboard.ts`: `buildClipboardText(sections: { heading: string; body: string }[], edits: Record<number, string>): string` → for each section `heading + "\n" + (edits[i] ?? body)`, sections joined by `"\n\n"`, trimmed. Plain text only: no `#`, `*`, `_` or bullets. Test `src/lib/__tests__/poaClipboard.test.ts` (headings present, blank line between sections, no markdown characters, edits win over bodies).
2. `ComposeView.tsx:193–194`: `fullDraftText = buildClipboardText(draft.sections, editedSections)`. `BeforeYouSubmitChecklist` and `CopyButton` keep receiving `fullDraftText` (now with headings — check the checklist does not count headings as "template phrases"; if `checkNovelty` or a length rule reacts, record it in Discovered and pass bodies-only text to the checklist instead).
3. Preview: a `Collapsible`/`Accordion` (existing primitive — check `src/components/ui/`) below the Copy row, trigger `APP.compose.asPasted.toggle` *"Show as it will paste"*, content a `<pre className="whitespace-pre-wrap font-mono text-sm">` of `fullDraftText`. Collapsed by default. No second copy button.
4. Error Alert (168–186): keep the link; add a `Retry` `Button variant="outline" size="sm"` that re-runs the load function (grep `setPhase({ kind: "error"` to find it) — label `SHARED.retryButton` (exists). Device-cap errors keep link only (retry cannot fix them).
5. Confirm `renderPoaText` is unused by the UI (`grep -rn "rendered" src/components src/app --include=*.tsx`); record the result in Discovered. Do not change it.

**Accept.**
```
grep -n "buildClipboardText" src/components/ComposeView.tsx src/lib/poaClipboard.ts → ≥ 2 hits
grep -n 'join("\\n\\n")' src/components/ComposeView.tsx                      → 0 hits
grep -n "asPasted" src/components/ComposeView.tsx src/content/app.ts        → ≥ 2 hits
grep -n "retryButton" src/components/ComposeView.tsx                         → ≥ 1 hit
npm test 2>&1 | tail -6                                                      → count ≥ previous + 4
```
Commit: `fix(uiux-polish/task-5): clipboard text carries plain section headings; as-pasted preview; retry in compose error`

---

### Task 6 — File input hygiene + duplicate detection + sized confirmation (register E3, E4, E6, E10)

**Why.** The picker accepts anything, one file at a time, no camera path, no duplicate check although every record already carries a SHA-256 of its plaintext.

**Do.**
1. **Core (the one permitted addition).** `src/core/vault/vault.ts`: add `plaintextHash: string` to `VaultListItem` and `toListItem`; add `async findByPlaintext(data: Uint8Array | string): Promise<VaultListItem | null>` that reuses the exact string→bytes conversion and `sha256Base64` used by `add()`, builds `\`${PLAINTEXT_HASH_VERSION}.${hash}\`` and returns the first matching record (or null). Tests in `vault.test.ts`: same bytes twice → returns the first record's id; different bytes → null; string input matches the same bytes.
2. `FileDropZone.tsx`: props `accept?: string` (default `"application/pdf,image/*,.heic,.heif"`), `multiple?: boolean` (default `true`), `onFile` unchanged (called once per accepted file, sequentially). Reject a file whose `type`/extension is outside `accept` with `toast.error(APP.interview.fileUpload.wrongType, { description: wrongTypeDesc })` *"That file type is not accepted"* / *"Use a PDF or an image (JPG, PNG, HEIC)."*. Add a second hidden input `accept="image/*" capture="environment"` and a `Take a photo` outline button shown only on coarse pointers (`[@media(pointer:coarse)]:inline-flex hidden` or an equivalent existing utility — check `tailwind.config.ts` before inventing a variant).
3. Duplicate check in the three add paths (`InterviewFlow.tsx:701–716`, `VaultView.tsx` `onAddFile`, `EvidenceSlotPanel.tsx:68`): before `vault.add`, `const dup = await vault.findByPlaintext(buf)`; if `dup`, `toast.info(APP.interview.fileUpload.duplicate, { description: duplicateDesc.replace("{name}", file.name).replace("{existing}", dup.name) })` *"Already in your vault"* / *"\"{name}\" matches \"{existing}\" byte for byte. Nothing was added."* and return. Extract the three near-identical add blocks into one helper `src/lib/vault/addFileToVault.ts` (rule §0.10) that returns `{ status: "added" | "duplicate"; record }`.
4. Confirmation copy: `APP.interview.fileUpload.added` *"\"{name}\" added"*, `addedDesc` *"{size} · {slot} · encrypted on this device"* with `formatBytes` (Task 2) and the evidence-kind label already used by `EvidenceSlotPanel` (fallback: "Vault" when no slot). Replace the three ad-hoc success toasts.

**Accept.**
```
grep -n "findByPlaintext" src/core/vault/vault.ts src/lib/vault/addFileToVault.ts → ≥ 2 hits
grep -n "plaintextHash" src/core/vault/vault.ts                              → ≥ 3 hits (type, toListItem, add)
grep -n 'accept=\|capture=' src/components/FileDropZone.tsx                 → ≥ 2 hits
grep -rn "vault.add(" src/components                                         → 0 hits (all through the helper)
grep -c "it(" src/core/vault/vault.test.ts                                   → ≥ previous + 3
```
Commit: `fix(uiux-polish/task-6): file picker accept/multiple/camera; hash duplicate check via Vault.findByPlaintext; one add helper with sized confirmation`

---

### Task 7 — Print stylesheet (register R5)

**Why.** No `@media print`; Ctrl+P on `/compose` prints buttons, nav and scrolling textareas.

**Do.**
1. `src/app/globals.css`, after the reduced-motion block: `@media print { header, footer, nav, button, [data-no-print] { display: none !important; } body { background: #fff; color: #000; } textarea { display: none; } .print-only { display: block !important; } }`. (The colour gate covers `src/components/` only; CSS literals are fine.)
2. `ComposeView.tsx`: after the section cards, `<div className="print-only hidden whitespace-pre-wrap font-serif text-sm">{fullDraftText}</div>` plus a one-line print header with the case kind and `formatDate(new Date())`. Mark the sticky interview bar (`InterviewFlow.tsx:565`), `AppHeader`, and the sonner `Toaster` with `data-no-print`.
3. Case page (`src/app/(app)/case/page.tsx` → its client view): same `data-no-print` on controls so the case summary prints clean. No new content.

**Accept.**
```
grep -n "@media print" src/app/globals.css                                   → 1 hit
grep -rn "data-no-print" src/components src/app --include=*.tsx              → ≥ 3 hits
grep -n "print-only" src/components/ComposeView.tsx                          → ≥ 1 hit
```
Commit: `fix(uiux-polish/task-7): print stylesheet; compose prints the plain POA text without chrome`

---

### Task 8 — Input attributes, viewport, tap target (register C24, H1, M3, K3)

**Do.**
1. `spellCheck` on seller-authored textareas: `PoaSection.tsx:80`, `InterviewFlow.tsx:671`, `InterviewFlow.tsx:845`. `spellCheck={false}` on pasted-Amazon-text textareas: `DecodeClient.tsx:141`, `DashboardClient.tsx:410`.
2. Email inputs (`login/page.tsx:155`, `signup/page.tsx:149`, `forgot-password/page.tsx:78`): `autoCapitalize="none"`, `autoCorrect="off"`, `spellCheck={false}`, `inputMode="email"`. Interview `number` input (grep `case "number"` / `numberPlaceholder` in `InterviewFlow.tsx`): `inputMode="numeric"`.
3. `src/app/layout.tsx:40–45` viewport export: add `interactiveWidget: "resizes-content"` (Next 14.2 `Viewport` type supports it; if `typecheck` disagrees, record the exact error and stop this step — do not cast).
4. Interview fixed bar (`InterviewFlow.tsx:565`): primary action `size="lg"` (44 px). Do not create a new button size.

**Accept.**
```
grep -rn "spellCheck" src --include=*.tsx | grep -v VaultGate                → 5 hits
grep -rn 'inputMode="email"' "src/app/(app)"                                 → 3 hits
grep -rn 'inputMode="numeric"' src/components/InterviewFlow.tsx              → 1 hit
grep -n "interactiveWidget" src/app/layout.tsx                               → 1 hit
```
Commit: `fix(uiux-polish/task-8): spell-check on seller text, phone keyboards on email/passphrase/number fields, viewport interactiveWidget, lg primary in the step bar`

---

### Task 9 — Offline notice (register G9)

**Why.** Local decode and the vault work offline; compose, critique and sync do not. Nothing tells the seller which is which.

**Do.**
1. `src/content/shared.ts` `SHARED.offline`: `title: "You are offline"`, `desc: "Decoding and your vault work without a connection. Drafting, critique and sync need one and will fail until you are back online."`
2. `src/components/OfflineNotice.tsx` ("use client"): state initialised to `true` (online) to avoid hydration mismatch, then `online`/`offline` listeners + `navigator.onLine` read in an effect. Render `Alert variant="warning" role="status"` with the two strings only when offline. No icon animation.
3. Mount once in `AppShell.tsx` between `AppHeader` and `children`, and once at the top of `DecodeClient.tsx`.

**Accept.**
```
grep -rn "OfflineNotice" src --include=*.tsx                                 → 3 hits (component + 2 mounts)
grep -n "navigator.onLine" src/components/OfflineNotice.tsx                  → 1 hit
```
Commit: `fix(uiux-polish/task-9): offline notice naming what works offline and what needs a connection`

---

### Task 10 — Copy hygiene: `!` lint, optional markers, first-use terms, README drift (register L3, H6, C28, discovered)

**Do.**
1. `scripts/lint-copy.mjs`: add `const BANNED_PUNCTUATION = [/[A-Za-z0-9)]!(?=["'\`\s.,])/]` and a fourth pass "banned punctuation (content only)" over files matching `/src\/content\//`, using `scanFile` like the numbers pass. Confirm `npm run lint:copy` still passes (0 hits today).
2. *(Box 4 ticked)* `APP.interview.optionalSuffix: "(optional)"`; where `InterviewFlow.tsx` renders the step prompt, append the suffix when `step.required === false`. Verify the client-side step type carries `required` (grep the local `interface` block near line 106 and `@/core` imports); if it does not reach the client, record it in Discovered and skip — do not widen the API.
3. *(Box 4 ticked)* First-use definitions: on `/decode`, `/dashboard`, `/case`, `/compose`, the first occurrence of POA, ASIN, ODR, AHR, LOA and "Seller Central" in that surface's strings reads as "Plan of Action (POA)", "Amazon Standard Identification Number (ASIN)", "order defect rate (ODR)", "Account Health Rating (AHR)", "letter of authorisation (LOA)". Edit `src/content/app.ts` / `marketing.ts` only. List page → term → string key in the evidence log.
4. `src/content/README.md`: remove or correct the `errors.ts` line to match the directory.

**Accept.**
```
grep -n "BANNED_PUNCTUATION" scripts/lint-copy.mjs                           → ≥ 2 hits
npm run lint:copy 2>&1 | tail -2                                             → PASS
grep -n "optionalSuffix" src/components/InterviewFlow.tsx src/content/app.ts → ≥ 2 hits (or Discovered note)
grep -n "errors.ts" src/content/README.md                                    → 0 hits, or the line now describes an existing file
```
Commit: `fix(uiux-polish/task-10): exclamation-mark copy lint, optional step markers, Amazon terms defined on first use, content README corrected`

---

### Task 11 — Proof, docs, ticks

**Do.**
1. Run the full §5 gate block; paste each proving line into the evidence log. Playwright/Lighthouse: run or write "NOT RUN — reason".
2. Screenshots for founder sign-off at 375/768/1280, light and dark: `/`, `/terms#independence`, `/case` (saved line + failure Alert forced by a test hook if one exists, else the saved line only), `/compose` (preview open), vault create form (loss warning). Use the existing `e2e/screenshots.spec.ts` pattern; store under its configured output dir; list paths in the evidence log.
3. `02-BUILD-PLAN-AMENDMENTS.md`: tick AA-30 with the final commit hash. `CLAUDE.md` §4: one "DONE" bullet listing the eleven commits; update BLOCKERS/NEXT if they changed. `docs/handoffs/2026-09-09-uiux-polish.md`: Resume pointer `done`, Discovered and Deviations filled (empty sections say "none").

**Accept.** Every Task 1–10 Accept line has an evidence row with a commit hash; §5 block green or explicitly NOT RUN.

Commit: `docs(uiux-polish/task-11): evidence log complete, AA-30 ticked, screenshots listed, CLAUDE.md state`

---

## 4. SELF-CHECK BEFORE EACH COMMIT

```
0. Context ≥ 50 %? Update the Resume pointer, compact, re-read §0.A + pointer + current task.
1. git diff --cached --stat                       # only files this task names (+ content modules)
2. git diff --cached | grep -inE "password|passphrase|secret|token|license_key|Dev-"   # identifiers only
3. npm run typecheck 2>&1 | tail -5 && npm run lint 2>&1 | tail -3 && npm run lint:copy 2>&1 | tail -2 && npm run format:check 2>&1 | tail -3
4. npm test 2>&1 | tail -6                         # count never decreases; new tests named in the task exist
5. <task's Accept block>                           # each command + its one output line → evidence log
6. Re-read the task's "Why" — is every listed defect gone?
7. Resume pointer → Status: done, Next command: first step of Task N+1.
8. Commit with the exact message given.
```

## 5. FINAL GATES (all green before "polish pass complete" is written anywhere)

- `npm run typecheck` · `npm run lint` 0 warnings · `npm run lint:copy` PASS (now 4 passes) · `npm run format:check` · `npm run build` (pages ≥ baseline) · `npm test` ≥ baseline + 15 · `npx playwright test` 0 failed, ≥ baseline + 1 · Lighthouse a11y 1.0 if runnable.
- `grep -rni "guarantee" src` → only the `composer.ts` critic pattern and tests · `grep -rn "sessionStorage\|localStorage" src` → only tests/theme · `grep -rn "animate-spin\|animate-pulse" src` → only buttons and `skeleton.tsx` · `grep -rn "Intl.DateTimeFormat" src --include=*.tsx` → 0 · `grep -rn "vault.add(" src/components` → 0 · `grep -rli superpower src e2e scripts` → 0.
- No new nav item, no new card above the fold on any route, no second primary action on any screen (spec §1.1) — state this explicitly in the evidence log with the routes you checked.
- A fresh browser on `/case` sees the loss warning **before** typing a passphrase; after 15 idle minutes (or the test's short `idleMs`) the vault is locked and asks for the passphrase.

## 6. AFTER THE PASS (surface, do not perform)

Founder signs off the Task 11 screenshots; founder decides whether Wave C-fix Tasks 8–10 (`docs/handoffs/2026-09-07-wave-c-fix-prompt.md`) or AA-31 (M-4) runs next; deploy the Vercel preview and run the smoke tests in `docs/DEPLOYMENT.md`.

## 7. FOUNDER-GATED (never do these yourself)

`FOUNDER_NOTE` stays `null`. No edits under `Planning/07-REFERENCE/`. No Amazon policy text authored from memory (B-08); no official Amazon URLs added (register O3). `legal/*.md` changes limited to the approved paragraphs in Task 1. Nothing from Appendix B. No Paddle/Polar/Wise/CWS/domain work. Note for the founder, not for you: `legal/terms.md:12` reads "not a guarantee of reinstatement" — the D6 grep covers `src/` only; whether the legal draft should say "no promise of reinstatement" instead is the founder's call.

---

## Appendix A — verified line references at `ed05259` (re-grep before editing)

| File | Lines | What |
|---|---|---|
| `src/components/SiteFooter.tsx` | whole (42) | two rows; `SHARED.footer.tagline`, `.nav.*`, `.neverSubmits` |
| `src/content/shared.ts` | whole | `SHARED.footer`, `metadata`, `retryButton`, `navSkip` |
| `src/content/legal.ts` | 72–117 | `LEGAL.terms.sections` ids `basis, licence, restriction, termination, governing` |
| `legal/terms.md` | 11–12 | §2 "What AppealDeck is — and is not" |
| `src/content/marketing.ts` | 125+ | `FAQ.items` `{ q, a }`; `FOUNDER_NOTE = null` at 123 |
| `src/components/InterviewFlow.tsx` | 247–253, 294–300 | silent `saveCaseFile` catches |
| | 353–362 | Save & exit with toasts |
| | 393–397 | `<VaultGate … onUnlocked>` |
| | 565 | fixed bottom action bar |
| | 671, 845 | short_text / decline `Textarea` |
| | 701–716 | `FileDropZone onFile` → `vault.add` → toast |
| `src/components/VaultGate.tsx` | 18, 24–30 | phase kinds; props |
| | 104–180 | `VaultInitForm` (hardcoded strings 118–120, 132–135, 139, 156, 175; input 141–147) |
| | 188+ | `VaultUnlockForm` |
| `src/components/ComposeView.tsx` | 168–186 | error Alert (link only) |
| | 193–194 | `mergedSections`, `fullDraftText` |
| | 222–224, 229 | `CopyButton`, checklist `draftText` |
| | 268 | render-prop `VaultGate` |
| `src/core/composer.ts` | 226–235 | `renderPoaText` (`## ` headings; leave) |
| `src/components/DeadlineChip.tsx` | 9–17, 19–29, ~80 | `en-US` formatter, `formatRelative`, `" | "` |
| `src/app/(app)/billing/page.tsx` 14 · `DashboardClient.tsx` 75 · `DeviceManager.tsx` 38 · `VaultView.tsx` 431 · `VerifiedStamp.tsx` 15 | | ad-hoc date formatting |
| `src/components/FileDropZone.tsx` | whole (78) | single-file input, no `accept` |
| `src/components/VaultView.tsx` | ~120–145, 235–240, 369 | `onLock`, `onAddFile` toasts, `VaultGate`, drop zone |
| `src/components/EvidenceSlotPanel.tsx` | 33, 68 | `vault.list()`, `vault.add()` |
| `src/core/vault/vault.ts` | 22, 30–42, 180–209, 232–243, 334 | hash version, `VaultListItem`, `add()`, `list()`, `sha256Base64Self` |
| `src/app/layout.tsx` | 40–45 | `viewport` export |
| `src/app/globals.css` | 198–206 | reduced-motion block (print block goes after) |
| `scripts/lint-copy.mjs` | 26–47, 114–150 | pattern lists, `main()` passes |
| `src/components/AppShell.tsx` | 16–19 | `AppHeader` + `children` |
| `src/app/decode/DecodeClient.tsx` 141 · `DashboardClient.tsx` 410 · `PoaSection.tsx` 80 | | textareas |
| `src/app/(app)/login/page.tsx` 155 · `signup/page.tsx` 149 · `forgot-password/page.tsx` 78 | | email inputs |
| `src/core/interviewEngine.ts` | 32 | `required?: boolean` |
| `Planning/03-PHASE-2-BUILD/06-PREMIUM-UI-UX-SPEC.md` | 192–217 | §14 table (row 22 last) |
| `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` | 258–~283 | AM-18 block; DoD line below §4 |

## Appendix B — AA-31, rides M-4 (NOT this pass; listed so nobody does it "while in there")

Critic word rules (future tense in corrective actions; blame-shifting words; vague-time phrases; jargon swaps — warnings with rule + fix, never hard blocks) · invoice issue-date field + 365-day freshness flag (`evidenceModel.freshnessDays`) · ASIN + case-ID extraction in `noticeParser.ts` and case-ID in the case header · seller override of the decoded kind · root-cause category step · dated corrective-action rows + "two actions" readiness hint (never "Amazon requires") · attachment references by filename in POA text · neutral character counter · ID paste normaliser. Register rows B2, B3, B5, C5–C12, C19, E7, H5, I11.
