# Your four issues — what's actually wrong, what I fixed, and what's left

**Date:** 11 Sep 2026
**Who this is for:** you, in plain language first, with the technical evidence underneath so a coding session can act on it without re-investigating.
**Style note:** every claim below is backed by an actual file and line number I read in the real code — not a guess. Where I say "confirmed," I mean I either read the code and traced the logic, or I opened the real running app in a browser and watched it happen.

---

## The short version

You raised four things. Here's where each one stands after this session:

1. **Passphrase should only ever appear on the Vault page, never on Case/Dashboard.** ✅ Fixed and verified in the browser.
2. **Signed-in data should persist; signed-out data should be session-only (gone when the tab closes).** ✅ Fixed and verified in the browser.
3. **Signing out but Case/Dashboard still act signed-in as the dev account.** ✅ Fixed and verified in the browser.
4. **The POA composer, the password fields, and the vault's view/download button are genuinely broken or badly under-built, and the overall guided flow doesn't feel like a real product yet.** ⚠️ **Not fixed in this session — diagnosed in full below, with concrete options.** This is the big one, and it deserves its own coding session rather than a rushed patch. Read the "POA composer" section below first — it's the most important finding in this whole document.

---

## Part 1 — What I fixed today (issues 1 and 2)

### 1a. Passphrase now lives only on the Vault page, and only if you turn it on

**What was wrong:** Dashboard, Case (the guided interview), and Compose were all silently wrapping themselves in the same "unlock this vault" screen that the real Vault page uses. Because you'd been through the earlier sign-in flow that sets a passphrase, that screen showed up as a real passphrase prompt on pages that should never have asked for one. On top of that, the Compose page had never been wired to unlock automatically at all — it would show a passphrase box even for an account that was never given a passphrase, and clicking submit would just fail.

**What I changed:**
- Dashboard, Case, and Compose now always unlock automatically using a key your browser holds for you — no passphrase, ever, on those three pages. ([DashboardClient.tsx](src/components/DashboardClient.tsx:331), [InterviewFlow.tsx](src/components/InterviewFlow.tsx:428), [ComposeView.tsx](src/components/ComposeView.tsx:309))
- The Vault page now also opens automatically by default — **no page asks for a passphrase unless you choose one.** ([VaultView.tsx](src/components/VaultView.tsx:221))
- I added a real, working "Protect with a passphrase" button on the Vault page (optional, off by default), plus a "Switch to automatic unlock" button to undo it. ([VaultView.tsx](src/components/VaultView.tsx))
- I added the underlying crypto operation that makes "switch back" possible — it didn't exist before, so once someone turned passphrase mode on there was no way back except losing data. ([vault.ts](src/core/vault/vault.ts) — new `relockWithDeviceKey` method, covered by 4 new automated tests)

**The one honest limitation you should know about:** your case data and your vault evidence documents are currently stored in *one* encrypted box, not two. If you (or a future customer) turn passphrase protection on from the Vault page, it protects that whole box — so yes, Dashboard and Case would then ask for it too, because they share the same lock. The dialog says this plainly when you turn it on. By default (nobody opts in), this never happens and nothing ever asks for a passphrase. If you want "passphrase protects evidence documents only, never touches case/dashboard even if turned on," that needs splitting the vault into two separately-keyed boxes — see **Option A/B** at the end of this section if you want that built properly later. I did not do that bigger surgery today because it's a real architecture change, not a quick fix, and the default behavior already matches what you asked for.

**Verified in the browser:** signed in as the dev test account, Dashboard/Case/Vault all opened with zero prompts. Clicked "Protect with a passphrase," saw the dialog, cancelled it (didn't want to leave your test account harder to test with). All 366 automated tests pass, plus 4 new ones for the new "switch back" operation.

*Options if you want the fuller fix later:*
- **Option A (bigger, cleaner):** split the vault into a "case" box (always automatic, never a passphrase) and an "evidence" box (can optionally be passphrase-protected on its own). Real DB migration, roughly a day of focused work.
- **Option B (what's live now):** one box, passphrase is opt-in and applies to everything if chosen. Zero migration risk, matches your ask by default, only matters if someone actually turns the option on.

### 1b. Signed-out sessions are now genuinely temporary

**What was wrong:** a visitor's in-progress case was being saved to the browser's permanent storage with no expiry at all — closing the tab, or even closing the whole browser and coming back a week later, would still show the old draft. That's not "session," that's "forever until you manually clear your browser."

**What I changed:** added a small check ([guestSession.ts](src/lib/vault/guestSession.ts)) that runs the moment a signed-out visitor opens Case or Dashboard. It uses a browser feature (`sessionStorage`) that is *automatically* wiped when every tab/window for the site is closed, but *survives* a plain refresh or clicking between your own pages. On the first page-load of a new browser session, if there's a leftover draft from a previous signed-out visit, it's wiped before anything loads. If you're signed in, this never runs — signed-in data behaves exactly as before (persists normally).

**Verified in the browser:** started a guest case ("Related account" test case), confirmed it carried over from Case to Dashboard within the same tab, then simulated closing the tab and reopening — the draft was gone, exactly as you asked. **One thing worth flagging on purpose:** this means if a panicking seller fills out three steps of the interview and closes the tab without signing in, that work is gone for good, with no warning beforehand. That's a real product risk for exactly the kind of user this product is for (someone in a hurry, mid-crisis). If you'd rather they get a clear "you'll lose this if you close the tab without signing in" banner instead of losing it silently, that's a five-minute copy change I can add — just say the word.

### 2. Signing out no longer leaves stale "still signed in" pages behind

**What was wrong:** this was a real, well-known class of Next.js bug, not something vague. When you sign out, the button was doing a soft, in-app navigation back to the login page. Next.js aggressively caches already-rendered pages in the browser for reuse on your next click — so clicking "Case" or "Dashboard" right after signing out could replay the *already-rendered, still-signed-in* version of that page instead of asking the server again. That's exactly what you saw: it "opens up perfectly" because it's not really opening anything new, it's just showing you the old screenshot-like copy it had cached from before you signed out.

**What I changed, two layers of fix so this can't quietly come back:**
- The sign-out button now does a real, full page reload to the login page instead of a soft in-app navigation. ([SignOutButton.tsx](src/components/SignOutButton.tsx)) A full reload throws away that stale cache completely.
- I also turned off that caching behavior app-wide for pages that depend on who's signed in, via a one-line Next.js setting. ([next.config.mjs](next.config.mjs)) This is the belt-and-suspenders fix — even if some other button in the app ever does a soft sign-out in the future, this setting stops the stale-page problem at the source.

**Verified in the browser:** signed in as the dev account, signed out, then went straight to Case and Dashboard — both correctly showed the signed-out screens (the "no case yet, sign in" versions), with no trace of the dev account anywhere in the header or the page.

**Was this ever a real security hole?** Only cosmetic/confusing, not a security bypass — nobody could actually *act* as the old account (the server-side checks were always correct; it was purely a stale rendered page being reused client-side). But it absolutely looked broken and would have alarmed a real customer, so it was worth fixing regardless.

---

## Part 2 — The POA composer is not actually drafting anything

This is the most important thing in this document. Please read this section slowly.

### What you saw

You said the generated Plan of Action had exactly three lines — one per section. You asked, in your own words, "is this what we've built?"

**Yes. That is exactly, precisely what the code does today.** I read the function that builds the Plan of Action. Here it is, almost word for word ([composer.ts](src/core/composer.ts:68)):

```
function buildRootCauseSection(data) {
  return {
    heading: "Root Cause",
    body: "[Describe what caused the {kind} issue. Be specific and factual.]",
  };
}
```

That's not a draft. That's a **fill-in-the-blank instruction to the seller**, written as if it were the finished document. The "Preventive Measures" section is the same trick — a bracketed instruction, not a sentence about anything you actually did. The only section with any real content is "Corrective Actions," and even that is just a bullet list like `- [Completed] Fixed the listing`, not a written paragraph.

### Why this happened — the part that will make the "why" click

You typed a real answer into the interview. I watched this happen live: I opened the app, started a test case, and the first question was *"What happened? In your own words, what led to this enforcement?"* — and whatever you type there is saved, encrypted, correctly, into your case file as `rootCause`.

**The composer never reads it.** I checked the function line by line ([composer.ts](src/core/composer.ts:68-74)) — it takes your case data as an argument, and the Root Cause section builder never once looks at `data.rootCause`. It only looks at what *type* of violation this is (policy, IP, funds hold, etc.) and prints a generic instruction based on that category. Your actual words — the ones you spent time carefully typing — are saved, then silently thrown away at the exact moment they matter most.

I confirmed the same gap in the API route that serves this to the browser ([compose/route.ts](src/app/api/compose/route.ts:83)) — it calls the exact same bare function. There is no AI call anywhere in this path. There's no LLM prompt, no draft generation, nothing. It's a template with blanks.

**This isn't a case of "the AI did a bad job."** There is no AI in this step at all, today. The product's core promise — "we draft your Plan of Action" — is, in the literal current code, "we hand you a form with instructions on what to write, organized by section." That's a fundamentally different (and much less valuable) product than what's being promised.

### Why did nobody notice until now?

Two honest reasons, not excuses:
1. Every session since the last real build push has been about UI polish, visual design, sign-up/sign-in flow, deadlines, the vault, screenshots — all real, all needed — but nobody actually sat down and read a generated POA end-to-end and asked "does this sentence make sense to a human." The planning documents (`Planning/03-PHASE-2-BUILD/04-EVIDENCE-FIRST-HARDENING.md`) are detailed about *when* to gate a draft (evidence-complete vs. gap-draft) and *which document type* to produce (POA vs. IP dispute vs. funds appeal) — but they never actually specified *how the sentences get written*. Everyone building around it assumed that part already worked or was trivial. It was neither.
2. There genuinely is a working AI integration in this codebase already ([gemini.ts](src/lib/llm/gemini.ts)) — it's used for reading a pasted notice, suggesting answers while you type, and (per the plan) critiquing a draft. It was just never connected to the one place that matters most: actually writing the draft.

### What "done right" looks like, and your two realistic options

You said: *"a poor appeal is never be considered an appeal... the POA should always be complete in all means."* I agree completely, and here's how I'd get there.

**Option A — Wire in real AI drafting (recommended).**
Use the Gemini integration that already exists in this codebase for its intended job: take everything the seller actually said — the root cause narrative, the timeline, prior appeal history, which evidence is attached and what kind — and have it write real, specific paragraphs for each section, grounded only in facts the seller actually provided (never inventing anything, which is exactly the "evidence-first" ethic your own planning docs already commit to). The deterministic rules you already have (banned-language checks, future-tense checks, blame-shifting checks, evidence-freshness checks — all in [composer.ts](src/core/composer.ts:121)) stay exactly as they are and run *after* the AI draft, as a safety net, not a source of the text.
- Cost/ops note: your existing Gemini setup already prices and rate-limits four specific tasks (extract-field, critique-poa, phrase-engine-output, triage-router). Drafting a full POA is a bigger, pricier call than any of those — it needs its own entry in that same cost-ceiling system (D9 in your decision log already requires a spend cap before anything ships wide), not a bypass of it.
- Effort: this is a real feature, not a bug fix — plan for a few focused days, not an afternoon.

**Option B — Make the deterministic version actually say something, without AI.**
If you want something better *immediately*, cheaply, and without depending on an external AI call at all, the rules-based composer can still weave your actual typed answers into real sentences using straightforward template logic — for example, turning a stored root-cause answer and a timeline event into "On {date}, {rootCause}." instead of a bracketed instruction. This will never read as polished as a real AI draft, but it stops the "we discarded your answer" problem today, and it's a much smaller, safer change (no new AI cost, no new failure mode).

**My recommendation:** do Option B as a fast, honest stop-gap in the next session or two (it directly fixes "we throw away what the seller typed," which is the worst part of the current behavior), then do Option A properly once you're ready to commit real time to it. Do **not** ship Option A half-built under time pressure — a bad AI-written legal-adjacent document is worse for your reputation than an honest, plain deterministic one.

### The other half of your ask: "if there isn't enough to write a good POA, ask for more instead of generating a bad one"

Good news: part of this already exists. There's a real "gap draft" mode ([readiness.ts](src/core/readiness.ts:137), [composer.ts](src/core/composer.ts:104)) that checks whether required *evidence documents* are attached, and if not, refuses to produce a "ready to submit" draft — it adds a big watermark ("NOT READY TO SUBMIT") and a section listing exactly what's missing and why Amazon wants it. That part is genuinely solid and matches your instinct exactly.

**What's missing:** that gate only checks whether a *file* was uploaded. It does not check whether the seller's *written answers* are actually substantive. Right now, I confirmed in the code ([interviewEngine.ts](src/core/interviewEngine.ts:171-174)) that literally any non-empty text is accepted as a root-cause answer — someone could type "idk" and the interview lets them continue exactly as if they'd written three paragraphs. Combined with the composer not using that text anyway (see above), the "quality" of the narrative is currently a non-issue for the software, when it should be central.

**What I'd build:** a second, separate "sufficiency" check that runs right before the composer is allowed to produce a full (not gap) draft — something like: root cause answer must be a minimum length and not just a placeholder word, at least one timeline event must be present, and (once Option A ships) the AI drafting step itself should be able to say "I don't have enough here to write a credible paragraph" and hand back a specific follow-up question instead of a thin answer, rather than silently producing three lines. This is a natural extension of the evidence-readiness scoring you already show on the dashboard — it just needs a second, narrative-quality dimension alongside the evidence-completeness one.

---

## Part 3 — Password fields have no show/hide toggle anywhere

Confirmed by reading every password input in the app. Every single one of these is a plain `type="password"` field with no eye icon, no toggle, nothing:

- [Login](src/app/(app)/login/page.tsx) — the sign-in password field
- [Signup](src/app/(app)/signup/page.tsx) — the create-password field
- [Reset password](src/app/(app)/reset-password/page.tsx) — the new-password field
- [Vault unlock / create / relock forms](src/components/VaultGate.tsx) — three separate passphrase fields
- [Vault "protect with a passphrase" dialog I added today](src/components/VaultView.tsx) — same gap, added consistent with the existing (broken) pattern rather than fixed in isolation

**Why this matters more than it sounds:** these are exactly the fields where a typo is most costly (a mistyped vault passphrase can mean permanently unrecoverable data, by design — you can't ask "forgot password" for a local encryption key). Not being able to check what you typed before submitting is a real usability problem, not a cosmetic one.

**The fix is small and should be done once, everywhere, not field-by-field.** Build one shared `PasswordInput` component — a normal text input with a small eye/eye-off icon button that toggles `type="password"` / `type="text"`, matching the icon style already used elsewhere in the app (Lucide icons, already a dependency) — and swap every password field above to use it. This is genuinely a same-day fix once someone sits down to do it; I'm flagging it here rather than doing it now only because you explicitly asked me to fix the top two issues first and write this document for everything else.

---

## Part 4 — The vault's "view" and "download" buttons

You said the view button gives "a false notification of download" and nothing actually downloads. I read both functions closely ([VaultView.tsx](src/components/VaultView.tsx)):

**The "view" (eye) button doesn't really show you the file.** For a text file it shows the first couple thousand characters in a small toast notification. For anything else — a PDF, a photo of an invoice, a scanned document, which is most of what actually gets uploaded here — it just shows a toast that says *"Binary file, use download to save"*. So "view" mostly can't actually show you anything for the file types sellers will realistically upload. That's a real, confirmed gap, separate from the download issue.

**The "download" button has a subtler, genuinely real bug.** Here's what it does: decrypt the file, build a temporary in-memory link, simulate a click on it, then immediately show a "downloaded successfully" message — regardless of whether the browser actually saved anything. The problem: some browsers (and especially embedded/webview-style browsers, which is plausible for however you were testing this) refuse to treat a simulated click as a "real" user action once there's been *any* asynchronous delay between your actual click and the simulated one — and decrypting the file is exactly such a delay. When that happens, the download silently does nothing, but the code has no way of knowing that, so it shows "success" anyway. **That matches your description exactly: a false notification, because the code genuinely cannot tell the difference between a real download and a silently blocked one with the method it's using today.**

**The fix, in two parts:**
1. **Make "view" actually preview the file** — open a proper dialog showing the real image inline, a real PDF viewer for PDFs, and the full text (not a truncated toast) for text files. Only fall back to "no preview available, use download" for genuinely unsupported types.
2. **Make "download" trustworthy** — use the browser's newer, more reliable Save-a-file API where it's available (this one *does* tell you honestly whether the user actually saved the file or cancelled, unlike the current method), and fall back to the current method with more honest wording ("download started" instead of "downloaded") where the newer API isn't available. This turns a silent, undetectable failure into either a real confirmed save or an honest "started" message that doesn't over-promise.

I did not build this today — it's a contained, well-scoped fix (roughly half a day including a proper preview dialog), and it's listed here for a future session rather than rushed in alongside the two priority fixes you asked for first.

---

## Part 5 — The bigger picture: "we're building a vault, not a guided solution"

I want to respond to this directly, because I think you're right, and I don't want to bury it under the smaller bugs above.

**What exists today, structurally:** paste notice → decode → guided interview (step by step, one question at a time) → a readiness/completeness score → a composer step. That skeleton is genuinely reasonable and matches how a real appeals product should feel. The individual pieces — the interview engine, the evidence-requirements model, the deadline tracking, the reply-analysis on Amazon's responses — are each honestly well-built and thought through; I read a lot of this code today and it's not sloppy.

**What's missing is the thing that turns those pieces into a product a panicking seller trusts:** the actual payoff. Right now the most important moment in the whole flow — "here is your drafted appeal" — is the weakest part of the entire application, by a wide margin, because (per Part 2) it isn't really drafting anything. Everything upstream of it (the interview, the evidence checklist, the deadline tracker) is in service of a moment that currently falls flat. That's very likely a large part of why the whole flow "feels sucked up" to you even though, piece by piece, it's fairly solid — the ending doesn't deliver on what the beginning promises.

**My honest recommendation for sequencing**, if you want my opinion on priority order:
1. Fix the composer so it never again throws away what a seller typed (Part 2, Option B is a fast, safe version of this).
2. Add the password show/hide toggle (Part 3) — cheap, low-risk, same-day.
3. Fix the vault view/download experience (Part 4) — contained, roughly half a day.
4. Once 1–3 are solid, invest properly in the real AI-drafted composer (Part 2, Option A) — this is the feature that actually justifies the $199 price and the whole product's reason to exist, so it deserves dedicated, unhurried attention rather than being squeezed in alongside UI polish.

I'd avoid running all of this as one giant catch-all session — each of these (especially the composer) deserves its own focused pass with its own before/after check, the same way your last several sessions have each tackled one clear thing at a time.

---

## Everything I actually changed today (for the record)

- [src/core/vault/vault.ts](src/core/vault/vault.ts) — new `relockWithDeviceKey` method (switch a vault back from passphrase mode to automatic), plus 4 new tests
- [src/lib/vault/guestSession.ts](src/lib/vault/guestSession.ts) — new file, enforces the "signed-out drafts don't survive closing the tab" rule
- [src/components/DashboardClient.tsx](src/components/DashboardClient.tsx) — frictionless vault unlock for signed-in users; guest-session freshness check
- [src/components/InterviewFlow.tsx](src/components/InterviewFlow.tsx) — same frictionless-unlock fix, simplified the old signed-in/signed-out branching that caused the passphrase prompt
- [src/components/ComposeView.tsx](src/components/ComposeView.tsx) — same frictionless-unlock fix (this page had never been wired up correctly at all)
- [src/components/VaultView.tsx](src/components/VaultView.tsx) — frictionless by default; new optional "Protect with a passphrase" / "Switch to automatic unlock" controls
- [src/components/SignOutButton.tsx](src/components/SignOutButton.tsx) — hard page reload on sign-out instead of a soft in-app navigation
- [next.config.mjs](next.config.mjs) — disabled stale client-side caching for signed-in-dependent pages, app-wide
- [src/content/app.ts](src/content/app.ts) — updated vault/security copy so it accurately describes automatic-unlock-by-default instead of the old "always needs a passphrase" wording
- [src/core/vault/vault.test.ts](src/core/vault/vault.test.ts) — 4 new tests for the new "switch back to automatic" operation

**Gates run and green:** typecheck, lint, copy-lint, format check, full test suite (366/366), production build (32 routes). Verified live in a real browser: sign-in, sign-out, Dashboard/Case/Vault frictionless access, the new passphrase-toggle dialog, and the guest-session-wipe behavior (started a test case as a guest, simulated closing the tab, confirmed the draft was gone).

**Not committed to git.** Per my standing instructions, I don't commit or push unless you ask me to — happy to do that now if you'd like these changes saved, or you can review the diff first.
