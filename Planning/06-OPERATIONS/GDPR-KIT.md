# GDPR Operational Kit — AppealDeck

**Why this file exists:** AppealDeck sells to EU/UK buyers, so GDPR (and UK GDPR) apply even though the controller is a Pakistan-based individual seller. This is the operational minimum: records of processing (Art. 30), data-subject-request (DSR) procedure, and a breach runbook. AI drafts; founder verifies and owns the execution.

## 1. Records of processing (Art. 30)
| Field | Value |
|---|---|
| Controller | Jhangir Hussain t/a "AppealDeck by Hawlton", Pakistan; hello@appealdeck.app |
| Purposes | Provide notice-decoder + POA-drafting software; entitlement/license enforcement; support; analytics |
| Data subjects | Sellers who paste notices; buyers of Appeal Passes |
| Categories of personal data | Notice text (may contain names/ASINs/addresses), email (purchase), hashed device id (license), support messages |
| Special categories | None intended; notice text may incidentally contain identity data — treated as confidential |
| Recipients (subprocessors) | Paddle (MoR/payment), Google (Gemini paid tier, drafting), Supabase (licenses/backend), Plausible/Umami (analytics), Cloudflare (hosting/DNS) |
| International transfers | US/EU via above; safeguards = each processor's DPA / MoR compliance |
| Retention | Browser case data: until user deletes; server notice text: on request / post-support window; license records: for entitlement + accounting |
| Security | Local-first encryption (Web Crypto), secrets in env stores only, no free-tier LLM for user data, least-privilege invites |

Keep this table current; review quarterly.

## 2. DSR procedure (30-day SLA)
| Right | How to action | Owner |
|---|---|---|
| Access | Email request → confirm identity → export the user's server-side data → send encrypted | Founder |
| Rectification | Correct license/email record in Supabase | Founder |
| Erasure | Delete server-side notice text + license record; note browser data is user-controlled (instruct delete) | Founder |
| Portability | Export in JSON | Founder |
| Objection (analytics/marketing) | Cookieless analytics already minimize; honor opt-out email | Founder |

Log every DSR with date, type, action, completion.

## 3. Breach runbook (notify within 72h of awareness)
1. **Detect/confirm** — alert from processor or user; isolate affected system.
2. **Contain** — rotate any exposed keys (Supabase/Gemini/Paddle), revoke access.
3. **Assess** — what personal data, how many subjects, risk level.
4. **Notify** — if risk to rights/freedoms: notify authority within 72h; notify affected users without undue delay. (Pakistan has no equivalent statutory clock yet, but the EU standard is the prudent bar given EU customers.)
5. **Document** — timeline, actions, comms, in `docs/DECISIONS.md` or a breach log.

## 4. Subprocessor DPAs
- Paddle: MoR — review their DPA/terms at signup.
- Google Gemini: enable paid tier; rely on Google Cloud DPA. Free tier NEVER touches user data.
- Supabase: execute a DPA; fresh project only.
- Plausible/Umami: confirm no personal data collected (cookieless).
- Cloudflare: review DPA.

**Founder action:** sign/accept each DPA at account creation; archive confirmations outside the repo.
