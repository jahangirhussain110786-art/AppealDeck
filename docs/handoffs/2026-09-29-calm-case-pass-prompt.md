# Calm case pass: the brief (29 Sep 2026)

This is the prompt I work from. The founder asked for it in chat on 29 Sep 2026: "think like an expert designer and content writer … small changes, text readability, the user does not feel overwhelmed with text, the user feels it is a highly easy to use OS." It follows the review that found the app did not need the full v6.1 rebuild ([visual review](2026-09-29-v6.1-visual-review.md) and the chat assessment the same day).

**This pass replaces the v6.1 build.** The five-step restructure is not built. The v6.1 prototype and handoff stay as reference. The v6.1 ideas worth having are taken here, in a smaller form: one-glance summary on the first case screen, one document open at a time, "I don't have it", and plain questions with examples.

## 1. Who I am for this pass

A senior product designer and UX writer. I have shipped calm, trusted tools for people under stress, like tax, immigration and medical portals, and I measure my work by one thing: the seller knows what the screen is and what to do next within five seconds.

## 2. Who the seller is

- Their Amazon account has just been suspended.
- They are frightened, often short of sleep, and often reading English as a second language, sometimes on a phone.
- They have already read the decode result. They do not want to read it again.
- They distrust anything that looks like a legal form.
- They will do the work if they can see how small the next piece is.

## 3. The goal

The same product, with the same features and the same rules, but calm. Every screen of the case answers two questions at a glance: _what is this?_ and _what do I do now?_ Everything else is still there, one tap away.

## 4. Design rules

1. **One main action per screen.** At most one orange button is visible for the current task. Other actions are outline, ghost or link buttons.
2. **Show the answer; fold the controls.**
   - Summaries are visible. The fields that change them sit behind a clearly named fold ("Change something", "I don't have it", "What a good invoice shows").
   - Folding is allowed. Removing is not.
3. **Say it once.** A fact, heading or reassurance appears once per screen. A second copy is cut.
4. **One thing open at a time.** A list of heavy cards (documents) shows each card's name and status. Only the one that needs the seller is open.
5. **Lines a tired person can read.**
   - Body text 15–16 px.
   - Helper text no smaller than 13 px, and only one line of it under a field.
   - Measure ≤ 70 characters.
6. **A disabled button never looks broken.** It turns neutral grey rather than faded orange, and where the reason isn't obvious it says it.
7. **Space before lines.** Group with spacing and one heading, not with nested boxes.
8. **Status is a word plus an icon**, never colour alone.
9. **Phone first.** Tabs fit at 390 px. No text is clipped, and nothing forces horizontal scrolling.

## 5. Writing rules

1. Short sentences, about 20 words at most, one idea each.
2. "You" and "we". Buttons start with a verb.
3. Plain words:
   - **documents**, not "records" or "evidence";
   - **letter**, not "response facts";
   - **the problem**, not "the allegation";
   - **Amazon store**, not "marketplace";
   - **page**, not "source page".
4. Every writing box shows a "For example: …" placeholder.
5. Explain an Amazon term once, in brackets, where it first appears.
6. **The honest lines stay.** They may get shorter, but their meaning must stay the same:
   - nothing is sent to Amazon, and you send it yourself;
   - "We added this" / "You added this";
   - we cannot check your corrective actions;
   - what a document check and wording help send, and to whom;
   - no promise about Amazon's decision.
7. `lint:copy` rules apply: no "guarantee", no win rates, no bare percentages, no exclamation marks.

## 6. Hard rules (never broken)

1. **Nothing is removed.** Every control, state, disclosure and honest line that exists today still exists after this pass. It may be re-worded, moved within its own screen, or folded.
2. **No behaviour change.**
   - Nothing in `src/core/*`, the vault format, `workspaceSchema.ts`, API routes, Pass/entitlement checks, gap rules, or what leaves the browser.
   - The data each button writes is unchanged.
3. Copy I touch moves into `src/content/` if it was inline.
4. **Tests.** When a string changes, the tests that assert it change in the same commit. A test is never deleted. A test whose _meaning_ would change means stop and ask. `src/content/__tests__/legalDisclosures.test.ts` keeps passing unedited, unless a pinned line's wording changes; then the meaning must be identical.
5. Founder's batch rule: 3–4 tasks per commit, gates once per batch, push when green.

## 7. The tasks (ranked by how much calmer they make the product)

Before and after each task I record two numbers for the screen it touches: the **visible word count** (main column, 1440 px) and the **page height at 390 px**. Baselines were measured on 29 Sep 2026:

| Screen                   | Words |
| ------------------------ | ----- |
| First case screen        | 305   |
| Documents (Evidence) tab | 505   |
| Letter (Response) tab    | 235   |

The Documents tab is 4,854 px tall at 390 px, for two documents.

### T1 · The first case screen (after "Open case workspace")

- **Now:** three headings say "your notice is saved / check how we read it / review your decoded request". Below them sit a seven-block form: the notice, store, position, a paste box for the appeal page, the issue, the route, and prior attempts.
- **Do:**
  - One heading.
  - A **"What we read"** summary: the problem, the Amazon store, what Amazon wants (route and number of documents), and whether you agree.
  - Then "Have you already replied to this notice?", kept visible because it changes what we check.
  - Then **Yes, that's right** (orange) and **Save for later**.
  - A single **"Change something"** fold holds the store, your position, the appeal-page paste box, the issue override and "Why this route?".
  - The notice itself sits behind "See or change your notice".
  - The scam warning and the multi-issue list stay visible and are never folded.
  - When the notice was _not_ decoded (typed straight into `/case`), the notice box and the appeal-page box stay open, because there is nothing to summarise yet.
- **Accept:** no field lost; the confirm and save-for-later buttons write exactly what they wrote before; the number of words shown before the fold is at most half the baseline.

### T2 · The Documents tab

- **Now:** a card for the list, the business-details form fully open, then every document card fully open. Each card shows the drop zone, a note box, a page box, a tick, three buttons and four or five folds.
- **Do:**
  - **Top card:**
    - "Documents Amazon wants" with one line of explanation.
    - "See your notice".
    - "Amazon asked for something else?", which is add-a-document with the same fields.
    - The all-documents tick, reworded with the same meaning.
  - **Business details:** folded by default when empty, open when details are saved or being edited. Same fields and same privacy line.
  - **Document cards:** each card is a disclosure. Its header shows the status, the name, and who asked ("In your notice" / "We added this" / "You added this"). Only the first document that still needs the seller opens by default, and any card opens on tap.
  - **Inside a card, in order:**
    - Amazon's words, or our "We added this" line.
    - One visible "why" line.
    - The file: drop zone or linked file, plus "Use a file already in this case".
    - The document check.
    - "What does it show?" (the note), with "Page" small beside it.
    - The tick, then **Save**.
    - An **"I don't have it"** fold holding: "I'm waiting for it", "Draft a request", the ask-for-it letters, "I can't get it" (the full cannot-obtain panel), and "It doesn't apply / correct the request" (the existing correct-or-remove form).
    - "What a good {document} shows" holds the fields, the not-accepted list and "How to review this file".
- **Accept:**
  - every control that exists today is reachable;
  - saving a review still needs the file, the note, a valid page and the tick;
  - the tab is at least 40% shorter at 390 px for the sample case.

### T3 · The Letter tab (today "Response")

- **Now:** jargon headings ("Corrective actions and their actual status", "Prevention: owner, process and adoption status"), empty boxes, no examples, and "Save response facts".
- **Do:**
  - **Plain questions, each with a one-line hint and a "For example" placeholder:**
    - "What went wrong?"
    - "What have you fixed already?"
    - "How will you stop it happening again?"
    - For other routes: "What do these documents show Amazon?" or "Anything else Amazon should know? (optional)".
  - **Shorter writing:**
    - the intro, one sentence;
    - the attestation, the same meaning in fewer words;
    - the send line under the button, in plain words, with the same facts.
  - **Buttons:** "Save my answers".
- **Accept:** field ids, the save payload, and the gates (sign-in, Pass, dirty) are unchanged; every honest line is still present.

### T4 · The side column and the top bar

- **Deadline field:** the label and help drop from 32 words to about 15. "Save this date" becomes "Save".
- **Top bar:**
  - "Changes saved" → "Saved".
  - "Unsaved changes — saving to this device…" → "Saving…".
  - "Round {n}" is shown only from round 2, as a small pill rather than monospace text.
- **Tabs:** Overview · **Documents** · **Letter** · History. Icons are hidden below 640 px, so all four fit at 390 px. The URL ids stay `evidence` / `response`, so old links work.
  - _Built differently (evidence log, Deviations 1):_ "Response" was kept, because verification and professional-help cases have no letter in that tab.

### T5 · Two small global fixes

- **Disabled orange button:** it becomes neutral grey (`bg-muted`, `text-muted-foreground`, no shadow) instead of 50% faded orange. This applies everywhere.
- **Decode page "Reply due" tile:** when the notice gives a window but no date, the tile says **"90 days"** (the window) with "from when you got the notice", instead of "No date stated". When the notice states neither a window nor a date, "No date stated" stays.

### Not in this pass

These are recorded so they are not lost:

- the v6.1 five-step rail and home;
- one question per screen;
- the phone button dock;
- the step 4 and 5 re-plumbing;
- the `src/core/evidenceModel.ts:187` sentence ("specific metric failure") shown for a listing or condition policy case. It is a content error in `src/core`, so it is outside this presentation pass. The founder decides whether it gets its own fix.

## 8. How I prove it

1. Baselines, then after each batch:
   - typecheck, lint, lint:copy, lint:reachability, lint:sources and format:check;
   - vitest;
   - a build;
   - Playwright chromium run as CI (`CI=1 npx playwright test --project=chromium --retries=0`).
2. The same scripted walk as the review (decode the sample, open the case, every tab), at 1440 and 390, light and dark. I look at every screenshot and record the word counts and heights before and after.
3. Evidence log: `docs/handoffs/2026-09-29-calm-case-pass.md`.
4. Record **AM-32** ("calm case pass, replaces the v6.1 build") in `02-BUILD-PLAN-AMENDMENTS.md`, add a `docs/DECISIONS.md` entry and a CLAUDE.md §4 bullet, and update `docs/CURRENT-STATE.md` rows if a capability's wording changes.
