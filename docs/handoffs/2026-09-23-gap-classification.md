# The classification pass — what to restore, rebuild, strike or defer

**23 September 2026.** The second round the founder asked for. The finding pass
([`2026-09-22-planned-vs-built-gap-audit.md`](2026-09-22-planned-vs-built-gap-audit.md)) listed 63
items and deliberately reached no verdict. This file reaches one for each, and says why.

**Verification before classifying.** I did not classify from the register's word. Spot-checked
against the code at `5a96dd5`: `draftStrength` and `idNormalize` have test-only importers (A-07,
A-08); `analytics.ts:13-18` really does name four events differently from the spec (B-12);
`workspace.ts:482` really does reset every requirement to `"needed"` on an Amazon reply (B-03);
`superpower` appears in no script, workflow or package script (B-14); no support surface exists
(B-22); `docs/DEPLOYMENT.md:82` and `legal/withdrawal-consent.md:13` really do say `$199` while
`src/content/` says `$249`. Every check confirmed the register. One disposition needed evidence the
register did not carry: `CopyButton` **is** used by `workspace/ResponseReview.tsx`, so the workspace
has its own copy path and `poaClipboard.ts` is genuinely superseded (A-09 → strike).

---

## The short version

Six sentences, before the tables.

1. **Nothing here blocks starting work.** Two lines block *deploying* honestly, and both are fixed in
   this session's commit.
2. **The thirteen unreachable features are the best hours in the repo** — the code exists and is
   tested; most need wiring, not building. Five of them are the exact expertise an appeal writer
   would judge the product on.
3. **The single biggest unbuilt thing is the reply delta (B-03).** Today, every Amazon reply resets
   the seller's entire evidence review to zero. The median real case is multi-round. This is the
   labour the product exists to save, and it is currently anti-work.
4. **I struck 14 items outright.** Each strike is written down here with its reason, because the
   register's own warning is that an unwritten strike means the next session finds the code again.
5. **Four things are cheap today and impossible to fix later**: the analytics event names, the
   database backup, the `superpower` gate, and a support surface.
6. **Two calls are genuinely the founder's** and are listed in §5. Neither blocks the first three
   waves of work.

---

## The lens

AM-26 (22 Sep) reordered everything: *product capability before price and channel*, because the
founder has no direct seller or appeal-writer access, and the route to both is a product strong
enough to impress a professional first. Price is parked at $249. Nothing is deployed.

So the question asked of every item below is not "was it promised?" but: **would an experienced
appeal writer, shown this product cold, notice its absence?** That test moves several items up
(objection alternatives, the reply delta, the escalation ladder, seller override) and several down
(SEO pages, waitlists, persona telemetry) relative to how the original specs ranked them.

D6's ethics spine is unchanged and is still a veto, not a tiebreak.

**Four dispositions.** **RESTORE** — the code is right, wire it up. **REBUILD** — the feature is
right, the home is wrong; build it on the workspace. **STRIKE** — do not build; the reason is
recorded here so it is not rediscovered. **DEFER** — right, and correctly not now; the gate is named.

---

## 1. Category A — the thirteen built and unreachable

| ID | Disposition | Why, under the AM-26 lens |
|---|---|---|
| **A-01** attestation | **REBUILD** on the workspace | An appeal writer's largest personal risk is a client who says an action is done when it is not. This is the discipline that protects them, and it is why EF-2 wrote fixed microcopy for it. But it must not come back as an interview step: it belongs on the corrective-action side of the workspace. The critic rule at `composer.ts:255` already exists and starts firing the moment something can write the field. |
| **A-02** objection alternatives | **REBUILD** on the workspace | AM-17 called this "the moment agencies earn their fee", and the audience is now agencies. "I can't get a compliant invoice" is the most common dead end in the whole product, and `alternativesFor()` already holds consultant-reviewed answers. Wiring it into `EvidenceReview` is a small job for the single most differentiating behaviour available. |
| **A-03** done / will do / can't | **REBUILD** with A-01 | The precondition for both of the above. One surface, one commit, three items. |
| **A-04** the interview step engine | **STRIKE — delete** | The journey decision is settled: the workspace is the only journey (`d9cb847`, founder direction). This closes AA-40's still-open "classic interview keep/retire" call — the founder retired the surface on 22 Sep, and keeping the engine alive behind it is what let A-01…A-03 rot. Delete `interviewEngine.ts` **after** `alternativesFor()` and the action model have moved out, not before. |
| **A-05** `whyAmazonWantsIt` | **REBUILD**, rides B-05 | One honest sentence explaining why Amazon asks for a document is precisely the kind of thing a professional uses to judge whether a tool knows the domain. It arrives free once `proposedRequirements()` consults `evidenceModel.ts` (B-05), because the field is already on the matrix. |
| **A-06** the three outreach letters | **REBUILD** — surface from `EvidenceReview` | Supplier-invoice request, rights-owner retraction, follow-up nudge. `letters.ts` is complete and tested. These are directly useful to an appeal writer *as a professional*, not only to a seller, which raises them under the new lens. |
| **A-07** draft strength | **RESTORE** — wire into `ResponseReview` | The cheapest high-value item in the register. It was built from the founder's own 12 Sep complaint that a thin, blame-shifting draft displayed as "Full draft"; that complaint is still live in the shipped product. Do this first. |
| **A-08** ID paste normaliser | **Reclassified while building — see §8.2** | Classified RESTORE, then found on wiring it that the field it belongs in does not exist: entities are extracted from the notice and rendered read-only, and there is no ID input anywhere in `src/`. `normalizePastedId` is therefore **DEFERRED to B-06** (seller correction of entities), where a seller will actually type one. The hazard behind it turned out to be real, verified and separate, and is fixed — §8.2. |
| **A-09** POA clipboard builder | **STRIKE — delete** | Genuinely superseded. `workspace/ResponseReview.tsx` uses `CopyButton` and has its own copy path; `buildClipboardText` was `/compose`'s. Verified this session — the register did not carry the evidence. |
| **A-10** `Stepper` | **KEEP as a declared gallery primitive** | Not a lost feature — a generic UI primitive with no current consumer, which is what a component gallery is for. The defect is the *gate*, which cannot tell a deliberate gallery-only primitive from a feature that lost its door. Fix that in A-13 with an explicit allowlist entry and a reason, the same pattern already used for the Paddle webhook. |
| **A-11** two illustrations | **KEEP the same way, or place them** | AM-22's V7 sweep — the one task of that pass never run — is what would have placed them. Either place them or allowlist them; both are honest, drifting is not. |
| **A-12** `src/lib/motion.ts` | **STRIKE — delete the file** | The motion policy is correct and live (`providers.tsx:9-10`). Only the named re-export is dead. Deleting it removes a file that documents claim is the home of a system it does not contain. |
| **A-13** the reachability blind spots | **FIX — and it is the mechanism fix, not an item** | Add §7's two scans to `lint-reachability.mjs`: exclude `DevUiGallery.tsx` from counting as a reference, and check `src/core` / `src/lib` modules for importers. Must land **last** in the sweep, or it fails the build with twelve findings on the way. Then this class of defect cannot recur silently. |

**Net:** three strikes, two keeps-with-a-reason, two restores, five rebuilds on one shared workspace
surface, one gate fix. The five rebuilds are one coherent feature — *"what does this case need, have
you done it, can you prove it, and what if you can't"* — not five errands.

---

## 2. Category B — specified and never built

### B.1 Correctness and evidence

| ID | Disposition | Why |
|---|---|---|
| **B-01** fixtures for the 4 new families | **BUILD — wave 2** | `VERIFICATION`, `PERFORMANCE_METRIC`, `PRODUCT_SAFETY`, `RESTRICTED_PRODUCT` came in with taxonomy v2 on 22 Sep and have zero fixtures, so classifier accuracy is unmeasured for 40% of the families. If a professional tests the demo on a verification notice and it misclassifies, the demo is over. Cheap, and it is the only thing that proves AA-39 works. |
| **B-02** synthetic reply fixtures | **BUILD — with B-03** | Including the adversarial one (a rejection quoting the seller's own template back). The reply path cannot be changed safely without them. |
| **B-03** the reply delta | **BUILD — highest priority unbuilt item** | Today `applyWorkspaceReply()` resets every requirement to `"needed"`: the seller redoes the whole evidence review on every Amazon reply. The median real case is multi-round, so the product is *most* useless exactly where it promised to be most useful. An appeal writer would find this in ten minutes. |
| **B-04** the escalation ladder | **BUILD — wave 3, reduced** | Real professional expertise (what to do after the third rejection), and it is where A-06's letters attach. Build the ordered stages and entry criteria; keep BSA dispute display-only as specified. Large enough to stand alone. |
| **B-05** requirement union with the matrix | **BUILD — wave 2** | Today `proposedRequirements()` uses five local regexes and never consults `evidenceModel.ts`, so a requirement Amazon did not spell out is never raised. Inferring the unstated requirement *is* the expertise being sold. Carries A-05 with it. |
| **B-06** seller override of the decoded type | **BUILD — wave 2** | K12's pre-agreed response to a wrong-classification signal has no mechanism behind it. More sharply: a professional *will* disagree with the classifier, and a tool that cannot be corrected by an expert cannot be used by one. |
| **B-07** deadline provenance | **BUILD — wave 3** | Stated / seller-entered / assumed, as a field rather than buried in English label strings. Honesty about where a date came from is a D6 matter, not a nicety. Timezone handling can follow. |
| **B-08** form-constraint capture | **STRIKE as specified; replace** | Capturing limits from Amazon's live form means reading Seller Central, which **AM-27 prohibits**. The need is real (a truncated answer is a wasted appeal), so replace it with documented limits maintained as data with a dated source, and say plainly they are documented values, not read from the form. |
| **B-09** export naming map | **DEFER** | Useful to a professional assembling a pack; not what they judge the product on. Revisit after B-03. |
| **B-10** free-decode evidence hook | **BUILD — wave 3** | EF-2's "honest conversion hook". Under the new lens its conversion job matters less, but demonstrating that the tool knows what the case needs *before* asking for anything is exactly the first-impression moment with an appeal writer. Cheap. |
| **B-11** AA-31 remainder | **SPLIT** | Dated corrective-action rows → **fold into the A-01/A-03 rebuild**, where they belong. Root-cause category step → **build in wave 3**. Neutral character counter → **build with B-08's documented limits**. Jargon swaps → **STRIKE**; AA-31 already records that it was never scoped precisely enough, and that is still true. |

### B.2 Measurement, money and safety rails

| ID | Disposition | Why |
|---|---|---|
| **B-12** the six canonical event names | **BUILD NOW — wave 1** | Four events exist under four different names and `checkout_opened` — the one that separates a pricing problem from a checkout problem — does not exist at all. The spec's warning is correct: renaming later poisons every historical comparison. Hours today, unfixable after the first month of data. |
| **B-13** nightly database backup | **BUILD — before deploy** | Licences, entitlements, outcome events and case reminders have **no backup of any kind**. The cost of being wrong here is not proportional to the size of the task. A GitHub Action doing `supabase db dump --data` to an encrypted off-site copy. |
| **B-14** the `superpower` CI gate | **BUILD NOW — wave 1** | One of the three absolutes in `CLAUDE.md` §3, enforced by nothing. Roughly fifteen lines next to the existing `guarantee` gate. |
| **B-15** free-tier Gemini key guard | **BUILD — wave 3** (AI half) | D9 exists because free-tier prompts train Google's models, and today one `GEMINI_API_KEY` serves everything with no separation. The guard is the AI-owned half; the two GCP projects are the founder's and are in §5. |
| **B-16** reserved pass-holder budget + breaker alerting | **DEFER** — gate: first paid Pass | Items 1–3 exist and fail closed, which is the part that protects the seller. Reserving budget matters once free load and paid load compete, which needs traffic. |
| **B-17** measured cost per case | **DEFER** — gate: before real spend | Every limit is the placeholder the spec says must not survive, which is only dangerous once money flows. Must run before the first live Gemini bill, not before the next feature. |
| **B-18** the spike drill | **DEFER** — gate: with B-17 | Named an M-W blocker; M-W is not deployed. |
| **B-19** Sentry + uptime monitors | **DEFER** — founder priority call, already recorded | Listed so it stays a decision, not an oversight. |
| **B-20** chargeback evidence packet | **DEFER** — gate: first sale | The register's own point stands: the first chargeback is not the moment to start building it. Put it in the deploy checklist, not the backlog. |

### B.3 Product surfaces

| ID | Disposition | Why |
|---|---|---|
| **B-21** browser-notification reminders | **STRIKE — the reasoning already exists, the tick does not match it** | Descoped on 22 Sep with a good reason: a notification that fires only when the tab is already open does not "speak first", and doing it properly needs a service worker, a push service and VAPID keys. The defect is that **AA-40 is ticked as if both halves shipped**. Correct the tick text; do not build. For a signed-out seller nothing speaks first, and that is a *stated* consequence of the no-account design, not a bug. |
| **B-22** a support surface | **BUILD — wave 1** | No support page, no address, no stated response window. A professional evaluating a tool built by one person asks "who is behind this and what happens when it breaks" before they ask anything else. It also unblocks a launch gate. Cheap. |
| **B-23** public knowledge base | **DEFER** — gate: deploy | The canned responses already exist as planning content. |
| **B-24** Guardian waitlist + persona telemetry | **STRIKE the telemetry; DEFER the waitlist** | Locale/user-agent segmentation on the decoder is speculative measurement of an audience we have not met. The waitlist is fine but pointless before deploy. **Do now:** delete the stray `NEXT_PUBLIC_PADDLE_PRICE_GUARDIAN_SUB` from `.env.example` (D-10) — no code reads it and its presence is the only risk. |
| **B-25** four SEO guide pages | **DEFER** — gate: founder keyword verification | Correctly blocked, and the 21 Sep channel staging puts organic behind product capability anyway. |
| **B-26** withdrawal-function page | **STRIKE — with the reasoning recorded** | The statutory right is waived at immediate delivery under D8's consent flow, and the 7-day voluntary refund runs by email. The page was specified before that consent design settled. The register is right that the gap is really the *missing reasoning*; this paragraph is it. |
| **B-27** the MV3 extension | **DEFER — one decision, not twelve gaps** | Third in D3's order, the web surface is not deployed, and AM-27 already cut it to paste-only. Roughly a dozen unticked boxes across four documents resolve to this one line. |

---

## 3. Category C — nine ticks that do not match reality

All nine are **CORRECT THE RECORD** — no product work, and they are why the founder could not read
the documents. Do them in one bookkeeping commit.

| ID | Correction |
|---|---|
| **C-01** | Untick AA-19, AA-22, AA-37 and annotate: "built, unreachable since `d9cb847`; rebuilt on the workspace in <commit>" — then re-tick when the A-01/A-02/A-03 rebuild lands. |
| **C-02** | AA-40: state that the email half shipped and the browser half is **struck with reason** (B-21), rather than leaving a tick that claims both. |
| **C-03** | AA-31: untick the ID normaliser until A-08 is wired. |
| **C-04** | AA-35: correct "V1–V8 not started" → V1–V6 and V8 shipped 12 Sep (`39a09a8`, `4bf76b0`); **V7, the cross-page sweep, is the one task never run** and is what would have caught A-11. |
| **C-05** | Tick AA-04 — done 22 Sep as AM-27. |
| **C-06** | Tick AA-25 — AM-17 ratified 11 Sep. |
| **C-07** | Tick AA-29 — `src/content/` and `lint-copy.mjs` exist. |
| **C-08** | `09-MULTI-CASE-ARCHITECTURE-SPEC.md`: mark both DoD items done, and **give it an AM number and a `docs/DECISIONS.md` entry** — it is the only multi-case work in the repo with no amendment record. |
| **C-09** | Tick gate checks 8, 16, 19, 25, 29, 31, 39; TRA-03/04/05/11/12; B-02, B-10, B-11, B-14, B-18; MASTER 8, 9, 15, 22. Bookkeeping, and it is what makes the remaining open count mean something again. |

---

## 4. Category D — stale statements

| ID | Disposition |
|---|---|
| **D-01** `$199` in 171 places | **TRIAGE, never substitute.** The two dangerous lines are fixed in this session's commit. The remaining ~33 live-text files are wave-3 work, by hand, in the three groups §4a already separated. Historical files (`docs/handoffs/*`, `docs/DECISIONS.md`, the v1.0 plan, `CLAUDE.md:62`) and competitors' prices are **not touched** — the house convention protects them. |
| **D-02** Cloudflare as the stack | **STRIKE** — correct AA-12, B-09, Gate 2 check 14, `01-ACCOUNTS-AND-SERVICES.md` item 11, `04-PHASE-3-LAUNCH/01` item 2 to Vercel. |
| **D-03** the $99/$149/$199 price experiment | **STRIKE** — superseded by $249 flat. Remove as an open decision from B-22, MASTER 35, unknowns 7. |
| **D-04** the five-slot header | **STRIKE** — AM-25 reduced it to three. Correct `07-ACCESS-AND-CONTINUITY-SPEC.md` §3.1 and acceptance item 3. |
| **D-05** AI field suggestions | **STRIKE** — deliberately retired 22 Sep. Correct that spec's §9 and acceptance item 6. |
| **D-06** the Guided Interview acceptance set | **SPLIT, do not delete** — `05-CASE-OS-SPEC.md` §1–§3 are still authoritative; §4 and its DoD describe a product that no longer exists. Mark §4 superseded in place with a dated banner. |
| **D-07** "missing appeal window → assume 90 days" | **RATIFY THE CODE** — `deadlinesModel.ts:65-70` returns `dueAt: null` and tells the seller to verify in Account Health. That is **better** than the spec and is the honest answer; record it as an amendment rather than leaving a silent contradiction with AM-03. |
| **D-08** `docs/MIGRATIONS.md` "159 tests" | **CORRECT** to the current count, or better, stop quoting a number that ages badly. |
| **D-09** `package.json` `--args V:\AppealDeck` | **CORRECT** to `V:\AppealDeck1`. |
| **D-10** `NEXT_PUBLIC_PADDLE_PRICE_GUARDIAN_SUB` | **DELETE** from `.env.example` (with B-24). |
| **D-11** `Planning/kilo-upgrade.md`, `04-BUILD/MCP-*.md` | **STRIKE from the product count** — not product work. Move them under a clearly-marked tooling folder so they stop inflating every open-item total. |

---

## 5. The two calls that are genuinely the founder's

Neither blocks waves 1–3.

1. **EU: comply or decline.** From the 22 Sep legal research — GDPR applies with no size threshold if
   EU sellers are served, and "flat, worldwide" pricing targets them. Comply properly, or geo-decline
   EU purchases. This is a cost-and-liability decision, not a technical one.
2. **The two GCP projects** behind AA-11 / B-15, so a free-tier Gemini key cannot reach user data.
   The code-side guard is mine and is in wave 3; the projects are the founder's.

Also still open and unchanged from the register's §6: `RESEND_API_KEY` (the reminder cron delivers
nothing without it), `NEXT_PUBLIC_PLAUSIBLE_DOMAIN`, `CRON_SECRET`, the pilot's go/revise/stop
thresholds, E&O insurance, the scoped UPL review before any US marketing spend, and the leaked-file
cleanup at `V:\Extension 2.3\extraction\`.

---

## 6. The order

**Wave 1 — the sweep and the cheap-forever rails.** Close the register's headline finding and the
four things that get harder with time. A-07 · A-08 · the A-01/A-02/A-03/A-05/A-06 workspace surface ·
strike A-04, A-09, A-12 · allowlist A-10, A-11 · A-13 last · B-12 · B-14 · B-22 · B-13.

**Wave 2 — what an appeal writer judges the product on.** B-03 + B-02 (the multi-round path) ·
B-05 (+ A-05) · B-01 · B-06.

**Wave 3 — depth and hygiene.** B-04 · B-07 · B-10 · B-11's surviving parts · B-08's replacement ·
B-15 · Category C in one commit · Category D including the D-01 triage.

**Deferred with a named gate, not forgotten:** B-09, B-16, B-17, B-18, B-19, B-20, B-23, B-24's
waitlist, B-25, B-27.

**Struck, and written down so they are not rediscovered:** A-04, A-09, A-12, B-08 as specified,
B-11's jargon swaps, B-21, B-24's persona telemetry, B-26, D-02, D-03, D-04, D-05, D-11, and the
$199 price experiment.

---

## 7. Fixed in this session, ahead of the waves

The register named two lines worth fixing "before anything else, whatever the classification pass
decides". Both are done in the commit that carries this file:

- `docs/DEPLOYMENT.md:82` — the Paddle setup instruction created the product at **$199**. Following
  it would have charged sellers the wrong price on day one.
- `legal/withdrawal-consent.md:13` — the EU consent authoring record said the honest-expectations
  card states "$199 one-time per case"; the card says $249. This is the same shape of defect as the
  missing "not legal advice" sentence found on 22 Sep: an authoring record that no longer matches
  what the buyer is shown, inside the one document whose whole job is proving what they were told.

---

## 8. Wave 1, first batch — built and verified the same day

Four items chosen on one rule: they delete nothing, so none of them depends on the founder agreeing
with a strike. The strikes (A-04, A-09, A-12) and the five-item workspace rebuild wait for that nod.

### 8.1 A-07 — the draft-strength signal is on screen

`computeDraftStrength` had been built, tested and unreachable since 12 September, and the founder's
own complaint that produced it — a three-sentence, blame-shifting draft displayed as "Full draft" —
stayed live in the shipped product for eleven days. It now renders in `ResponseReview` above the
critic findings, as a second line that is explicitly about the writing rather than the evidence.

The Alert tone moved out of the JSX into `DRAFT_STRENGTH_TONE`, so "every level has a tone and a
copy string" is a test rather than something a person has to notice. A second test asserts none of
the three strings mentions Amazon, approval, rejection, likelihood, chance or odds — the D6 line
this feature is closest to crossing.

### 8.2 A-08 — reclassified, and a real defect found underneath it

Wiring `normalizePastedId` revealed it has nowhere to go: there is no ID input field in the product
at all, because AA-39 extracts entities from the notice and renders them read-only. So the module is
deferred to B-06.

The hazard it was built for is real, and was verified rather than assumed: `entities.ts` matches
ASINs with `\bB0[A-Z0-9]{8}\b`, and a zero-width space pasted inside an identifier — routine when
copying out of a mail client — makes it match **nothing**. `"B08N5\u200BWRWNW"` extracts as `null`
while the clean string extracts fine. The ASIN vanishes with no error and the seller cannot tell.
Nothing in `src/` sanitised notice text.

Fixed at the right layer: a new `stripInvisibleChars` runs where the notice is **stored** (both
workspace fields and `/decode`), never inside the extractor, because `entities.ts` guarantees
`raw.slice(start, end) === value` so the UI can highlight the seller's own words, and sanitising
after the spans are computed would slide every offset.

**Verified in a browser, not only in tests.** Pasting a notice with a zero-width space inside the
ASIN into `/decode`: exactly one character dropped, every visible character untouched, and the
decode result now shows `ASIN B08N5WRWNW` in "Details we found in your notice" — the entity that
was previously lost in silence.

### 8.3 B-12 — the funnel events now carry their canonical names

Renamed to the spec's verbatim strings, and `checkout_opened` added — fired where the Paddle overlay
actually opens rather than on the button click, so the gap between it and `pass_purchased` is
abandonment at the payment step and not a locked vault or a rejected intent.

**Found while doing it, and not in the register:** `intake_started` had been *defined* since 11
September and fired from **nowhere**, so step 3 of the funnel would always have been empty. It now
fires when a case that did not exist before is opened — once per case, covering both a fresh start
and a decode import. Three events that have no honest trigger yet (`nano_availability`,
`decode_path`, `refund_requested`) keep their spec names in a comment for whoever adds them.

### 8.4 B-14 — the forbidden-sources gate exists

`scripts/lint-forbidden-sources.mjs` + `npm run lint:sources`, wired into CI beside the reachability
gate. It scans code and assets — not prose, because the documents that forbid the thing have to be
able to name it.

**It failed on its first run, on its own doc comment**, which is recorded in the script rather than
worked around silently: the alternative, splitting the marker into fragments so the source never
spells it, would have made the rule unreadable to the next person, and unreadability is how this
rule went unenforced for a month. No other file in 341 matched.

### Gates

tsc 0 · lint 0 · lint:copy PASS · **lint:sources PASS (new)** · lint:reachability PASS ·
format:check 0 · vitest **797/797 in 73 files** (up from 792; 5 new tests) · build 30 static pages ·
Playwright `CI=1 --retries=0` **73 passed · 0 failed · 3 skipped** (baseline was 71/1/3 — the known
cross-file flake did not reproduce).

Also fixed in passing: **D-09**, `package.json`'s `filesystem:up` pointed at `V:\AppealDeck`, a repo
that is not this one.
