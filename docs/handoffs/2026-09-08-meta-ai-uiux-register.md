# 2026-09-08 — Meta AI UI/UX brainstorm: verified register + tiering

**Status:** review artefact, founder-gated. Nothing here is appended to `06-PREMIUM-UI-UX-SPEC.md`, `02-BUILD-PLAN-AMENDMENTS.md`, or `docs/DECISIONS.md` until the founder ratifies §6 (draft AM-19).
**Source:** founder ↔ Meta AI transcript, 5 Sep 2026 (7 Meta AI turns, ~295 raw suggestions). Meta AI lines were treated as claims to verify, founder lines as intent.
**Method:** every "already exists" / "missing" statement below was grep-verified against `src/` on 8 Sep 2026 (branch `master`, Wave C-fix Tasks 0–7 committed). Locked sources: CLAUDE.md D1–D10, AM-16/17/18, spec 06 §1/§1.1/§3–§11/§13/§14, 05-CASE-OS-SPEC, 04-EVIDENCE-FIRST rejected register. No external web check changed a verdict; the platform facts relied on are listed in §7.

## 0. How to read the register

| Column | Values |
|---|---|
| **Lens** | TS = table-stakes (silent SaaS norm) · CD = category-defining (appeal-tool specific) · MS = market-sustaining (compliance, trust, operability) |
| **Tier** | **MUST** · **REALLY GOOD** · **GOOD** · **NICE** · **AVOID** |
| **Status** | shipped (verified in `src/`) · planned §x (in spec, not yet built) · decided (§14 row / D-x / AM-xx — not reopened) · new · n/a |
| **Timing** | **now** = fits the open Wave C-fix / Wave D presentation scope · **M-4** = core composer/critic work already in progress (founder confirms it rides M-4, else post-freeze) · **post-freeze** = feature; waits for first paid Passes + opt-in outcomes (AM-17 freeze) · **never** |
| **Effort** | S ≤ ½ day · M 1–2 days · L > 2 days |

Guardrails applied: D6 copy rules on every string (no "guarantee", no percentages/hours, no speaking for Amazon); §1.1 simplicity budget; feature ≠ presentation → post-freeze; founder-gated items surfaced, not performed; §14 verdicts and D1–D10 reported as *decided*, not re-argued.

## 1. Summary counts (de-duplicated register, 189 rows; a few rows are cross-references, e.g. M2→E4, R3→L4, M9→G9, R6→G10)

| Tier | Rows | Already shipped / partial / decided | Net new work proposed |
|---|---|---|---|
| MUST | 10 | 7 (A3, A15, E1, G1, J1, K1, N1) | **3** (A1, G2, G3) — all "now", all S |
| REALLY GOOD | 24 | 3 | 21 (14 rows fit "now"; 5 ride M-4: C8, C9, C10, C19, E7; 3 post-freeze: G4, G5, N5; O3 founder-gated) |
| GOOD | 30 | 1 | 29 (11 "now", the rest M-4 / post-freeze / Wave D) |
| NICE | 28 | 2 | 26 (post-freeze backlog, no commitment) |
| AVOID | 56 | 23 already rejected by D1–D10 / §14 / AM-16 / AM-17 | 33 newly named, each with the rule it breaks |
| shipped / planned / n/a (no tier needed) | 41 | 41 | 0 |

Pre-deploy budget check: the "now" items in §5 are all effort S; together about one working day inside the ~5-day wave capacity. None adds a nav item, a card above the fold, or a second primary action.

## 2. MUST HAVE — in tier order

| ID | Item | Status | Timing | Effort | Why |
|---|---|---|---|---|---|
| A1 | **Non-affiliation + trademark disclaimer** ("AppealDeck is independent and not affiliated with or endorsed by Amazon.com, Inc. Amazon is a trademark of its owner") in the footer, `/terms`, and the About/founder section | **new — grep finds no such line in `src/` or `legal/`** | now | S | Nominative use of "Amazon" without a disclaimer is a trademark/consumer-confusion exposure and a trust gap. Wording founder-gated (legal text). Sticky-bar form rejected (A2). |
| G2 | **Autosave status + surfaced failure** — quiet inline "Saved to vault · 14:02" after each step; if the vault write throws, an inline Alert, not silence | new — `InterviewFlow.tsx` saves per step (lines 249/296) but `catch {}` swallows failures | now | S | State quartet (§6) requires an error state; a seller who believes the case is saved when it is not is the worst data-integrity failure a local-first product can have. Toast-per-save (Meta AI's "every 10 s toast") stays banned (§6: one toast max). |
| G3 | **Passphrase-loss disclosure at passphrase creation** — "If you forget this passphrase, nobody, including us, can recover your case data. Cloud sync stores ciphertext only." | new — `app.ts` describes the key model but never states unrecoverability | now | S | Trust by mechanism (§10.2/§11): the honest consequence of "we never see your key" must be stated before the seller commits. Copy only. |
| A3 | Read-only stance: "You submit the appeal yourself in Seller Central; AppealDeck has no access to your Amazon account" | shipped (§10.2 table, trust card, compose line) | — | — | D6 read-only rendered. |
| E1 | Encrypted local-first vault with per-record download, delete-with-Dialog, search + filter, size/type/date | shipped (`VaultView.tsx`, AES-GCM/PBKDF2 in `crypto.ts`) | — | — | The category-defining trust mechanism. |
| G1 | Resume prompt + encrypted save & exit + per-step persistence | shipped (`resumePrompt`, `saveAndExit`, `saveCaseFile`) | — | — | §14 #9/#11 delivered. |
| J1 | Skeletons in every `loading.tsx`, error boundary, EmptyState pattern (7 uses), CopyButton "Copied" 2 s | shipped | — | — | §3/§6 state quartet. |
| K1 | WCAG 2.2 AA gates: axe e2e, Lighthouse a11y = 1.0, focus-visible rings, skip link, reduced motion, `aria-label` on icon buttons | shipped (`e2e/a11y.spec.ts`, `lighthouserc.cjs`, `globals.css`) | — | — | §9 gates, not advice. |
| N1 | Device/session management: list devices, revoke via Dialog | shipped (`DeviceManager.tsx`, `/api/devices`) | — | — | Table-stakes security UX; covers Meta AI's "session" ask. |

## 3. Full register by area

### A. Trust, honesty, compliance copy

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| A1 | Non-affiliation/trademark disclaimer | MS | MUST | new | now | S | See §2. |
| A2 | Sticky 32 px disclaimer bar with dismiss X | TS | AVOID | new | never | — | §1.1: nothing competes with the one primary action; a footer line + legal page carries the same fact. |
| A3 | "We do not access Seller Central; you paste the POA yourself" | CD | MUST | shipped | — | — | D6 read-only. |
| A4 | "Data deleted in 30 days" / "You own all data, delete anytime" bar | MS | AVOID | new | never | — | False for a local-first vault (data lives on the seller's device + ciphertext sync); D6 forbids untrue mechanism claims. Real deletion paths exist (per-record delete; account deletion by email in `legal.ts`). |
| A5 | Social proof counters ("3,241 sellers reinstated", "87 reinstatements last 30 days, avg 18 h") | MS | AVOID | decided (D6, §1 #2, §11) | never | — | Win rates only from opt-in outcome data (EF-5); no hours/percentages in copy (§10.5). |
| A6 | "Money-back guarantee" badge | MS | AVOID (word) / shipped (fact) | decided (D6 lint, D8) | — | — | The banned word greps to 0; the 7-day refund line already sits in the pricing trust card. |
| A7 | "Amazon compliant" label on uploaded files; "AI scan: looks valid" | CD | AVOID | new | never | — | Implies acceptance/authenticity verification we cannot perform (D6). Use "meets the evidence checklist" from `evidenceModel`. |
| A8 | "Amazon hates this" / "Amazon rejects emotional POAs" flag wording | CD | AVOID | new | never | — | Speaks for Amazon without a source (B-08 corpus gate). Critic flags state the rule and the fix, neutrally (already the pattern in `composer.ts`). |
| A9 | Security badge bar "256-bit · SOC 2 · deleted in 30 days" | MS | AVOID | new | never | — | No SOC 2 exists; §10.2 bans badge-speak; `LocalFirstBadge` + the exact envelope description in `app.ts` already show the mechanism. |
| A10 | Sample *real* redacted POAs | CD | AVOID | decided (§14 #14) | — | — | Sample POA is fictional + watermarked by decision; no real cases exist; privacy. |
| A11 | Case-study generator from reinstated cases | CD | GOOD | new | post-freeze, founder-gated | M | §11: EF-5 opt-in outcome data is the only permitted source; publish only with consent, process not text. |
| A12 | Policy changelog / "guidance verified on <date>" | CD | REALLY GOOD | shipped (`VerifiedStamp`) + decided (§14 #22 `/changelog`, Wave D) | Wave D | S | Maintenance signal = trust (§11). |
| A13 | Auto-adjusting the seller's draft when policy changes | CD | AVOID | new | never | — | Edits the seller's own words without consent; conflicts with "no automation" (D6). Show a changelog notice instead (A12). |
| A14 | Version number in footer (build/commit) | TS | GOOD | new | Wave D | S | Pairs with `/changelog`; §11 maintenance signal. Not in `SiteFooter.tsx` today. |
| A15 | Honest-expectations card at every commitment point | CD | MUST-class, shipped | shipped | — | — | D6 spine. |
| A16 | "Your POA covers 3/3 required points" | CD | shipped-modified | shipped (`ReadinessCard`, labelled "case-file completeness — not a prediction") | — | — | Wording must never read as approval likelihood (AM-16 banned framing). |
| A17 | Expert review button "$49 human review in 2 h" | CD | AVOID (now) | decided (D7 deferred; D6 no hours) | post-freeze | — | Expert Review returns only after MoR rails + fixture auditions (D5). |
| A18 | Live chat / "talk to expert" in Settings | TS | AVOID | decided (§14 deprioritised; D7) | — | — | — |
| A19 | Founder story card | CD | decided | §14 #7 | — | — | Only the founder's true words; ship null until supplied. |

### B. Decode and diagnosis

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| B1 | Paste notice → violation type + deadlines + plain-English summary | CD | MUST-class | shipped (`noticeParser`, `classifier`, `deadlinesModel`, `/decode`) | — | — | Core free surface (D10 funnel). |
| B2 | Extract ASINs from the notice and carry them into the case file | CD | GOOD | new — `noticeParser.ts` has no ASIN handling | M-4 | S | Deterministic regex (`B0` + 8 alphanumerics); makes the POA specific without an LLM. |
| B3 | Extract the Amazon case/complaint ID and show it in the case header | CD | GOOD | new — not parsed, not displayed | M-4 | S | Sellers quote it in every reply; Seller Central shows it prominently. Regex only. |
| B4 | Upload the notice as .eml / screenshot (OCR) | CD | NICE | new | post-freeze | M | Paste-mode is the decided primary path (D3); OCR is heavy and error-prone. |
| B5 | Manual "this was decoded as X — change type" override | CD | GOOD | partially (`FieldSuggester` suggests kind in the interview; confirm the seller can override) | M-4 | S | Misclassification must be correctable by the seller, deterministically. |
| B6 | "Common reasons for this notice type" explainer | CD | shipped | `guidance.ts` cards | — | — | — |
| B7 | Account-health card on the dashboard | CD | AVOID | decided (D6 read-only; D7 SP-API) | — | — | Needs Seller Central data. |
| B8 | Colour-coded status banner (suspended / under review / reinstated) with date | CD | shipped | `CaseStateBadge`, `SeverityBadge` | — | — | Colour never the only signal (§9). |
| B9 | DO-NOW / DO-NOT panic-hour triage cards | CD | planned | AM-17 (AA-24) | — | — | — |

### C. Interview and composer (structure, writing rules)

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| C1 | Locked 3-part structure: root cause / corrective / preventive | CD | shipped | `composer.ts` sections, `PoaSection` | — | — | — |
| C2 | Q&A blocks with typed inputs instead of one textarea | CD | shipped | Guided Interview (AM-17), `InputType` enum/file/date/number/short_text | — | — | Founder-hardened design. |
| C3 | Template gallery / "insert template" / "used in 412 appeals" | CD | AVOID | founder intent (5 Sep) + `checkNovelty` critic | never | — | Template phrases are exactly what the critic flags. |
| C4 | Per-field tabs Template / AI draft / Your notes | CD | AVOID-modified | decided (§14 #17 PoaEditor) | M-4 | — | Editing the draft in place is planned; no template tab. |
| C5 | Root-cause category step (process gap / supplier error / knowledge gap / system error) before free text | CD | GOOD | new — `intake_root_cause` is free text only | M-4 | S | Deterministic routing aid; keeps the free-text answer specific. Must not auto-write sentences. |
| C6 | Corrective-actions repeater rows (date · action · proof) with row validation | CD | GOOD | new — one `date` input exists; no dated action list | M-4 | M | Specific dated actions are the substance of a POA; deterministic. |
| C7 | "At least two corrective actions" readiness rule | CD | GOOD | new | M-4 | S | Fine as a readiness hint; copy must not claim "Amazon requires two" (unsourced). |
| C8 | Past-tense / future-tense check in corrective actions ("we will remove" → flag) | CD | REALLY GOOD | new — critic has banned-language + novelty + unattested-claims, no tense rule | M-4 | S | Regex rule, zero LLM; the most common weak-POA pattern. |
| C9 | Blame-shifting detector ("Amazon's mistake", "supplier lied", "not my fault") | CD | REALLY GOOD | new | M-4 | S | Deterministic word list; surfaces as a critic flag with a neutral fix. |
| C10 | Vague-time detector ("going forward", "ASAP", "soon") as a *warning*, never a hard block | CD | REALLY GOOD | new | M-4 | S | Same rule family as C8. Hard blocks rejected (C16). |
| C11 | Jargon swaps ("leverage" → "use") | CD | GOOD | new | M-4 | S | Same rule family; low risk. |
| C12 | Character counter with an invented limit ("Amazon ignores over 500") | CD | AVOID (number) / GOOD (counter) | new | M-4 | S | Banned-numbers rule (§10.5). A neutral counter + "keep it concise" is fine. |
| C13 | Paragraph limiter ("3 paragraphs max, box 4 turns red") | CD | AVOID | new | never | — | Invented rule presented as Amazon's. |
| C14 | Plain-English ↔ professional tone toggle; "explain like I'm 5" | CD | AVOID | new | never | — | An LLM call per toggle (D9 budget) that pushes text toward generic phrasing, the opposite of the founder's freshness rule. |
| C15 | "Generate from evidence" as the only generation path | CD | shipped | compose binds real case data (Wave C-fix Task 3) | — | — | — |
| C16 | Disable "Generate" until the evidence map is 100 % | CD | AVOID | contradicts AM-16 two-mode composer | never | — | The gap-draft mode exists precisely so a seller with partial evidence still gets a truthful draft with gaps marked. |
| C17 | Copied POA carries plain section headings and blank lines, no markdown | CD | REALLY GOOD | new — `fullDraftText` joins bodies only; `renderPoaText` emits `## ` headings | now | S | The seller pastes into a plain textarea: `##` looks broken, and no headings loses the structure reviewers scan for. Emit "Root cause" / "Corrective actions" / "Preventive measures" as plain lines. |
| C18 | "As pasted" plain-text preview toggle in compose | CD | REALLY GOOD | new | now | S | Shows exactly what the clipboard holds; honest by construction. |
| C19 | Reference attachments by filename inside the POA text ("see attached Invoice_ABC_2026-06-02.pdf") | CD | REALLY GOOD | new | M-4 | S | Replaces Meta AI's `@evidence` pills (which cannot survive a plain-text paste). Deterministic from vault record names + slot kinds. |
| C20 | `@`-mention evidence pills with hover preview in the editor | CD | NICE | new | post-freeze | M | See C19; hover-only previews also fail touch/a11y. |
| C21 | SOP builder that generates a downloadable SOP PDF | CD | NICE | new | post-freeze | M | Not in the AM-16 document-type router; risk of templated SOPs; revisit after opt-in outcomes show demand. |
| C22 | Monthly "audit your SOP" reminder | CD | AVOID (now) | D7 Guardian | post-freeze | — | Monitoring/reminders are the deferred Guardian tier. |
| C23 | Version snapshots / restore v3 / side-by-side diff / section lock | CD | NICE | new | post-freeze | M | Real but not panic-hour; vault could store draft versions later. |
| C24 | Native spell-check on POA textareas (`spellCheck`) | TS | REALLY GOOD | new — no `spellCheck` attribute anywhere | now | S | Free "grammar check"; no data leaves the browser. |
| C25 | Focus mode (hide chrome, one field) | TS | NICE | new | post-freeze | S | The interview is already one input per step. |
| C26 | Section-level "Fix it" auto-rewrite button | CD | GOOD | new | post-freeze | M | Adopt-modified: regenerate *one section* through the existing schema-constrained compose route with the flag as an instruction, within the per-case LLM budget (AM-17). Sentence-level auto-fix rejected (templating drift). |
| C27 | Readability grade ("Grade 8, Amazon prefers this") | CD | AVOID (claim) / NICE (hint) | new | — | — | Unsourced Amazon preference; a neutral readability hint is harmless but low value. |
| C28 | Amazon terms defined on first use per page (POA, ODR, ASIN) | CD | REALLY GOOD | rule in §10.3; audit pending (AA-29) | now | S | Panic-hour comprehension; zero LLM. |

### D. Critic ("Reviewer Lens")

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| D1 | 0–100 approval score, animated meter, weighted 40/30/30, benchmark vs "successful POAs average 85" | CD | AVOID | decided (AM-16 rejected approval predictors; banned readiness-as-approval framing) | never | — | The single most dangerous suggestion in the transcript: it sells a prediction we cannot make (D6). |
| D2 | Flags by severity with one-line fix, rendered beside the section | CD | shipped | critic margin code-mapped via `findingSections.ts` | — | — | — |
| D3 | Click flag → jump/highlight field | CD | shipped-equivalent | flags render in the section's margin | — | — | — |
| D4 | Every flag carries a "why" | CD | GOOD | partially (messages state the rule) | now | S | Copy pass: ensure each `CriticFinding` message names rule + fix; no praise theatre. |
| D5 | "Green wins" praise flags | CD | NICE | new | post-freeze | S | Low value; must not read as celebration of a draft (§1 #2). |
| D6 | Dismiss warning with a reason (logged) | CD | NICE | new | post-freeze | S | Only for warnings, never for severity-gated findings. |
| D7 | Sentence-level red/yellow/green dots | CD | AVOID | new | never | — | Score theatre by another name (see D1). |
| D8 | Downloadable "audit report PDF" | CD | NICE | new | post-freeze | S | Print stylesheet (R5) covers it. |
| D9 | Policy excerpt beside each required point | CD | GOOD | planned (§3 Accordion "why does Amazon want this?") | founder-gated (B-08 text retrieval) | S | Excerpts only from the in-force text once retrieved; never paraphrased from memory. |

### E. Evidence and vault

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| E1 | Encrypted vault: upload, view, download, delete (Dialog), search, filter, size, type, date | CD | MUST-class, shipped | `VaultView.tsx` | — | — | — |
| E2 | Required-documents checklist derived from notice type | CD | shipped | `evidenceModel.ts` + `EvidenceSlotPanel` | — | — | — |
| E3 | `accept` list on the drop-zone input (PDF/JPG/PNG/HEIC…), `multiple`, friendly wrong-type error | TS | REALLY GOOD | new — `FileDropZone.tsx` input has no `accept`/`multiple` | now | S | Prevents the most common upload error before it happens. |
| E4 | Mobile "Take a photo" button (`capture="environment"`) | CD | REALLY GOOD | new — no `capture` anywhere | now | S | One attribute; the warehouse-phone case Meta AI describes. |
| E5 | Auto edge-detect, crop, contrast enhance | CD | NICE | new | post-freeze | L | Heavy client code; phones already do this in the camera app. |
| E6 | Duplicate-file detection ("already in your vault") | TS | REALLY GOOD | new — vault already stores `plaintextHash` (SHA-256) per record | now | S | Compare hash on add; zero new crypto. |
| E7 | Invoice issue-date field + "older than 365 days" flag | CD | REALLY GOOD | new — `evidenceModel` has `freshnessDays: 365` but the UI never asks for the date | M-4 | S | The 365-day rule was verified 2 Sep (CLAUDE.md); provenance-stamped copy allowed. Deterministic. |
| E8 | OCR to read supplier/date/ASIN and "match" them | CD | NICE | new | post-freeze | L | Local OCR is heavy; matching implies verification we cannot claim (A7). |
| E9 | Redaction tool (black out prices) + copy on what may be obscured | CD | GOOD | new | post-freeze (tool) · founder-gated B-08 (copy) | M | Guidance on obscuring pricing must quote the in-force invoice-requirements text, not memory. |
| E10 | Micro-confirmation after upload ("Invoice.pdf · 2.3 MB added to Supplier invoices") | TS | GOOD | partially (toast on download; verify on add) | now | S | §6: inline confirmation at the point of action. |
| E11 | Delete with 5 s undo toast instead of a Dialog | TS | NICE | §6 allows undo where reversible; vault delete is destructive (also removes the cloud copy) | — | — | Dialog is the right pattern for irreversible deletes (§6); keep. |
| E12 | Rename / replace file | TS | NICE | new | post-freeze | S | — |
| E13 | Tagging, grid/list toggle, bulk select, column customisation, inline cell edit | TS | AVOID | new | never | — | Slots are the taxonomy; two views double the maintenance; lists are small. §1.1 "fewer, better components". |
| E14 | Row actions only on hover | TS | AVOID | new | never | — | Hover-only fails touch and keyboard; `VaultView` already shows labelled icon buttons. |
| E15 | Thumbnail preview on hover (300 px) | TS | AVOID | new | never | — | Same; click-to-view exists. |
| E16 | File versioning, expiry badge on IDs, "internal only vs submit to Amazon" tag | CD | NICE | new | post-freeze | S–M | The "attach to appeal" flag is the only one with a clear use (feeds `BeforeYouSubmitChecklist`). |
| E17 | Google Drive import | TS | AVOID | new | never | — | Third-party OAuth surface in a local-first product. |
| E18 | Chain-of-custody log ("downloaded 2 times"), "PDF cannot be edited" | CD | AVOID | new | never | — | Legalistic over-claim with no reviewer value; the PDF claim is false. |
| E19 | Upload timestamp visible per record | TS | shipped | `VaultView` formats record dates | — | — | — |

### F. Deadlines and case tracking

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| F1 | Deadline shown as absolute date + relative ("14 Sep · in 10 days"), tone by proximity | CD | shipped | `DeadlineChip.tsx` | — | — | — |
| F2 | Ticking countdown "48 h 12 m left", red under 24 h, favicon red dot | CD | AVOID | §1 #2 (no countdown timers) | never | — | Urgency theatre on a seller who is already panicking. |
| F3 | Time-zone shown where a time matters | TS | REALLY GOOD | new — `DeadlineChip` has no `timeZoneName` | now | S | Folded into L4 (shared formatter). |
| F4 | Push/email reminders 24 h / 6 h / 1 h ("Submit now or case closes") | CD | AVOID (copy) · post-freeze (feature) | D7 Guardian | post-freeze | — | Reminders are the deferred Guardian tier; the quoted copy is scarcity theatre. |
| F5 | "Add to calendar" (.ics download) for each deadline | CD | GOOD | new | post-freeze | S | Local, no backend, honest; the simplest reminder that respects D7. |
| F6 | Paste case ID → auto-track status | CD | AVOID | D6 read-only, D7 SP-API | never | — | Manual state via `caseState` + pasted replies (`responseAnalyzer`) is the decided model. |
| F7 | Follow-up scheduler after submit | CD | AVOID (now) | D7 | post-freeze | — | Static "what happens next" card exists in the caseState home. |
| F8 | Private case notes | CD | GOOD | new | post-freeze | S | One encrypted text record per case. |
| F9 | Case history / activity log (what changed, when) | CD | planned | 05-CASE-OS-SPEC §1 Timeline tab; `CaseLog` already stores state, attempts, submittedAt, lastReply | Wave C / M-W | M | Local only; never a team feed. |
| F10 | Message-centre inbox for Amazon replies | CD | AVOID | new | never | — | Email integration; paste-mode reply analysis is decided (AM-17). |

### G. State and data integrity

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| G1 | Per-step encrypted autosave + resume + save & exit | TS | MUST-class, shipped | `InterviewFlow.tsx` | — | — | — |
| G2 | Autosave status + surfaced failure | TS | MUST | new | now | S | See §2. |
| G3 | Passphrase-loss disclosure | MS | MUST | new | now | S | See §2. |
| G4 | Vault export/import as one encrypted bundle | MS | REALLY GOOD | new — no export; cloud sync of ciphertext exists (`pushVaultToCloud`) | post-freeze | M | GDPR portability + backup independent of our Supabase project; sync covers device loss, not our outage. |
| G5 | Cross-device conflict handling | MS | REALLY GOOD | new — sync uses `upsert: true` (last write wins, silent) | post-freeze | M | Two devices editing one case can silently overwrite. Minimum: "last synced" stamp + warn when the remote copy is newer. |
| G6 | Unsaved-changes prompt on tab close (mid-step only) | TS | GOOD | new | now | S | Per-step save makes this a small `beforeunload` when the current answer is dirty. |
| G7 | Undo tree, 50 steps, survives refresh | TS | AVOID | new | never | — | Native textarea undo + per-step persistence cover it; large complexity. |
| G8 | Field-level validate on blur, green check when valid | TS | planned §6 / shipped (login) | — | now | S | Green-check noise rejected; blur validation kept. |
| G9 | Offline indicator + "these actions need the network" | MS | GOOD | new — no `navigator.onLine` handling | now | S | Local decode/vault work offline; compose/critique do not. Saying which is trust by mechanism. |
| G10 | Retry button inside the compose error Alert | TS | GOOD | new — error Alert offers a link, not retry | now | S | §6: errors keep input and offer retry (decode already does). |
| G11 | Optimistic UI | TS | NICE | new | — | — | Local writes are already instant. |

### H. Forms and inputs

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| H1 | Native input types + `inputMode` (numeric, email), `autoCapitalize="none"` on ASIN/order-ID/passphrase fields | TS | REALLY GOOD | partially (`VaultGate` only; login has `autoComplete` but no `autoCapitalize`) | now | S | Correct mobile keyboards; zero design cost. |
| H2 | Input masks (`__/__/____`) | TS | AVOID | new | never | — | Masks fight screen readers and paste; native `type="date"` does the job. |
| H3 | Floating labels | TS | AVOID | new | never | — | Static labels (shadcn `Label`) read better under stress; floating labels shrink to illegible sizes. |
| H4 | Clear-X in search inputs | TS | shipped | `type="search"` in `VaultView` | — | — | — |
| H5 | Paste clean-up for ASIN/order IDs (strip dashes/spaces) | CD | GOOD | new | M-4 | S | Deterministic normaliser on blur. |
| H6 | Required vs optional marked explicitly | TS | GOOD | new | now | S | Interview steps: label optional ones "(optional)". |
| H7 | Help text under inputs | TS | shipped (login) · verify interview | now | S | — |
| H8 | Disabled-button tooltip explaining why | TS | NICE-modified | new | post-freeze | S | Disabled elements do not receive hover/focus reliably; when a reason is non-obvious, show it as inline text. The interview's disabled "Continue" is obvious (empty answer). |
| H9 | Error summary at top with links to fields | TS | NICE | new | — | — | Interview has one input per step; auth forms already validate inline. |
| H10 | Date-intelligence NLP ("last month" → July 2026) | CD | AVOID | new | never | — | Ambiguity in a document Amazon reads; date picker only. |
| H11 | Inline calculations, ASIN → product-name lookup, policy-aware autocomplete | CD | AVOID | new | never | — | Scope; catalogue lookup scrapes Amazon (ToS) or needs SP-API (D7); autocomplete = LLM per keystroke (D9) and template drift. |
| H12 | Supplier-name prefill from invoices | CD | NICE | new | post-freeze | M | Needs OCR (E8). |

### I. Navigation and shell

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| I1 | Breadcrumbs | TS | shipped | `AppBreadcrumb` in `AppShell` | — | — | §14 #10. |
| I2 | Command palette ⌘K / global search | TS | AVOID | decided (§1 #7, §14) | — | — | — |
| I3 | Bottom tab bar (Diagnose / Write / Review) | TS | AVOID | decided (§8: Sheet nav + sticky step action bar) | — | — | Two nav systems on mobile break the §1.1 budget. |
| I4 | Sticky step action bar with safe-area inset | TS | shipped | `InterviewFlow` fixed bar with `env(safe-area-inset-bottom)` | — | — | — |
| I5 | Active-route underline + `aria-current` | TS | shipped (§8) | — | — | — | Sliding-underline animation: NICE. |
| I6 | Scroll-to-top on route change, scroll restoration on back | TS | shipped (framework default) | — | — | — | — |
| I7 | Sticky section headers in a long POA | TS | NICE | new | post-freeze | S | — |
| I8 | Recently viewed list | TS | AVOID | new | never | — | One case per Pass; nav-item budget (≤ 7). |
| I9 | Dynamic tab title with status/warning count; favicon state | TS | NICE | new | post-freeze | S | Title template exists; status in the title leaks case state to onlookers — keep neutral if ever done. |
| I10 | Keyboard shortcuts 1/2/3 for sections, "/" to search | TS | NICE | new | post-freeze | S | `Kbd` primitive exists; not panic-hour value. |
| I11 | Case ID always visible top-right | CD | GOOD | new (depends on B3) | M-4 | S | — |
| I12 | "Attach file" control adjacent to the text it supports | CD | GOOD | verify placement of `EvidenceSlotPanel` relative to compose/interview inputs | now | S | Presentation only. |

### J. Feedback, motion, loading

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| J1 | Skeletons, not spinners | TS | shipped | `skeleton.tsx`, both `loading.tsx` | — | — | — |
| J2 | Toast tiers with icons; max 3 stacked; error toasts sticky | TS | shipped / decided | sonner `richColors` + `closeButton`, 4 s; default `visibleToasts` = 3; §6: blocking errors are inline Alerts, not toasts | — | — | — |
| J3 | Loading state inside the button, disabled while pending | TS | shipped | compose, decode, checkout | — | — | §7.2 "the one allowed spinner". |
| J4 | Press scale .98, 120–200 ms fades, no decorative motion | TS | shipped | `motion.ts`, tokens | — | — | — |
| J5 | Hover state on everything clickable | TS | shipped | shadcn defaults | — | — | — |
| J6 | "Draft saved" toast every 10 s | TS | AVOID | new | never | — | §6: one toast max; use the quiet inline state (G2). |
| J7 | Fatigue breaker ("take 30 s, want a summary?") | TS | AVOID | new | never | — | Interrupts a deadline-bound task; §1 #1 nothing moves unless the seller caused it. |
| J8 | Progress rings per requirement | CD | AVOID | new | never | — | `ReadinessCard` Progress + per-kind status list already carry it; rings are decoration. |
| J9 | Onboarding checklist "first case in 4 steps" | TS | shipped-equivalent | Stepper + caseState next-best-actions | — | — | — |
| J10 | Tooltip tour; empty-state videos | TS | AVOID | decided (§14 #19; video deprioritised) | — | — | — |

### K. Accessibility

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| K1 | axe 0 serious, Lighthouse a11y 1.0, focus rings, skip link, `aria-label`s, reduced motion, colour + text | TS | MUST-class, shipped | see §2 | — | — | — |
| K2 | Focus trap in dialogs, Esc closes | TS | shipped | Radix Dialog/Sheet | — | — | — |
| K3 | 48 px primary tap targets on mobile | TS | GOOD | partially (`Button` default 40 px, `lg` 44 px; WCAG 2.2 minimum 24 px met) | now | S | Use `size="lg"` for the interview's primary action on mobile. |
| K4 | High-contrast toggle; reduce-motion toggle | TS | NICE | new | post-freeze | S | System preferences already honoured; `prefers-contrast` media query is the cheap half. |
| K5 | Language selector "even if only English" | MS | AVOID | D7 (i18n P1/P2) | — | — | A control that does nothing is dishonest UI. |
| K6 | Alt text on Seller Central screenshots | TS | n/a | no screenshots by design (§1 #3) | — | — | — |

### L. Typography, colour, copy hygiene

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| L1 | 16 px base, 1.5–1.6 line height, Inter via `next/font`, tabular numerals | TS | shipped | `fonts.ts`, `globals.css` | — | — | — |
| L2 | Amazon-blue `#232F3E` headers | MS | AVOID | new | never | — | Trade-dress confusion for a tool whose first trust claim is "not Amazon"; §2 keeps the single green accent. |
| L3 | Sentence case; no exclamation marks; no emoji | TS | shipped (rule §10.1) · audit pending (AA-29) | content has 0 exclamation marks; POA section names stay capitalised as proper names | now | S | Add a `!` lint rule to `lint-copy.mjs` for `src/content/**`. |
| L4 | One shared date formatter (absolute + relative + tz) | TS | REALLY GOOD | new — six components call `Intl` ad hoc; `DeadlineChip` hard-codes `en-US` | now | S | §10.3 "14 Sep · in 10 days" everywhere; browser locale, explicit tz where a time matters. |
| L5 | Non-breaking spaces in "60 days", "Case #…" | TS | NICE | new | post-freeze | S | Content rule; low visibility. |
| L6 | Middle-ellipsis for long file names | TS | NICE | new | post-freeze | S | Needs JS; end-truncation is acceptable. |
| L7 | Microcopy: verb + object buttons, no "Submit"/"Learn more"; errors = what happened + next step | TS | shipped (§10.3) | — | — | — | — |
| L8 | Reassurance icons (shield/check/clock) | TS | shipped | lucide 1.5 px | — | — | — |

### M. Mobile

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| M1 | Responsive, no horizontal scroll, safe areas | TS | shipped | gates §9, §8 | — | — | Meta AI's "60 % on phone" is unverified; irrelevant since mobile is a gate anyway. |
| M2 | Camera capture | CD | REALLY GOOD | E4 | now | S | — |
| M3 | Keyboard avoidance for the sticky bar (`interactive-widget=resizes-content`, `100dvh`) | TS | GOOD | new — viewport export lacks `interactiveWidget` | now | S | Prevents the action bar hiding behind the keyboard on Android Chrome. |
| M4 | Voice-to-text / voice timeline | CD | AVOID | new | never | — | Web Speech API streams audio to the browser vendor's servers, contradicting the local-first claim; poor accuracy on legal text. |
| M5 | Swipe actions (swipe to delete / link) | TS | AVOID | new | never | — | Undiscoverable, no keyboard equivalent, accidental deletes. |
| M6 | Pull-to-refresh | TS | AVOID | new | never | — | Web anti-pattern; data is local. |
| M7 | Haptic on save | TS | AVOID | new | never | — | `navigator.vibrate` is unsupported on iOS Safari; gimmick. |
| M8 | Floating save button | TS | AVOID | new | never | — | Autosave exists; a second primary action breaks §1.1. |
| M9 | Offline mode banner | MS | GOOD | G9 | now | S | — |

### N. Collaboration, account, security

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| N1 | Device list + revoke | TS | MUST-class, shipped | — | — | — | — |
| N2 | Vault idle auto-lock with a one-minute warning | MS | REALLY GOOD | new — manual lock exists; no idle timer in `VaultGate`/`browser.ts` | now (security hygiene; founder confirms freeze exemption) | S | Banking-app norm; the vault holds invoices and IDs on shared/family devices. |
| N3 | Session-timeout warning for the auth session | TS | NICE | Supabase refreshes silently | — | — | Vault lock (N2) is the meaningful timeout here. |
| N4 | Optional TOTP 2FA in settings | MS | GOOD | new (Supabase MFA available) | post-freeze | M | Optional, never a nudge at login during the panic hour. |
| N5 | Self-service account deletion with a Dialog naming what is deleted | MS | REALLY GOOD | partially (email request path in `legal.ts`) | post-freeze | M | GDPR erasure is satisfied by the request path for v1; self-service later. |
| N6 | "Delete all local case data" action | MS | GOOD | new | post-freeze | S | Complements per-record delete. |
| N7 | Team roles, comments, @mentions, share links, activity feed, audit CSV | TS | AVOID (now) | decided (D7 multi-tenant P1/P2) | post-freeze P2 | — | Share links also require server-side plaintext or key sharing, which the vault design forbids today. |
| N8 | API keys + webhooks | TS | AVOID | new | never (solo founder) | — | Security surface with no v1 buyer. |
| N9 | Notification preferences | TS | AVOID (now) | D7 | post-freeze | — | No notifications exist to prefer. |
| N10 | Timezone selector | TS | NICE | new | post-freeze | S | Browser tz + explicit label (L4) suffices. |

### O. Education and support

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| O1 | Glossary popovers / `/faq` glossary group (POA, ODR, ASIN, LOA) | CD | GOOD | new (planning docs have an internal glossary only) | Wave D | S | Static content, SEO surface, zero LLM; pairs with C28. |
| O2 | Inline "why does Amazon want this?" Accordion | CD | planned §3 / §14 #18 | — | Wave C | S | Never a hover tooltip for essential info (§3). |
| O3 | Official Amazon help links beside each guidance card | CD | REALLY GOOD | new — `guidance.ts` carries one Amazon URL | founder-gated (B-08 URL verification) | S | "Read the policy yourself" is trust by mechanism; URLs must be checked live before shipping. |
| O4 | Seller Central screenshots in explainers | CD | NICE | new | post-freeze | M | Amazon's UI changes; stale screenshots mislead; text steps first. |
| O5 | Long FAQ | TS | n/a | `/faq` has 7 grouped items | — | — | — |

### P. Data lists, settings, integrations

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| P1 | Sortable vault list | TS | NICE | filter + search shipped | post-freeze | S | — |
| P2 | Pagination / infinite scroll | TS | n/a | lists are small | — | — | — |
| P3 | Theme light/dark/system | TS | shipped | `defaultTheme="system"` | — | — | — |
| P4 | Sync progress ("syncing 3 of 5") + cancel | TS | NICE | verify current sync UI | post-freeze | S | — |
| P5 | Analytics dashboards, community forum, multi-language, Amazon API | TS | AVOID | decided (D7, §14) | — | — | Meta AI agreed. |
| P6 | A/B POA testing; cross-seller "23 sellers had this, here's what worked" | CD | AVOID | decided (A/B rig deprioritised §14; D6 opt-in-only outcome data; local-first has no cross-user corpus) | never | — | — |

### R. Performance and platform

| ID | Suggestion | Lens | Tier | Status | Timing | Effort | Reason |
|---|---|---|---|---|---|---|---|
| R1 | Lighthouse budgets, `next/font`, lazy images | TS | shipped | `lighthouserc.cjs`, §9 | — | — | — |
| R2 | Stale-while-revalidate | TS | n/a | data is local | — | — | — |
| R3 | Shared date formatter | TS | REALLY GOOD | L4 | now | S | — |
| R4 | Debounced autosave | TS | shipped-equivalent | per-step save | — | — | — |
| R5 | Print stylesheet (`@media print`) for compose and case view | TS | REALLY GOOD | new — none exists | now | S | Gives "PDF export" of the POA and case file through the browser with no library; hides nav/buttons, keeps headings. |
| R6 | Retry on failed network call | TS | GOOD | G10 | now | S | — |

## 4. "Already decided" cross-reference (not reopened)

| Meta AI suggestion | Decided where | Verdict on record |
|---|---|---|
| Social proof counters, reinstatement stats, response-time promises | D6, §1 #2, §11, §10.5 | banned until EF-5 opt-in data; no percentages/hours |
| Approval score / reviewer simulator / benchmarks | AM-16 rejected register; banned "readiness-as-approval" framing | rejected |
| Template gallery | founder (5 Sep) + `checkNovelty` | rejected |
| Command palette, global search, tooltip tour, videos, live chat, i18n, A/B rig | §1 #7, §14 #19, §14 deprioritisations | rejected / deprioritised |
| Co-pilot chat bubble | AM-17 (no chat window, no `/chat` route, generative Q&A parked) | rejected |
| Expert review CTA, Guardian reminders/monitoring, SP-API case tracking, team mode | D7 | deferred |
| Analytics consent banner | §14 #12 | rejected pending Plausible/Umami confirmation |
| Confetti / celebration of a draft | §14 #20, D6 | rejected |
| Countdown timers | §1 #2 | rejected |
| Save to plaintext `localStorage` | §14 #11 | replaced by encrypted vault persistence (shipped) |
| Founder story | §14 #7 | true words only; null until supplied |
| Money-back "guarantee" | D6 lint, D8 | word banned; 7-day refund stated |

Unverified claims in the transcript that must not become copy: "60 % use a phone", "Amazon ignores over 500 characters", "Amazon prefers grade-8 reading level", "Amazon loves SOPs", "Amazon rejects emotional POAs", "3 clicks / under 10 minutes". Any Amazon-behaviour statement goes through the B-08 corpus and `guidance.ts` provenance stamps.

## 5. Recommended "now" list (fits the open Wave C-fix / Wave D scope, all effort S)

1. A1 disclaimer (footer + Terms + About) — founder supplies/approves wording.
2. G2 autosave status + surfaced failure.
3. G3 passphrase-loss disclosure at passphrase creation.
4. C17 + C18 plain-heading paste format + "as pasted" preview.
5. L4/R3 shared date formatter with tz label (fixes F3).
6. E3 + E4 + E6 file-input hygiene: `accept`, `multiple`, mobile capture, duplicate detection via the existing hash.
7. R5 print stylesheet.
8. C24 `spellCheck` on POA textareas.
9. H1 `inputMode` / `autoCapitalize` on ID-like fields.
10. G9 offline indicator + G10 compose retry.
11. M3 viewport `interactiveWidget`.
12. N2 vault idle auto-lock (founder confirms it is security hygiene, not a frozen feature).
13. L3 `!` lint rule; C28/O2 term-on-first-use pass rides AA-29.

Everything tiered GOOD/NICE with timing M-4 or post-freeze is a backlog, not a commitment.

## 6. Draft AM-19 — proposed additions to spec 06 §14 (founder ratifies; ≤ 10)

| # | Suggestion (source: Meta AI 5 Sep) | Proposed verdict | Reason |
|---|---|---|---|
| 23 | Non-affiliation/trademark disclaimer (footer, Terms, About) | **Adopt** (now) | Absent from `src/` and `legal/`; nominative use of "Amazon" needs it; trust by mechanism. Wording founder-gated. |
| 24 | Autosave status + surfaced vault-write failure | **Adopt** (now) | §6 state quartet; silent `catch {}` in `InterviewFlow.tsx`. |
| 25 | Passphrase unrecoverability disclosure | **Adopt** (now) | §10.2 mechanism honesty; no such sentence exists. |
| 26 | Plain-heading clipboard format + "as pasted" preview | **Adopt** (now) | `fullDraftText` drops headings; `renderPoaText` emits markdown `##`. |
| 27 | Shared date/time formatter (absolute + relative + tz) | **Adopt** (now) | Six ad-hoc `Intl` sites; §10.3 format rule. |
| 28 | File-input hygiene: `accept`, `multiple`, mobile `capture`, hash-based duplicate detection | **Adopt** (now) | Attributes only; hash already stored. |
| 29 | Print stylesheet for compose/case | **Adopt** (now) | Covers "PDF export" without a library. |
| 30 | Vault idle auto-lock with warning | **Adopt** (now, security hygiene) | Banking-app norm; invoices/IDs on shared devices. |
| 31 | Deterministic critic rules: future tense in corrective actions, blame-shifting words, vague-time phrases, jargon swaps | **Adopt** (M-4) | Zero-LLM regex rules in the critic family that already exists. |
| 32 | Invoice issue-date capture + 365-day freshness flag | **Adopt** (M-4) | Rule verified 2 Sep; `evidenceModel.freshnessDays` already 365; UI never asks. |

Post-freeze register (recorded, not scheduled): vault export/import bundle (G4), sync conflict semantics (G5), `.ics` deadlines (F5), case notes (F8), glossary (O1), official policy links after B-08 (O3), ASIN + case-ID extraction (B2/B3), root-cause category + dated corrective actions (C5/C6), attachment references in POA text (C19), self-service deletion + optional TOTP (N5/N4), version footer + `/changelog` (A14/A12).

## 7. Verification notes

- Repo facts checked by grep on 8 Sep 2026: no `affiliat*` in `src/` or `legal/` (only an unrelated "affiliate relationship" clause in `legal/terms.md`); no `@media print`; no `capture=`, `accept`, `spellCheck`, `navigator.onLine`, `timeZone`, `interactiveWidget`; no idle timer in `VaultGate.tsx`/`lib/vault/browser.ts`; `pushVaultToCloud` uses `upsert: true`; vault records store `plaintextHash` (SHA-256); `InterviewFlow.tsx` saves after each step with silent `catch {}`; `ComposeView.tsx` copies `mergedSections.join("\n\n")` (bodies only) and its error Alert offers a link, not retry; `noticeParser.ts` has no ASIN or case-ID extraction; `interviewEngine.ts` root cause is free text with one `date` input; `EvidenceSlotPanel.tsx` has no issue-date field; `lint-copy.mjs` bans patterns, numbers, colours but not `!`; sonner ships `visibleToasts` = 3 by default (checked in `node_modules/sonner`).
- Platform facts relied on without a web check: Web Speech API recognition is processed on the browser vendor's servers in Chrome; `navigator.vibrate` is not implemented in iOS Safari; Next.js App Router scrolls to top on navigation by default; WCAG 2.2 SC 2.5.8 minimum target size is 24 px (already cited in spec §1 #6).
- Not verified (surfaced for the founder): exact wording of Amazon's invoice-requirements text on obscuring prices (E9 copy) and every official help URL (O3) — both belong to the B-08 retrieval.
