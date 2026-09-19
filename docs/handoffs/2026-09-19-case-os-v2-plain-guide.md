# Case OS v2 — the plain-words version

19 September 2026. This is the short, plain companion to the [direction doc](2026-09-19-case-os-v2-direction.md), the [feature register](2026-09-19-case-os-v2-feature-register.md) and the [research memo](2026-09-19-case-os-v2-research.md). Read this first; open the others only when you want the detail behind a line.

## What you asked

You said the tool is still "a website built with care" and not yet a system that talks first, decides for the seller, and only shows what is needed — like the robotic leg that finds the person in the wheelchair and positions itself. You asked me to research again instead of dismissing the Meta AI ideas, find what is really still missing, and **not build anything yet**.

## The short answer

**You are right about the feeling, and here is exactly why it feels that way:**

1. **The decoder describes; it does not decide.** Today it says "this is a policy notice, 90-day window, here are the words that matter." It does not say *"this is a documents-only request — do not write an appeal — here are the two records it names."* Amazon actually has four different response types (appeal, plan of action, acknowledge, provide documents), and picking the wrong one is the number-one reason appeals die. That decision is the whole product, and no page makes it yet.
2. **Nothing reads the seller's documents.** An invoice goes into the vault as a file. The system cannot see that the supplier's phone number is missing on page 1. So it cannot say the second most valuable sentence: "this is what's wrong with your invoice, and here is the letter to fix it."
3. **Nothing ever speaks first.** The system stores a reminder date and never delivers it. An agency calls you. Ours waits to be opened.
4. **There are two products inside one app.** The older step-by-step interview and the new case workspace run side by side, with two different composers and two home screens. A seller meets the seams. An operating system has one front door.
5. **Three big notice types have no home.** Identity/INFORM verification (a huge 2026 wave), performance-metric notices (ODR, late shipment), and Seller Challenge for AHA sellers all get routed to "please clarify" or lumped into "policy."

Fix those five and the product becomes the thing you described. The full list is 12 gaps in the direction doc; these five are the heart.

## What about "you rejected it"?

Not quite. On 18 September the same 70-item list was gone through one by one: **44 kept or adapted, 19 deferred, 7 rejected.** The case workspace was built from it that day. The problem was that most of the "kept" items were only half-built, and the most important one (the decoder deciding) was scheduled first and never started.

The **7 that stay out** are the ones that would make the tool lie or fake evidence:

| Meta AI wanted | Why not | What we do instead |
|---|---|---|
| "82% approval odds" | No such data exists anywhere; the market was burned by exactly this | Show the exact unresolved items ("supplier phone missing, page 1") |
| Invoice "strength 42/100" | Same — an invented number | Per-field: present / missing / unclear / conflicting |
| A "fake but real-looking" training log | That is fabricating evidence — fraud, and Amazon's one permanent offence | A blank template + a log for a session that really happened |
| "$X lost per day" fear counter | Invented and coercive | True facts: attempts are limited; identical resubmission risks a lock |
| A skip-warning with fake odds | Manipulation | Decline with reason → real alternatives → consequence in words (already built) |
| Force edits to fool AI detectors | The fix for boilerplate is real facts, not word games | Facts ledger; prompts that ask for specifics |
| Related-account "scanner" | Nobody outside Amazon can see its linkage graph | A factual relationship timeline the seller builds, for specialist review |

Every one of these keeps the *need* and drops the lie. I re-checked each against this week's evidence; none became acceptable.

## One thing changed this week that matters

**Amazon's own Seller Assistant now guides appeals step by step, for free, inside Seller Central.** So "we explain your notice" is no longer something anyone will pay for. What Amazon will never do — keep the seller's independent evidence record, tell them when Amazon's own process is a trap (resending the same appeal → permanent lock), work when the account is already deactivated and half-locked, and never touch their account — is the only ground left. That is precisely the OS you are describing. Good news, but it means we should stop polishing the "explanation" and build the "decision + evidence + clock."

## The plan (for a future session — nothing built today)

| Phase | In plain words | Roughly |
|---|---|---|
| **K0 — Kernel** | The decoder decides the track and pulls out ASINs, case IDs, dates, requested records. New notice types get a home (verification, performance metrics, Seller Challenge, "this isn't from Amazon"). | 1–2 weeks |
| **K1 — One journey + the clock** | Fold the old interview into the workspace as its "ask one thing at a time" surface. One composer. One home. Reminders that actually arrive (browser; email if signed in). "Since you were here" summary. Supplier-wait state with a pre-filled letter and a follow-up date. A zero-AI questions drawer. | 2–3 weeks |
| **K2 — Sensors** | Read PDFs and images **inside the browser** (no cloud) and check each requirement: present / missing / unclear / conflicting. A facts ledger so the response only uses confirmed facts and contradictions are shown neutrally. Warn before an identical resubmission. Real 2026 rejection-letter fixtures. | 2–4 weeks |
| **K3 — Pack + tracks** | Evidence pack export with a manifest. Seller Challenge token counter. Verification prep checklists. | 1–2 weeks |

Ten of the highest-value items need **no AI at all**. The "operating system" feeling is mostly deterministic — decide, read, remind, compare.

## Decide these (a one-line answer each is enough)

1. Retire the old interview for **new** cases? (Recommended: yes. Old saved cases stay readable.)
2. Read documents **locally in the browser first**, cloud only as a later opt-in? (Recommended: yes — keeps "local-first" literally true.)
3. Email reminders for signed-in sellers? (Recommended: yes — needs the Resend key already on your blocker list.)
4. Split "policy" into performance-metric vs conduct, and add a verification type? (Recommended: yes.)
5. **Pass scope:** does one $199 Appeal Pass cover every revision and reply for that case, and for how long? This must be settled before K1 shows buyers the reply loop.
6. Paperwork: code comments cite AM-23/24/25 that were never written into the amendments file. Back-fill them, then log this as **AM-26**. The draft text is ready at the end of the direction doc; I did not append it because those files are yours to ratify.
7. Update the competitor dossier: Amazon's Seller Assistant now guides appeals; AppealsHub is back online.

## What I did not do

- No code was changed. No existing planning file was edited. Nothing deployed.
- No sub-agents were used; four new files were written from a full read of the code and specs plus six web searches, all dated 19 Sep 2026 with links.
- No task-by-task coding prompt yet — that is the first job of the session that starts K0, once you answer the seven questions above.
