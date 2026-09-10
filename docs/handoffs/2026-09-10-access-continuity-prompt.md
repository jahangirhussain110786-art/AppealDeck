# AppealDeck — Access ladder + continuity pass (AA-33) — coding-agent prompt

Written 10 Sep 2026 by the reviewing AI against commit `7bd3e4e` (the polish FIX pass is complete). Design authority for every behaviour below: **`Planning/03-PHASE-2-BUILD/07-ACCESS-AND-CONTINUITY-SPEC.md`** (cited as **S§n**). Evidence log for THIS pass: `docs/handoffs/2026-09-10-access-continuity.md`. Plain-language guide for the founder: `docs/handoffs/2026-09-10-access-continuity-plain-guide.md`. The visual refresh v3 pass runs **after** this one and was updated to expect its results.

## STATUS — RUNNABLE from Task A1. Ratified by Jhangir Hussain in chat on 10 Sep 2026 (AM-21). Task A0 paperwork was performed by the reviewing AI the same day.

- [x] **Tier ladder, gates, header** as S§1–S§3 (10 Sep 2026).
- [x] **Browser-key draft + passphrase re-lock** as S§4 — a core vault change, approved because it changes how the master key is held, not what is encrypted or where.
- [x] **Purchase continuity** as S§6 (overlay checkout, completion event, license-status endpoint, activation state).
- [x] **Email + password and Google both stay**; magic link stays.
- [x] **AI field suggestions on a free account under a daily cap** as S§9.
- [ ] **Founder may edit the privacy paragraph wording** (S§8, last block) before Task A7 runs. Default if untouched: use it as written.
- **Billing / Appeal Pass label:** "Billing" (default). One word in `SHARED.nav.billing` if the founder changes it.

---

## 0. OPERATING PROTOCOL

§0 and §0.A of `docs/handoffs/2026-09-09-uiux-polish-prompt.md` (one task = one commit, gate block after every task, evidence not adjectives, append never overwrite, no secrets, D6 is the aesthetic, extract don't duplicate, cross-platform, FORBIDDEN SOURCES, compact at 50 %, read in ranges, ≤ 3 chat lines between tool calls) and §0.B of `docs/handoffs/2026-09-09-uiux-polish-fix-prompt.md` (hashes only from `git log`, exit codes decide gates, shrunk tasks are written up as NOT DONE, prescribed commit messages verbatim, final message generated from commands) apply unchanged. Commit prefix: `feat(access/task-N)` for code, `docs(access/task-N)` for docs.

### 0.C Rules specific to this pass
1. **S§ is the source of truth.** Strings come from S§8 verbatim; behaviours from S§2–S§6. If a value cannot work, record why in the evidence log and use the nearest value that does.
2. **Grep before you edit.** Line numbers below were taken at `7bd3e4e`; Appendix A gives a grep pattern for each anchor. Trust the pattern.
3. **Save first, gate second, resume third** (S§2). Any screen that asks for sign-in, a passphrase or payment must be reachable only after the seller's work is already in the vault, must carry a return path, and must say what is saved.
4. **No plaintext browser storage.** The vault (IndexedDB, AES-GCM) is the only store. `grep -rn "localStorage\|sessionStorage" src` stays at 0 outside tests.
5. **The webhook is the only writer of license state.** The client polls; it never sets.
6. **Tests that pin the UI:** `e2e/a11y.spec.ts` asserts h1 "Sign in" / "Create your account" / "Forgot your password?", `getByLabel(/email/i)`, the skip link `a[href="#main"]`; `e2e/marketing.spec.ts` asserts a `columnheader` named Appeal Pass and a link matching `/sign in/i`. Keep those roles and names; update the tests this pass deliberately changes (listed per task).
7. **Windows:** for any env value that begins with `/`, prefix the command with `MSYS_NO_PATHCONV=1` (Git Bash rewrites a lone `/`). Read PIPESTATUS, not the last command's exit, when you pipe through `tail`.
8. **Gates against the production build** when a browser is involved: `npm run build`, then the preview config `appealdeck-prod` (`.claude/launch.json`, `npm run start` on :3000); Playwright reuses a running server.

---

## 1. CONTEXT — verified at `7bd3e4e` (10 Sep 2026)

Gates: typecheck 0 · lint 0 warnings · lint:copy PASS (5 passes) · format:check exit 0 · vitest **309/309** in 31 files · build **30 app routes, 10 static, middleware 27.1 kB** · Playwright **45 passed** (chromium project, production server) · Lighthouse 1.0 in every category on 7 pages, `/decode` a11y 0.96 (pre-existing `skip-link` + `heading-order`, owned by the visual pass).

Facts this prompt relies on (each re-grepped today):

- **Auth gating is in the pages, not the middleware.** `src/middleware.ts` returns `NextResponse.next()` in single-host mode (line 31). `src/lib/auth.ts:29` `requireUser()` redirects to `/login` with no return path; `getApiUser()` (line 10) returns `AppUser | null` for routes. `src/app/(app)/layout.tsx` renders `<AppHeader mode="marketing" />` + children when there is no user (lines 18–24) and `<AppShell user>` otherwise.
- **Pages:** `case/page.tsx:13` `requireUser`, `:16` `isLicenseActive`, `:25` `!hasPass` no-pass card; `dashboard/page.tsx:15–16` `requireUser` + `fetchLicenseByEmail` → `DashboardClient license={license}` whose `license.status !== "active"` branch (`DashboardClient.tsx:220–270`) renders locked skeleton cards + `HonestExpectationsCard` + "Get the Appeal Pass"; `vault/page.tsx:12–34` `requireUser` + no-pass card (`APP.vault.noPass*`); `compose/page.tsx:13–46` `requireUser`, no-pass card (`APP.compose.noPass.*`), else `<ComposeView />`; `billing/page.tsx:14` `requireUser`.
- **Header:** `src/components/AppHeader.tsx` — `MARKETING_NAV` (12–16) Decode/Pricing/FAQ, `APP_NAV` (18–23) Dashboard/Case/Vault/Billing, hard-coded labels; `NavLink` 36–51 (underlined); render 58–95: `nav aria-label="Primary"`, `ThemeToggle`, `SignOutButton` in app mode, `Sheet` for mobile. Marketing pages render `<AppHeader mode="marketing" />` themselves (`pricing/page.tsx:40`, `page.tsx`, `faq`, `LegalPage`); `AppShell.tsx` takes `user: { email?: string | null }` (not nullable).
- **Sign-in:** `login/page.tsx` — magic link `signInWithOtp` with `emailRedirectTo: ${APP_URL}/auth/callback` (77–81), password `signInWithPassword` then `window.location.href = "/dashboard"` (92–100), Google `signInWithOAuth` `redirectTo: ${APP_URL}/auth/callback` (111–114); `signup/page.tsx` mirrors (75, 85, 101–104). `src/app/(app)/auth/callback/route.ts` already honours `?next=` through `safeNext()` (lines 4–21) — same-origin relative paths only, default `/dashboard`.
- **Vault core:** `src/core/vault/vault.ts` — one DEK encrypts records (`add()` 181–210); `initWithPassphrase` 97–113 wraps the DEK under PBKDF2 (`wrapDek`, `crypto.ts:276–291`), `unlock` 133–143 (`unwrapDek` 293–320), `changePassphrase` 153–172 re-wraps without touching records, `status()` 77–90, `isInitialized()` 92–95. `KeyMode` (`envelope.ts:31–33`) = `passphrase | wrapped`; `VaultKeyStore` (`schema.ts:22–28`) = `{ mode, wrappedDek?, kdf?, version, createdAt }`; Dexie `meta` table (`db.ts:12,18`). Tests: `src/core/vault/vault.test.ts`.
- **VaultGate:** `src/components/VaultGate.tsx` phases `loading | needs_init | locked | unlocked` (20); `isInitialized()` → `needs_init` (97–100); create form calls `initWithPassphrase` (219); unlock form calls `unlock` (308). Consumers: `InterviewFlow.tsx:420–443`, `DashboardClient.tsx:273–284`, `VaultView.tsx`, `ComposeView.tsx:299`.
- **Interview:** `InterviewFlow.tsx` — vault init effect 173–211 (opens the vault, `needs_init`/`locked` → gate), `persistCaseFile` 222–236, `callApi` → `POST /api/interview` 250–270, `handleStart` 272–288, `handleSubmit` 290–346 (`data.complete` → `onComplete`), resume/start-over 348–380, kind chooser 445+ (`KIND_LABELS` 122–130), file step + `addFileToVault` 735–746, `FieldSuggester` at 714–716 (root-cause step). The engine is pure and already imported client-side: `nextStep`, `interviewProgress` (line 51); `createCaseFile`, `applyAnswer` exist in `src/core/interviewEngine.ts` (64, 160). `/api/interview` (`route.ts`) only validates + rate-limits + runs the same pure functions; it stays untouched and unused after A4.
- **Case store:** `src/lib/caseStore.ts` — `CASE_ID`, `saveCaseFile`, `loadCaseFile`, `saveCaseLog`, `loadCaseLog`, `deleteCaseFile`, `deleteCaseLog`.
- **Engine for the preview:** `src/core/evidenceModel.ts:193` `requirementsFor(kind)` (`required`, `whyAmazonWantsIt`), `src/core/caseState.ts:108` `nextBestActions(state)`, `:155` `expectationsCopy(state)`; `APP.evidenceKinds` labels; `EvidenceStatusBadge`, `DeadlineChipList` exist.
- **AI route:** `src/app/api/extract-field/route.ts` — `withGeminiBreaker` (134), `isLicenseActive` gate (139), no per-user limiter. Limiters live in `src/lib/ratelimit.ts` (compose 30/min, interview 60/min, analyze-reply 60/min; `hasUpstashEnv()` → `null` limiter when Upstash is absent, callers treat `null` as allow). Breaker: `src/lib/llm/gemini.ts:69–71` `spendCapPerDay: 240`.
- **Checkout:** `src/components/CheckoutButton.tsx` — loads Paddle.js v2, `Paddle.Initialize({ token })` (51), `Checkout.open({ items })` (90), no `eventCallback`, no `customer`, hard-coded toast strings (73–75, 84–89); `PurchasePanel.tsx` holds the D8 consent checkbox (27–42) and renders `CheckoutButton` when consented. No client-readable license route exists (`src/app/api/`: analyze-reply, compose, decode, devices, extract-field, interview, webhooks). `src/lib/license.ts` — `fetchLicenseByEmail(email) → { status, plan, licenseKey }`, `isLicenseActive(email)`.
- **Pricing table:** `src/app/pricing/page.tsx:54–76` renders `PRICING.rows` as three `TableCell`s (feature/free/pass); `e2e/marketing.spec.ts:26–27` asserts `columnheader` `/free/i` and `/appeal pass/i` (a second header containing "free" would trip strict mode — change to exact matches).
- **Tests pinning today's gates:** `e2e/app-gate.spec.ts:4–32` and `e2e/a11y.spec.ts` "Auth gate" (unauthenticated `/dashboard`, `/case`, `/compose`, `/vault`, `/billing` → `/login`); `app-gate.spec.ts:34–83` API 401s (keep all; add license/status).
- **Content:** `SHARED` has no `nav` group yet (the visual spec planned the keys; this pass creates them with S§8's names). `APP.vault.noPass*`, `APP.case.noPass.*`, `APP.compose.noPass.*`, `APP.dashboard.noPass*` exist and are removed by this pass.

## 2. SETTLED — do not reopen

D1–D10; AM-16…AM-19; AM-21 (this pass — S§ is binding); the visual pass's material (do not restyle; class changes only where a new component needs a sane default). Rejected for this pass: server-side drafts, plaintext storage, Google-only sign-in, inline-dialog sign-in (unnecessary once the draft is in the vault), any change to severity gating, to Paddle configuration, to the webhook, to `src/core/*` beyond the vault key-mode change in A3.

---

## 3. TASKS — in this order, one commit each

### Task A0 — Paperwork — ✅ DONE 10 Sep 2026 by the reviewing AI

AM-21 (AA-33/AA-34) appended to `02-BUILD-PLAN-AMENDMENTS.md` (DoD → 34 items), `docs/DECISIONS.md` entry, `CLAUDE.md` §4 bullet, `SESSION-START-PROMPT.md` repointed here, evidence log opened with the `7bd3e4e` baselines. Start at Task A1.

---

### Task A1 — Content keys and the five-slot header (S§3.1, S§8)

**Do.**
1. `src/content/shared.ts`: add `nav` exactly as S§8. `src/content/app.ts`: add the `access` group exactly as S§8 (all sub-groups; unused ones are fine until later tasks). `src/content/auth.ts`: add `login.subtitleContinue`, `signup.subtitleContinue`.
2. `AppHeader.tsx`: one nav list for both states — `[decode, case, dashboard, vault, pricing|billing]` (hrefs `/decode`, `/case`, `/dashboard`, `/vault`, `/pricing` or `/billing`), labels from `SHARED.nav`. Props become `{ user?: { email?: string | null } | null; signedIn?: boolean }`; keep `mode` accepted but ignored for one release (callers still pass it). Signed-out: `Vault` renders `Lock` (`size-3.5`, `aria-hidden`) after the label with a `Tooltip` `SHARED.nav.lockedHint`; right cluster `ThemeToggle` + ghost `Button asChild size="sm"` → `Link href={signInHref}` `SHARED.nav.signIn`, where `signInHref` = `/login?next=<pathname>` when the pathname starts with `/case`, `/dashboard` or `/vault`, else `/login`. Signed-in: `ThemeToggle` + `SignOutButton`. Mobile `Sheet`: same list; signed-out adds a full-width `outline` "Sign in" button after a divider; `SheetTitle` `SHARED.nav.menu`; trigger `aria-label` `SHARED.nav.openMenu`. Remove the `underline` classes from `NavLink` only if needed for the lock alignment — otherwise leave styling to the visual pass.
3. Static marketing pages: `AppHeader` receives no `user`; add a client hook `useSessionState()` (`src/lib/useSessionState.ts`: `supabase.auth.getSession()` in an effect, `onAuthStateChange` subscription, returns `"unknown" | "signed-out" | "signed-in"`). When the server did not pass `signedIn`, the header renders signed-out and swaps the right cluster and the last slot when the hook reports signed-in. No layout shift: the five slots are identical.
4. `AppShell.tsx`: `user` becomes nullable; `(app)/layout.tsx` renders `<AppShell user={user}>` for both states (the `main#main` landmark is then present on every app route).

**Accept.**
```
grep -n "SHARED.nav\." src/components/AppHeader.tsx                        → ≥ 8 hits
grep -n "MARKETING_NAV\|APP_NAV\|label: \"" src/components/AppHeader.tsx    → 0 hits (labels in content)
grep -n "lockedHint" src/components/AppHeader.tsx src/content/shared.ts     → 2 hits
grep -n "next=" src/components/AppHeader.tsx                                → ≥ 1 hit
grep -n "user: { email" src/components/AppShell.tsx                        → 0 hits; grep -n "| null" src/components/AppShell.tsx → ≥ 1
grep -n 'mode="marketing" />' "src/app/(app)/layout.tsx"                    → 0 hits
npm run lint:copy 2>&1 | tail -2                                            → PASS
```
Commit: `feat(access/task-1): five-slot header with a locked Vault and Sign in when signed out, nav labels in content, session-aware right cluster on static pages`

---

### Task A2 — Access: signed-out pages render, return paths carried (S§3.2)

**Do.**
1. `src/lib/auth.ts`: add `getOptionalUser(): Promise<AppUser | null>` (same body as `requireUser` without the redirect) and give `requireUser(next?: string)` an optional return path → `redirect(next ? `/login?next=${encodeURIComponent(next)}` : "/login")`. Extract `safeNext` from the callback route into `src/lib/safeNext.ts` and import it in the callback, `login/page.tsx` and `signup/page.tsx`.
2. `login/page.tsx` / `signup/page.tsx`: read `next` from `useSearchParams`, sanitise with `safeNext`, use it in `emailRedirectTo`/`redirectTo` as `${APP_URL}/auth/callback?next=${encodeURIComponent(next)}` and in the post-password `window.location.href`. When `next` starts with `/case`, show `subtitleContinue` instead of the default subtitle (h1 unchanged). Cross-links between login and signup keep `next`.
3. `case/page.tsx`, `dashboard/page.tsx`, `vault/page.tsx`: `getOptionalUser()`; pass `signedIn={Boolean(user)}` and `hasPass` (false when signed out) down; **delete the no-pass branches** on all three (T1 gets the full pages). `compose/page.tsx`: `requireUser("/compose")`; `billing/page.tsx`: `requireUser("/billing")`. Delete the removed `APP.*.noPass*` keys and any import of them.
4. `vault/page.tsx` signed out → the teaching state (S§3.2) with `APP.access.vaultSignedOut.*`, buttons to `/login?next=/vault` and `/case`. `case/page.tsx` signed out → render the page with `InterviewFlow signedIn={false}` (A4 makes it work; until then it shows the vault create form — acceptable inside this task, note it in the log). `dashboard/page.tsx` signed out → `DashboardClient signedIn={false} license={{ status: "none", plan: null, licenseKey: null }}` (A5 renders the signed-out states).
5. Tests: `e2e/app-gate.spec.ts` and `e2e/a11y.spec.ts` "Auth gate": `/dashboard`, `/case`, `/vault` unauthenticated → **200 and stay on the route** (assert `page.url()` contains the route and a level-1 heading is visible); `/compose` → `/login?next=%2Fcompose`; `/billing` → `/login?next=%2Fbilling`. Add `test("login keeps next")`: `/login?next=/case` shows the continue subtitle text.

**Accept.**
```
grep -n "getOptionalUser" src/lib/auth.ts "src/app/(app)/case/page.tsx" "src/app/(app)/dashboard/page.tsx" "src/app/(app)/vault/page.tsx" → 4 hits
grep -rn "noPass" src --include=*.ts --include=*.tsx                        → 0 hits
grep -n "safeNext" src/lib/safeNext.ts "src/app/(app)/auth/callback/route.ts" "src/app/(app)/login/page.tsx" "src/app/(app)/signup/page.tsx" → ≥ 4 hits
grep -n "next=" "src/app/(app)/login/page.tsx" "src/app/(app)/signup/page.tsx" → ≥ 4 hits
grep -n "requireUser(\"/compose\")\|requireUser(\"/billing\")" "src/app/(app)/compose/page.tsx" "src/app/(app)/billing/page.tsx" → 2 hits
npx playwright test e2e/app-gate.spec.ts e2e/a11y.spec.ts --project=chromium --reporter=dot 2>&1 | tail -3 → 0 failed
```
Commit: `feat(access/task-2): case, dashboard and vault render signed out; compose and billing redirect with a return path; login and signup carry next through every sign-in method`

---

### Task A3 — Vault core: device-key mode and passphrase re-lock (S§4)

**Do.**
1. `envelope.ts`: `KeyMode` gains `{ kind: "device"; verifiedAt: string }`. `schema.ts`: `VaultKeyStore` gains `deviceKey?: CryptoKey` and `deviceWrappedDek?: EncryptionEnvelope`.
2. `crypto.ts`: `generateDeviceKey(provider)` (AES-GCM 256, `extractable: false`, `["encrypt", "decrypt"]`), `wrapDekWithKey(provider, dek, kek): Promise<EncryptionEnvelope>` and `unwrapDekWithKey(provider, kek, env): Promise<CryptoKey>` (reuse `exportRawKey`, `encryptBytes`, `decryptBytes`, `importRawDek`).
3. `vault.ts`: `initWithDeviceKey()`, `unlockWithDeviceKey()`, `relockWithPassphrase(passphrase)` exactly as S§4.1 (deletes `deviceKey` + `deviceWrappedDek`, writes `mode: passphrase`, `kdf`, `wrappedDek`); `status()` unchanged in shape (mode now includes `"device"`); `unlock(passphrase)` throws `INVALID_INPUT` with a clear message when the mode is `device`. `getBrowserVault()` unchanged.
4. **Persistence probe first:** a vitest that stores a non-extractable `CryptoKey` in the test IndexedDB and reads it back. If it fails, add a `DeviceKeyStore` interface (`get/set/delete`) with an IndexedDB implementation (default) and an in-memory one for tests, injected through the `Vault` constructor options — never store extractable key bytes as a workaround. Record which path applied in Discovered.
5. Tests in `vault.test.ts` (S§11 item 4): device init → add → lock → `unlockWithDeviceKey` → read; `relockWithPassphrase` → `unlock(passphrase)` reads the same record and `status().mode === "passphrase"`; meta has no `deviceKey`/`deviceWrappedDek` after relock; wrong passphrase → `WRONG_PASSPHRASE`; relock with < 8 chars → `INVALID_INPUT`; `status()` reports `mode: "device"` while locked in device mode.

**Accept.**
```
grep -n "kind: \"device\"" src/core/vault/envelope.ts                        → 1 hit
grep -n "initWithDeviceKey\|unlockWithDeviceKey\|relockWithPassphrase" src/core/vault/vault.ts → ≥ 3 hits
grep -n "extractable\|false, \[\"encrypt\"" src/core/vault/crypto.ts        → ≥ 1 hit (device key non-extractable)
grep -c "it(" src/core/vault/vault.test.ts                                  → ≥ previous + 6
npm test 2>&1 | tail -4                                                     → ≥ 315 passed
```
Commit: `feat(access/task-3): vault holds its master key under a non-extractable browser key before a passphrase exists; relockWithPassphrase re-wraps the same DEK and deletes the device key`

---

### Task A4 — Anonymous interview, sign-in gate, passphrase gate, case preview (S§2, S§4.2, S§5)

**Do.**
1. `InterviewFlow` props `{ initialKind?, onComplete?, signedIn: boolean, hasPass: boolean }`; `case/page.tsx` passes `initialKind` from `searchParams.kind` when it is a valid `ViolationKind`.
2. Engine in the client: replace `callApi("start" | "answer")` with `createCaseFile`, `applyAnswer`, `nextStep`, `interviewProgress` from `@/core/interviewEngine` (same shapes the route returns: `{ caseFile, step, progress, complete }`). Delete `callApi`. `/api/interview` stays as is.
3. Vault init effect (S§4.2): signed out + uninitialised → `initWithDeviceKey()` → unlocked (no UI); signed out + `status().mode === "device"` → `unlockWithDeviceKey()`; signed out + passphrase mode → `VaultGate` as today; signed in + device mode → `VaultGate` **passphrase gate**: the create form with `APP.access.setPassphrase.title/body` (loss warning kept) calling `relockWithPassphrase`, then `onUnlocked`; other signed-in cases as today. Implement the two new `VaultGate` props `deviceMode?: boolean` (renders the relock variant) and `autoUnlock?: () => Promise<void>` (runs silently in the loading phase) rather than a second component.
4. **Every step saves**: `persistCaseFile` runs after `handleStart` and every `handleSubmit`, in both modes (it already does when unlocked).
5. **Sign-in gate:** when `!signedIn` and the current step's `inputType === "file"`, render `SignInGate` (`src/components/SignInGate.tsx`) instead of the step card: `APP.access.signInGate.*`, buttons `Link href="/login?next=/case"` (default) and `/signup?next=/case` (outline), the saved note with the `formatTime` of the last save. The fixed mobile bar hides while the gate shows.
6. **Auto-resume:** after `relockWithPassphrase` succeeds in this session, load the case file and resume at `nextStep` without the resume dialog; the dialog stays for the ordinary "returning with a passphrase vault" case. A quiet `APP.access.keepCaseLink` (`Link` to `/login?next=/case`) shows under the step card while signed out.
7. `FieldSuggester`: render only when `signedIn`; signed out shows one muted line `APP.access.aiSignedOut` under the root-cause textarea.
8. **`CasePreview`** (`src/components/CasePreview.tsx`, S§5) mounted on `/case` (right column on `lg+`, below on small) and under the decode result (`DecodeClient.tsx` `ResultView`, after the triage panel) with the CTA `APP.access.casePreview.startCta` → `/case?kind=${result.kind}` and `startNote`. Use `nextBestActions(<the engine's initial state constant>)` — find it in `src/core/caseState.ts`; do not type a state name from memory.
9. Tests: `e2e/access.spec.ts` (new): signed out `/case?kind=POLICY` → type an answer at the first text step, Continue, reload → the case is still at the next step (draft persisted under the device key); walk the deterministic steps (dates, prior appeals) until the first file step → the sign-in gate is visible with a link to `/login?next=%2Fcase`; `/decode` with the sample → the preview heading is visible. Vitest: `CasePreview` renders the required/optional markers for `POLICY` (`@testing-library/react` is present if `VaultGate.idle.test.tsx` exists; otherwise a pure render test with `react-dom/server`).

**Accept.**
```
grep -n "/api/interview" src/components/InterviewFlow.tsx                    → 0 hits
grep -n "createCaseFile\|applyAnswer" src/components/InterviewFlow.tsx       → ≥ 2 hits
grep -n "initWithDeviceKey\|unlockWithDeviceKey\|relockWithPassphrase" src/components/InterviewFlow.tsx src/components/VaultGate.tsx → ≥ 3 hits
test -f src/components/SignInGate.tsx && test -f src/components/CasePreview.tsx → exist
grep -n "CasePreview" src/app/decode/DecodeClient.tsx "src/app/(app)/case/page.tsx" → ≥ 2 hits
grep -n "signInGate\|casePreview\|setPassphrase" src/content/app.ts          → ≥ 3 hits
npx playwright test e2e/access.spec.ts --project=chromium --reporter=dot 2>&1 | tail -3 → 0 failed
```
Commit: `feat(access/task-4): interview runs signed out on the client engine and saves every step under the browser key; sign-in gate at the first document step; passphrase re-lock on return; case preview on decode and case`

---

### Task A5 — Signed-out dashboard, AI suggestions on a free account (S§3.2, S§9)

**Do.**
1. `DashboardClient` props `{ license, signedIn }`. Signed out: open the vault in device mode (same helper as A4 — extract `openVaultForVisitor()` into `src/lib/vault/visitor.ts` so both components share it); if a case file exists render the **draft summary**: `CaseStateBadge`, `DeadlineChipList` from `timelineEvents` (when any), `ReadinessCard` (completeness copy unchanged), `nextBestActions`, `CasePreview caseFile`, and a `Button asChild` → `/login?next=/dashboard` `APP.access.keepCaseLink` plus `draftNote`; if none, `EmptyState` with `dashboardSignedOut.emptyTitle/emptyDesc` and buttons Decode (`/decode`), Start your case (`/case`), Sign in (`/login?next=/dashboard`). Signed in without a Pass: the **full** dashboard (no locked cards, no expectations card); the "Review your Plan of Action (POA)" button leads to `/compose` where the gate lives. Remove the `license.status !== "active"` locked-card branch.
2. `src/lib/ratelimit.ts`: `rateLimitExtractField(user)` — `Ratelimit.fixedWindow(20, "1 d")` keyed by `user.id`, same `null`-when-no-Upstash pattern, exported alongside the others. `/api/extract-field`: replace the `isLicenseActive` check with `getApiUser()` (401 when null) + the new limiter (`tooManyRequestsResponse` on failure) inside the existing breaker. Tests: `src/app/api/__tests__/extract-field-gate.test.ts` — 401 signed out; 429 when the injected limiter denies; no `isLicenseActive` import remains.
3. `e2e/access.spec.ts`: signed out `/dashboard` → the empty-state heading is visible; after the A4 walk, `/dashboard` shows the draft summary heading `APP.access.dashboardSignedOut.title`.

**Accept.**
```
grep -n "license.status !== \"active\"" src/components/DashboardClient.tsx  → 0 hits
grep -n "dashboardSignedOut" src/components/DashboardClient.tsx             → ≥ 3 hits
grep -n "isLicenseActive" src/app/api/extract-field/route.ts               → 0 hits
grep -n "rateLimitExtractField" src/lib/ratelimit.ts src/app/api/extract-field/route.ts → 2 hits
grep -n "fixedWindow(20" src/lib/ratelimit.ts                               → 1 hit
npm test 2>&1 | tail -4                                                    → ≥ previous + 2
```
Commit: `feat(access/task-5): signed-out dashboard shows the device draft or a teaching state; free accounts get the full dashboard; AI field suggestions need sign-in and a per-user daily cap instead of a license`

---

### Task A6 — Purchase continuity: completion event, license status, compose gate (S§6)

**Do.**
1. `src/app/api/license/status/route.ts` (GET): `getApiUser()` → `unauthorizedJsonResponse()`; else `fetchLicenseByEmail(user.email)` → `NextResponse.json({ status, plan }, { headers: { "Cache-Control": "no-store" } })`; `dynamic = "force-dynamic"`. Vitest gate test (401 / typed body with a mocked license); `e2e/app-gate.spec.ts` gains the 401 test.
2. `CheckoutButton`: props gain `onCompleted?: () => void` and `customerEmail?: string`; `Paddle.Initialize({ token, eventCallback })` routes `checkout.completed` to `onCompleted`; `Checkout.open({ items, customer: customerEmail ? { email: customerEmail } : undefined })`. Move the four hard-coded strings into `APP.checkout.*` (new small group: `opening`, `unavailableTitle`, `unavailableDesc`, `loadFailedTitle`, `loadFailedDesc`).
3. `src/components/ComposeGate.tsx` (client): `APP.access.composeGate.*`, the D8 consent row (extract the checkbox + label from `PurchasePanel` into `src/components/pricing/ConsentRow.tsx` and use it in both), `CheckoutButton size="lg" customerEmail onCompleted`; states `idle → activating → active | timeout`; `activating` polls `/api/license/status` every 3 s up to 90 s; `active` renders `<ComposeView />` in place; `timeout` shows `stillWaiting`, a **Check again** button (one more poll cycle) and a link to `/billing`. `compose/page.tsx`: `hasPass ? <ComposeView /> : <ComposeGate email={user.email} />`.
4. `PurchasePanel`: same completion handling; signed in (via `useSessionState`) → poll then `router.push("/compose")`; signed out → show `signInToActivate` with a link to `/login?next=/compose`.
5. Tests: vitest for the poll helper (`src/lib/licensePoll.ts`: resolves on `active`, rejects/timeouts after N tries — inject `fetch` and a fake timer); `e2e/app-gate.spec.ts` license/status 401.

**Accept.**
```
test -f src/app/api/license/status/route.ts && test -f src/components/ComposeGate.tsx && test -f src/components/pricing/ConsentRow.tsx → exist
grep -n "eventCallback\|checkout.completed\|customer:" src/components/CheckoutButton.tsx → ≥ 3 hits
grep -n "Opening Paddle\|Checkout unavailable\|Checkout failed to load" src/components/CheckoutButton.tsx → 0 hits (strings in content)
grep -n "ComposeGate" "src/app/(app)/compose/page.tsx"                      → ≥ 1 hit; grep -n "noPass" "src/app/(app)/compose/page.tsx" → 0
grep -n "license/status" src/components/ComposeGate.tsx src/lib/licensePoll.ts e2e/app-gate.spec.ts → ≥ 3 hits
npm test 2>&1 | tail -4                                                    → ≥ previous + 3
```
Commit: `feat(access/task-6): checkout completion event and customer email, license-status endpoint, compose gate with consent and an activation state that resumes into the draft; pricing purchase resumes the same way`

---

### Task A7 — Pricing table, FAQ, privacy paragraph, planning notes (S§7, S§8, S§10)

**Do.**
1. `PRICING.tableHeadings.account`, per-row `account` values and the four new rows exactly as S§7; `pricing/page.tsx` renders four `TableCell`s per row (feature / free / account / pass); `e2e/marketing.spec.ts:26–27` → `getByRole("columnheader", { name: "Free", exact: true })`, `{ name: "Free account", exact: true }`, `{ name: "Appeal Pass", exact: true }`.
2. FAQ item and Pricing-group entry as S§8; `faqByGroup()` unchanged.
3. `src/content/legal.ts` privacy `what-we-collect`: append the S§8 paragraph (banner box: use as written unless the founder edited it in the spec).
4. `Planning/03-PHASE-2-BUILD/05-CASE-OS-SPEC.md` §5 line about the free tier: append "— **Amended by AM-21 (10 Sep 2026):** the signed-out tier reaches only `decode`; a free account additionally reaches `extract-field` under a per-user daily cap." (append, do not rewrite). `src/content/README.md`: mention the `access` group and `SHARED.nav`.

**Accept.**
```
grep -n "account:" src/content/marketing.ts                                → ≥ 13 hits (heading + 12 rows)
grep -n "What is free, and what needs an account" src/content/marketing.ts → 2 hits (item + group)
grep -n "exact: true" e2e/marketing.spec.ts                               → ≥ 3 hits
grep -n "key your browser holds" src/content/legal.ts                      → 1 hit
grep -n "Amended by AM-21" Planning/03-PHASE-2-BUILD/05-CASE-OS-SPEC.md    → 1 hit
npm run lint:copy 2>&1 | tail -2; npx playwright test e2e/marketing.spec.ts --project=chromium --reporter=dot 2>&1 | tail -3 → PASS; 0 failed
```
Commit: `feat(access/task-7): three-column pricing table, FAQ entry on what is free, privacy paragraph on the browser-held key, Case OS free-tier line amended`

---

### Task A8 — Proof, docs, ticks

**Do.**
1. Full §5 gate block; paste each proving line into the evidence log (exit codes). Playwright: whole chromium project, 0 failed. Lighthouse: direct `npx lighthouse` runs on `/`, `/pricing`, `/case`, `/dashboard`, `/vault` (signed out) — a11y 1.0 expected on the first two; record the others.
2. Screenshots (S§11 item 9) via `MSYS_NO_PATHCONV=1 SCREENSHOT_OUT=docs/handoffs/screenshots/2026-09-<DD>-access SCREENSHOT_ROUTES="/,/pricing,/case?kind=POLICY,/dashboard,/vault" npx playwright test --project=screenshots`; the sign-in-gate and decoded-sample states need a small addition to `e2e/screenshots.spec.ts` (walk the steps / load the sample before capturing) — add it behind `SCREENSHOT_FLOWS=1`.
3. `02-BUILD-PLAN-AMENDMENTS.md`: tick AA-33 with the A7 hash. `CLAUDE.md` §4: one DONE bullet listing A1–A8 by hash from `git log`. Evidence log: Resume pointer `done`, Discovered and Deviations filled ("none" if empty), the S§11 checklist with one row per item. `docs/handoffs/SESSION-START-PROMPT.md`: PATH lines → `docs/handoffs/2026-09-09-visual-refresh-prompt.md` and `docs/handoffs/2026-09-09-visual-refresh.md`; History line.

**Accept.** Every A1–A7 Accept line has an evidence row with a real hash; S§11 items 1–9 each have a row; §5 green or explicitly NOT RUN; the final chat message is generated per §0.B rule 5.

Commit: `docs(access/task-8): evidence log complete, AA-33 ticked, screenshots listed, CLAUDE.md state, session-start prompt repointed at the visual pass`

---

## 4. SELF-CHECK BEFORE EACH COMMIT

§4 of the polish prompt + `git cat-file -t` on every hash you write + `git ls-files --eol <changed>` shows `w/lf` + rule 0.C.3 re-read for any task that adds a gate.

## 5. FINAL GATES

`npm run typecheck` · `npm run lint` 0 warnings · `npm run lint:copy` PASS (5 passes) · `npm run format:check` exit 0 · `npm run build` routes ≥ 31 (the new `/api/license/status`) · `npm test` ≥ 309 + the new tests named above · `npx playwright test --project=chromium` 0 failed · Lighthouse as A8 · `grep -rn "localStorage\|sessionStorage" src` → tests only · `grep -rn "noPass" src` → 0 · `grep -rn "guarantee" src` → critic pattern and tests only · `grep -rli superpower src e2e scripts` → 0 · the S§2 rule stated per gate in the evidence log (what is saved before it asks, the return path, the resume).

## 6. AFTER THE PASS (surface, do not perform)

Founder: signs off the screenshots; runs the signed-in flows once with a real account (sign in at the gate → passphrase → continue; sandbox checkout → activation → draft); decides whether to push `master`; then starts the visual refresh v3 pass from `SESSION-START-PROMPT.md`.

## 7. FOUNDER-GATED (never do these yourself)

`FOUNDER_NOTE` stays `null`. No edits under `Planning/07-REFERENCE/`. No Amazon policy text authored from memory. No Paddle dashboard, webhook or price changes. No `legal/*.md` edits (the privacy paragraph goes into `src/content/legal.ts` only, as the spec says). Nothing from the visual pass's material (tokens, primitives, shells).

---

## Appendix A — anchors at `7bd3e4e` (grep first)

| File | Line(s) | Grep pattern | Task |
|---|---|---|---|
| `src/components/AppHeader.tsx` | 12–23 (nav arrays), 36–51 (`NavLink`), 58–95 (render) | `MARKETING_NAV\|function NavLink` | A1 |
| `src/components/AppShell.tsx` | 7–13 (props) | `user: { email` | A1 |
| `src/app/(app)/layout.tsx` | 18–27 | `mode="marketing"` | A1 |
| `src/lib/auth.ts` | 29–45 | `export async function requireUser` | A2 |
| `src/app/(app)/auth/callback/route.ts` | 4–21 | `function safeNext` | A2 |
| `src/app/(app)/login/page.tsx` | 77–81, 92–100, 111–114 | `signInWithOtp\|window.location.href\|signInWithOAuth` | A2 |
| `src/app/(app)/signup/page.tsx` | 75, 85, 101–104 | same | A2 |
| `src/app/(app)/case/page.tsx` | 13–16, 25–36 | `hasPass` | A2, A4 |
| `src/app/(app)/dashboard/page.tsx` | 15–16, 26 | `fetchLicenseByEmail` | A2, A5 |
| `src/app/(app)/vault/page.tsx` | 12–34 | `noPassTitle` | A2 |
| `src/app/(app)/compose/page.tsx` | 13–46 | `APP.compose.noPass` | A2, A6 |
| `src/app/(app)/billing/page.tsx` | 14 | `requireUser()` | A2 |
| `e2e/app-gate.spec.ts` · `e2e/a11y.spec.ts` | 4–32 · "Auth gate" block | `redirects to /login` | A2, A6 |
| `src/core/vault/envelope.ts` | 31–33 | `export type KeyMode` | A3 |
| `src/core/vault/schema.ts` | 22–28 | `interface VaultKeyStore` | A3 |
| `src/core/vault/crypto.ts` | 276–320 | `export async function wrapDek` | A3 |
| `src/core/vault/vault.ts` | 77–95, 97–172 | `async status\|initWithPassphrase\|changePassphrase` | A3 |
| `src/components/VaultGate.tsx` | 19–20 (phases), 95–105 (`isInitialized`), 219 (`initWithPassphrase`), 308 (`unlock`) | `needs_init` | A4 |
| `src/components/InterviewFlow.tsx` | 132–135 (props), 173–211 (vault init), 222–236 (persist), 250–270 (`callApi`), 272–346 (start/submit), 348–380 (resume), 420–443 (gate), 445+ (kind chooser), 714–716 (`FieldSuggester`), 735–746 (file step) | `callApi\|persistCaseFile\|FieldSuggester` | A4 |
| `src/app/decode/DecodeClient.tsx` | `ResultView` 236–345 (triage panel, CTA card ~330–345) | `guidance.triage.doNot\|Get the Appeal Pass` | A4 |
| `src/core/caseState.ts` | 98–160 | `export function nextBestActions` | A4, A5 |
| `src/core/evidenceModel.ts` | 193–205 | `export function requirementsFor` | A4 |
| `src/components/DashboardClient.tsx` | 220–270 (no-pass branch), 273–284 (`VaultGate`), 286–299 (no case) | `license.status !== "active"` | A5 |
| `src/lib/ratelimit.ts` | 12–14, 20–35 (limiter pattern), 75–95 (exports) | `getComposeLimiter` | A5 |
| `src/app/api/extract-field/route.ts` | 134–145 | `isLicenseActive` | A5 |
| `src/components/CheckoutButton.tsx` | 24–36 (props), 48–53 (`Initialize`), 80–91 (`open`), 73–75, 84–89 (strings) | `Paddle.Initialize\|Checkout.open` | A6 |
| `src/components/pricing/PurchasePanel.tsx` | 19–45 | `eu-consent` | A6, A7 |
| `src/lib/license.ts` | 12–36 | `fetchLicenseByEmail` | A6 |
| `src/app/pricing/page.tsx` | 54–76 | `PRICING.rows` | A7 |
| `src/content/marketing.ts` | 70–92 (`tableHeadings`, `rows`), 125–180 (FAQ) | `tableHeadings` | A7 |
| `src/content/legal.ts` | 29–37 | `id: "what-we-collect"` | A7 |
| `e2e/marketing.spec.ts` | 26–27 | `columnheader` | A7 |
| `e2e/screenshots.spec.ts` | 5–12 | `SCREENSHOT_OUT` | A8 |

## Appendix B — parked (not this pass)

The visual pass's material (S§1–S§7 of the visual spec); server-side drafts; account deletion / export flows; passphrase recovery (there is none by design); per-case licence keys; Guardian subscription (D7); anything in the visual spec's S§13.
