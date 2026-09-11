# Technical Risk Controls — the risk register as build requirements

**Why this file exists / when to use it.** The research stream on technical risk (STREAM6) produced a 20-item risk register (TR-01…TR-20) and a list of wrong assumptions in the v1.0 spec. This file converts everything that survives the project's later corrections into twelve **controls** (TRC-01…TRC-12) that are build REQUIREMENTS, not advice: each control states the risk, the exact requirement, where it lives in the architecture, and the acceptance test that proves it. A milestone that touches a control's home module does not pass its gate until the control's acceptance test passes. Read alongside `01-BUILD-SEQUENCE.md` (when each module is built) and `02-BUILD-PLAN-AMENDMENTS.md` (which corrections these controls assume — this file is the "full detail" target of its AM-13 and the "TRC-05" pointer of its AM-01). The closing table maps every TR item to its control or explains why it was dropped.

**Glossary (first use):** POA = Plan of Action (Amazon's required appeal document). MV3 = Manifest V3, Chrome's current extension platform. SW = the extension's background service worker (an event-driven script Chrome starts and kills at will). CWS = Chrome Web Store. MoR = Merchant of Record (payment provider that legally resells the product and handles VAT — Paddle primary, Polar fallback, per D2). Dexie = the IndexedDB (browser database) wrapper used for the local encrypted case vault. WebCrypto = the browser's native cryptography API. PBKDF2 = a key-derivation function that turns a passphrase into an encryption key; AES-GCM = the authenticated encryption cipher used for vault data. HMAC = keyed hash used to sign webhooks and entitlement payloads. Nano = Gemini Nano, Chrome's built-in on-device model behind the `LanguageModel` API. BSA = Amazon's Business Solutions Agreement; its §19 "Agent Policy" (effective 4 Mar 2026) restricts automated tools on Seller Central.

**How to use a control:** the **Requirement** bullets are contractual — the AI assistant implements them literally; the **Acceptance test** is what a reviewer runs (or reads in CI output) to sign the control off. Deviations are recorded in `docs/DECISIONS.md` with a reason, never silently.

---

## TRC-01 — MV3 service-worker lifecycle: no in-memory-only state, ever

**Risk (TR-04, TR-05, TR-19; STREAM6 corrections 3, 13, 14; SK-T1).** Chrome kills the SW after ~30 seconds of idle and hard-terminates any single event handler at 5 minutes — silently, with no error delivered to the caller. Module-scope variables vanish on every eviction. The offscreen document (the hidden page the SW uses for DOM parsing, since the SW has no DOMParser) allows only ONE instance per extension, and a module-scope "creating" flag is lost on eviction while the document survives — so a naive dedupe guard causes `createDocument()` rejections. Inside the offscreen document only `chrome.runtime` messaging works; `chrome.storage` calls throw.

**Requirement.**
1. **No durable state in SW module scope.** Every handler reads its state from `chrome.storage` or Dexie at entry and persists before returning. Caches are optimizations that must survive being empty.
2. **No `setInterval`/`setTimeout` in the SW.** All scheduling goes through `chrome.alarms` (see TRC-02). Grep gate: zero hits in `src/background/`.
3. **All event listeners registered synchronously at the top level** of the worker script — never inside `async` functions or after an `await` (Chrome does not reliably capture late listeners).
4. **Single-handler work budget < 4 minutes.** The composer pipeline (parse → classify → compose → critic → guardrails) is chunked: each alarm wake-up or message-handler invocation processes one stage, writes stage progress to storage, and returns. A cold SW resumes from the last persisted stage.
5. **Typed error envelope everywhere:** `{ok:false, code, message}` — a `sendResponse` is never left hanging; the UI never waits on a killed worker.
6. **Offscreen document discipline:** existence checked via `chrome.runtime.getContexts({contextTypes:['OFFSCREEN_DOCUMENT']})` (Chrome 116+; never a module-scope flag), created lazily, closed after idle timeout; every message on the shared bus carries a `target` tag; no `chrome.storage` calls from inside the document.

**Where it lives.** `src/background/router.ts` (M0 handler map + error envelope), `src/background/llm/composer.ts` (M5 staged pipeline), `src/offscreen/offscreen.ts` + its creation guard in the SW (M2), lint/CI rules in the repo root.

**Acceptance test.** (a) CI grep: `setInterval|setTimeout` in `src/background/` = 0 hits. (b) Integration test: force-terminate the SW (test harness equivalent of `chrome://serviceworker-internals` stop) mid-composer-run → on next wake the pipeline resumes from the last persisted stage and the UI receives a progress event, not a hang. (c) Offscreen race test: two concurrent `PARSE_RAW_HTML` requests after a simulated SW eviction produce one document, two correct results, zero `createDocument` rejections. (d) The v1.0 M6 gate ("kill/restart the browser mid-edit → zero data loss") passes.

- [ ] **TRA-01** Implement requirements 1–6 and land the four acceptance tests in CI. — **Owner:** AI assistant · **Cost:** $0 · **Deadline/Week:** with M-2 (foundations) and M-4 (staged pipeline), Weeks 1–5 · **Blocks:** M-2 and M-4 gates.

---

## TRC-02 — `chrome.alarms` one-minute granularity is the scheduling floor

**Risk (TR-07, TR-18; STREAM6 correction 4).** After the first five alarms in a session, Chrome enforces a ~1-minute minimum period. Any design that assumes sub-minute timers (deadline countdown precision, polling) silently degrades.

**Requirement.**
1. Deadline checking runs on an **hourly** alarm (`periodInMinutes: 60`), not a fast timer. Notification thresholds (T-7d, T-3d, T-1d before each deadline) are computed in logic at each wake-up; the `notified7/notified3/notified1` flags in the Dexie `deadlines` table prevent duplicates.
2. No code path relies on the first-five-alarms fast window. Code review gate: no `periodInMinutes` value below 1 anywhere.
3. Countdown UI renders live from `dueAt` timestamps when a page is open — display precision comes from the UI clock, never from alarm frequency.

**Where it lives.** `src/background/deadlines.ts` (M7) on top of the corrected deadline math in `src/core/deadlinesModel.ts` (see `01-BUILD-SEQUENCE.md` §4 — the AM-03 model, not v1.0 Appendix D).

**Acceptance test.** Simulated-clock unit tests: each threshold notification fires exactly once per deadline across repeated hourly wake-ups, including across a simulated browser restart; a deadline crossing two thresholds between wake-ups (machine asleep) fires the nearest threshold once, not both stale ones.

- [ ] **TRA-02** Implement the hourly deadline alarm + threshold logic with the simulated-clock test suite. — **Owner:** AI assistant · **Cost:** $0 · **Deadline/Week:** with M-4 (Weeks 3–5) · **Blocks:** M-4 gate.

---

## TRC-03 — Encryption-key handling: `chrome.storage.session` dies with the browser

**Risk (TR-20; STREAM6 correction 1).** `chrome.storage.session` survives SW restarts within a browser session but is **cleared when the browser exits**. If the vault encryption key exists only there, every browser restart bricks the vault. The donor codebase's original bug — key stored in `localStorage` beside the data it protects — must not be re-created in any form.

**Requirement (implements v1.0 §12.2 with the cold-start fix).**
1. **Runtime key** lives in `chrome.storage.session` only (fast path while the browser runs).
2. **Cold-start recovery, two modes:** (a) user set a passphrase → key derived on demand via PBKDF2 (SHA-256, ≥310,000 iterations) → AES-GCM key via WebCrypto; nothing key-like persists on disk; (b) user declined a passphrase → a **wrapped** copy of the key in `chrome.storage.local`. The UI states plainly that passphrase mode is the stronger protection (mode (b) protects against casual inspection of the database, not against an attacker with full profile access).
3. **Key never beside ciphertext:** ciphertext lives in IndexedDB (Dexie); key material never does — not raw, not wrapped, not in any Dexie table. No `localStorage` use anywhere in the extension.
4. New writes use WebCrypto AES-GCM; a read-compat shim decrypts any legacy crypto-js-format donor data, and re-encryption happens under TRC-04's envelope rules.
5. Wrong passphrase → clear "unlock failed" state with retry; never a silent empty vault (which users read as data loss).

**Where it lives.** `src/lib/crypto.ts` + Dexie hooks in `src/lib/db.ts` (M6); unlock UI in `src/options/` (M9 settings + first-run).

**Acceptance test.** (a) Set passphrase → write case data → full browser exit and relaunch → passphrase prompt → data decrypts. (b) Same flow without passphrase → data decrypts via the wrapped key with no prompt. (c) Raw IndexedDB inspection shows only ciphertext for 🔒-marked fields (v1.0 §9.1) and no key material in any IndexedDB store. (d) Grep: `localStorage` = 0 hits in extension source.

- [ ] **TRA-03** Implement the two-mode key lifecycle with the four acceptance checks. — **Owner:** AI assistant · **Cost:** $0 · **Deadline/Week:** with M-2 (Weeks 1–2) · **Blocks:** M-2 gate; every encrypted-vault feature.

---

## TRC-04 — Dexie migration safety: the vault must survive every schema change

**Risk (TR-10, TR-11; SK-T2; STREAM6 correction 5; MR-16).** IndexedDB upgrade transactions cannot await async work — WebCrypto called inside Dexie's `upgrade()` fails silently or aborts the upgrade, and Dexie 4 migration code runs only on upgrade (rollback has no downgrade hook). A botched migration on an encrypted vault is unrecoverable user harm: the product's memory is the vault.

**Requirement (this is the full detail behind `02-BUILD-PLAN-AMENDMENTS.md` AM-13).**
1. **WebCrypto never runs inside `upgrade()`.** `upgrade()` only performs synchronous, transactional marking (e.g., set `isEncrypted: 0` on rows needing re-encryption). Actual crypto runs in `db.on('ready')`, held open with `Dexie.waitFor()` so the app doesn't race ahead of migration.
2. **Versioned encryption envelope:** every encrypted field carries `{v, alg, iv, ct}` (version, algorithm, initialization vector, ciphertext). Old and new formats co-exist during migration; the read path dispatches on `v`. The old decryption key/path is not removed until 100% of records are confirmed migrated.
3. **Never change primary keys.** Breaking schema changes go export → new database → import, never in-place.
4. **No stacked legacy version blocks;** rollback of the app is treated as a fresh-install scenario in QA (Dexie cannot downgrade data).
5. A `schemaVersion` marker in `chrome.storage.local` detects stale clients and triggers the guided export/import path instead of a crash.
6. **`docs/MIGRATIONS.md`** (strategy + per-release checklist) and a migration test harness exist **before the first schema-changing release after v1** ships.

**Where it lives.** `src/lib/db.ts` (schema + hooks), `src/lib/crypto.ts` (envelope), `docs/MIGRATIONS.md`, `fixtures/vault/` (test corpus), CI migration job.

**Acceptance test.** The harness builds a fixture vault of **10,000 encrypted records** on schema vN, runs the vN→vN+1 migration, and asserts: zero records lost, every record decrypts, mixed-envelope reads work mid-migration (kill the migration halfway and reopen), and a fresh install on vN+1 works. This test runs in CI for every release that touches the schema.

- [ ] **TRA-04** Build the envelope + `db.on('ready')` migration pattern and the 10k-record harness; write `docs/MIGRATIONS.md`. — **Owner:** AI assistant · **Cost:** $0 · **Deadline/Week:** pattern with M-2/M-6; harness + doc before any post-v1 schema change (AM-13/AA-16) · **Blocks:** any schema-changing release.

---

## TRC-05 — MoR webhook reliability: entitlements survive outages and retries

**Risk (TR-12, TR-13, TR-14; SK-T3; STREAM6 corrections 6, 7, 12; MR-17).** Paddle requires an HTTP 200 within **5 seconds**; anything else (or a serverless cold start overrunning it) counts as failure. Delivery is **at-least-once** and unordered under retry — Paddle retries up to 60 times over 3 days (live mode), then the event is gone forever. Paddle signs `ts:rawBody` with HMAC-SHA256: verifying against a re-serialized JSON body mismatches 100% of the time. A paying customer stuck on the free tier during their deactivation window is the worst-case support scenario — exactly what a mass-suspension purchase spike plus a cold endpoint produces.

**Requirement (referenced by `02-BUILD-PLAN-AMENDMENTS.md` AM-01; provider-agnostic — the Polar path mirrors it).**
1. **Raw-body signature verification:** the webhook route receives the unparsed byte stream (`express.raw({type:'application/json'})` or the platform equivalent), verifies the HMAC against `ts:rawBody` before any JSON parse, and rejects stale timestamps (replay window per provider docs).
2. **Fast-ack pattern:** verify signature → enqueue the event (Supabase queue table) → return 200, all inside the 5-second budget. Processing happens asynchronously. A 200 is returned **only after** the event is durably queued — never before verification, never on a processing failure that lost the payload.
3. **Idempotency by event id:** processed `event_id`s are stored; duplicates are acknowledged and skipped. Handlers tolerate out-of-order arrival (e.g., a refund event landing before its purchase event parks in the queue for retry).
4. **Endpoint:** the webhook route is a **Supabase Edge Function** (hosting per `01-BUILD-SEQUENCE.md` B-09). No always-warm deployment is required: the MoR's retry behavior (Paddle: up to 60 retries over 3 days) combined with idempotency by event id (requirement 3) covers cold starts.
5. **Recovery query:** an operational runbook step + script queries the MoR API for current transaction/license state after any endpoint outage, instead of hoping for replays; manual replay via the provider dashboard is the secondary path. (Paddle-specific retry counts: secondary source — verify against the live dashboard during integration.)
6. **72-hour offline entitlement grace** in the client (see TRC-11) covers users through a backend outage without support tickets.

**Where it lives.** Supabase Edge Functions (`paddle-webhook` / `polar-webhook`, M12), Supabase `licenses` + event-dedup/queue tables (v1.0 §9.2 as amended by AM-01), `docs/RUNBOOK-payments.md` recovery step.

**Acceptance test.** (a) Unit: a byte-identical replay of a signed event is processed once; a tampered body is rejected before parsing. (b) Load: 100 concurrent signed events all ack within 5 seconds and produce exactly 100 license upserts. (c) Chaos drill: take the queue processor down, deliver events, restore — licenses converge with zero loss; then simulate a >3-day gap and prove the recovery query reconstructs state from the MoR API. (d) End-to-end (the amended M-5 gate): Paddle-sandbox purchase → license key issued → case unlocked.

- [ ] **TRA-05** Implement the webhook spine (1–4), the recovery script + runbook (5), and the four tests. — **Owner:** AI assistant · **Cost:** $0 (hosting under B-09) · **Deadline/Week:** Weeks 4–5, before M-W goes live · **Blocks:** M-W and M-5 gates.

---

## TRC-06 — Seller Central DOM churn: the product never depends on Amazon's markup

**Risk (TR-15; MR-14).** Amazon ships UI changes to Seller Central continuously; any selector-coupled harvester breaks without notice, most likely during a mass-suspension wave (peak traffic and peak DOM churn coincide). A CWS review cycle (days to weeks) is too slow for a fix.

**Requirement.**
1. **Paste-mode is the primary architecture** (D3, AM-02): the full decode→classify→compose flow works from user-pasted text with zero page access. DOM-harvest is a convenience layer only, and merges only after the BSA §19 read (gate B-15 in `01-BUILD-SEQUENCE.md`); this control governs its resilience *if* it ships.
2. **Text-not-layout parsing:** page context detected by URL pattern, never by DOM structure; extraction operates on `innerText` of the notification container, falling back to scoped main-content text.
3. **SelfHealingSelectors** (donor pattern): every selector is a ranked candidate chain; a miss walks the chain and reports which candidate matched (telemetry as an opt-in numeric signal, never page content).
4. **Selectors are remote *data*:** the candidate chains load from the remote-settings config (TRC-10) with baked-in defaults, enabling a 0-day selector hotfix without a store review. Remote *code* is banned (MV3/CWS rule).
5. **Failure UX:** when harvest fails, the panel offers paste-mode in one click — identical downstream results (the v1.0 M1 byte-identical-cleanText rule), never an error dead-end.

**Where it lives.** `src/content/sellerCentral.ts` + `src/lib/noticeParser.ts` (M1), selector config in the `remote-settings` payload (M12), paste UI in the panel (M8) and `/decode` page (M9/web).

**Acceptance test.** (a) Fixture suite: DOM-mode and paste-mode produce byte-identical `Notice.cleanText` on every fixture. (b) Mutation test: fixtures with renamed classes/ids and restructured wrappers still parse via lower-ranked candidates or scoped-text fallback. (c) Drill: push a selector change via remote-settings in staging → clients pick it up within 24 hours without an extension update. (d) Kill-all-selectors drill: with an empty selector config, the panel still decodes via paste-mode with no console errors.

- [ ] **TRA-06** Implement 2–5 and run all four drills before the extension's public listing. — **Owner:** AI assistant · **Cost:** $0 · **Deadline/Week:** Weeks 4–7 (M-6), drills before M-7 · **Blocks:** M-6 gate; DOM-harvest merge additionally blocked by B-15 (§19 read).

---

## TRC-07 — Gemini Nano unavailability: never assume on-device AI exists

**Risk (TR-08, TR-09; STREAM6 corrections 2, 10, 11; MR-13).** Nano's hardware gate is steep: desktop only, 22 GB free disk on the Chrome-profile volume, >4 GB VRAM GPU or 16 GB RAM + 4-core CPU, multi-GB first download — and Chrome purges the model when free disk drops below 10 GB or criteria lapse ~30 days (secondary source), so availability flaps on real machines. The API surface has churned (the old `window.ai.languageModel` shape and the `aiLanguageModelOriginTrial` permission are dead). A large share of business laptops will never run Nano.

**Requirement (implements the AM-07 inversion — cloud is the primary quality path).**
1. **Roles, fixed:** cloud Gemini Flash (paid tier, via our backend — D9) produces the paid POA deliverable; Nano is the opportunistic free/private/instant path for triage, classification, and field extraction **when available**; rules-only decode is the floor. The UX presents cloud as first-class, never as "degraded".
2. **Feature-detect per session:** `globalThis.LanguageModel` existence, then `availability()` → handle all four states: `unavailable` (skip Nano silently), `downloadable` (one-time consent card; `create()` requires user activation), `downloading` (progress via `downloadprogress`; never block the flow on it), `available` (use it). Re-check per session — yesterday's `available` can be today's `unavailable` after model eviction.
3. **No expired API residue:** manifest carries no origin-trial permission; grep `aiLanguageModelOriginTrial|window\.ai` = 0. Verify the current API/permission surface against Chrome-stable docs at build time (the surface has churned before).
4. **Context budget enforced** (v1.0 §11.3): Nano's ~6–9K-token window is checked via `inputQuota`; overflow → deterministic pre-summary or route to cloud. Never silently truncate a notice.
5. **Privacy note:** `availability()` is a hardware-fingerprinting-grade probe (secondary source); call it only when an AI feature is actually about to run, never speculatively at install.
6. Every Nano-absent path ends in a working outcome: consented cloud, or rules-only decode — never an error state that blames the user's hardware.

**Where it lives.** `src/background/llm/` capability gate + routing (M3/M5), backend `reason` proxy (M12, paid-tier key server-side only per AM-08), consent copy in `src/options/` settings (M9).

**Acceptance test.** (a) QA matrix runs the full decode flow in all four availability states (mocked) plus `cloudConsent=false` — every cell produces a correct decode via the best available path, zero cloud calls without consent, zero errors. (b) Grep check from requirement 3 is a CI gate. (c) Fresh Chrome-138 profile on hardware below the gate (or mocked `unavailable`): free decode works via rules-only; paid flow works via cloud.

- [ ] **TRA-07** Implement the capability gate, routing, and the QA matrix. — **Owner:** AI assistant · **Cost:** cloud calls ~$0.02/case (estimate) · **Deadline/Week:** with M-3/M-4 (Weeks 2–5) · **Blocks:** M-3 gate ("zero cloud calls when consent absent") and M-W quality bar.

---

## TRC-08 — Cloud cost runaway: a spend cap the free tier cannot breach

**Risk (MR-30, MR-15; D9; AM-12).** Per-case cloud cost is trivial (~$0.02, estimate), but a free public decoder during a mass-suspension wave is an unbounded spend and abuse surface (scripted abuse included). The founder's runway is ~$1,100–2,300; an uncapped API bill is an existential bug, not an inconvenience.

**Requirement (must be live BEFORE the free web tier is public).**
1. **Backend daily spend cap** (hard $ ceiling, configurable) — a circuit breaker: when tripped, cloud endpoints return a typed `degraded` response, not 5xx.
2. **Per-device/IP rate limits** at the `reason` proxy. The rate limits and the daily spend cap are set from the measured ~100-fixture-draft load test against the paid Gemini tier (see `01-BUILD-SEQUENCE.md` B-19), never guessed; the v1.0 §11.2 defaults (free tier 10 cloud calls/day, pass 200/case) are placeholders until the measured number lands, tuned from real data thereafter.
3. **Graceful degradation in every client** (web + extension): on `degraded`, the product falls back to rules-only decode with honest UI copy ("full AI analysis is briefly busy — here is the rules-based decode"), and recovers automatically at the next budget window. Never an error page.
4. **Paid-tier protection:** pass-holders draw from a reserved budget slice so free-tier load cannot starve a paying customer mid-case.
5. Spend and trip events alert the founder (email/webhook) the moment the breaker trips.

**Where it lives.** Backend `reason` edge function + budget table (M12), typed `degraded` handling in `src/core/` decode orchestration (shared by web and extension), alerting in the ops config.

**Acceptance test (the AM-12/AA-15 gate).** Simulated spike: scripted load trips the breaker → both clients visibly degrade to rules-only and keep decoding → budget window rolls over → cloud path recovers with no deploy and no restart. A parallel paid-case request during the trip still completes on the reserved slice.

- [ ] **TRA-08** Implement cap + limits + reserved slice + typed degradation + alerting; run the spike drill. — **Owner:** AI assistant · **Cost:** $0 · **Deadline/Week:** Week 4–5, before M-W public · **Blocks:** M-W gate (hard blocker — the free tier does not go public without it).

---

## TRC-09 — CWS review and rejection: submit clean, keep a fallback

**Risk (TR-01, TR-02, TR-03, TR-17; STREAM6 correction 8).** The likeliest rejection causes are mechanical: excessive/unused permissions, a data-disclosure form that mismatches the privacy policy or actual flows, and Limited-Use violations (enforced since 1 Aug 2026). Independent of rejection, this profile — new developer + 16 Seller Central host permissions + AI API — makes **manual review** probable: expect 1–3 weeks (estimate), not hours.

**Requirement.**
1. **Permissions minimalism enforced by audit:** manifest permissions (`storage`, `unlimitedStorage`, `alarms`, `notifications`, `offscreen` — no `tabs`, no `scripting`, no `<all_urls>`) are diffed against actual call sites before every submission; anything unused is removed. Host permissions stay the enumerated Seller Central domain list (v1.0 §8) — and shrink to zero if B-15 de-scopes to paste-only.
2. **Disclosure coherence:** privacy policy (live on the domain), CWS data-disclosure form, and in-product consent copy all describe the same flows — notice text processed locally, transmitted only under explicit cloud consent; telemetry opt-in, event names + numeric props only, never notice content (M13).
3. **Reviewer kit:** one-sentence justification per permission in the review notes; a **paste-mode demo video** proving core functionality without page access; single-purpose statement; honest paid-functionality disclosure for the external MoR checkout.
4. **Unlisted fallback:** the extension ships to design partners as an unlisted build regardless of review state; the web surface (live since M-W) is the revenue bridge while any review or appeal runs. A rejection is a process step, not a launch blocker.
5. Submission mechanics, listing copy rules, and trader verification are owned by `../04-PHASE-3-LAUNCH/02-CHROME-WEB-STORE-SUBMISSION.md` — this control owns the technical preconditions.

**Acceptance test.** Pre-submission CI checklist passes: permission-vs-callsite diff clean; grep for banned tokens (`guarantee` user-facing, `aiLanguageModelOriginTrial`, `lemonsqueezy`) = 0; data-disclosure form content matches the privacy policy section-by-section (manual sign-off recorded); demo video linked in the submission; unlisted channel verified installable by a design partner.

- [ ] **TRA-09** Build the pre-submission checklist into CI + a `docs/CWS-SUBMISSION-CHECKLIST.md`; produce the paste-mode demo video. — **Owner:** AI assistant (checklist, video draft), Founder (submission + sign-offs) · **Cost:** $0 (CWS $5 already under B-04) · **Deadline/Week:** Week 7 (M-7) · **Blocks:** M-7 gate.

---

## TRC-10 — Broken release during a mass-suspension wave: kill switch + staged rollout

**Risk (MR-20; AM-14).** The most likely moment for a breaking failure (Amazon DOM churn, a bad release, an API regression) is exactly when traffic peaks — a mass-suspension wave. Users mid-deactivation cannot wait for a store review cycle.

**Requirement (hard M12 requirements, per AM-14).**
1. **Remote-settings kill switch:** per-feature flags (`domHarvest`, `injector`, `cloudPath`, plus room for future features) and a `minSupportedVersion` field, served as remote **data** (JSON — never code), fetched by the SW on a daily alarm and at startup. **Fail-safe defaults baked into the build:** if the config is unreachable, the extension runs its shipped defaults (paste-mode always on) — the kill switch can only turn risky features OFF, never turn unshipped code on.
2. **`minSupportedVersion` behavior:** a client below it disables risky features and shows a calm "please update" notice — it never bricks decode/paste, and never destroys local data.
3. **Staged rollout:** once the install base exceeds CWS partial-rollout eligibility (~10,000 users — verify the current threshold when first eligible), every CWS release goes 5% → 25% → 50% → 100%, with a written halt criterion (error-telemetry spike or support spike) and a named person (Founder) authorized to halt. Below the threshold every release is effectively big-bang: the substitute control is hardened pre-release QA + the tested remote-settings kill switch.
4. **0-day hotfix path:** selector config via TRC-06 requirement 4; feature disable via the kill switch — both without a store review. A full code hotfix goes through expedited CWS submission with the previous stage held.
5. The web decoder deploys independently of the extension — a web-side rollback is a redeploy, minutes not weeks.

**Where it lives.** Backend `remote-settings` route (M12), SW config fetcher + flag gates (M0/M8/M11 call sites), rollout SOP in `docs/RELEASES.md`, CWS rollout controls.

**Acceptance test (the AM-14/AA-17 drill).** In staging: flip each feature flag OFF → every client degrades to paste-mode (or the feature-absent path) within 24 hours, without an update, with no console errors; set `minSupportedVersion` above the installed build → the update notice appears and core decode still works; restore the config → features return. The rollout SOP is walked once on the first post-launch release.

- [ ] **TRA-10** Implement kill switch + `minSupportedVersion` + staged-rollout SOP; run the full drill in staging. — **Owner:** AI assistant (build + drill), Founder (halt authority, SOP sign-off) · **Cost:** $0 · **Deadline/Week:** before M-6 gate (Week 6–7) · **Blocks:** M-7, and the Gate-2 rollback check in `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`.

---

## TRC-11 — License and clock tampering: tamper resolves to the free tier

**Scope note added 11 Sep 2026:** everything below describes the offline-capable **browser extension** design (a signed cache in `chrome.storage.local`, an offline grace period, a service-worker alarm) — none of that exists yet because the extension hasn't been built (M-7/M-8, per D3). The **web app**, live today, uses a deliberately simpler **server-truth-only** model: `src/lib/license.ts` asks Supabase directly on every check, no local cache, so there is nothing to tamper with client-side and no offline grace to protect. That's a reasonable design for an always-online web app, not a gap — this section's requirements become active once the extension ships and genuinely needs to work offline.

**Risk (v1.0 M11; MR-09 adjacent).** A $199 one-time unlock invites local tampering: edited entitlement cache, system clock rolled back to stretch the 72-hour offline grace, replayed stale entitlements.

**Requirement.**
1. **Signed entitlement cache:** the backend returns `{tier, passCases, subActive, exp}` signed (HMAC with a backend-only secret); the SW caches it in `chrome.storage.local` and verifies the signature on every read. Invalid signature → treat as free tier, silently re-fetch.
2. **Daily revalidation** via alarm against `verify-license`; **72-hour offline grace** measured against monotonic evidence (last-verified server timestamp embedded in the signed payload), so a rolled-back system clock cannot extend grace.
3. **Tamper → free tier, never a lockout:** the user keeps free-tier function and gets a "restore your license" path (re-enter key / re-verify). No data is ever deleted on entitlement failure — the vault is the user's regardless of tier.
4. All enforcement decisions are server-side (the client check is a cache); the severity-gated violation types (fraud/forged-docs/child-safety) can never reach checkout regardless of entitlement state (M3 gating).

**Where it lives.** `src/background/licensing.ts` (M11), backend `verify-license` + signing in the bootstrap route (M12), Supabase `licenses` table.

**Acceptance test (from the v1.0 M11 gate, amended).** (a) Hand-edited entitlement cache → free tier + restore path, no crash, no data loss. (b) Clock rolled back 30 days mid-grace → grace expires on schedule (server-timestamp math), not extended. (c) Revoked license (refund/chargeback webhook) downgrades the client within 24 hours. (d) Paddle-sandbox purchase → unlock → revoke → downgrade, end to end.

- [ ] **TRA-11** Implement signed cache + monotonic grace + tamper-to-free behavior with tests a–d. — **Owner:** AI assistant · **Cost:** $0 · **Deadline/Week:** Week 5–6 (M-5) · **Blocks:** M-5 gate.

---

## TRC-12 — Device-limit enforcement: keys get shared; the server decides

**Risk (MR-09, MR-21; AM-11).** A one-time $199 key will be posted to forums (high likelihood). Unlimited activations turn one sale into many; heavy-handed enforcement (support-ticket-only deactivation, legal threats) burns trust in a scam-scarred market.

**Requirement.**
1. **Server-side activation limit of 3–5 devices per license key** (start at 5; tighten only on observed abuse), enforced in `verify-license` — the client never decides. Schema: an `activations` table (or `licenses.device_ids jsonb` with count enforcement), device identified by the install-generated `deviceId` UUID.
2. **Self-service deactivation:** the user can free a slot from the settings UI (and from the license email's manage link) without contacting support. The refusal message on device N+1 names the limit and links straight to deactivation.
3. **Tone policy:** anomalous sharing (many activations, geographic spread) triggers a friendly email and, where sensible, an affiliate-conversion offer — community engagement over legal threats (MR-09/MR-21 mitigation); no automated bans.
4. Deactivation takes effect server-side immediately and client-side at the next revalidation (≤24 h, or instantly on manual re-verify).

**Where it lives.** Supabase `activations`/`licenses` (schema per AM-11), `verify-license` edge function (M12), settings UI in `src/options/` (M9) and the web license-management page.

**Acceptance test (the AM-11/AA-14 gate).** Activate the limit's worth of devices → activation N+1 is refused with the clear UI path → user deactivates an old device self-service → N+1 activates successfully; the whole loop completes with zero support contact. Server logs show the enforcement decision happened server-side.

- [ ] **TRA-12** Implement limit + self-service deactivation + the refusal UX; run the full loop test. — **Owner:** AI assistant · **Cost:** $0 · **Deadline/Week:** before the M-5 gate (Week 5–6) · **Blocks:** M-5 gate and Gate 3 ("anti-piracy controls active", `../00-DECISION/03-GATES-AND-KILL-CRITERIA.md`).

---

## Disposition of the STREAM6 register — every TR item accounted for

All twenty TR items from `APPEALDECK_STREAM6_TECHNICAL_RISK.md` were reviewed against the synthesis brief's corrections. Kept items map to a control above; dropped or reassigned items are explained here.

| TR | Topic | Disposition |
|---|---|---|
| TR-01 | CWS excessive-permissions rejection | **Kept** → TRC-09 (audit + minimalism). |
| TR-02 | CWS data-disclosure/privacy mismatch | **Kept** → TRC-09 (disclosure coherence). |
| TR-03 | CWS manual-review delay | **Kept** → TRC-09 (reviewer kit, unlisted fallback); the M-W web surface (D3) is the strategic absorber. |
| TR-04 | SW terminated mid-inference | **Kept** → TRC-01 (staged pipeline, <4-min budget). |
| TR-05 | Offscreen-document creation race | **Kept** → TRC-01 (getContexts guard). |
| TR-06 | `chrome.storage.session` missing on old Chrome | **Dropped — closed by design.** Minimum Chrome is 138 (v1.0 §8); the API landed in 102. No control needed. |
| TR-07 | Alarm minimum breaks sub-minute checks | **Kept** → TRC-02. |
| TR-08 | LanguageModel API shape churn | **Kept** → TRC-07 (feature-detect, no origin-trial residue, build-time re-verify). |
| TR-09 | Nano unavailable on user hardware | **Kept, amended** → TRC-07. STREAM6's "Nano → cloud → rules" tier order is superseded by the AM-07 inversion: cloud paid tier is the primary quality path; Nano is opportunistic. |
| TR-10 | Dexie migration corrupts vault | **Kept** → TRC-04. |
| TR-11 | Key rotation loses ciphertext | **Kept** → TRC-04 (versioned envelope, old key retained until 100% migrated). |
| TR-12 | Paddle webhook lost in outage | **Kept** → TRC-05 (recovery query, idempotency). |
| TR-13 | Signature verification vs parsed body | **Kept** → TRC-05 (raw-body verification). |
| TR-14 | Retry budget exhausted during downtime | **Kept** → TRC-05 (fast-ack + queue; Paddle's 60-retries/3-days + idempotency covers cold starts on the Supabase Edge Function). |
| TR-15 | Seller Central DOM churn | **Kept** → TRC-06. |
| TR-16 | BSA Agent Policy covers the injector | **Reassigned — not a build control.** This is a compliance ship/kill decision, resolved by the settled architecture (paste-mode primary; DOM-harvest gated on the §19 full-text read; injector last-or-never; never automation) — see `02-BUILD-PLAN-AMENDMENTS.md` AM-02 and gate B-15 in `01-BUILD-SEQUENCE.md`. STREAM6's narrower mitigation ("legal review of the value-setter, ships M8") understated the risk per the brief's correction; TRC-06 and TRC-10 carry the technical remnants (resilience, feature flag, kill switch). |
| TR-17 | CWS Limited-Use / AI-safeguard violation | **Kept** → TRC-09 (requirement 2) with telemetry design in M13. |
| TR-18 | Alarm enforcement breaks deadline precision | **Dropped — duplicate.** Same fact as TR-07; merged into TRC-02. |
| TR-19 | Offscreen memory pressure / closure | **Kept** → TRC-01 (create-on-demand, close-after-use, existence check). |
| TR-20 | Session storage cleared on exit loses key | **Kept** → TRC-03. |

**STREAM6 "assumes X but actually Y" correction table:** rows 1, 3, 4, 5, 6, 7, 10, 11, 12, 13, 14 are folded into TRC-01…TRC-07 as stated requirements; row 2 (API shape) → TRC-07; row 8 (manual-review probability) → TRC-09; row 9 (BSA §19 vs read-only precedent) → AM-02/B-15 as above; row 15 (EU 14-day withdrawal right vs "no refund after generation") is **not a technical control** — it is settled product policy (D8, implemented via AM-05: 7-day voluntary refund + EU-compliant checkout consent) and is excluded from this register.

---

## Definition of done

- [ ] All twelve action items TRA-01…TRA-12 checked, or descoped with a reason logged in `docs/DECISIONS.md`.
- [ ] Every acceptance test in TRC-01…TRC-12 is automated where possible and wired into CI or the release checklist; the three drills (spike → breaker, kill-switch flip, selector hotfix) each ran at least once in staging with the result recorded.
- [ ] No milestone gate in `01-BUILD-SEQUENCE.md` was signed off while a control homed in that milestone's modules had a failing or unrun acceptance test.
- [ ] The disposition table above still matches reality: any newly discovered technical risk was added as a TRC with the same risk/requirement/location/acceptance structure, and any dropped control has its reason logged.
- [ ] Grep gates hold across `src/`, backend, and docs: `setInterval|setTimeout` in `src/background/` = 0; `localStorage` in extension source = 0; `aiLanguageModelOriginTrial` = 0; the banned token `guarantee` = 0 in user-facing copy.
