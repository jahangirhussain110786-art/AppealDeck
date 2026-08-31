# Credential Rotation — Leaked Supabase/Postgres Secrets (Day 1, blocks everything)

**Why this file exists / when to use it:** The predecessor project at `V:\Extension 2.3` contains live database credentials in plaintext — including inside a build output folder (`dist\`) that may have been zipped and shared. Until those credentials are rotated (replaced with new ones so the leaked values stop working), nothing in the AppealDeck project may touch the affected Supabase project, and no new infrastructure may be created that reuses any of these secrets. Execute this file first — before the collaborator policy, before the individual-seller setup, before any code. It takes under an hour.

**Owner of the whole file:** Founder. **Cost:** $0. **Deadline:** Day 1. **Blocks:** everything else in this playbook.

Terms used below: **Supabase** = the hosted backend platform (Postgres database + API) the old project used. **Postgres password** = the master database password. **Anon key / service key** = Supabase API keys issued as JWTs (JSON Web Tokens — long strings starting with `eyJ`); the service key grants full admin access to the database. **Project ref** = Supabase's unique ID for a project; the compromised project is `fogvzjtxbqgfppdrxqra`.

---

## 1. What leaked, and where (exact inventory)

All paths are under `V:\Extension 2.3\`. [source: PROJECT_STATE_HANDOFF.md §3; APPEALDECK_BUILD_PLAN.md §2.1]

| # | File | Line | What is exposed | Severity |
|---|------|------|-----------------|----------|
| 1 | `list-tables.js` | 4 | Postgres password, plaintext | High |
| 2 | `extraction\run-migration.mjs` | 4 | Postgres password, plaintext | High |
| 3 | `extraction\.env.local` | whole file | Postgres password + Supabase anon JWT + keys | High |
| 4 | `dist\extraction\.env.local` | whole file | Same as #3 — **shipped inside a build output**, i.e. potentially distributed outside this machine | **Critical** |
| 5 | `extraction\seed-templates.mjs` | 2 | Supabase anon JWT + keys, hardcoded | High |

Compromised Supabase project ref: **`fogvzjtxbqgfppdrxqra`**.

**Root cause:** the old `build.js` did not exclude `.env*` files, so secrets were copied into `dist\`. Treat every leaked value as fully public — assume anyone who ever received a build zip, a repo copy, or a backup has them. Rotation (step 3–4) is what makes the leak harmless; scrubbing files (step 5) is secondary hygiene.

**Handling rule while you work:** never paste any of these credential values into a chat window, AI assistant, support ticket, email, or notes file. You only ever need the *first ~6 characters* of the old password for the verification grep in step 6.

---

## 2. Procedure

- [ ] **Step 1 — Confirm the inventory.** Open the five files listed above and visually confirm the secrets are where the table says. Do not copy the values anywhere. If a file is already missing, note it and continue.
  **Owner:** Founder · **Cost:** $0 · **Deadline:** Day 1 · **Blocks:** Steps 2–7

- [ ] **Step 2 — Log in to the Supabase dashboard** at `supabase.com/dashboard` with the account that owns project `fogvzjtxbqgfppdrxqra`. If two-factor authentication (2FA) is not enabled on this Supabase account, enable it now (Account → Security).
  **Owner:** Founder · **Cost:** $0 · **Deadline:** Day 1 · **Blocks:** Steps 3–4

- [ ] **Step 3 — Rotate the Postgres password.** In the project, go to **Settings → Database → "Reset database password"** (exact menu label may vary slightly with dashboard updates; the action you need is the database password reset). Generate a new strong password with the dashboard's generator. Store it only in a password manager — never in a file inside any repo.
  **Owner:** Founder · **Cost:** $0 · **Deadline:** Day 1 · **Blocks:** Step 6 verification; any future use of the project

- [ ] **Step 4 — Rotate the API keys (anon + service).** Go to **Settings → API**. Regenerate the JWT secret / API keys (in current dashboards this is "JWT Settings → Generate new secret", or the "API Keys" page's rotate action). Rotating the JWT secret invalidates the leaked anon key AND the service key at once — do this even though only the anon key was confirmed in the files, because `.env.local` files typically also carried the service key. Anything still using the old keys will get `401 Unauthorized` afterwards — that is the desired outcome; nothing in production depends on this project.
  **Owner:** Founder · **Cost:** $0 · **Deadline:** Day 1 · **Blocks:** Step 6 verification

- [ ] **Step 5 — Scrub or delete the leaking files.** In this order:
  1. Delete `V:\Extension 2.3\dist\extraction\.env.local` (and, safest, the entire `dist\` folder — nothing in it is ever reused; the old project's `dist\` is also on the forbidden-source list for code).
  2. Delete `V:\Extension 2.3\extraction\.env.local`.
  3. Edit `list-tables.js` line 4 and `run-migration.mjs` line 4: replace the password string with `process.env.DB_PASSWORD` or simply delete both files if you will never run them again (recommended — they were one-off utility scripts).
  4. Edit `seed-templates.mjs` line 2 the same way, or delete the file.
  5. Search for any zip/backup copies: check Downloads, Desktop, cloud-drive folders, and email attachments for archives of the old project or its `dist\` folder. Delete what you find (normal delete is fine — the credentials are dead after steps 3–4; the goal is to stop re-leaking dead values and old code).
  **Owner:** Founder · **Cost:** $0 · **Deadline:** Day 1 · **Blocks:** Step 6

- [ ] **Step 6 — Verify with greps (must all come back clean).** Run these in PowerShell:
  ```powershell
  # A. Project ref must not appear in any file (it appears inside Supabase URLs and JWTs)
  Get-ChildItem "V:\Extension 2.3" -Recurse -File | Select-String -Pattern "fogvzjtxbqgfppdrxqra" -List

  # B. No JWTs anywhere (all Supabase keys are JWTs beginning "eyJ")
  Get-ChildItem "V:\Extension 2.3" -Recurse -File | Select-String -Pattern "eyJhbGciOi" -List

  # C. No .env files left inside any dist folder
  Get-ChildItem "V:\Extension 2.3" -Recurse -Force -Filter ".env*"

  # D. Old-password fragment — type the FIRST 6 CHARACTERS of the old password by hand;
  #    do not save this command anywhere after running it
  Get-ChildItem "V:\Extension 2.3" -Recurse -File | Select-String -Pattern "<first-6-chars-of-old-password>" -List
  ```
  Expected result: A, B, and D return nothing; C returns nothing (or only files you deliberately kept outside `dist\`, which should be none after Step 5). Any hit = go back to Step 5.
  Optional extra check that rotation worked: a request to `https://fogvzjtxbqgfppdrxqra.supabase.co/rest/v1/` with the OLD anon key in the `apikey` header must return 401.
  **Owner:** Founder · **Cost:** $0 · **Deadline:** Day 1 · **Blocks:** Step 7; declaring this file done

- [ ] **Step 7 — Check for signs of abuse (best effort).** In the Supabase dashboard, open **Logs / Reports** for the project and skim the API and database logs for unfamiliar source IPs or bulk reads since 24 Aug 2026 (the day the leak was documented). If anything looks like exfiltration of real user data, note it in `../06-OPERATIONS/02-CRISIS-PLAYBOOK.md` handling; in practice this project held only extraction templates, so the realistic worst case is nuisance access, not a user-data breach.
  **Owner:** Founder · **Cost:** $0 · **Deadline:** Day 1–2 · **Blocks:** nothing (informational)

---

## 3. Never-again rules (carry into the new repo from commit #1)

- [ ] **Rule 1 — `.gitignore` blocks secrets from day one.** The new `V:\AppealDeck` repo's `.gitignore` must include `.env*`, `*.pem`, `*.zip` before the first commit. Real values live only in deployment environment settings (Vercel/Supabase dashboards); the repo carries an `.env.example` with empty values. [source: APPEALDECK_BUILD_PLAN.md §2.1 P-3, §2.5, §5]
  **Owner:** AI assistant (enforced), Founder (spot-checks) · **Cost:** $0 · **Deadline:** first commit · **Blocks:** repo scaffold sign-off

- [ ] **Rule 2 — Never ship or share anything from a `dist\` folder** without an explicit release checklist that greps the output for `eyJ`, `.env`, and the project ref. Build scripts must exclude `.env*` from outputs — this exact bug caused the leak.
  **Owner:** AI assistant · **Cost:** $0 · **Deadline:** standing rule · **Blocks:** every release

- [ ] **Rule 3 — Use a FRESH Supabase project for AppealDeck.** Do not reuse `fogvzjtxbqgfppdrxqra` even after rotation. A new project costs nothing, guarantees a clean credential history, and severs every link to the contaminated codebase (the build plan itself marks fresh-project as the recommended option). After anything worth keeping is exported, pause or delete the old project entirely.
  **Owner:** Founder (creates project), AI assistant (integrates) · **Cost:** $0 (free tier for dev; Supabase Pro $25/mo at launch per the hosting decision) · **Deadline:** Week 1, when backend work starts (see `../02-PHASE-1-FOUNDATION/`) · **Blocks:** backend setup

- [ ] **Rule 4 — No credential ever goes to any contractor or collaborator as a shared password.** Access is granted through per-person invites with the minimum role, and only to people bound by the collaborator policy — see `./02-COLLABORATOR-POLICY.md`.
  **Owner:** Founder · **Cost:** $0 · **Deadline:** standing rule · **Blocks:** any credential sharing

---

## Definition of done

- [ ] Postgres password reset in the Supabase dashboard (Step 3).
- [ ] Anon + service API keys regenerated; old keys return 401 (Step 4).
- [ ] All five leaked locations scrubbed or deleted; `dist\` contains no `.env*` (Step 5).
- [ ] All four verification greps return zero hits (Step 6).
- [ ] Supabase logs skimmed for abuse; result noted (Step 7).
- [ ] New-repo `.gitignore` includes `.env*` before first commit (Rule 1).
- [ ] Decision recorded that AppealDeck uses a fresh Supabase project, not `fogvzjtxbqgfppdrxqra` (Rule 3).
