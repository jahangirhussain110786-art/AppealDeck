# The case page today — complete inventory (28 Sep 2026)

**What this is.** Every feature, control, message and state a seller can meet on `/case`, read from the code at `5f3a07a` (not from the prototype). It is the checklist for the v6.1 build: when the build is done, every line below must still exist somewhere, re-worded and re-placed per [the build handoff](2026-09-28-v6.1-build-handoff.md) §4, or be listed there as deliberately changed. Nothing here may disappear silently.

Abbreviations: CW = `src/components/workspace/CaseWorkspace.tsx`, RR = `RequestReview.tsx`, ER = `EvidenceReview.tsx`, RespR = `ResponseReview.tsx`, RG = `RequirementGuidance.tsx`, PA = `PriorAttempts.tsx`, CO = `CaseOverview.tsx` (all in `src/components/workspace/` unless a path is given). Copy lives in `src/content/workspace.ts` and `src/content/app.ts`. Line numbers are as of `5f3a07a` and will drift.

**Not on `/case` (dashboard, unchanged by this pass):** outcome recording and "Archive this case" (`CaseOutcome.tsx`), outcome sharing, email/follow-up reminders (`ReminderControl`), "Waiting on someone else", "Delete this case", `ClockBriefCard`.

## A. Case types (routes)

Routes: `PROTOCOL_LABELS`, `src/core/workspace.ts:20-30`; router `routeWorkspace` (`workspace.ts:625-698`). Only **documents, operational, questionnaire, acknowledgement** can prepare a response (`COMPOSABLE_PROTOCOLS`, `workspace.ts:44-49`). Overview next-step priority (CW:1375-1393): gated → reply pending → awaiting → information → cannot compose → next record → records not confirmed → prepare.

- **operational — Plan of Action** (the prototype's case). Response fields: root cause; corrective actions with the attestation tick; prevention. Each needs ≥40 characters (`workspace.ts:862-874`).
- **documents — Document response.** One field, "Your factual explanation"; sheet title "Your response brief"; no corrective/prevention/attestation. Gaps: "Add the requested document to your plan." (no records) and "Explain how the supplied records answer the request."
- **questionnaire.** One answer box per Amazon question, in Amazon's order, each with a count and wording help (RespR:174-199). Explanation relabelled "Anything else Amazon should know (optional)". Each unanswered question is a gap.
- **acknowledgement.** Same as documents; gap "Write the acknowledgement Amazon asked for." with no 40-character minimum.
- **verification — identity or business verification** (ID, video call, INFORM Act or re-certification wording). The Response tab shows `VerificationChecklistCard` ("Preparing your verification": numbered steps, "Commonly missed" badges) instead of a response. Cannot compose. The overview says "Clarify the requested response" → "View case notes". No "Write and check your response" checklist row.
- **dispute — Disputed allegation** (position "I disagree with the allegation"). Cannot compose. The explanation field still shows. "Organize your notes first" (`C.unsupported`) replaces the prepare/sign-in/Pass area. No "Improve the wording".
- **information — Informational update** (no action requested). Overview "No new response is requested". Otherwise like dispute.
- **clarification** (non-US marketplace; notice under 30 characters; undetermined; or the saved route no longer matches the notice). Like dispute.
- **specialist — Professional review (gated)** (fabricated documents, fraud, child safety — D6; or the sticky `professionalReviewRequired`). Overview "Get professional help with this allegation", no record preview. Response tab shows only "Professional review needed". The timeline's "Amazon replied?" button is hidden. `gatedScreenShown` analytics fires once. Evidence and History stay available.
- A **severity-gated kind** gets the gated UI even when the route label is composable (CW:932).
- **Route mismatch after a notice edit:** gap "Confirm the requested route…", and the case cannot compose until it is re-confirmed.

## B. Every feature, by where it is today

### Loading, errors, vault

- "Opening your case…" plus skeletons.
- "Could not open this browser's vault" / "Reload to try again…".
- "Case unavailable" with the reason; "Could not read your saved case. Reload to retry…".
- A legacy case migrating shows a spinner.
- `VaultGate` (`src/components/VaultGate.tsx`):
  - open error with Reload;
  - loading skeleton;
  - init passphrase form;
  - device-relock set-passphrase form;
  - unlock form: "Passphrase", "Unlock", "Need to set up or recover your vault?" → /vault;
  - idle warning "Vault locks in 1 minute" / "Stay unlocked";
  - auto-lock toast after 15 minutes;
  - persistent-storage request.

### Top bar

- **Title:** the issue name (`APP.violationKinds[kind]`), or "Your case workspace" when the kind is UNKNOWN.
- **"Round {n}"** badge, hidden on mobile.
- **Save status**, one of:
  - "Unsaved changes — saving to this device…"
  - "Saving or processing…"
  - "Changes saved" ✓
  - "Save each review to keep changes."
- **Autosave:** field drafts save ~900 ms after typing stops and flush when the seller leaves the page.
- **"New case"** (hidden on mobile) opens the "Start a separate case?" card:
  - "Create separate case"
  - "Keep working here"
  - conflict text "This case changed in another window. Reload before starting another case."

### Above the tabs

- **Migration note** "Your case moved into the workspace": only for a migrated legacy case.
- **Decoded notice banner** "Your decoded notice is saved in this case": shown until the route is confirmed. On other tabs it adds "Review the saved request".
- **Error alert** "Action not completed", with one of:
  - the other-window conflict;
  - "Could not attach the file. Try again.";
  - "Update the task's source to an exact sentence…";
  - "The original file is unavailable…";
  - "A linked document changed or was removed…";
  - "Could not build the manifest…".
- **Tabs** Overview / Evidence / Response / History, kept in `?view=`.

### Overview tab

- **Change-of-approach card:** only after 2 or more submissions (prior ones count) and a latest reply that is not "reinstated".
  - Title "Two responses have not resolved this. Change the approach, not only the words."
  - An intro and 4 numbered steps, including the seller-performance@ and jeff@ escalation addresses.
  - A sources note and 3 source links.
- **Before the route is confirmed:**
  - **NextStepCard:** "Next step" pill, the first dated deadline, "Check how we read your notice", and the body "Confirm what Amazon is asking for below…".
  - **RequestReview:**
    - **Header:** "Start with the actual request" / "Add your notice, check the current request, then confirm your route." When decoded: "Review your decoded request" / "Your notice is saved. Check the route we suggest below, then confirm it."
    - **Decoded summary tile:** "Amazon notice", "Saved from Decode" or "Unsaved notice edits", "· N characters", and "Read or edit your notice".
    - **Notice textarea** "Amazon notice": up to 50,000 characters, invisible characters stripped, autosaved draft `request.notice`.
    - **Authenticity (scam) warning** above the notice, when flagged.
    - **"Marketplace on the notice":** Amazon US / Another marketplace / unsure.
    - **"Your position on the allegation":** I need to understand it first / I acknowledge the issue described / I disagree with the allegation. This choice changes the route.
    - **"What the response page asks for (optional)":** paste box, help `C.formHelp`, draft `request.formInstructions`.
    - **Kind override "Is this the right issue?":** "Change the issue" → a select of every kind → "Use this issue instead". It adds records without removing any, and the effect text says so.
    - **"Suggested route"** with a "Why this route?" disclosure.
    - **Issues raised** (only with more than one issue): "This notice raises more than one issue", a lead, then each issue with "Where we read that" and the quote. Read-only here.
    - **Prior attempts "Have you already responded to this notice?":**
      - lead text, and "Why this matters" (shown when none are recorded);
      - "Yes, I already responded" / "Add another response";
      - an optional date (max today) and optional pasted text with help;
      - "Record this response" / "Cancel";
      - each attempt listed with its date (or "Date not recorded") and text (or "Wording not kept"), plus a delete button;
      - the effect alert once any exist.
    - **"Confirm this route":** disabled if the notice is under 30 characters. It recomputes kind, records, issues and deadlines, and writes history.
    - **"Save for later":** saves without confirming.
- **After the route is confirmed:**
  - **NextStepCard:**
    - the due line;
    - the next record preview (desktop only; not when gated, reply pending or awaiting);
    - the title/body pairs listed under A;
    - primary CTA: "Read Amazon's reply" / "Add a reply" / "View case notes" / "Review evidence plan" / "Review response facts";
    - secondary "Review the request".
  - **Route line:** "{Route} · You review the wording and send it yourself through Amazon's own page."
  - **Checklist:** "{done} of {total} done" and a bar.
    - One row per record: label, source ("Named in your notice" / "Usually asked for in cases like this" / "Added by you"), status pill, filename.
    - "Every issue in the notice answered" row (multi-issue only).
    - "Write and check your response" row (composable only): Sent / In progress / Not started, with a character count.

### Evidence tab

- **"Requested records"** ("Attach originals. Review each record. Note what it supports."):
  - "Read the saved request" (notice + form text);
  - "Add a requested record": label, "Where this came from (optional)" and "Add requested record". Capped at 30 records. A verbatim notice sentence marks the record as Amazon's; anything else as the seller's.
  - the **"all records" tick** "I checked the notice and response page, and this list covers all requested records.": disabled until confirmed, and cleared when the list changes.
- **"Your business details"** (`CaseFactsCard.tsx`): name, address and suppliers, "Save business details", and a privacy note.
- **One card per record:**
  - **Header:** status pill, label, and provenance: "We added this" / "You added this" with help, or Amazon's quoted sentence.
  - **File:**
    - linked filename + "Read original";
    - otherwise the `FileDropZone`: "Drop a file here" / "Choose a file", "Take a photo" on touch devices, "PDF, PNG or JPEG · up to 10 MB stored, up to 3 MB checked", an "Uploaded" list, and "File too large" / "That file type is not accepted";
    - "Change linked file" or "Use a file already in this case" → "Link an existing file from this case".
  - **Document check** (`DocumentCheckPanel.tsx`, only once a file is linked):
    - "What we could read" and "Checked {date}.";
    - "Check this document" / "Reading your document…" / "Check again";
    - the send disclosure (server kinds) or on-device disclosure (identity/bank);
    - a stale notice when the notice or business details changed;
    - error variants: unnamed kind, identity PDF, format, size, sign-in expired, no Pass, server, unreachable;
    - business result: summary, numbered findings with field, note, quote, "Compared with:", status, disqualifiers, and "This describes your document only. Whether Amazon accepts it is their decision.";
    - identity/bank result "How the picture looks";
    - saved checks kept with the case.
  - **Review "What does this file show?"** ("Manual review · Original files stay unchanged"):
    - note "What does this record support or leave unclear?" (draft);
    - "Source page" (1–10000);
    - the reviewed tick "I checked the original, its page reference and the facts recorded here." (it resets on edit);
    - "Save evidence review" (needs a file, the tick, a note and a page);
    - "I'm waiting for information" (then the waiting help box);
    - "Draft a request" → "Request to the record issuer" with "Copy request draft" and "AppealDeck does not send messages.";
    - "How to review this file".
  - **Guidance** (`RG`, absent for seller-added records):
    - "Why Amazon asks for this";
    - "What a record like this has to show";
    - "What will not be accepted";
    - one "Ask for it — {letter}" per letter, with a Copy button.
  - **"I cannot obtain this record"** panel:
    - a reason of at least 10 characters;
    - "What you can do instead": each alternative with its honesty note, "What this costs you", "Choose this path" and "Chosen";
    - "Record that you cannot obtain this";
    - once recorded: a warning, the reason quoted, "I can obtain it after all", and "Recorded {date}. Change it any time.".
  - **"Correct this task or mark it no longer applicable":**
    - "Exact request in the current notice or form" + "Update request and reopen review";
    - "Why is this record no longer requested?" (at least 10 characters) + "Remove from current plan". The removal is remembered.
- **Facts ledger "What this case knows"** (`FactsLedgerCard.tsx`, hidden when empty):
  - a mismatch alert "One thing does not match" / "{n} things do not match", listed first;
  - each fact with its status, value(s) and sources.

### Response tab (non-gated, non-verification)

- **Header:** "Your response"; "What happened. What changed." (operational) or "Your response brief"; "Use confirmed facts. Your wording is preserved in the response."
- **Fields:** questionnaire answers; the explanation (label per route); for operational, corrective actions + attestation + prevention.
  - Attestation: "I confirm each corrective action described above is genuinely complete, as written. AppealDeck cannot and does not verify this." Disabled while empty; cleared on edit; "Confirmed by you on {date}…".
- **Under every section:** "{count} characters" and **"Improve the wording"** (signed-in and composable only).
  - It shows the short-text hint or the send note, then "Suggesting clearer wording…".
  - The suggestion: "Your wording" / "Suggested wording", a check note, "Use the suggested wording" / "Keep mine".
  - Messages: unchanged, fact changed, needs Pass, sign in, too many, busy, unavailable.
- **"Save response facts."**
- **Issues confirmation** "My response addresses every issue listed above." (multi-issue only).
- **Cannot compose:** "Organize your notes first" (`C.unsupported`).
- **Can compose:**
  - "Before you send" with "{n} items to resolve" and the gap list;
  - guests: "Sign in to prepare your response" (with `?next=`);
  - **Pass gate** (`ComposeGate.tsx`): "Unlock the drafted plan", "$249, once, for this case", the EU consent row + checkout, "Activating your Appeal Pass…", a timeout with "Check again" + Billing, and "Continue to your draft";
  - "Prepare response" / "Prepare working draft" (disabled while facts are unsaved, with its warning), and "Requires an Appeal Pass for this case…".
- **After preparing** ("Review the exact response"):
  - the mode reason and watermark warning;
  - the response text;
  - **draft strength** "The writing itself: …" (strong / needs work / weak) and **critic notes**;
  - the final review tick "I reviewed the facts, attachment names and page references against the response page in Seller Central.";
  - "Copy response" / "Copy working draft" (after the tick);
  - "Download the linked originals from Evidence… Copying does not record a submission.";
  - **"Before you submit"** checklist (`BeforeYouSubmitChecklist.tsx`): evidence attached, no template phrases, "Novelty on attempt {n}", "You submit this yourself in Seller Central", and "Open Seller Central" when all pass;
  - **duplicate warning** "This looks like what you already sent" (date, % overlap, new sentences);
  - **"Record what you sent"**:
    - "Still open on this case" items + note;
    - "I sent the response exactly as prepared here." / "I changed it before sending, or sent different wording." → "Paste the text you actually sent";
    - "Submission reference or receipt note (optional)";
    - a confirm tick (two wordings);
    - "Record submission" → SUBMITTED, then History.

### History tab

- **"Submissions and replies"** ("Earlier attempts stay unchanged when you revise the plan."):
  - "Earlier request · revision {n}" (notice, form text, records with file and status);
  - empty state: "No submission recorded" / "Copying or exporting does not submit a response.";
  - "Attempt {i} · {date} · revision {r}" (text, reference, attachments with page), including prior attempts;
  - **reply paste** "Add Amazon's next reply" (≥30 characters, ≤99 replies, draft) → "Save reply for review" → REVISION.
- **Per reply:**
  - "Applied to a new revision" / "Review before changing the plan" and "Read reply · {date}";
  - **reply reading** (unapplied): "What this reply says", 7 category sentences, "What Amazon says was wrong, in its own words" with quotes, and "This is our reading…";
  - **reply delta** "What this reply changes": Asked for again / New in this reply / Still on your list / Kept as reviewed, or "This reply does not name any records…";
  - "The reply becomes the request for the next round…";
  - "Start the next round with this reply", which keeps the seller's date and returns to Overview.
- **"Activity":**
  - the last 3 events, or "Activity appears as you save your work.";
  - "Earlier activity (n)";
  - "Download case notes" (appealdeck-case-notes.txt) and "Download evidence manifest" (hashes, sizes, record, page).

### Sidebar

- **Timeline:**
  - "Amazon replied?" (confirmed and not gated);
  - deadline lines: no countdown / closes {date} / {label}: {dateTime} / from the day you received it / confirm in Account Health / "No confirmed deadline recorded…";
  - events: "Amazon replied" + quote, "You sent response {n}", "A response you sent before this case", "Case started".
- **Seller deadline field:** "The response date Amazon shows you in Account Health", help text, a date, "Save this date".
  - A past date is blocked.
  - Once entered: "You entered this date from Account Health." and "Remove the date I entered".
- **Vault card:**
  - "No files yet" / "1 file in this case" / "{n} files in this case" and "Saved on this device. Open vault";
  - "Storage & privacy" (`C.privacy`);
  - guests: "Guest session · Sign in to move work to your account vault.";
  - "All cases";
  - "New case" (mobile).
- **App sidebar case list:** a dot, title, and "{n}d" / today / waiting for each case; a click switches case.

## C. Rare states a fresh first-round case never shows (the ones most likely to be forgotten)

- Vault forms and the idle lock.
- Migration note; decoded banner/variant; scam warning; other-window conflict.
- **Multi-issue:** the issues list, the Response confirmation, the checklist row and the gap line.
- Recorded prior attempts (list, effect alert, delete).
- Kind override applied; "We added this" / "You added this".
- A record in "waiting" or "cannot obtain"; removing a record; the 30-record cap; linking an existing file.
- **Every document-check state**, including identity/bank, stale, and disqualifiers.
- A facts-ledger mismatch.
- Sign-in gate; Pass gate phases.
- Every wording-help message.
- Watermark; weak/needs-work strength; the duplicate warning; open items at record time; the "changed before sending" path; "Open Seller Central"; "Confirmed by you on {date}".
- **After submission:** "Keep the next reply with this attempt" / "Add a reply"; "Sent" pill; an edit flips to REVISION.
- **Reply pending:** reply reading, delta, "Start the next round".
- **Round 2+:** round badge, earlier requests, the applied badge, carried/reopened records, recomputed deadlines.
- The change-of-approach card.
- Timeline reply events; the seller-entered date and its removal; earlier activity.
- Gated/specialist; verification checklist; dispute/information/clarification ("Organize your notes first", "View case notes"); non-US marketplace.
- Questionnaire per-question answers; acknowledgement's relaxed gap.
- "Start a separate case?"; mobile "New case"; "Take a photo".
