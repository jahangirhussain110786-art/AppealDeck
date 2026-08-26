# APPEALDECK — MASTER BUILD PLAN

**Version 1.0 · 24 Aug 2026 · Hawlton Alliance**
**Audience: an AI coding assistant with file access to `V:\Extension 2.3` and a terminal.**
**Product: Chrome MV3 extension that decodes Amazon seller deactivation notices, classifies the violation, drafts a policy-correct Plan of Action (POA), tracks appeal deadlines, and keeps an encrypted local case vault. Free notice decoder → $199 one-time "Appeal Pass" → $29/mo "Account Health Guardian".**

---

## §0 HOW TO EXECUTE THIS DOCUMENT

1. Read §1–§7 fully before writing any code. §2 (Prerequisites) must be 100% complete before Milestone 1 begins.
2. Build in the milestone order of §15. Each milestone has acceptance criteria — do not proceed to the next milestone until all criteria pass.
3. The reuse map in §6 names exact donor files in `V:\Extension 2.3`. **Copy only the files listed there.** The forbidden-source list in §2.6 is absolute — never copy, reference, or adapt anything from those paths.
4. Every module spec in §10 has: purpose → donor code → new code → public API → acceptance criteria. Implement to the spec; where the spec is silent, prefer the simplest local-first solution.
5. Conventions: TypeScript strict everywhere (including service worker and content scripts), all cross-context messages typed and prefixed `AD_` (§10-M0), no `any` without a `// TODO(any):` comment, no console.log in shipped code (use the logger in §10-M13).
6. When an external fact in this document might have drifted (Chrome API shape, Amazon page layout), verify against live docs before implementing — §7 and §11 flag the volatile spots explicitly.

---

## §1 PRODUCT DEFINITION

### 1.1 What it is
AppealDeck is a Chrome extension for Amazon sellers whose account or listing has been deactivated/suspended. In the seller's panic moment it:

1. **Decodes** the deactivation notice (from the Seller Central Performance Notifications page, the Account Health page, or pasted text) — names the enforcement type, severity, money-at-risk status (funds hold), and what Amazon expects in the appeal. **This tier is free** and is the trust hook.
2. **Interviews** the seller with a violation-specific intake wizard (root cause facts, evidence available, timeline).
3. **Drafts** a Plan of Action in Amazon's exact expected format (Root Cause → Corrective Actions → Preventive Measures), grounded in the actual notice text and the intake answers — never generic. Runs an adversarial self-critique pass ("would Amazon reject this?") before showing the draft. **Paid: $199 one-time Appeal Pass per case** (unlimited redrafts for that case).
4. **Tracks** the appeal clock, funds-review windows, and escalation ladder with alarms and notifications.
5. **Keeps** every notice, draft, submission, and piece of evidence in an encrypted, local-first case vault (exportable).
6. **Monitors** (subscription tier, $29/mo): watches the Account Health dashboard for new violations/warnings and drafts responses before they escalate to deactivation.

### 1.2 Who buys, and why now
- Buyer: Amazon sellers (FBA/FBM), from side-hustle to 8-figure. They already pay $500–$3,000 per reinstatement case to consultants/lawyers (verified: AMZ Sellers Attorney $1,500 flat / $2,300 IP or related-account; My Amazon Guy $1,000–$2,000; Rosenbaum Famularo ~$3,000/case; Riverbend ~$500/mo prevention retainers).
- They are the most extension-habituated buyers on the web (Helium 10, Keepa, Jungle Scout all run content scripts on Seller Central — precedent established).
- Zero dedicated appeal-drafting extensions exist on the Chrome Web Store (verified Aug 2026).

### 1.3 Positioning and hard rules (legal/ethical spine — bake into all copy and code)
- **Document preparation and case management. NEVER legal advice, NEVER "guaranteed reinstatement".** The word "guarantee" must not appear anywhere in UI, store listing, or generated documents.
- Show honest expectations in-product: most first appeals fail even with $3,000 lawyers; quality + completeness improves odds, nothing ensures them.
- Route hopeless case types (forged-document allegations, fraud, child-safety) to a visible "get a professional" screen with an attorney-referral note instead of selling an Appeal Pass. See §10-M3 severity gating.
- **Read-only on Seller Central.** The extension never clicks, submits, or automates anything in Seller Central. It reads notice text and (only on explicit user command) writes the finished POA into the appeal textarea for the user to review and submit **themselves**.

### 1.4 Non-goals (v1)
No multi-platform (Google Ads / Meta come later as separate products), no team accounts, no cloud sync of case content (local-first; sync is opt-in P2), no mobile, no auto-submission of appeals (never), no marketplace beyond notices in English (DE/FR locales P2).

---

## §2 PREREQUISITES — COMPLETE ALL BEFORE ANY CODE

### 2.1 Security actions (DO FIRST — independent of this project)
| # | Action | Detail |
|---|---|---|
| P-1 | **Rotate the leaked Postgres password** | Plaintext in `V:\Extension 2.3\list-tables.js:4`, `V:\Extension 2.3\extraction\run-migration.mjs:4`, `V:\Extension 2.3\extraction\.env.local`, and `V:\Extension 2.3\dist\extraction\.env.local`. Rotate in the Supabase dashboard (Settings → Database), then delete/scrub those files. |
| P-2 | **Rotate the Supabase anon JWT + service keys** | Hardcoded in `V:\Extension 2.3\extraction\seed-templates.mjs:2` and `.env.local`. Regenerate in Supabase dashboard (Settings → API). |
| P-3 | **Never commit secrets** | The new repo gets `.gitignore` with `.env*`, and the build script must never copy `.env*` into any output (the old `build.js` bug). |

### 2.2 Accounts & services (human owner sets these up; assistant integrates)
| # | Service | Purpose | Notes |
|---|---|---|---|
| A-1 | Chrome Web Store developer account | Publishing | One-time $5 fee. Use a clean business identity (Hawlton Alliance). |
| A-2 | **Lemon Squeezy** account (RECOMMENDED) | Payments + licensing | Merchant-of-record → handles EU VAT (founder is in Finland — this removes VAT-OSS burden entirely). Built-in license-key API (`POST /v1/licenses/validate`, `/v1/licenses/activate`). Create two products: "Appeal Pass" $199 one-time (license key enabled), "Account Health Guardian" $29/mo subscription. **Alternative** (documented in §10-M11): Stripe Checkout on the existing Vercel backend — more control, but you become the merchant for EU VAT. Pick ONE before Milestone 5. |
| A-3 | Supabase project | Backend (existing project reusable) | Existing project `fogvzjtxbqgfppdrxqra` is usable after key rotation, or create a fresh project (cleaner — recommended). |
| A-4 | Vercel account | Express API host (existing) | Existing `backend/` deployment reusable after trimming (§10-M12). |
| A-5 | Google AI Studio API key (Gemini) | Cloud LLM fallback | Server-side only — the key lives in Supabase/Vercel env, NEVER in the extension. |
| A-6 | Amazon Seller Central account | Testing on real pages | Any seller account (even inactive) gives access to Account Health / Performance Notifications page structure. Without one, build against the fixture corpus (§13.1) and recruit 2–3 design-partner sellers for live testing. |
| A-7 | Domain + landing page | `appealdeck.app` or similar | Hosts: privacy policy (CWS-required), terms (with the no-legal-advice disclaimer), the free "notice decoder" web page (SEO distribution), checkout redirect pages. |

### 2.3 Local tooling
- Node.js ≥ 20 LTS, npm ≥ 10 (or pnpm), git.
- Chrome ≥ 148 (for current built-in-AI API surface; product must run on 138+ with graceful degradation).
- Editor/agent with TypeScript 5.x.
- Test hardware note: on-device Gemini Nano needs ~22 GB free disk and >4 GB VRAM GPU (or 16 GB RAM / 4-core CPU); the dev machine should qualify so both LLM paths are testable.

### 2.4 New repository — DO NOT build inside `V:\Extension 2.3`
```
Create: V:\AppealDeck\        ← fresh git repo, MIT-or-proprietary license file owned by Hawlton Alliance
```
Rationale: `V:\Extension 2.3` contains third-party proprietary code (Superpower ChatGPT copies). The new product must be provably clean. Donor files are **copied** in (per §6), never symlinked, and only from the approved list.

### 2.5 Environment variables (create `.env.example` in repo root; real values in deployment env only)
```
# Supabase (backend only)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
# LLM (backend only)
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash        # verify current model id at build time
# Payments (backend only) — Lemon Squeezy path
LEMONSQUEEZY_API_KEY=
LEMONSQUEEZY_STORE_ID=
LEMONSQUEEZY_WEBHOOK_SECRET=
LEMONSQUEEZY_VARIANT_APPEAL_PASS=
LEMONSQUEEZY_VARIANT_GUARDIAN_SUB=
# Payments — Stripe alternative
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_PRICE_APPEAL_PASS=
STRIPE_PRICE_GUARDIAN_SUB=
```

### 2.6 FORBIDDEN SOURCES — absolute, no exceptions
Never copy, adapt, paraphrase, or "take inspiration at code level" from:
- `V:\Extension 2.3\spchatgpt\` and `V:\Extension 2.3\spchatgpt-rebranded\` (third-party proprietary — Superpower ChatGPT)
- `V:\Extension 2.3\content\core.js`, `content\mc-managers.js`, `content\spchatgpt-*.js`, `content\chatgpt-managers.bundle.js`, `content\chatgpt-polyfills.js`
- `V:\Extension 2.3\chunked\`, `V:\Extension 2.3\dist\`, `V:\Extension 2.3\Branding\rebrand-*.{js,cjs}`
- Any file whose content mentions "superpower" (run a grep check before committing any copied file).

Everything in §6's donor table has been verified as originally authored / MIT and is safe.

---

## §3 ARCHITECTURE OVERVIEW

```mermaid
flowchart LR
  subgraph SellerCentral["Seller Central page (content script)"]
    CS[notice detector +\ntext harvester] --> PANEL[injected panel\n'Decode this notice']
    PANEL -->|AD_* messages| SW
    INJ[POA injector\nreactNativeValueSetter] --- PANEL
  end
  subgraph Extension["Extension contexts"]
    SW[service worker\nrouter + alarms + licensing] <--> OFF[offscreen doc\nDOMParser for raw HTML]
    SW <--> NANO[LanguageModel\nGemini Nano on-device]
    SW <--> DB[(Dexie: AppealDeckDB\nencrypted case vault)]
    OPT[options app (React)\ncases · wizard · POA · deadlines] <--> SW
    POP[popup\ncase summary + license] <--> SW
  end
  subgraph Backend["Backend (only when needed)"]
    SW -->|licensing, cloud LLM fallback,\nanon telemetry| API[Vercel Express /gptx/*\n+ Supabase edge fns]
    API <--> SB[(Supabase:\nlicenses · telemetry ·\npolicy corpus pgvector)]
    LS[Lemon Squeezy / Stripe] -->|webhook| API
  end
```

**Principles**
1. **Local-first**: notice text, intake answers, drafts, evidence — all stay in the browser (Dexie, encrypted). The ONLY data that leaves the machine: (a) license validation calls, (b) cloud-LLM fallback payloads **with explicit user consent toggle**, (c) anonymous telemetry events (op-in respected, no notice content ever).
2. **On-device AI first**: classification and drafting run on Gemini Nano when available; cloud fallback goes through OUR backend (`reason` edge function) so no API key ships in the extension (MV3 remote-code and CWS Limited-Use compliant).
3. **Read-only content script** (§1.3). The single write operation (filling the appeal textarea) happens only on an explicit button press and touches only the textarea value.
4. **Paste-mode parity**: every feature must work with a pasted notice (no Seller Central access at all) — this is the ToS-proof fallback and also the web-funnel demo mode.

---

## §4 TECH STACK (locked decisions)

| Layer | Choice | Rationale |
|---|---|---|
| Language | TypeScript 5.x strict, everywhere | Donor codebase is TS; SW/content scripts in TS via bundler (fixes HUNGER's unbundled-JS flaw) |
| Bundler | Vite 6 + `@crxjs/vite-plugin` | Manifest generation, HMR for options page, single-source versioning |
| UI | React 19 + Tailwind CSS 4 | Direct donor compatibility (HUNGER shell ports as-is) |
| State | zustand 5 + `dexie-react-hooks` (`useLiveQuery`) | Donor pattern |
| Local DB | Dexie 4 (IndexedDB), AES field encryption (crypto-js → migrate to WebCrypto AES-GCM, §12.2) | Donor pattern with security fixes |
| On-device LLM | Chrome built-in `LanguageModel` (Gemini Nano), Chrome 138+ | Zero marginal cost, privacy story; §11 |
| Cloud LLM | Gemini via Supabase edge fn `reason` (adapted) | Key server-side; `withExponentialBackoff` donor for retries |
| Validation | zod 4 | Donor dependency; every LLM JSON output parsed through zod |
| Backend | Existing Vercel Express (`backend/api/index.js`, trimmed) + Supabase (Postgres/pgvector + edge functions) | §10-M12 |
| Payments | Lemon Squeezy (default) / Stripe (alt) | §2.2 A-2, §10-M11 |
| Tests | Vitest (unit), fixture corpus (§13), Playwright optional for options-page E2E | |

---

## §5 REPOSITORY SCAFFOLD

```
V:\AppealDeck\
├── .env.example
├── .gitignore                  # node_modules, dist, .env*, *.pem, *.zip
├── LICENSE                     # proprietary, © Hawlton Alliance
├── package.json                # name "appealdeck", version drives manifest via crxjs
├── vite.config.ts              # crxjs + react + tailwind; inputs: options, popup, offscreen
├── manifest.config.ts          # defineManifest (§8)
├── tsconfig.json               # strict, noUnusedLocals
├── docs\
│   ├── BUILD_PLAN.md           # this file, copied in
│   └── DECISIONS.md            # running ADR log — assistant appends every non-trivial decision
├── src\
│   ├── shared\
│   │   ├── messages.ts         # AD_* message constants + payload types (M0)
│   │   ├── types.ts            # Case, Notice, ViolationType, PoaDraft, Deadline, Entitlement…
│   │   ├── storageKeys.ts
│   │   └── config.ts           # limits, retention, endpoints
│   ├── background\
│   │   ├── index.ts            # SW entry (donor: my.ChatGPT background/index.js)
│   │   ├── router.ts           # handler-map router (M0)
│   │   ├── licensing.ts        # entitlement cache + revalidation (M11)
│   │   ├── deadlines.ts        # alarms + notifications (M7)
│   │   ├── llm\
│   │   │   ├── nano.ts         # LanguageModel wrapper (M-LLM)
│   │   │   ├── cloud.ts        # backend fallback client + backoff (donor)
│   │   │   ├── classifier.ts   # M3
│   │   │   ├── composer.ts     # M5 pipeline (donor: pipeline.js skeleton)
│   │   │   ├── critic.ts       # redteam pass (donor: engine/redteam.js)
│   │   │   ├── guardrails.ts   # donor: engine/guardrails.js
│   │   │   └── prompts\        # all prompt templates as .ts exports (Appendix A)
│   │   └── offscreenHost.ts    # setupOffscreenDocument (donor)
│   ├── content\
│   │   ├── sellerCentral.ts    # entry: page detection + harvester (M1)
│   │   ├── panel.ts            # injected panel (donor: singleton panelController) (M8)
│   │   ├── injector.ts         # reactNativeValueSetter POA fill (donor) (M8)
│   │   └── panel.css
│   ├── offscreen\
│   │   ├── offscreen.html
│   │   └── offscreen.ts        # PARSE_RAW_HTML protocol (donor) (M2)
│   ├── options\                # the full React app (M9)
│   │   ├── index.html
│   │   ├── main.tsx
│   │   ├── App.tsx             # donor shell, routes: /cases /case/:id /decode /deadlines /settings /unlock
│   │   ├── pages\  …           # CaseList, CaseDetail, DecodeNotice, IntakeWizard, PoaEditor, Deadlines, Settings, Unlock
│   │   ├── components\ …       # Sidebar, LogToasts, ActionConfirmModal, ErrorBoundary, CommandPalette (donors)
│   │   └── store\appStore.ts   # donor: machineStore adapted
│   ├── popup\
│   │   ├── index.html
│   │   └── main.tsx            # case summary, "Decode current page", license badge (M10)
│   └── lib\
│       ├── db.ts               # AppealDeckDB (M6)
│       ├── crypto.ts           # fixed encryption (M6/§12.2)
│       ├── noticeParser.ts     # adapted WasmBridge subset (M1/M2)
│       ├── taxonomy.ts         # violation taxonomy data (§7.1 as code)
│       ├── deadlinesModel.ts
│       ├── csvExport.ts        # donor: csvTools adapted
│       └── telemetry.ts        # M13
├── fixtures\notices\           # test notice corpus (§13.1)
├── backend\                    # NEW trimmed copy (not in-place edit) of Vercel API (M12)
└── supabase\                   # NEW migrations + edge functions (M12)
```

---

## §6 REUSE MAP — copy these donor files (and nothing else)

Copy each donor into the new repo, then adapt per the module specs. All are originally authored by the owner or MIT (singleton). After each copy, grep the file for `superpower` — must be zero hits.

| Donor (in `V:\Extension 2.3\`) | Key exports | → New location | Action |
|---|---|---|---|
| `Extraction tool Extension\src\lib\wasm\parserInterop.ts` | `pruneHtml, ensureHtmlContext, decodeHTML, normalizeText, sanitizeUrlInput, parseJsonLdSchemas, detectSpaShell, extractLastModified, dedupeList, detectLanguage, yieldToEventLoop, calculateConfidence, deepExtractWithStreaming` | `src/lib/noticeParser.ts` | **Cherry-pick ~15%** — drop all email/phone/social/tech-stack extractors (≈2,600 lines of lead-gen code) |
| `Extraction tool Extension\src\store\localDb.ts` | `HungerDatabase` class, encrypt-on-write/decrypt-on-read Dexie hooks, `getStats`, cleanup scheduler | `src/lib/db.ts` | **Port structure, rewrite schema** (tables in §9.1). ⚠ 90-day auto-delete (`DECAY_TTL_MS`) must become opt-in — silent deletion of case evidence is unacceptable |
| `Extraction tool Extension\src\lib\encryption.ts` | `cryptoVault` (AES field encryption, key rotation) | `src/lib/crypto.ts` | **Port + 2 mandatory fixes** (§12.2): key storage `localStorage` → `chrome.storage.session`/`local`, key must not live beside ciphertext (PBKDF2 from optional user passphrase) |
| `Extraction tool Extension\public\background.js` | `setupOffscreenDocument()` (promise-dedupe guard), `withExponentialBackoff(op, maxRetries, baseWaitMs)` (429/503-aware), target-filtered message routing + `chrome.storage.local` state rehydration pattern | `src/background/offscreenHost.ts`, `src/background/llm/cloud.ts` | **Cherry-pick**; drop SheetsManager, drop no-op heartbeat alarm |
| `Extraction tool Extension\public\offscreen.js` | `{target:'offscreen', action:'PARSE_RAW_HTML', html}` → `{success,data}` protocol | `src/offscreen/offscreen.ts` | **Port protocol as-is**; delete `api.allorigins.win` proxy + UA-rotation/stealth code entirely |
| `Extraction tool Extension\src\App.tsx` + `components\{ActionConfirmModal,ConfirmModal,ErrorBoundary,CommandPalette}.tsx` + `DataVault.tsx` + `DeveloperSettings.tsx` | HashRouter shell, Sidebar, LogToasts (motion, max-3, auto-dismiss), modals, table UI, settings page | `src/options/*` | **Port shell as-is, swap route table**; `DataVault` → case list; `DeveloperSettings` → settings (license key entry, cloud-consent toggle) |
| `Extraction tool Extension\src\store\machineStore.ts` | zustand store: `logs`, `addLog`, `bgStatus` | `src/options/store/appStore.ts` | **Adapt** — stats become `{casesOpen, poaDrafted, deadlinesDue, appealsWon}` |
| `Extraction tool Extension\src\lib\csvTools.ts` | `generateShadowCSV` (papaparse, chunked blob) | `src/lib/csvExport.ts` | **Adapt** column list to case log |
| `Extraction tool Extension\src\lib\engine\{SanitizationPipeline,SelfHealingSelectors}.ts` | input sanitizing; resilient selector fallback chains | `src/lib/` | **Cherry-pick** — SelfHealingSelectors is valuable because Seller Central DOM churns |
| `singleton\content.js` | `panelController` (init/refresh/bindEvents/overlay), `ensureOverlay`, `MutationObserver`→`tryRestore` SPA-remount, `setPromptTextRobust`, `reactNativeValueSetter` (native-setter + InputEvent + verify-retry×5), style/panel id pattern, `payloadFormatter` prompt-builder shape, misc utils (`uid, sleep, dedupeStrings`) | `src/content/panel.ts`, `src/content/injector.ts`, prompt-builder shape into `src/background/llm/prompts/` | **Port as-is** (~250 L), rename `bci-*`→`apd-*`, rewrite HTML builders. MIT licensed — clean |
| `singleton\background.js` | `geminiGenerateMultimodal` (image+prompt) | `src/background/llm/cloud.ts` | **Adapt** — screenshot-of-notice → classification input (P1 feature) |
| root `background\index.js` | ESM SW entry: onInstalled defaults, alarms dispatch, commands, onMessage delegation | `src/background/index.ts` | **Port as-is**; alarms become `deadlineCheck` (hourly) + `licenseRevalidate` (daily) |
| root `shared\constants\messages.js` | prefixed message-constant pattern | `src/shared/messages.ts` | **Port pattern** as `AD_*` with TS payload types |
| root `background\orchestrator\pipeline.js` | `buildPromptData → assemblePrompt → callLLM → processLLMResult` staged pipeline, `sendProgressToTab`, `extractNextSteps` | `src/background/llm/composer.ts` | **Adapt skeleton**, replace every stage's content |
| root `engine\gemini.js` | `callGemini(prompt, apiKey, {model,maxOutputTokens,temperature})` + safetySettings | backend edge fn `reason` | **Port server-side**; key never in extension |
| root `engine\{redteam,confidence,guardrails,questionnaire,writing-styles,multi-model,deepseek,groq,openrouter}.js` | critic pass, claim scoring, output blocking, missing-info interview generator, formal register, provider fallback | `src/background/llm/*` + backend | **Adapt 6, port 4.** Skip `humanize.js` (wrong posture for a formal document) |
| root `popup\{keys,utils,init}.js` | popup module split, `downloadBlob` | `src/popup/` | **Adapt** — keys.js becomes license-key entry |
| `backend\api\index.js` | Express + rawBody middleware (webhook-signature ready), `/gptx/bootstrap`, `/register`, `/check-has-subscription`, `/latest-version`, `/remote-settings`, `/announcements`, telemetry stubs, `/health` | `V:\AppealDeck\backend\api\index.js` | **Copy then TRIM**: keep ~12 routes, delete ~110 Superpower-era routes (≈680 lines). Fix `cors({origin:true, allowedHeaders:['*']})` → allowlist the extension origin `chrome-extension://<ID>` |
| `supabase\functions\_shared\{cors,db}.ts`, `functions\{reason,scheduler,search,memory,profiles}\` | CORS helpers, service-role client, LLM endpoint, cron, vector search | `V:\AppealDeck\supabase\functions\` | **Adapt 5, delete 10** ChatGPT-specific fns (`conversations, highlights, notes, pins, prompts`). Tighten `Allow-Origin` from `*` |
| `supabase\schema.sql` | 5 tables w/ RLS; `memories` has pgvector(768) + HNSW index | `V:\AppealDeck\supabase\migrations\0001_init.sql` | **Adapt** per §9.2 |

**Stripe/LS integration: 100% greenfield** — verified no working payment code exists anywhere in the donor codebases.

---

## §7 AMAZON DOMAIN KNOWLEDGE PACK (encode as `src/lib/taxonomy.ts` data + Appendix B templates)

> ⚠ Volatile: Amazon changes thresholds, page URLs, and policy names. Each fact below was verified Aug 2026; re-verify at build time and keep this data in ONE file so updates are single-point.

### 7.1 Enforcement taxonomy (the classifier's target enum)

| `ViolationType` enum | Trigger | What Amazon expects in the appeal | v1 scope |
|---|---|---|---|
| `ODR_PERFORMANCE` | Order Defect Rate ≥1% (60-day: negative feedback + A-to-Z + chargebacks); also Late Shipment ≥4%, Cancel Rate ≥2.5%, Valid Tracking <95% | Operational root cause + concrete fixes (carrier change, inventory buffers, SOPs, staffing) + metric-monitoring prevention | **YES** |
| `SECTION3_INAUTHENTIC` | "Section 3 of the Business Solutions Agreement" + inauthentic/counterfeit claims | Unaltered supplier invoices (≤365 days, quantities & addresses matching), verifiable supply chain to the brand's authorized chain of custody; invoices alone often insufficient | **YES** |
| `SECTION3_IP_COMPLAINT` | Rights-owner complaint (trademark/copyright/patent) | Retraction from rights owner (Notice Retraction Form / Brand Registry) OR LOA/licensing agreement + invoices. Violations sit on Account Health 180 days | **YES** |
| `SECTION3_RELATED_ACCOUNT` | Linked to another deactivated account | Reactivate or disclaim EACH linked account (one appeal per enforcement); proof of divestiture (sale deed / business-transfer agreement) if no longer owned | P1 |
| `REVIEW_MANIPULATION` | Incentivized/fake review schemes | Specific admission, terminate vendor/incentive schemes, process-change evidence | P1 |
| `DROPSHIPPING_POLICY` | Third party visible as seller of record | Show seller-of-record on all packing slips/invoices/packaging + supplier-agreement fixes | P1 |
| `RESTRICTED_PRODUCT` | Prohibited/gated product listings | Catalog audit + deletion + gating compliance + sourcing controls | P1 |
| `FORGED_DOCUMENTS` | Amazon believes submitted docs were altered | Near-permanent; identity re-verification; **do NOT sell an Appeal Pass — route to professional-help screen** | GATED |
| `LISTING_LEVEL` | ASIN suppression/removal (not account-level) | Appeal via the violation row "Submit appeal" on Account Health | **YES** (decode + draft) |
| `UNKNOWN` | Classifier confidence < threshold | Show decoded facts + generic POA structure guidance + paste-into-wizard path; never guess a type to the user | **YES** |

**Account Health Rating context** (decode display): 0–1000 scale; Healthy 200–1000, At-Risk 100–199, ≤99 deactivation-eligible; new sellers start at 200. Account Health Assurance (AHR ≥250 for 6 months, ≤10 days below, valid emergency contact, Professional plan): Amazon calls before deactivating with a **72-hour** resolution window (excluded: counterfeit/fraud/child-safety).

**Funds holds** (decode display + deadline model): on deactivation, disbursements typically disabled ~**90 days** under the *Funds Disbursement Eligibility Policy* (renamed from "Fund Withholding Policy" Oct 2024). Reinstatement restores disbursement; otherwise after 90 days a **separate funds appeal** to `disbursement-appeals@amazon.com` (identity, financial instruments, sourcing docs). Track both clocks independently.

### 7.2 The POA canonical format (composer output contract)
- Literal headings, in order: **Root Cause** → **Corrective Actions** → **Preventive Measures**.
- 1–2 pages max; bullet points over prose; specific dates, order IDs, supplier names.
- Every preventive measure maps 1:1 to a named root cause.
- Tone: factual, accountable, zero emotion, zero blame of Amazon/buyers, **no legal threats** (mentioning lawyers/arbitration in a POA is counterproductive).
- Prevention carries the most weight with reviewers — the composer allocates the largest section there.

### 7.3 Appeal flow & clocks (deadline model inputs)
- Submission: Account Health → **"Reactivate your account"** banner (account-level) or violation-row **"Submit appeal"** (listing-level); some paths via the Appeal button on a Performance Notification. Form = POA textarea + file attachments (invoices, LOAs, IDs).
- Appeal window: typically **90 days** from notice (some notices say 60 — parse the actual notice text for the stated window; the parser must extract it, and default to the shorter figure when ambiguous).
- Rejection loop: "we do not have enough information" responses; resubmissions allowed but near-identical repeats risk a permanent "no further consideration" lock (community-reported wall ≈ 5 attempts). The UI shows attempt count and warns at 3+.
- Escalation ladder (encode as ordered stages the UI can display): 1) revised POA → 2) `seller-performance@amazon.com` → 3) `jeff@amazon.com` (routes to Executive Seller Relations — only with an airtight POA) → 4) Account Health Support "Call me now" → 5) BSA dispute/arbitration (display-only; the product gives no legal advice — the escalation screen for stage 5 says "consult a professional").

### 7.4 Seller Central surfaces (content-script matching + parsing strategy)
- Key paths: `/performance/dashboard` (Account Health), `/performance/notifications` (Performance Notifications).
- Hosts (enumerate in manifest — wildcarded TLDs must be listed individually):
  `sellercentral.amazon.com`, `.ca`, `.com.mx`, `.com.br`, `sellercentral-europe.amazon.com` (UK/DE/FR/IT/ES), `sellercentral.amazon.nl`, `.se`, `.pl`, `.com.tr`, `.ae`, `.com.sa`, `.eg`, `.in`, `.co.jp`, `.com.au`, `.sg`.
- DOM reality: Amazon's internal **Katal Design System** (`kat-*` web components) mixed with server-rendered and SPA modules; no stable public selectors. **Strategy: parse notification TEXT, not layout** — harvest `document.body.innerText` scoped to the notification container found by resilient heuristics (SelfHealingSelectors donor), and always offer paste-mode. Never depend on a specific class name for correctness.
- Precedent: Helium 10, Jungle Scout, SellerBoard content scripts run on `sellercentral.*` with user-granted access — установ norm exists. (Jungle Scout documents "on specific sites" scoping.)

---

## §8 MANIFEST SPEC (`manifest.config.ts` via crxjs `defineManifest`)

```jsonc
{
  "manifest_version": 3,
  "name": "AppealDeck — Amazon Appeal & POA Assistant",
  "version": "<from package.json>",
  "description": "Decode Amazon deactivation notices, draft your Plan of Action, and never miss an appeal deadline. Local-first: your case never leaves your browser.",
  "minimum_chrome_version": "138",
  "permissions": ["storage", "unlimitedStorage", "alarms", "notifications", "offscreen"],
  // NO tabs, NO scripting, NO <all_urls>. Add "sidePanel" only if M9 chooses side-panel over options-page (default: options page).
  "host_permissions": [
    "https://sellercentral.amazon.com/*", "https://sellercentral.amazon.ca/*",
    "https://sellercentral.amazon.com.mx/*", "https://sellercentral.amazon.com.br/*",
    "https://sellercentral-europe.amazon.com/*", "https://sellercentral.amazon.nl/*",
    "https://sellercentral.amazon.se/*", "https://sellercentral.amazon.pl/*",
    "https://sellercentral.amazon.com.tr/*", "https://sellercentral.amazon.ae/*",
    "https://sellercentral.amazon.com.sa/*", "https://sellercentral.amazon.eg/*",
    "https://sellercentral.amazon.in/*", "https://sellercentral.amazon.co.jp/*",
    "https://sellercentral.amazon.com.au/*", "https://sellercentral.amazon.sg/*"
  ],
  "background": { "service_worker": "src/background/index.ts", "type": "module" },
  "content_scripts": [{
    "matches": ["<same host list>/*"],
    "js": ["src/content/sellerCentral.ts"],
    "css": ["src/content/panel.css"],
    "run_at": "document_idle"
  }],
  "action": { "default_popup": "src/popup/index.html", "default_title": "AppealDeck" },
  "options_page": "src/options/index.html",
  "icons": { "16": "...", "32": "...", "48": "...", "128": "..." },
  "commands": { "decode-notice": { "suggested_key": { "default": "Ctrl+Shift+D" }, "description": "Decode the notice on this page" } }
}
```
Notes: backend calls (license/LLM/telemetry) use `fetch` from the SW — HTTPS endpoints do not need `host_permissions` in MV3. Verify at build time whether the current built-in-AI API requires a manifest permission on Chrome 148+ (docs referenced an `"ai"`-style permission for newest features).

---

## §9 DATA MODEL

### 9.1 Dexie — `AppealDeckDB` (`src/lib/db.ts`)
Port `HungerDatabase`'s hook pattern (auto-encrypt on create/update, decrypt on read). Encrypted fields marked 🔒.

```ts
cases:      'id, status, violationType, marketplace, createdAt, updatedAt'
// Case { id, title, marketplace, sellerAccountLabel🔒, violationType, status: 'decoding'|'intake'|'drafting'|'submitted'|'rejected'|'won'|'closed',
//        appealAttempts: number, entitlement: 'free'|'pass', createdAt, updatedAt }
notices:    'id, caseId, receivedAt, source'
// Notice { id, caseId, source: 'dom'|'paste'|'screenshot', rawText🔒, cleanText🔒, extractedFacts🔒 (JSON: asins, orderIds, policyCited, statedDeadline, fundsHoldMentioned), receivedAt }
poaDrafts:  'id, caseId, version, createdAt'
// PoaDraft { id, caseId, version, intakeAnswers🔒 (JSON), body🔒, criticReport🔒 (JSON), confidence, model: 'nano'|'cloud', createdAt }
evidence:   'id, caseId, kind, addedAt'
// Evidence { id, caseId, kind: 'invoice'|'loa'|'retraction'|'id'|'screenshot'|'other', fileName, blob🔒 (base64), note🔒, addedAt }
deadlines:  'id, caseId, kind, dueAt, notified7, notified3, notified1'
// Deadline { kind: 'appeal_window'|'funds_review'|'aha_72h'|'custom', dueAt, source: 'parsed'|'user' }
timeline:   '++id, caseId, at'
// TimelineEvent { caseId, at, type: 'notice_received'|'poa_drafted'|'appeal_submitted'|'amazon_reply'|'escalated'|..., note🔒 }
settings:   'key'   // cloudConsent: boolean (default false), retentionOptIn, telemetryOptIn, passphraseSet…
```
Retention: NO automatic deletion by default (invert the donor's 90-day decay). Offer manual purge + optional auto-archive.

### 9.2 Supabase (new migration `0001_init.sql`) — minimal server state
```sql
licenses      (id uuid pk, device_id text unique, ls_customer_id text, ls_order_id text,
               tier text check (tier in ('free','pass','guardian')), pass_case_quota int default 0,
               sub_status text, current_period_end timestamptz, created_at, updated_at)  -- RLS: service-role only
telemetry_events (id bigint identity, device_id text, event text, props jsonb, created_at) -- anon, no content
policy_corpus (id bigint identity, violation_type text, kind text check (kind in ('policy','exemplar')),
               content text, embedding vector(768))  -- pgvector + HNSW (port from donor `memories`); P1 for RAG-grounded drafting
outcomes      (id bigint identity, device_id text, violation_type text, attempt int,
               result text check (result in ('accepted','rejected','no_response')), created_at)
               -- OPT-IN only; powers honest win-rate stats
```
Edge functions (adapted donors): `reason` (cloud LLM proxy — accepts prompt parts, returns JSON; rate-limited per device_id), `scheduler` (daily license revalidation sweep, P1), `search` (policy_corpus vector search, P1). New: `ls-webhook` (or `stripe-webhook`), `verify-license`.

### 9.3 `chrome.storage` keys
- `local`: `entitlementCache` (signed JSON: tier, quota, exp — §10-M11), `deviceId` (uuid v4 generated on install), `onboardingDone`.
- `session`: encryption session key (§12.2).

---

## §10 MODULE SPECS

### M0 — Messaging backbone (`src/shared/messages.ts`, `src/background/router.ts`)
- Port the `MESSAGES` prefixed-constant pattern (donor `shared\constants\messages.js`) as a TS const object with a `AdMessage` discriminated-union payload type per message. Prefix all values `AD_` (collision-proofing on Seller Central).
- Messages (initial set): `AD_PING, AD_DECODE_NOTICE, AD_CLASSIFY_RESULT, AD_START_INTAKE, AD_GENERATE_POA, AD_POA_PROGRESS, AD_GET_CASE, AD_LIST_CASES, AD_SAVE_EVIDENCE, AD_SET_DEADLINE, AD_INJECT_POA, AD_GET_ENTITLEMENT, AD_UNLOCK_CASE, AD_OPEN_CHECKOUT, AD_TELEMETRY`.
- Router: handler-map `{[MESSAGES.X]: async (payload, sender) => result}` (NOT a 500-line switch — donor's known flaw). Central try/catch → typed error envelope `{ok:false, code, message}`. Every handler validates payload with zod.
- **Acceptance:** compile-time exhaustiveness (a message without a handler fails a unit test that diffs the constant set against the handler map); `AD_PING` round-trips from content script and options page.

### M1 — Notice ingestion (content script `src/content/sellerCentral.ts` + `src/lib/noticeParser.ts`)
- Detect page context by URL (`/performance/notifications`, `/performance/dashboard`) — never by DOM structure.
- Harvest strategy (ordered): (1) locate notification/violation containers via SelfHealingSelectors candidate chains (donor) → (2) fall back to scoped `innerText` of main content → (3) paste-mode (user pastes into panel or options page — must produce identical downstream results).
- `noticeParser.ts` (adapted donor functions): normalize text → extract structured facts with deterministic regex/rules first: notice date, stated appeal window ("within XX days"), ASINs (`/B0[A-Z0-9]{8}/g`), order IDs (`/\d{3}-\d{7}-\d{7}/g`), policy names cited ("section 3", "order defect rate", "intellectual property"…), funds-hold sentence detection, marketplace. LLM sees the text AFTER deterministic extraction and never overrides regex facts.
- **Read-only rule enforced here:** this module attaches no listeners to Amazon's buttons, submits nothing, mutates nothing except the AppealDeck panel.
- **Acceptance:** all fixtures in `fixtures/notices/` (§13.1) parse to correct structured facts (unit-tested); paste-mode and DOM-mode produce byte-identical `Notice.cleanText` for the same content.

### M2 — Offscreen parsing (`src/offscreen/offscreen.ts`)
- Port donor protocol `{target:'offscreen', action:'PARSE_RAW_HTML', html}` (SW has no DOMParser). Used for: pasted HTML, stored raw notices re-parsing, future email-forward ingestion. Delete every trace of the donor's third-party proxy (`allorigins`) and stealth headers.
- **Acceptance:** SW can round-trip raw HTML → clean text without a visible window; offscreen document is created lazily with the donor's promise-dedupe guard and closed after idle timeout.

### M3 — Classifier (`src/background/llm/classifier.ts`)
- **Stage 1 deterministic:** keyword/rule table over extracted facts (e.g., "section 3" + "inauthentic" → `SECTION3_INAUTHENTIC`). Rules win when unambiguous. Port scoring shape from donor `calculateConfidence` + `engine/confidence.js`.
- **Stage 2 LLM (only if stage 1 ambiguous):** Nano/cloud with `responseConstraint` JSON schema `{violationType: enum, confidence: 0-1, signals: string[], severity: 'listing'|'account'|'terminal', fundsHold: boolean, statedDeadlineDays: number|null}` — validated by zod.
- Confidence < 0.7 → present as `UNKNOWN` with decoded facts only (never guess to the user).
- **Severity gating:** `FORGED_DOCUMENTS`/fraud/child-safety → hard-block Appeal Pass purchase for the case; show professional-help screen (§1.3).
- **Acceptance:** ≥90% correct type on the fixture corpus; 100% of gated types blocked from checkout; zero cloud calls when `cloudConsent=false` and Nano unavailable (graceful "on-device AI unavailable" path with rules-only decode).

### M4 — Intake wizard (`src/options/pages/IntakeWizard.tsx` + donor `engine/questionnaire.js` adapted)
- Per-violation question sets (data-driven from `taxonomy.ts`), e.g. `SECTION3_INAUTHENTIC`: supplier name/relationship, invoice availability & dates (≤365d?), quantities match?, brand authorization chain, prior complaints. `ODR_PERFORMANCE`: which metric breached, carrier, fulfillment method, staffing, recent spikes & cause.
- The donor questionnaire engine generates FOLLOW-UP questions when answers are vague ("supplier is legit" → asks for name, address, relationship length). Cap: 12 questions max, all skippable with explicit "I don't have this" (the composer then honestly omits rather than inventing).
- **Acceptance:** every question's answer lands in `PoaDraft.intakeAnswers`; skipped answers produce no fabricated content in the draft (verified by critic pass, M5).

### M5 — POA composer (`src/background/llm/composer.ts` — donor `pipeline.js` skeleton)
Pipeline stages (each emits `AD_POA_PROGRESS` to the UI via donor `sendProgressToTab` pattern):
1. `buildPromptData`: notice facts + intake answers + taxonomy template for the type + (P1) top-k policy_corpus snippets.
2. `assemblePrompt`: Appendix A templates; formal register via donor `writing-styles.js` "professional" mode.
3. `callLLM`: Nano first (chunk if `inputQuota` exceeded — §11.3), cloud fallback (consented), provider fallback chain via donor `multi-model.js` server-side.
4. `critic` (donor `redteam.js` adapted): adversarial pass with the Amazon-reviewer rubric — flags: unmapped preventive measures, emotion/blame, legal threats, vague root cause, fabricated facts not present in intake/notice, length >2 pages. Auto-regenerates once on hard flags, then surfaces remaining flags in the editor UI.
5. `guardrails` (donor): hard-blocks output containing invented policy citations, invented dates/order IDs (diff against deterministic facts), the word "guarantee".
- Output: structured `{rootCause: string[], correctiveActions: string[], preventiveMeasures: string[]}` rendered to the canonical format; editable in `PoaEditor` (rich-text-light: headings locked, bullets editable); versioned per regeneration.
- **Acceptance:** all fixture cases produce drafts passing critic with ≤1 regeneration; zero fabricated ASINs/order IDs/dates across the fixture suite (automated diff test); draft renders under 2 pages at 11pt.

### M6 — Case vault & evidence (`src/lib/db.ts`, `src/lib/crypto.ts`, `src/options/pages/CaseDetail.tsx`)
- Schema §9.1; encryption fixes §12.2. Evidence upload (images/PDFs → base64 blobs, 10 MB/file cap, warn at 200 MB total).
- Timeline auto-events from every module; manual "Amazon replied" entry with paste box (feeds attempt counter + rejection analysis P1).
- Export: whole case → JSON (encrypted or plain, user choice) + `csvExport` case log; explicit "escalation packet" export (P1): notices + POAs + timeline as printable HTML for `jeff@`/ESR emails.
- **Acceptance:** kill/restart the browser mid-edit → zero data loss; export/import round-trips a case bit-perfectly; encrypted fields unreadable in raw IndexedDB inspection.

### M7 — Deadlines & alarms (`src/background/deadlines.ts`)
- On notice decode: auto-create `appeal_window` deadline (parsed stated window; ambiguity → shorter figure + "verify in your notice" flag) and `funds_review` (+90 days) when funds-hold detected.
- `chrome.alarms` hourly `deadlineCheck` → `chrome.notifications` at T-7d, T-3d, T-1d (donor alarm wiring from root `background/index.js`; the notified flags in §9.1 prevent duplicates).
- **Acceptance:** simulated clock tests fire each threshold exactly once; notification click deep-links to the case.

### M8 — In-page panel & injector (`src/content/panel.ts`, `injector.ts` — donor singleton, MIT)
- Panel appears ONLY on recognized notice/health pages: collapsed chip ("AppealDeck: notice detected — Decode") → expanded card with decode summary + "Open full case" (options page deep link). `MutationObserver`+`tryRestore` donor pattern survives Katal SPA re-renders; all ids/classes `apd-*`; styles scoped, `z-index` defensive.
- Injector: on the appeal form page, an explicit "Insert my POA" button fills the textarea via donor `reactNativeValueSetter` + verify-retry(×5). NEVER auto-fills, NEVER touches the submit button. After insert, banner: "Review every line before you submit — you are responsible for what you send."
- **Acceptance:** panel survives 20 SPA navigations without duplication or leak (donor's dedupe id check); injector round-trips a 6,000-char POA into a React-controlled textarea on the fixture harness page (a local page replicating a controlled-textarea, since real appeal pages need a suspended test account).

### M9 — Options app (`src/options/`) — donor HUNGER shell
Routes: `/cases` (list, donor DataVault table: status chips, deadline countdowns) · `/case/:id` (tabs: Notice / Intake / POA / Evidence / Timeline / Escalation) · `/decode` (paste-mode landing — also the web-demo twin) · `/deadlines` (calendar list) · `/settings` (license, cloud-consent toggle default OFF, passphrase, retention, telemetry opt-in, export/purge) · `/unlock` (checkout hand-off, §M11).
Keep donor LogToasts (5s auto-dismiss), ActionConfirmModal for destructive actions, ErrorBoundary, CommandPalette.
**Acceptance:** every flow completable keyboard-only; dark/light themes; no route dead-ends (each screen has a next-step CTA).

### M10 — Popup (`src/popup/`)
Compact: active case summary (type, next deadline countdown), "Decode current page" (sends `AD_DECODE_NOTICE` to the active tab if it's Seller Central; otherwise opens `/decode`), license badge, link to options. Donor popup module split (`init/keys/utils`).
**Acceptance:** popup renders <150ms from cached state; zero network on open.

### M11 — Licensing & payments (`src/background/licensing.ts` + backend)
- **Free tier:** unlimited decode + classification + deadline tracking + 1 intake preview (first 3 questions) — full POA generation locked.
- **Appeal Pass $199 (one-time, per case):** unlocks POA generation + unlimited redrafts + critic + injector + escalation packet for ONE case. Purchase flow: `/unlock` → `AD_OPEN_CHECKOUT` → SW opens Lemon Squeezy checkout URL in a new tab (checkout NEVER inside Seller Central, payment data never touches the extension) → user enters license key from receipt email into `/settings` (and a `verify-license` poll auto-detects webhook-confirmed purchases by `device_id` passed as checkout custom data).
- **Guardian $29/mo:** subscription (LS variant), gates the Account Health monitor (P1 feature — ship the SKU disabled-but-purchasable only when monitor ships; do NOT sell before the feature exists).
- Entitlement: backend `/gptx/bootstrap` (donor route adapted) returns `{tier, passCases: [caseKey], subActive, exp}` signed (HMAC w/ backend secret); SW caches in `chrome.storage.local`, revalidates via daily alarm, 72h offline grace, tamper → free tier.
- Backend: `ls-webhook` edge function (verify `X-Signature` HMAC with `LEMONSQUEEZY_WEBHOOK_SECRET`; handle `order_created`, `subscription_created/updated/cancelled` → upsert `licenses`). Stripe alternative: same shape with `constructEvent` on the donor's rawBody middleware.
- **Acceptance:** free→pass upgrade end-to-end in LS test mode; revoked license downgrades within 24h; clock tampering does not extend grace; gated M3 types cannot reach checkout.

### M12 — Backend trim (`V:\AppealDeck\backend`, `V:\AppealDeck\supabase`)
- Copy donor Express app; DELETE ~110 `/gptx/*` ChatGPT-era routes; KEEP+adapt: `bootstrap`, `register` (→ device registration), `check-has-subscription`, `latest-version`, `remote-settings` (kill-switch/feature flags), `announcements`, 4 telemetry sinks (→ `telemetry_events`), `health`. Fix CORS to the extension origin allowlist. Add: `verify-license`, checkout-session creation (Stripe path only), `outcome-report` (opt-in win-rate data).
- Supabase: migration §9.2; adapted edge functions per §9.2; delete the 10 ChatGPT-specific functions and the legacy `.js` duplicates.
- **Acceptance:** `npm run dev` boots backend locally; all kept routes covered by a smoke-test script; deployed to Vercel + Supabase with rotated keys; zero references to the old hardcoded Supabase URL.

### M13 — Telemetry & logging (`src/lib/telemetry.ts`)
- CWS Limited-Use compliant: **opt-in**, anonymous `device_id` only, event names + numeric props ONLY (`decode_completed {type, confidence_bucket}`, `pass_purchased`, `poa_generated {regen_count}`) — never notice text, never seller identity. Local ring-buffer logger (donor `addLog`) for support diagnostics, exportable by the user manually.
- **Acceptance:** network inspector shows zero payloads containing case content; toggling opt-out stops all events immediately.

### M14 — Copy & legal
- Persistent footer in POA editor + first-run screen + store listing: "AppealDeck prepares documents and organizes your case. It is not a law firm and does not provide legal advice. No outcome is guaranteed."
- Honest-expectations card shown before first purchase (conversion-tested copy, but factual): appeal outcomes depend on case facts; many first appeals are rejected; here's what improves odds.
- Privacy policy (on the domain): enumerate exactly the §3 data flows. Terms: liability cap, no-refund-after-generation policy decision (RECOMMENDED: 7-day refund if no POA was generated; no refund after generation — document clearly).
- **Acceptance:** the word "guarantee" greps to zero across `src/`, store listing, and site; disclaimer present on every POA render/export.

---

## §11 LLM SPEC

### 11.1 On-device (primary) — Chrome built-in `LanguageModel` (Gemini Nano)
```ts
// availability: 'unavailable' | 'downloadable' | 'downloading' | 'available'
const avail = await LanguageModel.availability({ expectedInputs: [{ type: 'text', languages: ['en'] }] });
const session = await LanguageModel.create({
  temperature: 0.3, topK: 3,                     // clamp via LanguageModel.params()
  initialPrompts: [{ role: 'system', content: CLASSIFIER_SYSTEM }],
  monitor(m) { m.addEventListener('downloadprogress', reportToUi); },
});
const raw = await session.prompt(noticeText, { responseConstraint: CLASSIFY_JSON_SCHEMA }); // structured output
// also: session.promptStreaming() for POA drafting UX; session.inputUsage / session.inputQuota for chunking
```
- Works in the **service worker** directly (no offscreen needed), Chrome 138+; verify exact API/permission surface against Chrome-148-era docs at build time (this API has churned).
- If `downloadable`: show a one-time "enable on-device AI (~download)" consent card; if `unavailable` (hardware gates: ~22 GB disk, >4 GB VRAM or 16 GB RAM): cloud-consent path or rules-only decode.

### 11.2 Cloud fallback (secondary) — backend `reason` edge function
- Extension → `POST /reason {task, parts}` with device_id; backend calls Gemini (donor `callGemini`, current model id from env) with `withExponentialBackoff`; provider fallback (donor `multi-model` + `groq/deepseek/openrouter` clients) server-side. Per-device rate limit (free: 10 cloud calls/day; pass: 200/case).
- Gated by `settings.cloudConsent === true` — the toggle copy states exactly what is sent.

### 11.3 Context budget
- Nano usable context ≈ 6–9K tokens. Budget: system 400 + taxonomy template 600 + notice (clipped to first 2,500) + intake answers (clipped 1,500) + output room 2,500. Notices longer than the clip → deterministic pre-summary (keep sentences containing dates/IDs/policy names verbatim).

### 11.4 Prompt templates — full text in **Appendix A**; requirements:
- Classifier: closed enum, JSON-schema constrained, refuses content not resembling an Amazon notice (`violationType:'UNKNOWN', confidence:0`).
- Composer (per violation type): forbids inventing facts; every claim must trace to notice/intake; skipped intake answers → the draft says what the seller will do to obtain the evidence instead of pretending it exists.
- Critic: rubric-scored JSON (`{flags: [{code, severity, quote, fix}], score: 0-100}`) with the §7.2 rules as the rubric.

---

## §12 SECURITY & PRIVACY

1. **Permissions minimalism** (§8): no `tabs`, no `scripting`, no `<all_urls>`. Content script only on enumerated Seller Central hosts.
2. **Encryption fixes (mandatory, from donor audit):**
   a. Session key: `localStorage` (donor bug — unavailable in SW, key next to data) → random key in `chrome.storage.session` for runtime + wrapped copy in `chrome.storage.local` **only** when the user declines a passphrase; with passphrase: PBKDF2(SHA-256, ≥310k iterations) → AES-GCM via WebCrypto (migrate off crypto-js for new writes; keep read-compat shim).
   b. Blob evidence encrypted with the same envelope.
3. **CWS Aug-2026 compliance checklist** (enforcement began Aug 1, 2026): Limited Use — collect only what the single purpose needs (telemetry design M13); prominent disclosure + data-disclosure form: declare "website content" (notice text) processed locally, transmitted ONLY under explicit cloud-consent; no affiliate injection anywhere; no circumvention of AI-service safeguards; MV3 remote-code ban — all logic in-package, remote *config* (remote-settings JSON) is allowed, remote JS is not.
4. **ToS posture:** read-only harvesting of the seller's own notices; paste-mode keeps full functionality with zero page access; no scraping runs, no automation. (Helium 10 / Jungle Scout precedent.)
5. Backend: CORS allowlist, rate limits, RLS on all tables, service-role key only in edge functions/Vercel env, webhook signature verification, no PII in `telemetry_events`.

---

## §13 TESTING

### 13.1 Fixture corpus (`fixtures/notices/`) — build FIRST (Milestone 1)
- ≥4 realistic notices per v1 violation type (ODR, Section3-inauthentic, Section3-IP, listing-level, unknown/garbage) — sourced from public seller-forum posts (rewritten, anonymized) + synthetic variants (marketplace variants, with/without funds-hold paragraph, 60 vs 90-day windows, HTML + plaintext forms). Each fixture = `{raw.html|txt, expected.json}` (type, facts, deadlines).
- Plus adversarial fixtures: a shipping notification (must classify UNKNOWN), a phishing-style fake notice, an empty page.

### 13.2 Test layers
| Layer | Tool | Coverage |
|---|---|---|
| Unit | Vitest | noticeParser fact extraction (every fixture), classifier stage-1 rules, deadline math, entitlement cache logic, message router exhaustiveness, crypto round-trip |
| LLM eval | Vitest + recorded runs | fixture → classification accuracy ≥90%; composer fabrication diff = 0; critic catches 5 seeded-bad drafts |
| Integration | Vitest + chrome API mocks | decode→classify→intake→draft happy path; paste-mode parity; license downgrade |
| Manual QA (per release) | checklist in `docs/QA.md` | real Seller Central smoke on a live account (panel mount, harvest, no console errors, injector on harness page), popup, notifications, checkout in LS test mode, fresh-profile install, Chrome 138 (no Nano) degradation path |

---

## §14 BUILD, RELEASE & STORE SUBMISSION

1. `npm run build` → crxjs emits `dist/` with generated manifest (version from package.json); `npm run zip` → store artifact. CI (GitHub Actions): typecheck + unit + LLM-eval (recorded) + build on every push.
2. **CWS listing** (prepare during Milestone 6): name, 132-char summary, description written to the §1.2 queries ("amazon account deactivated", "plan of action", "appeal"), 5 screenshots (decode card, POA editor, deadlines, vault, honest-expectations card), category: Workflow & Planning. Single-purpose statement: "Helps Amazon sellers understand enforcement notices and prepare appeal documents." Privacy-policy URL + completed data-disclosure form (§12.3). Justify each host permission in the review notes; mention paste-mode and local-first processing explicitly (reviewers reward it).
3. Versioning: semver; `remote-settings` carries `minSupportedVersion` as kill-switch for broken releases.
4. Rollout: unlisted → 5 design partners → listed. Keep a 0-day hotfix path (content-script selectors are config-driven via remote-settings *data*, not code).

---

## §15 MILESTONES & ACCEPTANCE (8 weeks, sequential)

| # | Week | Deliverable | Acceptance gate |
|---|---|---|---|
| M-1 | 1 | §2 complete: creds rotated, accounts opened, repo scaffolded (§5), CI green on empty app, **fixture corpus built (§13.1)** | All P-/A- items checked; `npm run build` produces loadable extension |
| M-2 | 1–2 | Messaging backbone (M0) + DB/crypto (M6 core) + offscreen (M2) | M0/M2/M6 acceptance tests pass |
| M-3 | 2–3 | Notice ingestion (M1) + classifier (M3) + decode UI (panel chip M8-lite + `/decode` page) — **the free tier, end to end** | Fixture accuracy ≥90%; paste parity; severity gating works |
| M-4 | 3–5 | Intake wizard (M4) + POA composer with critic/guardrails (M5) + PoaEditor + deadlines (M7) | M4/M5/M7 gates; full case flow on 3 fixture types without dev tools |
| M-5 | 5–6 | Licensing + payments (M11) + backend trim/deploy (M12) + telemetry (M13) | LS test-mode purchase → unlocked case; revocation works; backend smoke green |
| M-6 | 6–7 | Full panel + injector (M8) + popup (M10) + polish (M9 routes complete, M14 copy everywhere) + QA checklist runs | Manual QA clean on live Seller Central (design-partner account); "guarantee" grep = 0 |
| M-7 | 7–8 | Store package (§14), landing page + privacy policy live, unlisted submission, design-partner beta | CWS review passed or feedback addressed; 3 real cases decoded by partners |
| M-8 | 8 | Public listing + launch playbook execution (free decoder SEO pages, community answers) | Listed; first paid Appeal Pass |

Post-launch backlog (P1): related-account/review-manipulation/dropshipping types, escalation packet export, rejection-analysis ("paste Amazon's reply"), Account Health Guardian monitor (then enable the $29 SKU), policy_corpus RAG, DE/FR locales, screenshot-input classification (singleton multimodal donor).

---

## §16 RISK REGISTER (technical) — mitigations are requirements

| Risk | Mitigation (built above) |
|---|---|
| Seller Central DOM changes break harvesting | Text-not-layout parsing (§7.4), SelfHealingSelectors, remote-settings-driven selector config, paste-mode always works |
| Chrome built-in AI API churn / user hardware can't run Nano | API verified at build time; three-tier degradation: Nano → consented cloud → rules-only decode |
| CWS rejection | §12.3 checklist, minimal permissions, local-first story in review notes, paste-mode demo video for reviewers |
| Free-ChatGPT competition | Free tier IS the ChatGPT-parity layer; paid = classification + format correctness + deadlines + vault + critic + outcome data |
| Angry-customer blowback on failed appeals | M14 honest-expectations gate before purchase, refund policy, severity gating routes hopeless cases away from checkout, opt-in outcome stats published |
| Amazon ToS complaint | Read-only, no automation, user-initiated injection only, paste-mode fallback removes page dependency entirely |
| Solo-maintainer bus factor | This document + `docs/DECISIONS.md` + typed messages + fixture suite keep the codebase re-enterable |

---

## APPENDIX A — PROMPT TEMPLATES (implement verbatim as string exports in `src/background/llm/prompts/`)

### A.1 `CLASSIFIER_SYSTEM`
```
You are an expert analyst of Amazon Seller Central enforcement notices. You will receive the text of a notice.
Classify it strictly into one of: ODR_PERFORMANCE, SECTION3_INAUTHENTIC, SECTION3_IP_COMPLAINT, SECTION3_RELATED_ACCOUNT, REVIEW_MANIPULATION, DROPSHIPPING_POLICY, RESTRICTED_PRODUCT, FORGED_DOCUMENTS, LISTING_LEVEL, UNKNOWN.
Rules:
- Base your answer ONLY on the provided text. If the text is not an Amazon enforcement notice, return UNKNOWN with confidence 0.
- Do not infer facts that are not stated. List the exact phrases that signal your classification in "signals".
- severity: "listing" if only ASINs are affected, "account" if selling privileges are deactivated, "terminal" if the notice states no appeal will be considered or alleges forged documentation.
Return JSON only, matching the provided schema.
```

### A.2 `COMPOSER_SYSTEM` (parameterized by violation type template)
```
You are drafting an Amazon Plan of Action for a seller. You write in formal, factual, first-person-plural business English.
ABSOLUTE RULES:
- Use ONLY facts provided in NOTICE_FACTS and INTAKE_ANSWERS. Never invent dates, order IDs, ASINs, supplier names, or events.
- If an important fact is marked "not provided", write what the seller WILL do to obtain or remediate it — never pretend it exists.
- Structure: three sections with these exact headings: "Root Cause", "Corrective Actions", "Preventive Measures".
- Every Preventive Measure must reference which Root Cause it prevents.
- Bullets over paragraphs. Specific over general. No emotion, no blame of Amazon or buyers, no mention of lawyers, legal action, or guarantees.
- Total length: fits on 1–2 pages (under 700 words).
{VIOLATION_TYPE_GUIDANCE}   // injected from taxonomy.ts, e.g. for SECTION3_INAUTHENTIC: emphasize supply-chain verification, invoice availability and dates, brand authorization…
```

### A.3 `CRITIC_SYSTEM`
```
You are a skeptical Amazon Seller Performance reviewer. You will receive a draft Plan of Action plus the notice facts and intake answers it must be grounded in.
Find every reason to reject it. Check, in order:
1. FABRICATION: any date, ID, name, or event not present in the source facts. (severity: hard)
2. UNMAPPED_PREVENTION: preventive measures that do not address a stated root cause. (hard)
3. VAGUENESS: root cause that describes symptoms, not causes; corrective actions without concrete steps/dates. (soft)
4. TONE: emotion, blame, legal threats, promises or guarantees. (hard)
5. LENGTH/FORMAT: missing headings, prose walls, over 700 words. (soft)
Return JSON: {"score": 0-100, "flags":[{"code","severity":"hard"|"soft","quote","fix"}]}.
```

### A.4 `QUESTIONNAIRE_FOLLOWUP` — donor `engine/questionnaire.js` prompt, retargeted: given an intake answer, decide if it is specific enough for a POA; if not, produce ONE concrete follow-up question. JSON `{sufficient: boolean, followUp?: string}`.

## APPENDIX B — POA SKELETONS (per v1 type; stored in `taxonomy.ts` as `{guidance, skeleton}`)
- **ODR_PERFORMANCE skeleton:** Root Cause: metric breached + operational cause (carrier delays / stock-outs / listing mismatch / support gaps). Corrective: refunds/outreach to affected orders, carrier or 3PL change, restock, listing corrections — with dates. Preventive: metric-monitoring cadence (daily AHR check), buffer-stock policy, SLA with carrier, QA checklist — each tied to its cause.
- **SECTION3_INAUTHENTIC skeleton:** Root Cause: sourcing path that allowed the complaint (e.g., unauthorized distributor). Corrective: invoices attached (dates/quantities), removal of affected inventory, supplier verification performed. Preventive: authorized-distributor-only policy, invoice retention SOP (365d+), pre-listing brand-authorization check.
- **SECTION3_IP_COMPLAINT skeleton:** Root Cause: why the listing triggered the complaint (image/wordmark/ASIN misuse). Corrective: retraction request status, listing removal/edits, LOA obtained. Preventive: IP-clearance checklist before listing, brand-relationship documentation, catalog audit schedule.
- **LISTING_LEVEL skeleton:** condensed single-issue version of the above matching the violation row.

## APPENDIX C — UI COPY BLOCKS (fixed strings; tone: calm, competent, honest)
- First-run: "Take a breath. Most deactivations are appealable. Let's read your notice properly first — that part is free."
- Pre-purchase honest-expectations card (M14) full text.
- Injector post-insert warning (M8) full text.
- Not-legal-advice footer (M14) full text.
- Gated-type screen: "This notice type has very low self-service success and real legal stakes. We won't sell you a drafting pass for it. Here's what professionals handle better…"

## APPENDIX D — DEADLINE MATH
`appeal_window.dueAt = noticeReceivedAt + statedDays (parsed; ambiguous → min(candidates); missing → 90) `; `funds_review.dueAt = deactivatedAt + 90d`; AHA path: if notice references Account Health Assurance call → `aha_72h = callAt + 72h`. All datetimes stored UTC, rendered local; countdown chips: green >14d, amber 3–14d, red <3d.

## APPENDIX E — LAUNCH PLAYBOOK (post M-8, summarized)
Free notice-decoder web page (same parser compiled for web) as SEO asset per §1.2 queries → CWS listing keywords → named-founder answers in r/FulfillmentByAmazon / FBA Facebook groups (expertise-first, no drive-by pitching — communities ban vendor spam but allow substantive help) → anonymized before/after case studies → design-partner testimonials. Track: installs, decode→intake rate, intake→purchase rate, refund rate, (opt-in) outcome stats.

---
*End of build plan. Assistant: begin at §2, log decisions in `docs/DECISIONS.md`, and treat §2.6 as inviolable.*
