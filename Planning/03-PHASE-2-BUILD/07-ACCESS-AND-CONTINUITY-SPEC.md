# 07 — Access ladder and continuity (AM-21) — design authority

Written 10 Sep 2026 by the reviewing AI from the founder's direction given in chat the same day. Implemented by `docs/handoffs/2026-09-10-access-continuity-prompt.md` (Tasks A1–A8); evidence `docs/handoffs/2026-09-10-access-continuity.md`; plain-language version `docs/handoffs/2026-09-10-access-continuity-plain-guide.md`. Runs **before** the visual refresh v3 pass (`docs/handoffs/2026-09-09-visual-refresh-prompt.md`), which was updated on 10 Sep to build on this spec.

## 0. The founder's direction (10 Sep 2026, verbatim in substance)

1. A new visitor must see the whole product, not "a basic decoder and a money drawer". Everything is visible in the header; what needs sign-in or the Appeal Pass is shown locked or disabled, never hidden.
2. The guided interview starts with **no account**. The moment it asks for a document or shows the actions the seller must take, it asks the seller to **sign in**. When the seller reaches the finalisation (the drafted Plan of Action), it asks for the **Appeal Pass**.
3. **Nothing entered is ever lost** at sign-in or at purchase, for every sign-in method. Work is saved first, the gate comes second, and the seller resumes exactly where they were. This is the norm for every gate in the product.
4. Keep email + password **and** Google sign-in (magic link stays too).
5. AI field suggestions are enabled once the seller is signed in (free account), under a cap.

Everything below is the exact shape of that direction against the code at commit `7bd3e4e`.

## 1. The three steps

| Step | Who | What the seller gets | Where it runs / what it costs us |
|---|---|---|---|
| **T0 · No account** | Anyone | Decode; deadlines; do-now / do-not triage; the **case preview** (the evidence this notice type will need and the action checklist); the guided interview **up to the first document or action step**, saved on the device as they go; the dashboard showing that draft; Pricing; FAQ; legal pages | Browser only. Rules engine in the client. Nothing stored on our servers. |
| **T1 · Free account** | Signed in | Everything in T0 plus: the passphrase-protected vault; document uploads; the rest of the interview (declines and honest alternatives, readiness as "case-file completeness"); dashboard with next actions; save and resume; **AI field suggestions** under a per-user daily cap | Auth row on Supabase; AI calls behind the existing daily spend cap and circuit breaker plus a per-user cap. Vault stays on the device. |
| **T2 · Appeal Pass ($199, one case)** | Licensed | The composer: gap or full draft, critic review, before-you-submit checklist, copy and print; Amazon-reply analysis; cloud vault sync and up to 5 devices; 7-day refund | LLM drafting and the deliverable. Unchanged from today. |

Severity gating does not move: gated notice types are never sold at any step (D6). Nothing in D1–D10 is reopened; D10's funnel ("decode → intake started → purchase") finally has its middle step in front of the seller.

## 2. The three gates — exactly where they fall

The interview engine (`src/core/interviewEngine.ts` → `nextStep`) asks, in order: notice type → what happened (free text) → key dates → prior appeals → then one **action/evidence step per required document** (`inputType: "file"`, `kind: "evidence_ask"`), then the completion step.

| Gate | Trigger in code | What the seller sees |
|---|---|---|
| **Sign in** | Signed out and `nextStep(file).inputType === "file"` (the first evidence/action step) | The step card is replaced by the **sign-in gate panel**: "Save your case to continue", one sentence on why (documents are encrypted with a passphrase only you know), "Sign in" and "Create an account" buttons carrying `?next=/case`, and a quiet line "Saved on this device". The case preview stays visible beside it. |
| **Passphrase** | Signed in and the vault is in **device-key mode** (see §4) | The existing vault create form with a new title ("Set a passphrase to keep your case"), the passphrase-loss warning, then `relockWithPassphrase`. The interview resumes at the saved step without a "resume?" dialog. |
| **Appeal Pass** | `/compose` while signed in without an active license | The **compose gate card**: what the Pass adds to *this* saved case, the price, the EU-withdrawal consent (D8), the checkout button (overlay), and after checkout the **activation state** (§6). Signed out on `/compose` → `/login?next=/compose`. |

Rule: **every gate saves before it asks** (the draft is already in the vault when the gate renders), **every redirect carries a return path**, and **every waiting state names what is saved**.

## 3. Header and signed-out pages

### 3.1 Header (both states, five slots)

| State | Left | Nav | Right |
|---|---|---|---|
| Signed out | Logo → `/` | Decode · Case · Dashboard · Vault 🔒 · Pricing | theme toggle · **Sign in** (ghost, `href="/login?next=<current path>"` on app routes, `/login` elsewhere) |
| Signed in | Logo → `/dashboard` | Decode · Case · Dashboard · Vault · Billing | theme toggle · sign out |

- The lock glyph (`Lock`, `size-3.5`) sits after "Vault" only when signed out, with a tooltip `SHARED.nav.lockedHint` ("Sign in to unlock"). Case and Dashboard carry no lock: they work signed out and carry their gate inside.
- Compose is never a header item. FAQ lives in the footer and on the pricing page. Billing appears only when signed in.
- Labels come from `SHARED.nav.*` (keys listed in §8; the visual pass restyles the header and reuses these keys).
- Mobile: the `Sheet` mirrors the list; "Sign in" is a full-width outline button at the bottom when signed out.
- Marketing pages are static. The header there renders the signed-out variant on the server; a small client effect (`supabase.auth.getSession()`) swaps the right cluster (Sign in → sign out, Pricing → Billing) after mount. The five nav slots are identical in both states, so nothing shifts.
- This supersedes the "no new nav item" rule of spec 06 §1.1 and of the visual prompt §2 for the header only; the founder decided the header on 10 Sep 2026 (AM-21). The other §1.1 rules (one primary action per screen, ≤ 3 cards above the fold) stand.

### 3.2 What each page shows when signed out

| Route | Signed out | Notes |
|---|---|---|
| `/decode` | Unchanged, plus under the result: **`CasePreview`** for the decoded kind (§5) and the CTA "Start your case — free" → `/case?kind=<KIND>` | The preview renders engine output only; no storage. |
| `/case` | The interview starts at once (kind pre-filled from `?kind=`); the case preview beside/below it; a quiet "Sign in to keep your case" link from step one; the sign-in gate at the first document step | Vault in device-key mode, created silently on first save. |
| `/dashboard` | If a device-mode vault holds a case file: its summary (state badge, deadlines from the timeline, readiness as completeness, next actions) with "Sign in to keep your case". Otherwise the teaching state: "No case on this device yet" with Decode / Start your case / Sign in | Reads the same vault the interview writes. |
| `/vault` | Teaching state: what the vault is, how it is encrypted (existing copy), "Sign in to unlock" → `/login?next=/vault`, "Back to your case" | Never a redirect. |
| `/compose` | Redirect to `/login?next=/compose` | Finalisation needs an account and the Pass. |
| `/billing` | Redirect to `/login?next=/billing` (unchanged) | Hidden from the signed-out header. |
| `/pricing` | Three-column table (§7) | |

### 3.3 Pages when signed in without a Pass

Dashboard, Case and Vault work in full (T1). The old "Appeal Pass required" cards on those three pages are removed. Compose shows the compose gate card (§6). Billing shows "No active plan" with the checkout (existing) and gains the same completion handling.

## 4. Storage: one vault, two ways to hold its master key

Today (`src/core/vault/vault.ts`): one random data-encryption key (DEK) encrypts every record; the DEK is **wrapped** under a key-encryption key derived from the passphrase (PBKDF2-SHA-256, 310 000 iterations) and stored in the `meta` row (`KeyMode.kind: "passphrase" | "wrapped"`, `wrappedDek`). `changePassphrase()` already re-wraps the DEK without touching records. The design below adds a second way to wrap the same DEK.

### 4.1 Device-key mode (before the seller has a passphrase)

- `KeyMode` gains `{ kind: "device"; verifiedAt: string }`.
- `VaultKeyStore` gains `deviceKey?: CryptoKey` (AES-GCM-256, `extractable: false`, usages `["encrypt", "decrypt"]`, generated by `subtle.generateKey`, persisted in IndexedDB by structured clone) and `deviceWrappedDek?: EncryptionEnvelope` (the DEK wrapped under the device key). `wrappedDek` / `kdf` stay for passphrase mode.
- `Vault.initWithDeviceKey()`: generate DEK + device key, wrap, write meta `{ mode: device }`, hold the DEK. `Vault.unlockWithDeviceKey()`: read meta, unwrap with the stored device key, hold the DEK. Both are silent (no UI).
- `Vault.relockWithPassphrase(passphrase)`: requires mode `device`; obtains the DEK (in memory, or by unwrapping with the device key); wraps it under the passphrase (`wrapDek`), writes `{ mode: passphrase, kdf, wrappedDek }`, **deletes** `deviceKey` and `deviceWrappedDek`. Records are untouched. Minimum 8 characters as today.
- `status()` reports `{ state: "locked", mode: "device" }` so callers can auto-unlock.
- Everything else (`add`, `list`, `findByPlaintext`, `lock`, `changePassphrase`, sync) is unchanged.

### 4.2 Who uses which mode

| Situation | Behaviour |
|---|---|
| Signed out, no vault | First save → `initWithDeviceKey()` silently |
| Signed out, vault in device mode | `unlockWithDeviceKey()` silently |
| Signed out, vault in passphrase mode (someone signed out on a device that already has a real vault) | The existing unlock form |
| Signed in, vault in device mode | The passphrase gate (§2) → `relockWithPassphrase` → continue |
| Signed in, no vault | Existing create form (today's behaviour) |
| Signed in, vault in passphrase mode | Existing unlock form |

Cloud sync (`pushVaultToCloud`) stays Pass-only and requires passphrase mode; a device-mode vault is never uploaded.

### 4.3 Security posture, stated honestly

- Data at rest is AES-GCM-256 ciphertext in IndexedDB in both modes. In device mode the key material cannot be read by page scripts (non-extractable), only used; the browser profile is the boundary. This protects against casual inspection and other sites; it does **not** protect against someone with full access to the unlocked browser profile — neither does a signed-in session. The passphrase mode restores the stronger property the vault has today.
- Nothing is stored in `localStorage` or `sessionStorage`. Spec 06 §14's rejection of plaintext browser storage stands.
- **Disclosed boundary (privacy page, one paragraph):** clearing browser data before sign-in deletes the draft; there is no server copy by design. After sign-in and a Pass, cloud sync holds an encrypted copy recoverable with the passphrase.
- The test suite runs on `fake-indexeddb`; if it cannot structured-clone a `CryptoKey`, the device key store is injected (in-memory implementation in tests, IndexedDB in the browser) and the browser path is covered by a Playwright test on `/case` (signed out: answer step 1, reload, the answer is still there).

## 5. Case preview (engine output, read-only)

`src/components/CasePreview.tsx` (client, no storage): props `kind: ViolationKind`, `caseFile?: CaseFile`.

- "Evidence Amazon will ask for": `requirementsFor(kind)` → each requirement's label (`APP.evidenceKinds[kind]`), a **Required / Optional** marker, and `whyAmazonWantsIt` as the description. When `caseFile` is given, slots already present show `EvidenceStatusBadge status="present"`.
- "What happens next": `nextBestActions(state)` from `src/core/caseState.ts`, with `state` = the case file's state when given, else the state a freshly decoded case starts in (use the constant the engine exports; do not invent a state name).
- Deadlines: only when `caseFile.timelineEvents` has dates (`DeadlineChipList`); the decode page keeps its own deadlines from the decode result.
- Mounted on: the decode result (below the triage, with the "Start your case — free" CTA), `/case` (beside the interview on `lg+`, below it on small screens), and the signed-out dashboard draft summary.
- Readiness anywhere in this spec is rendered only as **case-file completeness**, never as a prediction (AM-16).

## 6. Purchase continuity

Today `CheckoutButton` opens the Paddle overlay and nothing listens for completion; the browser cannot ask whether the license is active. Changes:

1. **Completion event.** `Paddle.Initialize({ token, eventCallback })`; on `checkout.completed` call the button's `onCompleted` prop. Pass `customer: { email }` to `Checkout.open` when the seller is signed in, so the webhook's email matches the account.
2. **License status endpoint.** `GET /api/license/status` → `401 { error: "Unauthorized" }` when signed out, else `{ status, plan }` from `fetchLicenseByEmail`. `dynamic = "force-dynamic"`, `Cache-Control: no-store`. The webhook stays the only writer of license state.
3. **Compose gate card (`src/components/ComposeGate.tsx`, client).** Title "Unlock the drafted plan", one sentence on what the Pass adds to this saved case, the price line, the D8 consent row (reuse `PurchasePanel`'s checkbox and `LEGAL.consent.*`), `CheckoutButton` (disabled until consent, as on pricing). On completion: the **activating state** ("Activating your Appeal Pass. Your case is saved.") polling `/api/license/status` every 3 s for up to 90 s; when `status === "active"` render `ComposeView` in place. On timeout: "Your payment went through but the activation has not arrived yet." with a **Check again** button and a link to Billing. Never a dead end.
4. **Pricing page.** `PurchasePanel` uses the same completion handling: signed in → poll, then `router.push("/compose")`; signed out → the note "Sign in with the email you used at checkout to activate your Appeal Pass." with a link to `/login?next=/compose`.
5. **Vault relocked during checkout.** The idle lock may fire while the overlay is open; the compose page already renders `VaultGate`, so the unlock prompt appears in place and the flow continues.

## 7. Pricing table and FAQ

Columns: **Free** · **Free account** · **Appeal Pass** (the e2e test that asserts the column headers changes to exact matches). Rows and values:

| Row (key) | Free | Free account | Appeal Pass |
|---|---|---|---|
| Plain-English decode (`decode`) | Yes | Yes | Yes |
| Deadlines and a do-now / do-not list (`plainEnglish`) | Yes | Yes | Yes |
| Case preview: evidence list and action checklist (`preview`, new) | Yes | Yes | Yes |
| Guided interview (`interview`) | First steps | Yes | Yes |
| Document uploads in the encrypted vault (`vault`) | — | Yes | Yes |
| Case dashboard and readiness (`readiness`, new) | Draft only | Yes | Yes |
| AI field suggestions (`aiSuggest`, new) | — | Yes, daily cap | Yes |
| Drafted Plan of Action (`poa`) | — | — | Yes |
| Critic review (`critic`) | — | — | Yes |
| Amazon-reply analysis (`replyAnalysis`, new) | — | — | Yes |
| Cloud sync, up to 5 devices (`devices`) | — | — | Yes |
| 7-day refund (`refund`) | — | — | Yes |

FAQ: one new item in the **Pricing** group, "What is free, and what needs an account?" (text in §8). The visual pass's copy deck §4.4/§4.5 was updated on 10 Sep to carry these rows and this item, so V10 does not undo them.

## 8. Strings (verbatim; every one passes `lint-copy`; no exclamation marks)

`src/content/shared.ts`
```ts
nav: {
  primary: "Primary",
  decode: "Decode",
  case: "Case",
  dashboard: "Dashboard",
  vault: "Vault",
  pricing: "Pricing",
  billing: "Billing",
  faq: "FAQ",
  signIn: "Sign in",
  signOut: "Sign out",
  menu: "Menu",
  openMenu: "Open menu",
  themeToggle: "Toggle colour theme",
  lockedHint: "Sign in to unlock",
},
```
`src/content/app.ts` — new group `access`
```ts
access: {
  signInGate: {
    title: "Save your case to continue",
    body: "Your answers so far are saved on this device. From here the interview asks for documents, which are encrypted with a passphrase only you know. Sign in to set it and keep your case.",
    signIn: "Sign in",
    createAccount: "Create an account",
    savedNote: "Saved on this device",
  },
  setPassphrase: {
    title: "Set a passphrase to keep your case",
    body: "Your case has been saved on this device so far. Choose the passphrase that protects it from now on. Documents you add are encrypted with it.",
  },
  keepCaseLink: "Sign in to keep your case",
  dashboardSignedOut: {
    title: "Your case, at a glance",
    draftNote: "This draft is saved on this device only. Sign in to keep it and continue.",
    emptyTitle: "No case on this device yet",
    emptyDesc: "Decode a notice, then start your case. Everything you enter is saved on this device as you go.",
    decode: "Decode a notice",
    start: "Start your case",
  },
  vaultSignedOut: {
    title: "Your encrypted evidence vault",
    desc: "The vault stores your supplier invoices, brand authorizations and other case documents encrypted on your device (AES-GCM, key derived from a passphrase you set — we never see it). It opens once you sign in.",
    cta: "Sign in to unlock",
    back: "Back to your case",
  },
  casePreview: {
    title: "What this case will need",
    evidenceTitle: "Evidence Amazon will ask for",
    actionsTitle: "What happens next",
    required: "Required",
    optional: "Optional",
    startCta: "Start your case — free",
    startNote: "Saved on this device as you go. Sign in when the interview reaches your documents.",
  },
  composeGate: {
    title: "Unlock the drafted plan",
    body: "Your case file is saved. The Appeal Pass drafts the Plan of Action from it, reviews the draft with the critic, and adds cloud sync for your vault.",
    price: "$199, once, for this case",
    activating: "Activating your Appeal Pass. Your case is saved.",
    activatingHint: "This usually takes a few seconds after checkout.",
    stillWaiting: "Your payment went through but the activation has not arrived yet. Check again in a moment, or open Billing.",
    checkAgain: "Check again",
    signInToActivate: "Sign in with the email you used at checkout to activate your Appeal Pass.",
  },
  aiSignedOut: "Sign in to enable field suggestions.",
},
```
`src/content/auth.ts`: `login.subtitleContinue` and `signup.subtitleContinue` = "Your answers are saved on this device. Sign in to keep them and continue." (shown when `next` is `/case`; the h1 texts pinned by the a11y tests do not change).

`src/content/marketing.ts` — `PRICING.tableHeadings` gains `account: "Free account"`; each row gains an `account` value (§7); new rows `preview`, `readiness`, `aiSuggest`, `replyAnalysis` with the features named in §7. FAQ item: **Q** "What is free, and what needs an account?" **A** "Decoding, deadlines, the do-now list and the first interview steps are free with no account, saved on this device. Sign in, still free, to add documents to your encrypted vault, see how complete your case file is and use AI field suggestions. The Appeal Pass drafts and reviews the Plan of Action and adds cloud sync." Group: Pricing.

`src/content/legal.ts` — privacy, section `what-we-collect`, one added paragraph (founder may edit before Task A7): "Before you sign in, anything you enter in the guided interview is encrypted on your device with a key your browser holds; it does not reach our servers. When you sign in and set a passphrase, the same records are re-locked under that passphrase. Clearing your browser data before you sign in deletes that draft; there is no copy anywhere else."

Removed keys (with the code that used them): `APP.case.noPass.*`, `APP.vault.noPassTitle/noPassDesc/noPassCta/noPassBack`, `APP.compose.noPass.*` (replaced by `access.composeGate`), `APP.dashboard.noPass.*` and `noPassCard.*` (the signed-in dashboard no longer has a no-pass branch).

## 9. AI field suggestions on a free account

- `/api/extract-field`: replace the license gate with **signed in** + a per-user daily cap (`Ratelimit.fixedWindow(20, "1 d")`, keyed by user id, in `src/lib/ratelimit.ts` next to the existing limiters) + the existing Gemini breaker and daily spend cap. `429` with the existing too-many-requests shape when the cap is hit.
- `FieldSuggester` receives `enabled` from the interview: hidden when signed out; when the cap is hit it shows the existing rules-only state.
- `/api/compose` and `/api/analyze-reply` keep the license gate. The Case OS spec's line "the free tier can reach exactly one route: decode" becomes "the signed-out tier reaches only decode; a free account additionally reaches extract-field under a per-user daily cap" (AM-21 records this).

## 10. Planning consequences (recorded in AM-21)

- **AM-17 / 05-CASE-OS-SPEC §5:** free-tier route rule amended as in §9.
- **AM-18 / spec 06 §113 pricing table:** superseded by §7.
- **Spec 06 §1.1 / visual prompt §2:** "no new nav item" superseded by §3.1 for the header; the rest of §1.1 stands.
- **Build plan v1.0 line 454** ("1 intake preview (first 3 questions)"): realised as "the interview up to the first document step, saved on the device", which is the same boundary the engine draws.
- **Visual refresh v3** (AM-20, pending V0): its prompt, spec, copy deck and evidence log were updated on 10 Sep to start after this pass and to build on `SHARED.nav.*`, the signed-out states and the three-column table.

## 11. Acceptance — what must be provable before "done"

1. Signed out: `/case` answers step 1, reload, the answer is still there (Playwright, real Chromium, no login).
2. Signed out: `/case` reaches the first `file` step and shows the sign-in gate; `/dashboard` shows the draft summary; `/vault` shows the teaching state; `/compose` redirects to `/login?next=%2Fcompose`; `/billing` redirects with `next`.
3. Header: five slots in both states; lock only on Vault when signed out; Billing only when signed in.
4. Vault unit tests: device init → add → lock → device unlock → read; relock → passphrase unlock reads the same record; device key gone after relock; wrong passphrase fails; `status()` reports `mode: "device"`.
5. `GET /api/license/status` → 401 signed out (Playwright API test), typed JSON signed in (vitest with a mocked license).
6. `POST /api/extract-field` → 401 signed out; 429 after the daily cap (vitest with a fake limiter); no license check remains in that route.
7. Pricing: three `columnheader`s; the FAQ item renders in the Pricing group.
8. All gates green: typecheck · lint · lint:copy (5 passes) · format:check · vitest ≥ 309 + new tests · build ≥ 30 routes · Playwright 0 failed · Lighthouse 1.0 a11y on `/` and `/pricing` (the `/decode` 0.96 is pre-existing and belongs to the visual pass).
9. Screenshots at 375/1280, light + dark, signed out: `/`, `/decode` with the sample decoded (preview visible), `/case` at step 1, `/case` at the sign-in gate, `/dashboard`, `/vault`, `/pricing`.

## 12. Not in this pass

Any visual restyle (tokens, primitives, shell layout — the visual pass); a server-side draft or any storage of case data on our servers; Google-only sign-in; SP-API, chat, or anything AM-17 rejected; changes to severity gating; per-case licensing changes; Paddle configuration or MoR changes (D2); new dependencies.

## 13. AM-21 (appended to `02-BUILD-PLAN-AMENDMENTS.md` on 10 Sep 2026)

See `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` → AM-21 (AA-33, AA-34).
