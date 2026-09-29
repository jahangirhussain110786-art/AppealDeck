# Calm case pass: evidence log (29 Sep 2026)

This pass follows [the brief](2026-09-29-calm-case-pass-prompt.md). It replaces the v6.1 build (AM-32).

## In plain words

- **Opening a case after decoding** now shows a short "Here is what we read" summary:
  - the problem;
  - the Amazon store;
  - what Amazon wants, with how many documents;
  - whether you agree.

  Then one "Yes, this is right" button. Every field that was there before is still there, under "Something wrong? Change it".

- **The Documents tab** shows one document at a time. Each document card closes to its name and status.
  - Inside a card: Amazon's words, the file, a short note, then Save.
  - Waiting, asking for it, "I can't get it" and "It doesn't apply" are under **"I don't have it"**.
  - The rules for a good document are under **"What a good … shows"**.
  - Business details close to one line until you open them.
- **The Response tab** asks plain questions ("What went wrong?", "What have you fixed already?", "How will you stop it happening again?"), each with a one-line hint and an example.
- **Small fixes:**
  - Buttons you can't press yet are grey, not faded orange.
  - The top bar says "Saved" / "Saving…".
  - "Round 1" is gone; round 2 and later show a small pill.
  - "Evidence" is now **Documents**.
  - All four tabs fit on a phone.
  - The decode page says "90 days, from when you got the notice" instead of "No date stated".
- **Nothing was removed.** No data, rule, price, or thing sent anywhere changed.

## Measurements

The scripted first-time walk: decode the sample notice, open the case, visit every tab. Guest session, production build. "Main" is the main column without the side column.

| Screen            | Main words before → after | Page height at 390 px before → after |
| ----------------- | ------------------------- | ------------------------------------ |
| First case screen | 224 → **122** (−46%)      | 2,604 → **2,114** px                 |
| Documents tab     | 422 → **168** (−60%)      | 4,854 → **2,628** px (−46%)          |
| Response tab      | 152 → **182** (+20%)      | 2,668 → 2,749 px                     |
| History tab       | not measured → 52         | 1,675 → 1,659 px                     |

- **Documents tab:** the brief asked for at least 40% shorter at 390 px. It is 46% shorter. **Met.**
- **First screen:** the brief asked for at most half the words. It went from 224 to 122, just above half (the target was ≤ 112). **Nearly met.** The remaining words are the prior-attempts question, which the brief deliberately keeps in view.
- **Response tab:** it grew on purpose. Each question now has a one-line hint, the change the brief asked for. The examples are placeholders, so they are not counted.

## Gates

All gates were run on the final code.

| Gate                                                                                            | Result                              |
| ----------------------------------------------------------------------------------------------- | ----------------------------------- |
| typecheck                                                                                       | exit 0                              |
| lint (`--max-warnings=0`)                                                                       | exit 0                              |
| lint:copy / lint:reachability / lint:sources                                                    | exit 0 / 0 / 0                      |
| format:check                                                                                    | exit 0                              |
| vitest                                                                                          | 1170 / 1170 in 95 files             |
| build                                                                                           | exit 0                              |
| Playwright chromium, `CI=1 --retries=0`, after a build, `.env.local` loaded for signed-in tests | **124 passed, 0 failed, 0 skipped** |

The baseline was CI green at `5b781bd`. No code had changed since `5f3a07a`.

## What moved where (nothing removed)

| Before                                                                                                   | Now                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Banner "Your decoded notice is saved in this case"                                                       | Kept on the Documents, Response and History tabs. On the overview the request card says "Saved from Decode".                                                          |
| Marketplace and position selects, response-page paste box, "Is this the right issue?", "Why this route?" | Under "Something wrong? Change it", which is open from the start when the notice was typed rather than decoded. "Why this?" sits under "What Amazon wants".           |
| Scam warning                                                                                             | Moved out of the notice field, so it shows even when the notice is folded. Never folded.                                                                              |
| Multi-issue list, prior attempts                                                                         | Visible, unchanged.                                                                                                                                                   |
| Every document card fully open                                                                           | One open: the first still needing work. Finishing one opens the next. Any card opens on tap, and its contents are hidden rather than removed, so typed text survives. |
| "I'm waiting", "Draft a request", ask-for-it letters, "I cannot obtain", "Correct this task"             | Under "I don't have it". A recorded "can't get it" shows outside the fold.                                                                                            |
| "How to review this file", "What a record like this has to show", "What will not be accepted"            | Together under "What a good {document} shows" ("How to check this file" when there is no guidance).                                                                   |
| "Manual review · Original files stay unchanged" caption                                                  | Inside that fold: "Your original file is never changed."                                                                                                              |
| Business details, always open                                                                            | Closed to one line when empty; open when saved.                                                                                                                       |

## Deviations from the brief

1. **The Response tab keeps its name** rather than becoming "Letter". Verification and professional-help cases show a checklist or a referral there, not a letter, so "Letter" would be untrue for them.
2. **Wording changes to honest lines:**
   - **Attestation:** "I confirm each corrective action described above is genuinely complete, as written. AppealDeck cannot and does not verify this" became "I confirm every action I describe as done above is really done. AppealDeck cannot check this." It still covers each action as written. Actions described as in progress are not claimed as done.
   - **Send note:** "Facts and file references go to AppealDeck; original files stay in your vault" became "Your answers and file names go to AppealDeck; your files stay in your vault."

   The facts are the same. `legalDisclosures.test.ts` passes unedited, because it pins neither line.

3. **The summary's document count** comes from `proposedRequirements(value, kind)` before confirming, and from the saved list after. This is a read of existing core code; nothing in `src/core` changed.

## Found, then fixed (founder approved in chat, 29 Sep 2026)

Both are wording in `src/core`, so they were left out of the presentation pass until the founder said to fix them. Only the wording changed. The conditions, the records raised, and whether a record is required are unchanged.

1. **"Before you send" gap lines** (`workspaceGaps` in `src/core/workspace.ts`) used engine wording. They are shown in "Before you send", as the dashboard's next step, in the export, and in a submission's "still open" note. Before and after:

   | Before                                                                                  | After                                                                                           |
   | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
   | Confirm the requested route against your notice and the response page.                  | Confirm how we read your notice.                                                                |
   | Confirm that the list covers every item requested by your notice and the response page. | Tick that your document list is complete, once you have checked the notice and the appeal page. |
   | This notice raises N separate issues. Confirm your response addresses each one.         | Your notice raises N separate problems. Tick that your response answers each one.               |
   | Add the requested document to your plan.                                                | Add the document Amazon asked for.                                                              |
   | Named as unobtainable, and stated in the response: X                                    | You can't get this, and your response says so: X                                                |
   | Review and link evidence for: X                                                         | Add the file, say what it shows, and save it: X                                                 |
   | Check the source of the request for: X                                                  | Check Amazon's words for this document against your notice: X                                   |
   | Answer the question: Q                                                                  | Answer Amazon's question: Q                                                                     |
   | Describe the specific root cause.                                                       | Answer “What went wrong?” in a few sentences, naming the cause.                                 |
   | Explain how the supplied records answer the request.                                    | Say in a few sentences what your documents show Amazon.                                         |
   | Describe corrective actions, distinguishing completed work from plans.                  | Answer “What have you fixed already?”, saying what is finished and what is still in progress.   |
   | Describe the preventive process and its adoption status.                                | Answer “How will you stop it happening again?”: who does what, and how often.                   |

   Unchanged: "Write the acknowledgement Amazon asked for." and "Amazon replied. Read what the reply changes before doing anything else." Both were already plain. The dashboard's fallback line became "Your answers and documents are ready for a final check."

   Already-saved "still open" notes keep the wording they were saved with. Nothing reads them back or matches on them.

2. **The POLICY entry in `src/core/evidenceModel.ts`** had been worded like the performance-metric one: "the specific metric failure", "the defect window", "apology text in place of metrics". POLICY is the general policy-violation kind, and PERFORMANCE_METRIC has its own entry, so the reason, fields and not-accepted list were rewritten for it:
   - **Reason:** "Amazon wants to see which orders the problem affected, and that every customer complaint or claim on them was dealt with."
   - **Fields:** the order or sales report for the affected listings; each complaint, return or claim and how it was resolved.
   - **Not accepted:** an apology in place of the order records; a summary total without the orders behind it.

**Gates after the fix:** typecheck, lint, lint:copy, reachability, sources and format all 0 · vitest 1170/1170 · build 0 · Playwright chromium CI 124/0/0. Unit tests updated for the new wording: `workspace.test.ts`, `questionnaire.test.ts`, `noticeIssues.test.ts`.

## Tests changed (labels only, meaning kept)

- **Files:** `e2e/decode-continuity.spec.ts`, `journey.spec.ts`, `response-continuity.spec.ts` and `workspace.spec.ts`.
- **Labels renamed:**
  - "Evidence" → "Documents"
  - "Changes saved" → "Saved"
  - "Unsaved changes" → "Saving…"
  - "Confirm this route" → "Yes, this is right"
  - "Save response facts" → "Save my answers"
  - "Root cause" → "What went wrong?"
  - "Save evidence review" → "Save document"
  - …and the other field labels in the brief.
- **Steps added:** four tests now open the fold, or the card, that holds what they check. No test was deleted, and no assertion's meaning changed.

## Follow-up: the way forward (29 Sep 2026, later)

The founder asked: "there is not any next button … which leads his filled data to next steps to the finalization of a proper response". This was not a misunderstanding. I walked the live case and found:

- **Overview** had a forward button ("Go to your documents").
- **Documents** ended at "What this case knows". Only the tab row showed that the answers came next, and nothing said the final response is prepared there.
- **Response:** "Prepare response" stayed disabled until the seller had also pressed "Save my answers". Two buttons did one job, and the second was greyed out right after the seller finished writing.
- **The prepared response,** with its last steps (read, copy, record what you sent), opened below the fold with nothing pointing at it.

What changed (no feature removed, nothing in `src/core`, the vault, the API or the Pass):

- **`StepNav`** (`src/components/workspace/StepNav.tsx`) sits at the bottom of Documents and Response.
  - **Documents:** "Documents ready: {done} of {n}.", "You can write your answers now and add the rest later.", the "Amazon asked for nothing else" tick (moved here from the top card, so it follows the list it confirms), then "Back to overview" and "Next: write your answers". A verification case gets "Next: see what to prepare"; a gated case gets no Next.
  - **Response:** "Back to documents".
  - **Pressing either button** brings the next view to the top and moves the keyboard focus to its tab. This runs in an effect, not an animation frame, because an animation frame never runs in a background tab.
- **"Prepare response" now saves the answers itself,** then prepares from what was saved. The "Save your answers above…" warning is gone because it no longer applies. "Save my answers" stays, for saving without preparing.
- **"Before you send" and the button's wording now read the answers as typed,** so an answer the seller has just written no longer appears as still missing.
- **The prepared response scrolls into view with its heading focused,** and says in one line what to do: "Read it, then copy it into Amazon's appeal page and attach your files. Come back and record what you sent."
- **"Download the linked originals from Evidence"** now says "Documents", the tab's current name.

**Checked:** walked as a guest and signed in (the prepared response, heading focused) at 1440 and 390 px, light and dark, with no sideways scroll.

**Gates:** typecheck, lint, lint:copy, reachability, sources and format all 0 · vitest 1187/1187 · build · Playwright chromium CI 126/0/0.

**Tests:**
- New: `e2e/workspace.spec.ts` "the documents view ends with the way on to the answers, and back".
- Changed: the refused-outcome test now presses "Prepare response" without saving first, and asserts that the prepared response's heading is focused.
