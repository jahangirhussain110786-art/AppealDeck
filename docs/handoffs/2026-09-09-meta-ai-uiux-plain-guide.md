# 2026-09-09 — Your Meta AI UI/UX list, explained in plain words

**What this is.** A plain-language companion to `docs/handoffs/2026-09-08-meta-ai-uiux-register.md` (the 189-row table). The register is the evidence. This page is the explanation. Nothing here changes a decision; the decisions you still have to make are in §8.

**Re-checked today.** Every "still missing" claim in the register was grepped again against `src/` at commit `ed05259` (9 Sep 2026). All of them still hold. Nothing on the "do now" list has been built yet.

**Vocabulary used below.** *D6* = the ethics rules in `CLAUDE.md` (no "guarantee", no promises, read-only, local-first). *Feature freeze* = the rule from AM-17: no new features until the first paid Passes and opt-in outcomes exist. *M-4* = the composer/critic work that is already in progress. *AM-19* = the proposed amendment that records these verdicts once you ratify it. *Spec 06* = the premium UI/UX spec.

---

## 1. What happened to the ~295 suggestions

Meta AI's seven replies were split into single suggestions, duplicates were merged, and each one was checked three ways: does it already exist in the code, does a locked decision already cover it, and does it fit the panic-hour seller. The result:

| Bucket | Roughly how many | What it means for you |
|---|---|---|
| Already built or already in the plan | about 55 | Meta AI's "must-haves" mostly exist. See §7. |
| Already rejected by earlier decisions | 23 | Approval scores, template galleries, chat bubbles, expert buttons and so on. Not reopened. |
| Do now, before the first deploy | 13 small items | About one working day. All copy, attributes and state feedback. See §3. |
| Do during the composer work (M-4) | about 14 rows | Need the core, so they wait for that wave. See §4. |
| Later, after first sales | about 45 rows | Real ideas, wrong time. Recorded, not scheduled. See §5. |
| Never | 33 newly named | Each breaks a stated rule. See §6. |

The exact row for every item is in the register. This page does not repeat the table.

## 2. Why the register looked repetitive

You saw the disclaimer, the autosave message and the passphrase warning three times. That is because the register has three summary sections that all lead with the same three items: §2 (the MUST list), §5 (the to-do list) and §6 (the draft amendment). They are the only three brand-new MUSTs, so they head every summary. The other 186 rows sit in the area tables in §3, which are dense and coded (A1, G2, TS/CD/MS). That layout is fine as evidence and poor as an explanation. This page fixes the explanation side.

One honest note on the transcript itself. Meta AI contradicted itself across turns (it sold template libraries in turns one and two, then killed them in turn three; it proposed "success rate %" and later killed that too). Several of its "facts" are unverified and must never become copy: "60% use a phone", "Amazon ignores over 500 characters", "Amazon prefers grade-8 reading level", "Amazon loves SOPs", "Amazon rejects emotional POAs". Its claimed audits of DocuSign, Linear and others cannot be checked. So every Meta AI line was treated as a claim to verify, not a fact. Where the transcript genuinely helped: the quiet table-stakes list in turns five to seven surfaced thirteen small things that really are missing, and the writing checks (tense, blame words, vague time) fit our zero-AI critic well.

## 3. Do now, before the first deploy

Thirteen items. All small. None adds a menu item, a card above the fold, or a second main button. The coding-agent prompt for them is `docs/handoffs/2026-09-09-uiux-polish-prompt.md`.

1. **Say plainly that you are not Amazon.** No sentence anywhere in the app or the legal pages says AppealDeck is independent of Amazon. Add one line in the footer, one short section in the Terms, and one FAQ answer. Using the Amazon name without this is a trademark and confusion exposure, and sellers who have been burned by fake "Amazon partners" look for it. The sticky top bar Meta AI wanted is rejected; a footer line carries the same fact without competing with the page. You approve the wording (a proposal is in the prompt).

2. **Tell the seller when their answers are saved, and when saving failed.** The interview already saves to the encrypted vault after every step, but it says nothing, and if the save fails it stays silent. A seller who believes the case is saved when it is not is the worst failure a local-first product can have. Add a quiet "Saved to vault · 14:02" line and, on failure, a visible message with a Retry button. Also warn if they close the tab with an unsaved answer typed in. No toast every ten seconds; that is banned by the spec.

3. **Warn at passphrase creation that a lost passphrase cannot be recovered.** The vault screen explains the encryption but never states the consequence: nobody, including us, can recover the data without the passphrase. One sentence, shown before they commit.

4. **Make the copied POA paste cleanly.** "Copy all" currently copies the three section bodies with no headings, so the structure Amazon's reviewers scan for disappears when the seller pastes into Seller Central. Add plain headings (the section titles the draft already has) and a preview of exactly what the clipboard will contain. No markdown, no `##`.

5. **One way of showing dates everywhere.** Six components format dates differently and the deadline chip is fixed to US style. One shared helper produces "14 Sep 2026 · in 10 days" everywhere, with the time zone shown whenever a clock time is shown.

6. **Upload hygiene.** Tell the file picker which types are allowed (PDF and images), allow several files at once, give phones a "Take a photo" button, and say "this file is already in your vault" when the same file is added twice. The vault already stores a fingerprint of every file, so the duplicate check is nearly free.

7. **Print stylesheet.** Ctrl+P on the compose page gives a clean printout or PDF of the POA and case file with no buttons or navigation. This is the "PDF export" Meta AI asked for, with no library and no new screen.

8. **Browser spell-check on the text the seller writes.** One attribute. Nothing leaves the browser. Pasted Amazon text is excluded.

9. **The right phone keyboard for passphrase and email fields.** No auto-capitalisation, no autocorrect on the passphrase, numeric keypad on the number step.

10. **Offline notice.** A quiet line when the connection drops: decoding and the vault work offline, drafting and critique need a connection. Plus a Retry button inside the compose error, which today only offers a link back to the case.

11. **Keep the bottom action bar above the phone keyboard.** One viewport setting; on Android Chrome the bar can hide behind the keyboard today.

12. **Auto-lock the vault after fifteen minutes idle**, with a one-minute warning. Banking-app norm; the vault holds invoices and IDs on shared or family devices. This is security hygiene, not a feature, but you confirm that reading of the freeze.

13. **Copy hygiene.** A lint rule that fails the build if an exclamation mark appears in UI copy (there are none today; this keeps it so). Define Amazon terms (POA, ASIN, ODR) the first time they appear on each page. Mark optional interview steps "(optional)". Fix a stale line in the content README.

## 4. Do during the composer work (M-4)

These touch the core engine, so they ride the composer wave rather than the polish pass. All are deterministic rules; none calls the AI.

- **Writing checks in the critic.** Flag future tense in corrective actions ("we will remove" should be "we removed on 10 July"), blame-shifting words ("Amazon's mistake", "supplier lied", "not my fault"), vague time phrases ("going forward", "ASAP", "soon") and jargon ("leverage", "utilize"). Each flag states the rule and the fix, neutrally. Warnings, never hard blocks.
- **Ask the invoice issue date and flag invoices older than 365 days.** The 365-day rule was verified on 2 Sep and the evidence model already holds the number, but the interface never asks for the date.
- **Pull ASINs and the Amazon case ID out of the pasted notice** and show the case ID in the case header. Sellers quote it in every reply.
- **Let the seller correct a wrong classification** of their notice.
- **Root-cause category before the free text** (process gap, supplier error, knowledge gap, system error), **dated corrective-action rows**, and an "at least two actions" readiness hint. The hint must never be phrased as Amazon's rule.
- **Reference attachments by filename inside the POA text** ("see attached Invoice_ABC_2026-06-02.pdf"). This replaces Meta AI's `@evidence` pills, which cannot survive a plain-text paste.
- **A neutral character counter** with no invented limit, and **stripping dashes and spaces from pasted IDs**.

## 5. Later, after the first paid Passes and opt-in outcomes

Recorded as a backlog. Nothing here is scheduled.

- Export and import the whole vault as one encrypted bundle (backup independent of our servers).
- Warn when two devices edited the same case (today the last write silently wins).
- "Add to calendar" file for each deadline. The honest reminder that respects the deferred Guardian tier.
- Private case notes; draft version snapshots; a "attach to appeal" flag on files.
- Glossary page; official Amazon policy links beside guidance (only after the policy texts are retrieved and the URLs checked live).
- Self-service account deletion; optional two-factor login; version number in the footer plus a changelog page.
- Case studies generated only from opt-in outcomes; a standard-operating-procedure builder if demand shows.

## 6. Never, and the reason for each group

**A. It would claim something we cannot know or promise (D6).** An approval score out of 100, a "reviewer simulator", a benchmark against "successful POAs", coloured dots per sentence, an "Amazon compliant" label on files, "AI scan: looks valid", "Amazon hates this" wording, invented rules ("500 characters", "3 paragraphs", "grade 8"), social-proof counters, response-time promises, a "money-back guarantee" badge (the 7-day refund is already stated; the word is banned), a "256-bit · SOC 2" bar (no SOC 2 exists), "data deleted in 30 days" (false for a local-first vault), chain-of-custody stamps and "this PDF cannot be edited". The approval score is the single most dangerous suggestion in the transcript.

**B. It pushes panic instead of calming it.** A ticking "48 h 12 m left" countdown, a red dot on the browser tab, "submit now or your case closes" reminders, "take a break" popups, a "draft saved" toast every ten seconds, progress rings, confetti.

**C. It breaks local-first, read-only or no-automation.** Anything that needs the seller's Seller Central login (account-health card, automatic case tracking, message-centre inbox), auto-editing the seller's draft when a policy changes, Google Drive import, voice-to-text (the audio goes to the browser vendor's servers), team share links (they need server-side plaintext or shared keys), API keys and webhooks, ASIN-to-product lookups (scrapes Amazon or needs the SP-API).

**D. Already decided elsewhere.** Template gallery and "insert template" tabs (your own rule, and the critic already flags template phrasing), a co-pilot chat bubble (AM-17: no chat window), live chat and "talk to an expert", a "$49 human review in 2 h" button (Expert Review is deferred), reminder pushes (Guardian is deferred), command palette, tooltip tour, empty-state videos, a language selector that does nothing, notification settings with nothing to notify, an analytics consent banner.

**E. UI clutter that fights the one-action-per-screen rule.** A sticky disclaimer bar, a bottom tab bar (a second navigation), a floating save button, a "recently viewed" list, tagging plus grid/list toggle plus bulk select plus column customisation for a list of a handful of files, hover-only row actions and hover previews (they fail on touch and keyboard), floating labels, input masks, a fifty-step undo tree.

**F. Mobile gimmicks and brand confusion.** Swipe to delete, pull to refresh, vibration on save (not supported on iPhone Safari), Amazon-blue headers (trade-dress confusion for a tool whose first claim is "not Amazon").

## 7. Already built

Meta AI presented these as things to build. They exist and were verified in the code:

- Paste a notice, get the violation type, the deadlines and a plain-English summary. Guidance cards per notice type.
- The locked three-part POA structure, asked as typed step-by-step questions, not one big text box.
- The encrypted vault: upload, view, download, delete with confirmation, search, filter, size and date per file, cloud sync of ciphertext only.
- The required-evidence checklist derived from the notice type, and a readiness bar labelled "case-file completeness, not a prediction".
- Critic flags beside each section with a severity badge; a "before you submit" checklist; the honest-expectations card at every commitment point.
- Deadline chips showing absolute plus relative dates with a calm tone that changes with proximity.
- Encrypted autosave after every interview step, a resume prompt and save-and-exit.
- Skeleton loaders, empty states, "Copied" feedback, loading states inside buttons, one-toast-at-a-time policy.
- Accessibility gates in the test suite: axe, Lighthouse, focus rings, skip link, reduced motion, labelled icon buttons.
- Device list with revoke; breadcrumbs; a sticky mobile action bar with safe-area padding; light, dark and system theme; 16 px Inter with tabular numerals; sentence case and verb-object buttons.

## 8. Your decisions

Four ticks, all inside the banner at the top of `docs/handoffs/2026-09-09-uiux-polish-prompt.md`. The coding agent must not start until they are ticked.

1. **Ratify AM-19** (the ten verdict rows). Strike any row you disagree with; the matching task gets deleted.
2. **Approve or edit the disclaimer wording.** Legal text, so it is yours to sign.
3. **Confirm the vault auto-lock is security hygiene**, exempt from the feature freeze. If not, that task is deleted.
4. **Confirm the small copy items** ("(optional)" markers, first-use definitions) ride the existing copy-audit item AA-29.

Two things I did not do because they are yours: nothing was appended to spec 06, the amendments file or `docs/DECISIONS.md` (Task 0 of the prompt does that once you tick), and nothing under `Planning/07-REFERENCE/` was touched.

## 9. How to use the two files

1. Read this page. Open the register only when you want the evidence for one row.
2. Tick the banner in the prompt file and edit the disclaimer wording if you wish.
3. Give the prompt file to your coding AI. It works task by task, one commit each, with an evidence log at `docs/handoffs/2026-09-09-uiux-polish.md`.
4. When it is done, bring the result back. I audit each task against its Accept block, the same way the Wave C-fix pass was audited.
