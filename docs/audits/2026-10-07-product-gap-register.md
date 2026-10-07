# Product gap register — what is missing between "works" and "the best tool a suspended seller can use"

7 Oct 2026. Companion to [the launch audit](2026-10-07-launch-audit-plan.md). That file lists defects. This one lists **what the product does not yet do, and what could fail after launch**, each with the evidence that it is true today, why it matters to a seller, a rough size, and a recommendation. Nothing here is built unless it says so. Locked decisions (D1 to D10) are respected: no automation of Seller Central, no "guarantee" or odds, severity gating stays, local-first stays unless the founder chooses otherwise.

Size: **S** under a day, **M** a few days, **L** a week or more. Status: **Verified** = checked in code or in the running app on 7 Oct.

## A. Before the first paying seller (almost all founder actions)

| # | Item | Evidence | Why it matters | Who / size |
| --- | --- | --- | --- | --- |
| A1 | Paddle **Default payment link** not set | Sandbox overlay opens, then `transaction_default_checkout_url_not_set` | No seller can pay | Founder, minutes (DEPLOYMENT 5a) |
| A2 | Production Paddle: live product at $249, live client token, live webhook secret, domain approval | CURRENT-STATE: "Paddle sandbox only" | Real money | Founder, S |
| A3 | Gemini key is on the free tier (20 requests a day per model) | 29 Sep finding, still true | Document checks and wording help fail for everyone after a few uses; privacy page promises the paid tier | Founder: turn billing on for that key's project, then set `GEMINI_PAID_TIER_CONFIRMED=true` |
| A4 | Vercel environment: Supabase service key, `CRON_SECRET`, `RESEND_API_KEY`, Plausible domain | CURRENT-STATE "Needs config" rows | Reminders, confirmation emails, analytics and every signed-in server feature are inert without them | Founder, S |
| A5 | Mailboxes `support@`, `billing@`, `privacy@` must exist | Named in the live Terms, Privacy and Support pages | A seller (or a regulator) writes and nothing answers | Founder, S |
| A6 | Nightly backup Action fails on every run | `gh run list` shows the scheduled Backup run failing | Licences and entitlements have no working backup | Founder: add the two secrets, then run one restore drill |
| A7 | Migration 0016 not applied | New file | Optional hardening | Founder, S |
| A8 | EU/UK decision: comply or decline | Legal-boundaries research, 22 Sep | The Pass is sold worldwide, so EU privacy law applies from the first EU buyer | Founder decision |
| A9 | Real domain `appealdeck.com` connected | Test site is `appealdeck.vercel.app` | Canonical URLs, email sender domain, Paddle approval | Founder, S |

## B. Product gaps a seller or an appeal professional would notice

| # | Gap | Evidence (Verified) | Why it matters | Rec. |
| --- | --- | --- | --- | --- |
| B1 | **The finished response can only be copied or printed.** Downloads are plain `.txt` (case notes) and a manifest; no Word or PDF of the response or the evidence pack | Only `text/plain` downloads in `CaseWorkspace.tsx`; no docx/pdf generation anywhere | Consultants, VAs and lawyers hand work over as files; sellers keep a dated record of exactly what was sent | **Do first.** Print-ready PDF and Word of the response and a one-file evidence pack. M |
| B2 | **No calendar entry for deadlines.** Only an email reminder (needs Resend), nothing for a seller who does not read email in a panic | No `.ics` or calendar code in `src` | The appeal window is the one hard clock in the product | `.ics` download for the appeal window and each follow-up date, plus "copy to calendar" on the dashboard. S |
| B3 | **Cases live in one browser.** Another device sees nothing unless the seller makes and restores an encrypted backup by hand | Local-first by design; restore proved in `e2e/backup-restore.spec.ts` | Sellers work from a phone in the first panic hour and a laptop later; browser data loss is the worst outcome | Keep local-first, but offer **automatic encrypted backup after each save** (opt-in, already built blocks: 7 MB cap, 3 kept). M |
| B4 | **No offline app shell.** No service worker, though the data is local | No `serviceWorker` in `src` or `public` | A seller on a bad connection cannot even open their case | Cache the shell and the case workspace for offline reading and editing; sync nothing. M |
| B5 | **Responses are assembled from the seller's words, never drafted.** The AI only suggests wording one section at a time | `composeWorkspace` is deterministic; `aiDrafted: false` | The most common request from a frightened seller is "write it for me". A seller with weak English or no root-cause insight gets a bare structure | Founder decision (D9, privacy sentence, cost). If yes: a drafting step that asks 5 to 8 plain questions and drafts each section **behind the same fact lock** and the same review gate. L |
| B6 | **No translation help.** A notice in German, French or Japanese is refused unless the seller forces it, and the response is English only | `language.ts`: non-English is "unsupported" | EU, Japan and LATAM sellers are a large share of suspensions | Show a plain-language translation of the notice (opt-in, fact-locked), keep the appeal itself English as Amazon's channel expects. M |
| B7 | **No handoff to a human expert.** Expert review is deferred (D7); there is no way to share a case safely with a consultant | No share feature; export is a text file | Some cases need a professional (and D6 refers some to one); a one-click, encrypted, expiring share would turn that referral into a service | After B1. M |
| B8 | **No intake by forwarding the Amazon email**, only paste | Paste box only | Mobile sellers forward mail; pasting from a phone mail app is error-prone | A unique forward-to address (privacy and abuse work) or a share-sheet target for the PWA. L |
| B9 | **No templates library** beyond three request letters and one sample POA | `letters.ts`, `SAMPLE_POA` | Sellers ask for examples per notice type | Per-kind example responses written from public Amazon guidance, clearly marked as examples. M |
| B10 | **Reminders: email only, one follow-up date** | `caseReminders.ts`; one `reminderAt` per case | A case has several clocks (appeal window, supplier chase, Amazon's reply time) | Multiple dated reminders per case plus B2. S to M |
| B11 | **Account-health monitoring is impossible by policy** (Agent Policy, AM-27). Worth saying out loud so it is never promised | AM-27 | Competitors may claim it; this is a strength | Marketing line only |

## C. Credibility and trust a professional looks for

| # | Gap | Evidence | Rec. |
| --- | --- | --- | --- |
| C1 | No public proof of outcomes. Correct under D6 until opt-in data exists with a denominator | Outcome sharing is built; no published figure | Keep the discipline. Publish an honest "what we know so far" page only when there are enough shared outcomes. |
| C2 | No named human behind the product on the page beyond the support line | `/support` names the operator | Add a short "who builds this and why" with the real founder story **only if the founder writes it** (never invented). S |
| C3 | No status or changelog page | None | A one-page changelog builds trust with professionals. S |
| C4 | No walkthrough video or sample case a visitor can click through | Sample notice exists | A recorded 90-second walk using the sample notice. S |

## D. Operating the service (the things that fail quietly)

| # | Gap | Evidence | Rec. |
| --- | --- | --- | --- |
| D1 | **No error monitoring.** A parked or failed payment only writes a console line | `console.error` in the Paddle webhook; Sentry deferred | At minimum a daily digest of `payment_events_unmatched` and failed cron runs by email; ideally Sentry on the server routes. S to M |
| D2 | **No health endpoint or uptime check** | No `/api/health` | Add one and point a free uptime monitor at it. S |
| D3 | **No admin view for parked payments, refunds or support lookups.** Everything is SQL by hand | Only the Supabase dashboard | A small founder-only page behind an allow-listed email. M |
| D4 | **No restore drill** for the database backup | Backup Action never succeeded | Run once before launch. S |
| D5 | **CSP is Report-Only.** Reports now arrive (`/api/csp-report`) | `vercel.json` | After a week of clean reports, enforce. S |
| D6 | **Mobile-lab performance 69 to 86** (desktop 100) | L-018 | Revisit after launch with field data, not lab guesses. |

## E. Ideas deliberately not recommended

Auto-submitting to Seller Central, scraping Account Health or reading the seller's Amazon pages (Agent Policy, AM-27); predicting approval or quoting win rates (D6, FTC substantiation risk); AI that decides whether a case is "strong"; subscription "monitoring" tiers (D7); anything that takes the seller's Amazon credentials.

## Suggested order

1. **A1 to A6** (a day of founder work; nothing else matters until these are done).
2. **B2** `.ics` (small, immediately useful), then **B1** PDF/Word export.
3. **D1 and D2** monitoring and a health check, so launch problems are seen.
4. **B3** automatic encrypted backup, **B4** offline shell.
5. Founder decisions: **B5** AI drafting, **A8** EU, **B6** translation.
6. After the first paid cases: B7 handoff, B9 examples, C1 outcomes.

## Open question for the founder

B5 is the biggest lever on perceived value and the biggest change to the product's promise. Everything else on this list improves the product without changing what it is.
