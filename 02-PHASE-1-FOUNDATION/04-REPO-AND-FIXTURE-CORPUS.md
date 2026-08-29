# Repo & Fixture Corpus — the clean code workspace and the test corpus everything is measured against

**Why this file exists / when to use it:** Two Week-1 deliverables live here. First, the code workspace: `V:\AppealDeck` becomes a git repository (this playbook lives alongside the code), scaffolded per the build plan, with a `.gitignore` and CI designed so the credential leak that poisoned the old codebase **cannot recur**. Second, the fixture corpus: a set of realistic-but-synthetic Amazon enforcement notices with expected outputs — built FIRST because it is the acceptance instrument for milestone M-3 (classifier accuracy ≥90%) and lets milestones M-1→M-5 proceed with **no live Amazon account at all**. Execute in Week 1 (repo) and Week 1–2 (corpus).

Glossary: **CI** = continuous integration (automated checks on every push). **MV3** = Chrome extension Manifest V3. **Fixture** = a stored test input plus its expected output. **ODR** = Order Defect Rate, an Amazon performance metric whose breach triggers suspensions. **Section 3** = the clause of Amazon's Business Solutions Agreement under which fraud/inauthenticity/illegality deactivations are issued. **IP** = intellectual property. **POA** = Plan of Action. **Donor code** = files from the founder's previous projects, legally cleared for reuse (build plan §6). **LLM** = large language model.

---

## 1. Git init and repository layout

The playbook directories (`00-DECISION/` … `08-TEAM/`) and the code scaffold share one repository at `V:\AppealDeck`. Committing the playbook is deliberate: it contains no secrets, and it is the AI assistant's persistent memory across sessions (see §4).

- [ ] **1.** `git init` in `V:\AppealDeck`; first commit = the playbook files + `LICENSE` (proprietary, © Jhangir Hussain) + `.gitignore` (§2) + `README.md` (two lines: what AppealDeck is, pointer to `00-DECISION/01-VERDICT.md`). Default branch `main`. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1, Day 1–2 · **Blocks:** all code work, Gate 1 check 9
- [ ] **2.** Scaffold the code skeleton per build plan §5 (`../03-PHASE-2-BUILD/reference/APPEALDECK_BUILD_PLAN_v1.0.md`): `package.json` (name `appealdeck`), `vite.config.ts` + `manifest.config.ts`, `tsconfig.json` (strict), `src/` tree, `fixtures/notices/`, `backend/`, `supabase/`, `docs/` (with `DECISIONS.md`, the running decision log the AI assistant appends to). Two build order amendments apply: the core (`parse → classify → compose → critic`) lives platform-agnostic so `npm run build:web` produces the web decoder bundle and `npm run build` the MV3 extension (decision D3, see `../03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md`); and the §2.5 payment env vars are replaced per §3 below (Lemon Squeezy is dead, decision D2). — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** M-1 acceptance (`npm run build` produces a loadable extension)
- [ ] **3.** Donor-code discipline: copy donor files only from the build plan §6 approved list (never symlink, never from the §2.6 forbidden sources — `spchatgpt*`, `chunked/`, `dist/`, anything mentioning "superpower"). After **every** copied file: `grep -i superpower <file>` must return zero hits before commit. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** continuous · **Blocks:** legal cleanliness of the codebase (the entire reason this repo exists outside `V:\Extension 2.3`)

---

## 2. .gitignore and the never-again rules

**Background (why this is non-negotiable):** the old project leaked its Postgres password and Supabase keys because (a) real values sat in tracked files, and (b) the old `build.js` copied `.env.local` into `dist\`, which then shipped inside build outputs. Details and the rotation procedure: `../01-PHASE-0-BLOCKERS/01-CREDENTIAL-ROTATION.md`. The rules below make both failure modes structurally impossible.

- [ ] **4.** `.gitignore` committed **before** any other file can be staged, containing at minimum: `.env*`, `node_modules/`, `dist/`, `*.pem`, `*.zip` (plus editor/OS noise: `.DS_Store`, `*.local`). Exception line `!.env.example` so the template stays tracked. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1, Day 1 (first commit) · **Blocks:** every subsequent commit
- [ ] **5.** Build-output rule: no build or packaging script may ever copy `.env*` into any output directory; the release checklist greps the `dist/` output for `eyJ` (JWT prefix), `.env`, and the Supabase project ref before any zip leaves the machine. This exact bug caused the old leak. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** standing rule from Week 1 · **Blocks:** safe releases
- [ ] **6.** Secrets live only in deployment environments (Supabase function secrets, GitHub Actions secrets, Cloudflare/Vercel dashboards) and the founder's password manager. Real values never appear in the repo, chat logs committed to the repo, or the playbook. — **Owner:** Founder (holds) + AI assistant (enforces) · **Cost:** $0 · **Deadline:** standing rule · **Blocks:** everything §2 exists to protect

---

## 3. Private GitHub remote, CI, and .env.example

- [ ] **7.** Create a **private** GitHub repository under the founder's account (2FA on, per `./01-ACCOUNTS-AND-SERVICES.md` §3); push `main`. No collaborators exist today (solo founder); if a future contractor ever needs repo access, the collaborator policy binds them first (`../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md`) and they get a scoped collaborator invitation — never shared credentials. — **Owner:** Founder (creates), AI assistant (pushes) · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** CI, off-machine backup of the codebase
- [ ] **8.** GitHub Actions CI on every push and pull request: **typecheck** (`tsc --noEmit`) → **unit tests** (Vitest, includes the fixture-loader test in §5) → **build** (`npm run build` and `npm run build:web`). CI must be green on the empty scaffold before feature work starts (M-1 acceptance). — **Owner:** AI assistant · **Cost:** $0 (free tier) · **Deadline:** Week 1 · **Blocks:** M-1, every later milestone's regression safety
- [ ] **9.** Add two grep gates to CI, failing the build on any hit: (a) `guarantee` in `src/`, site copy, and store-listing text (decision D6's ethics gate, checked by machine, not memory); (b) `superpower` anywhere in the repo (forbidden-source tripwire). A free secret scanner (e.g. gitleaks) as a third CI step is recommended. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1–2 · **Blocks:** Gate 2 check 16 automation
- [ ] **10.** Commit `.env.example` with empty values — build plan §2.5 amended for decision D2 (Paddle/Polar replace Lemon Squeezy):

```
# Supabase (backend only)
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
# LLM (backend only — paid tier for production, free tier for dev fixtures only, D9)
GEMINI_API_KEY=
GEMINI_MODEL=                       # verify current Flash model id at build time
# Payments (backend only) — D2: Paddle primary
PAYMENTS_PROVIDER=paddle            # paddle only
PADDLE_API_KEY=
PADDLE_WEBHOOK_SECRET=
PADDLE_PRICE_APPEAL_PASS=
PADDLE_PRICE_GUARDIAN_SUB=          # SKU exists but is not sold (D7)
```

— **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1 · **Blocks:** backend work, `./03-PAYMENTS-SETUP.md` §5 wiring

---

## 4. CLAUDE.md — the AI-session continuity file

A lost AI session must cost minutes, not hours (Gate 1 check 10). `CLAUDE.md` at the repo root is what every fresh AI session reads first. The **full content spec and the handoff ritual live in `../08-TEAM/03-AI-SESSION-CONTINUITY.md`** — this file only fixes the creation deadline and the minimum contents:

1. One-paragraph product definition + the settled decisions D1–D10 (pointer to `../00-DECISION/02-DECISION-LOG.md`).
2. The build order (D3) and current milestone status (updated at every session end).
3. The forbidden-sources list (build plan §2.6) and the donor-copy grep rule.
4. The banned-numbers list and the two banned-copy rules (no "guarantee", no success-rate claims) — the AI must never reintroduce them.
5. Security rules: no secrets in the repo, `.env*` never copied to outputs, Gemini free tier = synthetic fixtures only.
6. The handoff ritual: append every non-trivial decision to `docs/DECISIONS.md` with date and rationale before ending a session.

- [ ] **11.** Create `CLAUDE.md` per the spec above (full spec: `../08-TEAM/03-AI-SESSION-CONTINUITY.md`); founder reads it once and confirms it matches reality. — **Owner:** AI assistant (drafts), Founder (confirms) · **Cost:** $0 · **Deadline:** Week 1, Day 1–2 · **Blocks:** Gate 1 check 10, every AI build session

---

## 5. The fixture corpus — build FIRST (blocks milestone M-3)

**What it is:** `fixtures/notices/` — a corpus of enforcement-notice test cases, each a raw input (`raw.html` or `raw.txt`) plus an `expected.json` (correct classification, extracted facts, deadlines). It is the measuring stick for the parser and classifier: M-3's acceptance gate is "fixture accuracy ≥90%", and the corpus is also the audition instrument for appeals-expert vetting (`../01-PHASE-0-BLOCKERS/02-COLLABORATOR-POLICY.md`, decision D5). Because the corpus stands in for Seller Central, no live Amazon account is needed until the Week-6 live-QA gate.

### 5.1 Required coverage

| v1 violation type | Minimum realistic fixtures | Mandatory variants across the set |
|---|---|---|
| ODR (performance suspension) | ≥4 | 60-day vs 90-day **stated** response windows; HTML and plaintext forms |
| Section 3 — inauthentic (supplier/invoice) | ≥4 | funds-hold paragraph present vs absent; marketplace variants (e.g. .com vs .co.uk) |
| Section 3 — IP complaint | ≥4 | rights-owner named vs anonymous; ASIN-level vs account-level language |
| Listing-level (ASIN takedown) | ≥4 | with and without a stated reinstatement path (incl. Seller Challenge language) |
| Unknown / garbage | ≥4 | ambiguous wording, truncated notices, non-enforcement Amazon mail |

**Plus adversarial fixtures (all mandatory):**

| Adversarial fixture | Expected behavior |
|---|---|
| A shipping notification (ordinary Amazon operational email) | Classifies **UNKNOWN** — never invents a violation |
| A phishing-style fake notice (off-domain links, credential bait) | Classifies UNKNOWN; parser flags suspicious markers; product never treats it as a real case |
| An empty page / empty string | Graceful error, no crash, no LLM call |
| One fixture carrying legacy "17 days" phrasing | Parsed as the stated window of **that notice only**, flagged `legacySoftDeadline: true` — never presented as current Amazon policy (the "17 days to submit" claim is a stale 2017–19 artifact; current notices state their own windows) |

Total: ≥20 realistic + ≥4 adversarial ≈ 25+ fixtures, matching the Round-3 finding that ~25–30 fixtures (not "10,000 templates") is the real data need. [source: The Second Opinion.md; APPEALDECK_BUILD_PLAN.md §13.1]

### 5.2 expected.json contract (one per fixture)

```
{
  "type": "ODR | SECTION3_INAUTHENTIC | SECTION3_IP | LISTING_LEVEL | UNKNOWN",
  "severityGate": "none | professional_help",        // forged-docs/fraud/child-safety route to help, never checkout (D6)
  "facts": {
    "marketplace": "...", "asins": ["B0TEST…"],
    "statedWindowDays": 90,                           // parsed from THIS notice — never assumed constant
    "fundsHoldPresent": true,
    "legacySoftDeadline": false
  },
  "deadlines": {
    "responseDue": "<deactivation + statedWindowDays>",
    "fundsAppealEligible": "<deactivation + 60d>"     // corrected model — see ../03-PHASE-2-BUILD/01-BUILD-SEQUENCE.md §4
  }
}
```

Deadline expectations must encode the **corrected deadline model** (funds appeal eligible at +60 days since Oct 2024; funds review at +90 days is a checkpoint, never automatic; fraud-class holds have no countdown; Seller Challenge stage for listing-level) — not the v1.0 build plan's Appendix D.

### 5.3 Sourcing rules (legal/ethical — absolute)

1. **Source material:** public seller-forum posts (Amazon Seller Central forums, Reddit) where sellers quote their notices — **rewritten, never copied verbatim** (copyright + privacy), then anonymized: invented business names, synthetic ASINs, randomized order IDs, shifted dates.
2. **Synthetic variants:** generated from the rewritten bases (window lengths, funds-hold paragraph, HTML vs plaintext, marketplace). The Gemini **free** tier may assist here — fixtures are synthetic by construction, which is exactly what the free tier is restricted to (decision D9).
3. **Never** use a real seller's confidential documents. **Never** buy freelancers' past client appeals as source material — that work product belongs to their clients and embeds client-confidential facts (struck as toxic in the Round-3 audit, same discipline as the forbidden-source code ban).
4. Every fixture gets a one-line provenance note in a `SOURCES.md` inside `fixtures/notices/` ("rewritten from public forum post, anonymized" / "synthetic variant of odr-01").

### 5.4 Actions

- [ ] **12.** Build the corpus per §5.1–§5.3: directory per fixture (`fixtures/notices/<type>/<id>/raw.(html|txt)` + `expected.json`), provenance notes in `SOURCES.md`. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 1–2 · **Blocks:** milestone M-3 acceptance (classifier accuracy ≥90%), Gate 1 check 8, expert-audition mechanics (D5)
- [ ] **13.** Add a Vitest fixture-loader test to CI: every fixture directory parses, every `expected.json` validates against the §5.2 schema (zod), counts meet §5.1 minimums. The corpus is "built" only when this test is green. — **Owner:** AI assistant · **Cost:** $0 · **Deadline:** Week 2 · **Blocks:** trustworthy M-3 accuracy measurement
- [ ] **14.** Select one Section 3-inauthentic fixture and prepare the **audition variant** with the two traps (ambiguous response window + a missing supplier invoice — fabricating the invoice is an instant fail; asking for it scores top marks). Keep it out of the public repo history if auditions will reuse it. — **Owner:** AI assistant (prepares), Founder (uses in auditions) · **Cost:** $0 · **Deadline:** Week 2 (auditions start Week 2) · **Blocks:** expert vetting per decision D5

---

## Definition of done

- [ ] `V:\AppealDeck` is a git repo: playbook + code scaffold committed, `LICENSE` (© Jhangir Hussain) and `README.md` present, default branch `main`.
- [ ] `.gitignore` (`.env*`, `node_modules/`, `dist/`, `*.pem`, `*.zip`, with `!.env.example`) was in the **first** commit; no secret has ever been tracked (verify: `git log --all --diff-filter=A -- "*.env*"` shows only `.env.example`).
- [ ] Private GitHub remote live; CI green on every push: typecheck + unit + both builds + the two grep gates ("guarantee" = 0 in shipped copy, "superpower" = 0 anywhere).
- [ ] `.env.example` committed with the D2-amended variable set; real values exist only in deployment environments and the founder's password manager.
- [ ] `CLAUDE.md` created per `../08-TEAM/03-AI-SESSION-CONTINUITY.md` and confirmed by the founder; `docs/DECISIONS.md` exists and the handoff ritual is in use.
- [ ] Fixture corpus complete: ≥4 realistic fixtures per v1 type + all adversarial fixtures, each with a schema-valid `expected.json` encoding the corrected deadline model; provenance noted; fixture-loader test green in CI.
- [ ] The audition fixture with both traps is ready for Week-2 expert auditions.
- [ ] Donor copies (if any yet) all pass the "superpower" grep; nothing originates from a §2.6 forbidden source.
