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

## Found, not fixed

These are outside a presentation pass, because the wording is in `src/core`. They are the founder's call.

1. **"Before you send" gap lines** come from `workspaceGaps` in `src/core` and still use engine wording, e.g. "Review and link evidence for: Supplier invoice" and "Describe the preventive process and its adoption status". They are the last jargon on the Response tab.
2. **`src/core/evidenceModel.ts:187`** tells a listing and condition policy case that Amazon wants "the specific metric failure". That reason fits a performance-metrics case. It shows as the "Why Amazon asks for this" line when the Sales or performance record card is opened.

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
