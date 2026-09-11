# AppealDeck — founder-reported issues fix pass — coding-agent prompt

Written 11 Sep 2026 against commit `5f0c6ee`, after a session that fixed three access/session bugs live (uncommitted) and diagnosed the composer, password fields, and vault view/download bug without fixing them. Diagnosis (read-only, full evidence, plain language): `docs/handoffs/2026-09-11-founder-issues-diagnosis-and-plan.md` — read it once for context; this prompt is the actionable version and does not repeat every explanation. Evidence log for THIS pass: `docs/handoffs/2026-09-11-founder-issues-fix.md`.

This prompt is written to be picked up cold, by a different AI session, with no memory of the conversation that produced the diagnosis. Everything you need is either in this file, `CLAUDE.md`, or the diagnosis doc above.

## STATUS — RUNNABLE from Task 0. Task 4 is founder-gated, do not start it on your own judgment

- [ ] **Task 4 (real AI-drafted composer) needs an explicit founder go-ahead in chat, given after reading this prompt's Task 4 section.** Default if the founder has not said so: **stop after Task 3** and report. Do not treat "fix the composer" in a general instruction as covering Task 4 — Task 1 is the composer fix that ships by default; Task 4 is a much bigger, separate feature.

Everything else here (Tasks 0–3) is authorized to run without further sign-off — it directly implements the founder's own bug reports and CLAUDE.md's "NEXT 4 ACTIONS" item 1.

---

## 0. OPERATING PROTOCOL

- One task = one commit, with the exact commit message given at the end of each task.
- **Create and edit files only with your file-editing tool.** Never through the shell: no heredocs, no `echo >`, no `Out-File`, no `Set-Content`, no scripts that write files. Shell writes have corrupted files in this repo to UTF-16 before (see `AGENTS.md` / prior handoffs).
- In PowerShell use `Select-Object -Last N` instead of `tail`; use your search tool instead of shell `grep` where one is available, but the Accept blocks below are written as literal `grep`/`rg`-style commands for portability — translate to whatever your environment supports, the important part is the expected output, not the exact shell syntax.
- Before every commit, run the self-check block (§4). No secrets in commits.
- **D6 is the aesthetic, non-negotiable:** no "guarantee", no invented percentages/win-rates/hours-to-decision, no social proof, no exclamation marks in copy, never claim the tool predicts Amazon's decision. New user-facing strings go into `src/content/*.ts`; after any content change, `npm run lint:copy` must exit 0. It also bans the soft words "secure", "don't worry", "powerful", "simply", "just" inside `src/app/`, `src/components/`, `src/content/` — write around them, not through an allowlist edit.
- Never invent facts the seller didn't provide. The composer fix in Task 1 must use only what's actually in the case file — this is the same evidence-first principle as the rest of the app (see `Planning/03-PHASE-2-BUILD/04-EVIDENCE-FIRST-HARDENING.md`), not a new rule for this pass.
- Read files in ranges where you can; grep/search before opening a whole file blind.

### 0.B REPORTING RULES (this repo has been burned by inflated final reports before — see `founder-ai-audit-pitfalls` pattern)

1. **Every commit hash you write anywhere comes from `git log --oneline` output you actually ran.** Never type a hash from memory or from this prompt (this prompt's hashes, where given, are for context only — re-verify with `git cat-file -t <hash>` before citing one in your own report).
2. **A gate whose process exits non-zero is red**, whatever the printed text looks like. Never describe a red gate as "pass", "pre-existing", or "not introduced by this pass" without also saying it is still red.
3. **A task is done only when every line of its Accept block is green in your own session.** A task you shrank, skipped, or replaced with something smaller is written up as `NOT DONE — <what is missing>` in the evidence log and in your final message, not as done.
4. **Prescribed commit messages are used verbatim.** If your work doesn't match the message, the work isn't finished as specified — fix the work, don't edit the message to fit.
5. **Your final chat message:** `git log --oneline 5f0c6ee..HEAD`, then one line per gate with its exit code, then the evidence-log path. Nothing else unless something is blocked.

---

## 1. CONTEXT — verified state at `5f0c6ee` (11 Sep 2026)

**Working tree at the start of this pass is *not* clean** — a prior session made real, tested, verified fixes and left them uncommitted on purpose, for Task 0 of this pass to commit. Expect `git status --short` to show exactly:

```
 M next.config.mjs
 M src/components/ComposeView.tsx
 M src/components/DashboardClient.tsx
 M src/components/InterviewFlow.tsx
 M src/components/SignOutButton.tsx
 M src/components/VaultView.tsx
 M src/content/app.ts
 M src/core/vault/vault.test.ts
 M src/core/vault/vault.ts
?? docs/handoffs/2026-09-11-founder-issues-diagnosis-and-plan.md
?? src/lib/vault/guestSession.ts
```
(plus `CLAUDE.md`, this prompt, `docs/handoffs/2026-09-11-founder-issues-fix.md`, and `docs/handoffs/SESSION-START-PROMPT.md`, all written by the reviewing AI as part of this same handoff — commit them together too. Two pre-existing untracked items — `.claude/` and `docs/handoffs/screenshots/2026-09-07/` — are unrelated, predate this pass, and are **not** part of this commit; leave them untracked.)

Gates already verified green on this exact uncommitted diff, by the session that made it: typecheck 0 · lint 0 warnings · lint:copy PASS (5 passes) · format:check exit 0 · vitest **366/366** in 39 files · build **32 routes**. Re-run them yourself in Task 0 before trusting this — don't take it on faith.

**What that uncommitted diff does (already done, do not redo):** `VaultGate` (`src/components/VaultGate.tsx`, unchanged this pass) is now passed `deviceMode autoUnlock` unconditionally from Dashboard/Case/Compose/Vault, so no page asks for a passphrase by default; a new `Vault.relockWithDeviceKey()` (`src/core/vault/vault.ts`) lets a passphrase-mode vault switch back to automatic; `VaultView.tsx` has a new opt-in "Protect with a passphrase" / "Switch to automatic unlock" control; `src/lib/vault/guestSession.ts` wipes a signed-out visitor's leftover draft on a genuinely new browser session; `SignOutButton.tsx` does a hard `window.location.assign` instead of a soft router push; `next.config.mjs` sets `experimental.staleTimes.dynamic = 0`. Full explanation in the diagnosis doc's Part 1. **Do not touch any of this in Tasks 1–3 unless a task explicitly says to.**

**The three things this pass actually fixes (Tasks 1–3), verified by direct code reading, file:line accurate as of `5f0c6ee`:**

- **Composer is a placeholder, not a draft** — `src/core/composer.ts:68-74` (`buildRootCauseSection`) and `:97-102` (`buildPreventiveMeasuresSection`) return literal bracketed instructions (`"[Describe what caused the {kind} issue...]"`) regardless of the case data passed in; neither function reads `data.rootCause` at all. `src/core/interviewEngine.ts:171-174` (`applyAnswer`, case `"intake_root_cause"`) accepts any non-empty string with no length/substance check. There is no interview step anywhere for preventive measures (`grep -n 'id: "intake_' src/core/interviewEngine.ts` → 3 hits, none about prevention). `src/app/api/compose/route.ts:83` calls the same bare `composePoa()` — no LLM call in this path at all, despite `src/lib/llm/gemini.ts` being a real, working integration used elsewhere (`extract-field`, `critique-poa` task tag, `phrase-engine-output`, `triage-router`).
- **No password show/hide toggle anywhere** — every `type="password"` field in the app is bare. Confirmed locations (line numbers as of `5f0c6ee`): `src/app/(app)/login/page.tsx:185`, `src/app/(app)/signup/page.tsx:169`, `src/app/(app)/reset-password/page.tsx:104,126`, `src/components/VaultGate.tsx:292,312,378,458,470` (five fields across the create/unlock/relock forms), `src/components/VaultView.tsx:614,628` (the new opt-in passphrase dialog added this session, built consistent with the existing gap rather than fixed in isolation).
- **Vault view/download don't work as a user expects** — `src/components/VaultView.tsx`, function `onView` (~line 191): for anything except `text/*`/`application/json` it only shows a toast saying "use download instead" — no real preview for images, PDFs, or scans, which is most of what actually gets uploaded. Function `onDownload` (~line 213): decrypts the file, builds a blob URL, synthesizes an `<a>` click, then unconditionally shows a "downloaded successfully" toast — with no way to know whether the browser actually saved anything. Some browsers refuse a synthetic click as a genuine user action once there's been an `await` (here, the decrypt) between the real click and the synthetic one, so the download can silently do nothing while the code reports success anyway.

**Anchors (grep before editing — this session already edited several of these files today, so line numbers may have shifted further by the time you start):** `src/core/composer.ts` (`composePoa`, `buildRootCauseSection`, `buildCorrectiveActionsSection`, `buildPreventiveMeasuresSection`, `buildGapSection`, `critiquePoa`) · `src/core/readiness.ts` (`composerModeFor`, `isRequiredComplete`, `ComposerMode` type) · `src/core/interviewEngine.ts` (`CaseFile` interface line 47, `createCaseFile`, `nextStep`, `applyAnswer`, `interviewProgress`) · `src/core/composer.test.ts` and `src/core/interviewEngine.test.ts` (existing tests you must keep green and extend) · `src/components/ui/input.tsx` (the `Input` primitive and `fieldClassName` export you'll wrap) · `src/content/app.ts` (`APP.vault.actions`, add new keys near it).

---

## 2. SETTLED — do not reopen

- Everything in `CLAUDE.md` §1–3 (product one-pager, locked decisions D1–D10, forbidden sources).
- The passphrase/session/sign-out fixes described in §1 above — those are finished and verified; this pass does not touch `VaultGate.tsx`'s unlock logic, `guestSession.ts`, `SignOutButton.tsx`, or `next.config.mjs`.
- D9 (Gemini paid-tier-only, cost ceiling before wide release, rules-only degradation floor) governs Task 4 if it ever runs — it is not optional there.
- Do not add a "view" preview for arbitrary file types beyond image/PDF/text in Task 3 — anything else gets the honest "no preview, use download" message, not a new viewer.

---

## 3. TASKS

### Task 0 — Commit this session's verified fixes, open this pass's evidence log

**Do.**
1. Run `git status --short` and confirm it matches §1's list (plus the untracked handoff/prompt/CLAUDE.md files and the two pre-existing unrelated untracked items). If it doesn't match, stop and report the difference — do not guess or force it through.
2. Run the gates yourself and confirm green before committing: `npm run typecheck`, `npm run lint`, `npm run lint:copy`, `npm run format:check`, `npm run test`, `npm run build`.
3. `git add` everything from §1's list plus `CLAUDE.md`, this prompt file, the evidence log file (create it now — see the template at the bottom of this prompt), and `docs/handoffs/SESSION-START-PROMPT.md`. Do **not** add `.claude/` or `docs/handoffs/screenshots/2026-09-07/`.
4. One commit.

**Accept.**
```
git status --short                    → empty except the two pre-existing untracked items
npm run typecheck                     → exit 0
npm run lint                          → 0 warnings
npm run lint:copy                     → PASS
npm run format:check                  → exit 0
npm test                              → 366 passed (or more, never fewer)
npm run build                         → 32 routes (or more)
```
Commit: `fix(founder-fixes/task-0): commit the passphrase/session/sign-out fixes verified live this session; open the fix pass`

---

### Task 1 — Composer actually uses what the seller wrote; thin answers get a real "add more detail" gap, not a fake draft

This is the most important task in this pass. Read the diagnosis doc's Part 2 in full before starting if anything below is unclear.

**Why.** Right now the composer discards the seller's actual typed answer and prints a fill-in-the-blank instruction instead. A one-word answer ("idk") is treated exactly the same as a real paragraph. Neither of those is acceptable for a document with the founder's own house rule: **a poor appeal is never a real appeal.**

**Do.**

1. **`src/core/interviewEngine.ts`** — add a new optional field to `CaseFile` (line ~47-57): `preventiveMeasures?: string`. Add a new step, asked after `intake_prior_appeals` and before the evidence-ask loop:
   ```ts
   if (file.priorAppealsAnswered && !file.preventiveMeasuresAsked) {
     return {
       id: "intake_preventive_measures",
       kind: "intake_preventive_measures", // add to the StepKind union
       title: "Preventing this from happening again",
       prompt:
         "What have you changed, or will you change, so this doesn't happen again? This is optional, but a specific answer here makes your Plan of Action stronger.",
       inputType: "short_text",
       required: false,
     };
   }
   ```
   Add a `preventiveMeasuresAsked?: boolean` field to `CaseFile` so an empty/skipped answer doesn't re-prompt forever (set it to `true` in `applyAnswer` for this step id regardless of whether a value was given — an explicit skip is a valid answer, matching how `intake_prior_appeals` already works). In `applyAnswer`, add a case for `"intake_preventive_measures"` that sets `next.preventiveMeasures = answer.value` when present and always sets `next.preventiveMeasuresAsked = true`. Update `interviewProgress()`'s total-step count and `createCaseFile()`'s defaults to include the new field/flag. Update `src/core/interviewEngine.test.ts` for the new step (at minimum: the step appears after prior-appeals and before evidence asks; skipping it doesn't loop; the field round-trips through `applyAnswer`).

2. **`src/core/readiness.ts`** (or a new small exported function in `composer.ts` if that reads more naturally — your call, but export it either way and add a unit test) — add a narrative-sufficiency check:
   ```ts
   const MIN_ROOT_CAUSE_CHARS = 40;
   const LOW_EFFORT_ANSWERS = new Set([
     "idk", "i don't know", "n/a", "na", "none", "unknown", "not sure", "no idea",
   ]);

   export function isNarrativeSufficient(data: CaseFileData): boolean {
     const text = (data.rootCause ?? "").trim();
     if (text.length < MIN_ROOT_CAUSE_CHARS) return false;
     if (LOW_EFFORT_ANSWERS.has(text.toLowerCase())) return false;
     return true;
   }
   ```
   This is a heuristic, not an AI judgment call — keep it deterministic and cheap, matching every other check in this file. Extend `composerModeFor(data)` so it returns `gap-draft` (with a reason distinguishing "evidence gap" from "narrative gap" — add a `gapReason: "evidence" | "narrative" | "both"` field to `ComposerMode`) whenever either evidence is incomplete OR `!isNarrativeSufficient(data)`. Update `composer.test.ts` / `readiness.test.ts` for the new field and the new gating condition.

3. **`src/core/composer.ts`** — rewrite the three section builders:
   - `buildRootCauseSection(data)`: when `isNarrativeSufficient(data)`, the body is the seller's own words verbatim (`data.rootCause!.trim()`), optionally prefixed with a plain dated lead-in when a timeline event exists (e.g. `` `On ${data.timelineEvents[0].date}: ` ``) — do not invent additional narrative beyond what the seller wrote. When not sufficient, the body explains plainly what's missing and how to fix it (not a bracket instruction dressed as content) — something like: *"There isn't enough detail here yet to draft this section credibly. Go back to the case interview and describe, specifically, what caused this — a vague or one-line answer reads as unconvincing to a reviewer."* Route this through `src/content/app.ts` as a new string (e.g. `APP.compose... ` or a new `core`-facing constant — this file isn't itself under `src/content/`, so define the literal string as an exported constant in `composer.ts` with a comment explaining why it lives here instead of content, OR thread it in from a caller that already has `APP` in scope; pick whichever keeps `composer.ts` framework-agnostic, since it's platform-agnostic core per `CLAUDE.md` D3 — this is a real design decision, make it deliberately and say which way you went in the evidence log).
   - `buildPreventiveMeasuresSection(data)`: when `data.preventiveMeasures` is present and non-trivial (reuse a similar length/low-effort check, or factor `isNarrativeSufficient`'s logic into a shared helper taking the field name), use it verbatim. When absent, say plainly that no preventive measures were provided — do not fabricate a bracket instruction.
   - `buildCorrectiveActionsSection`: unchanged — it already uses real `actionItems` data; leave it as is.
   - When `mode.mode === "gap-draft"` because of a narrative gap (new `gapReason`), the existing `buildGapSection` must also explain the narrative gap in plain terms (not only list missing evidence documents) — extend it, don't replace the evidence-gap behavior.
4. Run every existing test in `composer.test.ts`, `readiness.test.ts`, `interviewEngine.test.ts` and fix what the new behavior breaks — expect several existing fixtures to need a real `rootCause` string added since the old fixtures likely just set placeholder-length or empty values that the old code never checked.

**Accept.**
```
grep -n "data.rootCause" src/core/composer.ts                         → ≥ 2 hits (read, used in the body)
grep -n "\[Describe what caused" src/core/composer.ts                  → 0 hits
grep -n "\[Describe the systemic" src/core/composer.ts                 → 0 hits
grep -n "isNarrativeSufficient" src/core/*.ts                          → ≥ 2 hits (definition + use)
grep -n "intake_preventive_measures" src/core/interviewEngine.ts       → ≥ 2 hits
grep -n "preventiveMeasures" src/core/interviewEngine.ts src/core/composer.ts → ≥ 3 hits total
npm test 2>&1 | tail -8                                                → all green, ≥ 366 tests (likely more — new tests added)
npm run lint:copy                                                      → PASS
```
Commit: `fix(founder-fixes/task-1): composer uses the seller's actual root-cause and preventive-measures answers instead of bracketed placeholders; thin narrative answers gap-draft with a specific ask instead of faking content`

---

### Task 2 — One shared password show/hide component, used everywhere

**Why.** Every password/passphrase field in the app is a dead-end `type="password"` box with no way to check what you typed before submitting — worst exactly where a typo is most costly (a mistyped vault passphrase can mean permanently unrecoverable local data, by design).

**Do.**
1. New file `src/components/ui/password-input.tsx`: a `PasswordInput` component wrapping the existing `Input` primitive (`src/components/ui/input.tsx`) — same props except no `type` (it's fixed internally), plus a toggle button (Lucide `Eye`/`EyeOff`, `type="button"`, `tabIndex={-1}` so it never steals tab order from the field or the submit button, `aria-label` "Show password" / "Hide password") positioned inside the field on the right, switching the underlying `<input>` between `type="password"` and `type="text"`. Local `useState` per instance — no global state needed.
2. Replace every bare `<Input type="password" .../>` listed in §1 (11 fields total: login, signup, reset-password ×2, `VaultGate.tsx` ×5, `VaultView.tsx` ×2) with `<PasswordInput .../>` (drop the `type="password"` prop; keep every other prop — `autoComplete`, `autoCapitalize`, `autoCorrect`, `spellCheck`, `value`, `onChange`, `aria-invalid`, `aria-describedby`, `onKeyDown`, `id` — unchanged).
3. If any of those 11 fields sits inside a container with `overflow: hidden` or a fixed narrow width that would clip the new toggle button, adjust padding/width minimally — do not restyle anything else on that page.

**Accept.**
```
grep -rn 'type="password"' src                                        → 0 hits
grep -rln "PasswordInput" src/app/\(app\)/login/page.tsx src/app/\(app\)/signup/page.tsx src/app/\(app\)/reset-password/page.tsx src/components/VaultGate.tsx src/components/VaultView.tsx → 5 files
grep -c "PasswordInput" src/components/VaultGate.tsx                   → 5
grep -c "PasswordInput" src/components/VaultView.tsx                   → 2
npm run typecheck                                                     → exit 0
npm run build                                                         → same route count as Task 0's baseline
```
Commit: `feat(founder-fixes/task-2): shared PasswordInput component with a show/hide toggle, used on every password and passphrase field in the app`

---

### Task 3 — Vault "view" actually previews the file; "download" is honest about whether it worked

**Why.** "View" can't show you a photo of an invoice or a PDF — the most common things sellers upload — it just tells you to use download instead. "Download" claims success even when the browser silently blocked it, because the current method can't tell the difference.

**Do.**

1. **View.** Replace the toast-based `onView` in `src/components/VaultView.tsx` with a `Dialog` (already imported in this file) showing a real preview:
   - `image/*` → decrypt, build an object URL, render `<img>` inside the dialog, revoke the URL on close.
   - `application/pdf` → decrypt, build an object URL, render an `<iframe>` (a reasonable height, e.g. `h-[70vh] w-full`), revoke on close.
   - `text/*` / `application/json` → show the full decoded text in a scrollable `<pre>` inside the dialog (no more truncating to 2000 characters and dumping it in a toast — a sensible upper cap like 200 000 characters to protect the DOM from a pathological file is fine, just far more generous than today).
   - anything else → an honest message that a preview isn't available for this file type, with a "Download" button right there in the same dialog that calls the same download logic from step 2.
2. **Download.** Prefer the File System Access API when present (`typeof window.showSaveFilePicker === "function"`): `showSaveFilePicker({ suggestedName: record.name })`, write the decrypted bytes to the returned handle, and only show a success toast once the write actually completes — catch `AbortError` silently (the user cancelled the save dialog; that is not a failure and must not show an error toast), and show a real error toast for any other thrown error. When the API isn't available, fall back to the existing blob-URL-and-synthetic-click method, but change the success wording from "downloaded" to **"download started"** — you cannot honestly claim more than that with this method, so don't.
3. Add the new copy strings to `src/content/app.ts` under `APP.vault` (a `preview` sub-object for the dialog states, and adjust `APP.dashboard.toasts.downloadSuccess` or add a new key for the honest "started" wording rather than silently reusing the old string with different meaning). Run `npm run lint:copy` after.

**Accept.**
```
grep -n "showSaveFilePicker" src/components/VaultView.tsx              → ≥ 1 hit
grep -n "AbortError" src/components/VaultView.tsx                      → ≥ 1 hit
grep -n "<img\|<iframe" src/components/VaultView.tsx                   → ≥ 2 hits (one each)
grep -n "2000" src/components/VaultView.tsx                            → 0 hits (the old truncation constant is gone)
npm run lint:copy                                                      → PASS
npm run typecheck                                                      → exit 0
npm run build                                                          → same route count as Task 0's baseline
```
Manual check (record it in the evidence log, don't skip it): in a real browser, upload one small image and one small text file to the vault, open View on each (confirm the image renders and the full text shows, not truncated), then Download each and confirm a real file lands on disk (or, if testing in an environment where `showSaveFilePicker` isn't available, confirm the toast now says "started" not "downloaded").

Commit: `fix(founder-fixes/task-3): vault view shows a real preview for images/PDFs/text; download uses the File System Access API with an honest fallback message`

---

### Task 4 — Real AI-drafted composer (FOUNDER-GATED — do not start without an explicit go-ahead)

**Do not do this task unless the founder has explicitly said, in chat, to proceed with it, after Tasks 0–3 are done and reported.** If that hasn't happened, stop after Task 3, report Tasks 0–3 complete per §0.B rule 5, and wait.

If and when authorized:

**Why.** Task 1's fix stops the composer from discarding the seller's words, but it still isn't a *drafted* document — it's the seller's own raw sentences, lightly organized. The founder's actual ask is a real AI-authored Plan of Action, grounded only in facts the seller provided (never inventing anything — this is the same evidence-first principle as the rest of the app, not a new rule).

**Do (outline — the founder should review and adjust this shape before you write code, not just before you ship it):**
1. Add a new `LlmTask` entry in `src/lib/llm/gemini.ts` (e.g. `"draft-poa-section"`), with its own model choice and, critically, **its own entry in the cost-ceiling/circuit-breaker system** (`breakerOptions` / `src/lib/breaker.ts`) — do not let this task share a budget with the small, cheap tasks it currently coexists with (`extract-field`, `critique-poa`, `phrase-engine-output`, `triage-router`). This is a bigger, pricier generation and D9 requires a real spend cap before anything like this ships broadly.
2. Add a new function (e.g. `composePoaWithLlm` in a new `src/core/composerLlm.ts`, or as a server-side-only wrapper if `composer.ts` must stay platform-agnostic per D3) that builds a prompt from the case file's actual facts — root cause, timeline, prior-appeal count, preventive measures, which evidence is attached and its kind — with an explicit system instruction to never state anything not present in the input, and to return structured JSON matching the existing `PoaSection[]` shape (use `responseJsonSchema` on the Gemini call, already supported).
3. Wire it into `/api/compose/route.ts` behind the existing license/rate-limit checks, with the deterministic `composePoa()` (Task 1's version) as an automatic fallback if Gemini is unconfigured, times out, or the circuit breaker is open — never a hard failure, matching the "rules-only degradation floor" already required by D9.
4. The deterministic critic (`critiquePoa`, unchanged) still runs on whatever comes out of either path, as the safety net it already is.
5. This needs its own dedicated evidence log, its own gates, and — given real Gemini spend is involved — a check-in with the founder before it's considered done, not just a green test suite. Do not fold its evidence into `docs/handoffs/2026-09-11-founder-issues-fix.md`; open a new dated file.

Do not attempt to fully spec every detail of this from this outline alone — if something here is ambiguous once you're actually implementing it, that's a "stop and report" situation (§0 protocol), not a "guess and proceed" one, given real money and the product's core promise are both on the line.

---

## 4. SELF-CHECK BEFORE EACH COMMIT

- `git cat-file -t` on every hash you're about to write anywhere.
- The prescribed commit message copied verbatim.
- `git ls-files --eol <changed files>` shows `w/lf` for every file (a `w/crlf` result means your editor wrote CRLF on Windows — fix before committing; this has corrupted files in this repo before).
- `npm run lint:copy` after any change to `src/content/**` or any new user-facing string anywhere in `src/`.
- No new `console.log`/`console.error` debug statements left in committed code.

## 5. FINAL GATES (after Task 3, or after Task 4 if authorized and completed)

```
npm run typecheck      → exit 0
npm run lint            → 0 warnings
npm run lint:copy       → PASS
npm run format:check    → exit 0
npm test                → all green, count ≥ Task 0's baseline (366)
npm run build            → route count ≥ Task 0's baseline (32)
```
Plus the Task 3 manual browser check. Playwright/Lighthouse are not required for this pass unless you have reason to think Tasks 1–3 touched a route those suites cover — if you run them, report the real result; if you skip them, say "NOT RUN — reason", never silently omit them from the final report.

## 6. AFTER THE PASS (surface, do not perform)

Founder: decides whether to authorize Task 4; decides whether to push `master`; reviews the new preventive-measures interview step's wording before it goes live to real sellers (it's new user-facing copy, worth a founder look even though it passed lint:copy).

## 7. FOUNDER-GATED

Task 4 in full (see its own section above). Do not touch `legal/`, `Planning/07-REFERENCE`, or anything related to Paddle/Polar/pricing in this pass — none of it is in scope.

---

## Evidence log template (create as `docs/handoffs/2026-09-11-founder-issues-fix.md` in Task 0)

```markdown
# Founder-issues fix pass — evidence log

Baseline: commit `5f0c6ee`, gates recorded in the fix prompt §1.

## Resume pointer
Task: 0 · Status: not started · Last green gate: (none yet) · Next command: `git status --short`

## Task 0
(fill in: commands run, output, commit hash from `git log`)

## Task 1
...

## Task 2
...

## Task 3
...

## Discovered / Deviations
(anything you found that this prompt didn't anticipate)

## Founder sign-off
(anything that needs the founder's own eyes — e.g. the new interview question's wording)
```
