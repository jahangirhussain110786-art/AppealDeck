# Case OS v2 — direction: from "a website built with care" to a system that recognises, positions, and steps back

**Date:** 19 September 2026 · **Status:** planning only — no `src/` change, no existing planning file edited · **Trigger:** founder's 16–18 Sep Meta AI conversation (8-module "agency replacer" → 3-stage "Reinstate OS" → 70-feature list), pasted 19 Sep with the instruction to research again rather than dismiss, and to report in plain terms before anything is built.

**Companions (all new, all 19 Sep 2026):** [research memo](2026-09-19-case-os-v2-research.md) · [feature register (70 + 26)](2026-09-19-case-os-v2-feature-register.md) · [plain-language guide](2026-09-19-case-os-v2-plain-guide.md).

**Terms:** Track = what the notice actually asks the seller to do (appeal / documents / acknowledge / dispute / verify / funds / nothing). Family = what kind of problem it is (authenticity, IP, performance metric…). Workspace = the `/case` product shipped 18 Sep (`src/core/workspace.ts`, `src/components/workspace/`). Classic interview = the older kind-based step flow (`src/core/interviewEngine.ts`, `InterviewFlow.tsx`, `/case?mode=classic`). D6 = the ethics spine (no guarantee, no invented claims, no automation, severity gating).

---

## 0. The honest verdict, up front

1. **The founder is right about the feeling.** Opening the product today, a suspended seller gets a *description* of their notice and a *form* to fill. The system does not yet say, unprompted, "this is a documents-only request — do not write an appeal; here are the two records it names; here is the letter to your supplier; I'll remind you on Friday." That sentence is the whole product, and no page says it yet.
2. **The Meta AI transcript was not rejected.** The 18 Sep session processed *this exact* transcript item by item: `docs/product/2026-09-18-feature-decisions.md` marks **44 of 70 as Keep or Adapt**, 19 as Defer, and only **7 as Reject**. The case workspace shipped the same day was built from it. What went wrong is not rejection — it is that most Keep/Adapt items are still **P (partial)**, the product still runs **two parallel journeys**, and the piece the founder cares about most (the decoder *deciding*) was scheduled as "Slice 0" and never started.
3. **The seven rejections stand, and this pass re-checked each one against fresh evidence** (§4). They are the items that would require the product to lie (approval odds, invoice "strength" scores, revenue-loss fear math, a related-account "scanner"), to manipulate (skip-modal with fake statistics, forced edits to dodge AI detectors), or to **fabricate evidence** (a "fake but real-looking" training log — which is the one class of act Amazon treats as unforgivable and which is fraud). None of them makes the tool better at getting a seller reinstated; each makes it a scam with better UI. Every one has a compliant replacement that delivers the underlying *need*, listed in §4.
4. **The market moved under us this week (research R1):** Amazon's own Seller Assistant now "guides you through appeals… with step-by-step workflows" for free inside Seller Central. Explaining a notice is no longer worth money. What is: independent, evidence-linked case management that works *after* deactivation, tells the seller when Amazon's own path is a trap, and never touches their account. That is exactly the OS the founder describes — and it is the only ground Amazon structurally cannot take.

---

## 1. What exists today (grep-verified 19 Sep 2026, `master` at `a3fc0ac`)

| Capability | Where | State |
|---|---|---|
| Deterministic notice parse → 7 kinds, stated window, funds/Seller Challenge mentions | `src/core/noticeParser.ts`, `classifier.ts`, `index.ts` | **Built.** Extracts no ASINs, case IDs, complaint IDs, brand names or dates other than the day-count window. |
| Decode page: kind, window, DO-NOW/DO-NOT triage, "what this means" annotations anchored to the seller's text, records named in the notice | `src/app/decode/`, `src/lib/decodeAnnotations.ts`, `guidance.ts` | **Built.** Does **not** state the track ("this needs documents, not a POA"). |
| Workspace: route (documents / operational / dispute / information / clarification / specialist), seller-confirmed; requirements with verbatim source quote; evidence linked by file + hash + page + note; deterministic response; submission snapshots; reply → new revision; autosave; outcome + archive; case list | `src/core/workspace.ts`, `src/components/workspace/*`, `src/lib/caseStore.ts` | **Built (18–19 Sep).** Routing needs the seller to type the form's instructions first. |
| Classic interview: kind-based questions (root cause, dates, prior appeals, prevention), per-kind evidence matrix, action check ("done / will do / can't") with predefined alternatives, readiness (completeness, never odds), gap draft vs full draft, LLM rewrite of narrative sections, critic rules | `interviewEngine.ts`, `evidenceModel.ts`, `readiness.ts`, `composer.ts`, `InterviewFlow.tsx`, `/api/compose` | **Built.** Runs *beside* the workspace, not inside it. Two composers exist (`composePoa` with Gemini; `composeWorkspace` deterministic). |
| Case state machine (14 states, funds sub-track, novelty rule), reply analyser (7 regex categories), letters (supplier invoice, retraction, follow-up), outcome schema + opt-in endpoint | `caseState.ts`, `responseAnalyzer.ts`, `letters.ts`, `outcomeModel.ts`, `/api/analyze-reply`, `/api/outcome` | **Built.** State machine is not the home screen; letters are not generated from the *actual* notice's ASINs/requirements; reminders are stored dates only — nothing is ever delivered. |
| Vault: encrypted, local-first, per-account/guest isolation, device key or passphrase, backup/restore, preview/download | `src/core/vault/`, `src/lib/vault/` | **Built.** Nothing *reads* a document — no OCR, no PDF text, no field extraction. |
| Entitlements, Paddle, per-case Pass, checkout eligibility check, rate limits, breakers | `src/lib/license.ts`, `/api/checkout/intent`, webhook | **Built.** |

**Diagnosis in one line:** the *parts* of an operating system exist; what is missing is the *kernel* that decides, the *sensors* that read, the *clock* that speaks first, and *one* journey instead of two.

---

## 2. The target experience — three sentences the system must be able to say

The whole v2 can be tested by whether these three sentences appear, unprompted, at the right moment:

1. **On decode (Understand):** *"This is a **document request** about **2 ASINs** (B0…, B0…). Amazon is asking for **supplier invoices dated in the last 365 days** — it is **not** asking for a Plan of Action. Your stated window is **90 days** from the notice date; confirm the exact date on your Account Health page. Do these 3 things now; do not do these 4."*
2. **In the case (Fix):** *"Your invoice for B0… is missing the supplier's phone number (page 1, top-right — nothing readable there). Here is a request to your supplier naming exactly what Amazon needs. Mark it 'waiting' and I'll bring it back on **Tuesday**. Meanwhile, your second record is complete."*
3. **After submission (Prove):** *"You submitted on 12 Sep. Amazon's reply asks for **the same invoice again** — this usually means the reviewer could not verify the supplier, not that the file was missing. Your last attempt already attached `invoice-acme.pdf` (hash …). Sending it unchanged risks a permanent lock; here is what has to be *different* this time."*

Every clause in those sentences is either extracted from the seller's own text/files or drawn from the reviewed evidence matrix. None is a prediction, a percentage, or a promise. That is the "robotic leg": it recognises, positions, and steps back.

---

## 3. What is genuinely missing (the 12 gaps, ordered by leverage)

| # | Gap | Why it is the difference between a website and an OS | Compliant with D6? |
|---|---|---|---|
| G1 | **Track decision at decode time** — the notice itself (plus an optional screenshot of the Account Health form) yields *track* (appeal / documents-only / acknowledge / dispute / verification / funds / information-only / not-Amazon / unsupported) with a stated reason and the exact sentence it came from. Today `routeWorkspace()` can only do this after the seller types the form instructions. | R2: wrong track is the #1 practitioner-reported cause of denial. This is the "recognise" step. | Yes — deterministic first; the seller confirms; ambiguity abstains ("clarification"). |
| G2 | **Entity extraction with source spans** — ASINs, Order IDs, Case/Complaint IDs, dates, brand/complainant names, the "how do I reactivate" section, requested-record phrases. Seller corrects; never invented. | Every later sentence ("2 ASINs", "the invoice for B0…") depends on it. Letters, requirements, duplicate checks, and the response all need real identifiers. | Yes — regex + span; LLM only for bounded extraction with schema output (existing `/api/extract-field` pattern). |
| G3 | **Taxonomy v2** — split `POLICY` into `PERFORMANCE_METRIC` (ODR/LSR/VTR/cancellation) vs policy conduct; add `VERIFICATION` (INFORM / identity / video call), `RESTRICTED_PRODUCT`, `PRODUCT_SAFETY` (gated), `SELLER_CHALLENGE` as a track flag; keep `INAUTHENTIC_DOCUMENTS` gate but separate "product authenticity complaint" from "document falsification allegation" so genuine invoice-holders are not over-gated (18 Sep blueprint §2 finding). | R4/R5/R8: three high-volume 2026 notice classes the product currently routes to "clarification" or lumps together. | Yes — additive; severity gates untouched or strengthened. |
| G4 | **Evidence that reads itself (local-first)** — PDF text layer (pdf.js) and image OCR (Tesseract.js) **in a Web Worker in the browser**, so document bytes never leave the vault; extracted field candidates (supplier name/address/phone, dates, quantities, product codes) shown with page/region; per-requirement checks rendered as *present / missing / unclear / conflicting / not applicable*; seller confirms each. Cloud extraction only as an explicit opt-in second pass (T2 terms). | The founder's Module 3 is the biggest tech moat *and* the biggest honesty risk. Local OCR keeps the local-first promise intact; the four-state check replaces the dishonest "invoice strength 42%". | Yes — readability/completeness/consistency only; **never** authenticity. Screenshots are not auto-rejected (A2 allows images). |
| G5 | **One journey** — retire the classic interview as a separate product; keep its engine as the workspace's "ask" surface (one step at a time, typed inputs, decline-with-reason, predefined alternatives). One composer path: deterministic assembly from confirmed facts → optional LLM *phrasing* of narrative sections → critic. Dashboard and Case Overview merge into one home ("Cases" → case). | Two parallel flows are why the product feels like "a website built with care": the seller meets seams. An OS has one front door. | Yes. |
| G6 | **The clock speaks first** — opt-in reminders actually delivered: browser Notifications API for signed-out sellers; email (Resend, already wired for receipts) for account holders; a "since you were here" brief on return (state, deadline, waiting items, one next action). Deadline provenance shown (stated in notice / seller-entered / unknown). | An agency calls you. Today the product stores a reminder date and never speaks. This is the single cheapest way to feel alive without any AI. | Yes — reminders to the *seller* only; nothing is ever sent to Amazon or a supplier. |
| G7 | **Waiting-for-third-party as a first-class state** — "I've asked my supplier" → letter pre-filled from the real requirement + real ASINs → follow-up date → nudge → "received" → new version linked to the old, both kept. Other work stays unblocked. | Founder's Module 5 without the automation. Real agencies spend most of their hours here. | Yes — seller sends; product drafts, tracks, reminds. |
| G8 | **Facts ledger with provenance** — a `Fact {field, value, state: extracted/confirmed/disputed/unknown, sources[]}` layer (blueprint §7). The composer uses only confirmed facts; contradictions surface neutrally ("your root cause says X; the invoice shows Y — which is right?"). | This is the *honest* version of "lie detection": consistency review, not accusation. It also makes "no invented claims" mechanically true instead of a rule the LLM is asked to follow. | Yes. |
| G9 | **Reply delta + duplicate-submission guard** — compare the new reply's asks against the last submission (text + attachment hashes): what was asked before, what is already attached, what reopened, what must be *different*. Warn hard when the new draft/attachments are byte-identical to the last attempt. Real 2026 reply fixtures. | R7: resending the same appeal is the best-evidenced route to a permanent lock, and the workspace already has the hashes to catch it. | Yes — mirrors AM-03's novelty rule structurally. |
| G10 | **Verification and Seller Challenge tracks** — zero-LLM checklists: INFORM 10-day certification, identity/video-call preparation (documents, name consistency, appointment mechanics), Seller Challenge token counter (3/180 d) with the "exhausted standard appeals?" gate. | R3/R4/R5: high-volume, currently unsupported, needs no AI, and is exactly the calm-agency voice. | Yes. |
| G11 | **Case-questions drawer** (05 §4.3, spec'd Sept 2, never built) — zero-LLM cards by kind + state ("what does 'no further consideration' mean?", "why does Amazon want a phone number on the invoice?"). Fixed honest line for unanswerable questions. | "Self-talking" without a chatbot. Cheap content, structural abuse-proofing. | Yes. |
| G12 | **Evidence pack export** — manifest (export filename ↔ original ↔ hash ↔ page ↔ requirement), cover sheet, plain-text response, optional PDF; naming described as *our* convention, never "Amazon standard". | Founder's #31/#32/#53/#57. `buildCaseExport()` exports notes only today. | Yes. |

Everything else in the transcript is either already built, a later-phase extension of one of these twelve, or in §4.

---

## 4. The seven rejected items — re-checked, and what replaces each

| Meta AI item | Why it stays out (19 Sep re-check) | What delivers the real need instead |
|---|---|---|
| #18 Approval odds ("38% → 82%") | No dataset exists (still none in 2026; AppealsPro's transparent 23% is the only published number). Inventing one is the incumbent sin the market is scarred by; it also creates refund/chargeback exposure. | The four-state requirement checks (G4) + "case-file completeness — not a prediction" (already built) + the *specific* unresolved list. A seller who sees "supplier phone missing on page 1" acts faster than one who sees "38%". |
| #27 Invoice strength score 0–100 | Same class; also mathematically meaningless without ground truth. | Per-field present/missing/unclear/conflicting with page/region (G4). |
| #39 "Fake but real-looking" training log | Fabricating evidence for an Amazon appeal is fraud; Amazon's document-falsification response is permanent. Also a D6 hard floor. | A **blank** training-record template plus a guided log for a session that *actually happened* (date, attendees, material, owner) — with draft/adopted states so the POA never claims adoption that hasn't occurred. |
| #43 Fear/loss calculator ("$X/day") | Coercive; the number would be invented; distressed buyers + fear framing = the exact pattern regulators and MoRs punish. | Deadline provenance + honest cost-of-inaction *facts* from the matrix (attempts are limited; identical resubmission risks a lock), then respect the choice. |
| #45 Skip modal with poor odds | Manipulative; odds are invented. | "Decline with reason → predefined alternatives → consequence in words" (already built in `interviewEngine.ts`), surfaced in the workspace (G5). |
| #54 Force edits to evade AI detection | Gaming a detector is the wrong goal; the fix for boilerplate is real facts (R9). | Facts ledger (G8) + critic flags for vague/unsupported language (partly built, AA-31) + "three places only you can answer" prompts that ask for *specifics*, not word changes. |
| #62 Related-account "scanner" | Nobody outside Amazon can see its linkage graph; claiming to is a lie. | A factual relationship timeline the seller builds (accounts, dates, shared resources, status), routed to specialist review — the honest input a professional actually needs. |

Also unchanged from earlier passes (D2/D7/D9, and the 18 Sep launch strategy): no $99/$299/$799 tiers before value is proven; no human-review marketplace through Paddle; SP-API only as a scoped read-only spike for *post-reinstatement* monitoring (a deactivated account's API is unreliable exactly when needed); no ensemble/fine-tune on a corpus we do not have; no auto-submission or auto-email ever (Agent Policy).

---

## 5. Architecture of the v2 kernel (additive to what exists)

```
paste / PDF / image  ──►  extract (spans)  ──►  DECIDE {family, track, scope, certainty, reasons[]}
                                                     │
                       ┌─────────────────────────────┼──────────────────────────────┐
                       ▼                             ▼                              ▼
              instantiate requirements       open track tools                 set clock
              (from the notice's own         (letters, checklists,            (deadline w/ provenance,
               reactivation section +         verification prep,               waiting dates, reminders)
               reviewed matrix)               Seller Challenge tokens)
                       │
                       ▼
            evidence READ (local OCR/PDF) ──► field candidates ──► 4-state checks ──► seller confirms
                       │
                       ▼
            FACTS ledger (extracted / confirmed / disputed / unknown, with sources)
                       │
                       ▼
            compose from confirmed facts only ──► critic ──► immutable attempt (text + hashes)
                       │
                       ▼
            reply ──► delta vs last attempt ──► duplicate guard ──► revised plan (old plan kept)
```

- **New core modules (pure TS, tested, no React):** `decision.ts` (family/track/scope/certainty), `entities.ts` (span extraction), `facts.ts` (ledger + contradiction detection), `evidenceChecks.ts` (4-state per-requirement), `replyDelta.ts`, `verification.ts` (checklists), `sellerChallenge.ts` (token budget).
- **New browser-side services:** `documentReader.worker.ts` (pdf.js + Tesseract.js in a Worker; results stored encrypted beside the file), `reminders.ts` (Notifications API + opt-in email via the existing Resend client).
- **Schema:** additive `Workspace v2` (issues[], facts[], requirement instances with applicability + alternatives, artifacts with versions, planRevisions[], attempts[] already partly present). Zod-bounded like `workspaceSchema.ts` today. Migration reads v1 unchanged; nothing moved or deleted (same rule the 14 Sep multi-case P0 proved).
- **No new routes for chat.** LLM use stays at `decode`, `extract-field`, `compose`, `analyze-reply`, all schema-constrained. Per-case budget unchanged.
- **Retire, don't delete, the classic interview:** `/case?mode=classic` keeps reading legacy cases; new cases never start there.

---

## 6. Build order (for a future session — not now)

Effort bands are planning ranges for one implementer; each phase ends with the house gates (tsc · lint · lint:copy · format · vitest · build · Playwright) and one browser walkthrough.

| Phase | Delivers | Includes gaps | Effort | Exit test (what the product must *say*) |
|---|---|---|---|---|
| **K0 — Kernel** | `decision.ts`, `entities.ts`, taxonomy v2, decode page states the track; fixtures for every track incl. verification, Seller Challenge, information-only, not-Amazon, multi-issue, truncated | G1 G2 G3 | 1–2 wk | Sentence 1 of §2 renders for a documents-only fixture; a POA is *not* offered for it; a verification fixture opens the checklist; every gated fixture still gates. |
| **K1 — One journey + the clock** | classic interview folded into the workspace as its ask-surface; single composer path; merged home; deadline provenance; delivered reminders (browser + opt-in email); "since you were here" brief; waiting state with pre-filled letters and follow-up dates; case-questions drawer | G5 G6 G7 G11 | 2–3 wk | A seller who leaves mid-case gets a reminder on the date they chose and returns to one screen that names the next action; a supplier wait does not block other work. |
| **K2 — Sensors** | local PDF/OCR worker; field candidates with page/region; 4-state checks; facts ledger; contradiction prompts; duplicate-submission guard; reply delta with real 2026 fixtures | G4 G8 G9 | 2–4 wk | Sentence 2 and 3 of §2 render on the fixture set; an identical resubmission is warned about before it can be recorded; no check ever says "authentic". |
| **K3 — Pack + tracks polish** | evidence pack export with manifest; Seller Challenge token counter; verification prep; INFORM 10-day handling; readiness copy sweep | G10 G12 | 1–2 wk | Export opens in a second browser with every reference resolving; the token counter refuses a 4th challenge inside 180 days. |
| **Pilot gate** | the 18 Sep launch-strategy gates (§8 there) — unchanged | — | observation | Five observed sellers can name the next action unaided and distinguish "planned" from "done". |

Cut order if time forces it: K3 → K2's cloud-OCR opt-in → K1's email reminders (browser reminders stay). **K0 and the duplicate guard are not cuttable** — they are the OS claim.

---

## 7. Decisions needed from the founder (in chat is fine)

1. **Retire the classic interview for new cases** (keep it read-only for saved legacy cases)? — recommended yes; it is the root of the "two products" feeling.
2. **Local OCR first** (pdf.js + Tesseract.js in-browser, zero cloud) with cloud extraction only as a later opt-in — recommended yes; it keeps the local-first promise literally true.
3. **Reminders by email for account holders** (Resend, opt-in per case) — recommended yes; needs the `RESEND_API_KEY` that is already on the blocker list.
4. **Taxonomy v2 as in G3** — recommended yes; the `PERFORMANCE_METRIC` split and `VERIFICATION` kind are the two with clear evidence.
5. **Pass scope wording** (the 18 Sep strategy asked for it and it is still open): does one Appeal Pass cover all revisions and replies for that case, for how long? K1's "reply delta" makes this visible to buyers, so it must be decided before K1 ships.
6. **Amendment number:** code comments already cite AM-23, AM-24 and AM-25 (12 Sep header/interview decisions) that were never written into `02-BUILD-PLAN-AMENDMENTS.md` (last recorded is AM-22). Recommend recording them as one-paragraph back-fills, then logging this direction as **AM-26** with the §6 phases as AA-36…AA-39. Not done here — the amendments file and `docs/DECISIONS.md` are edit-gated to founder ratification.
7. **Dossier updates** (edit-gated): §3 Amazon row (Seller Assistant now guides appeals), R-23 severity, §1.5 AppealsHub back online.

---

## 8. Draft amendment text (for the founder to paste once ratified — not appended here)

> **AM-26 — Case OS v2: the decoder decides the track, evidence reads itself locally, one journey, the clock speaks first (proposed 19 Sep 2026).** Founder direction: "a text site is not successful until it is a self-talking, highly interactive system… an operating system, not a website built with care." Re-verification of the 16–18 Sep Meta AI transcript against 19 Sep 2026 web evidence and the code at `a3fc0ac` found 12 real gaps (direction doc §3) and re-confirmed 7 rejections (§4) with compliant replacements. Adds core modules `decision.ts`, `entities.ts`, `facts.ts`, `evidenceChecks.ts`, `replyDelta.ts`, `verification.ts`, `sellerChallenge.ts`; browser-side local OCR/PDF worker and delivered reminders; taxonomy v2 (`PERFORMANCE_METRIC`, `VERIFICATION`, `RESTRICTED_PRODUCT`, `PRODUCT_SAFETY` gated); Workspace v2 additive schema; retirement of the classic interview for new cases. Locked decisions untouched: D2 pricing, D6 (no odds, no fabricated records, no automation, severity gates), D7 (SP-API deferred to post-reinstatement monitoring), D9 (LLM only at the four schema-constrained routes). **AA-36** K0 kernel · **AA-37** K1 one journey + clock · **AA-38** K2 sensors · **AA-39** K3 pack + tracks. Feature-freeze note from AM-17 §5 is superseded for these four items only, by explicit founder direction on 14 and 19 Sep 2026.

---

## Definition of done (this planning pass)

- [x] Transcript re-read in full; each of its 70 items reconciled with the 18 Sep decision and the code (register).
- [x] Live-web re-verification dated 19 Sep 2026 with URLs (research memo), including the one finding that changes positioning (Seller Assistant).
- [x] Twelve gaps named with file-level grounding, each tested against D6; seven rejections re-checked with replacements.
- [x] Build order with exit tests; founder decisions listed; draft AM text ready.
- [x] Plain-language guide written (house rule since 9 Sep: dense documents ship with a plain companion).
- [ ] Founder answers §7; a fresh session writes the K0 task prompt from §5–§6 and repoints `SESSION-START-PROMPT.md`.
