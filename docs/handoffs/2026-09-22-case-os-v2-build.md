# AM-26 Case OS v2 — build evidence log

**Pass:** AM-26 / AA-39–43, ratified by the founder in chat on 22 September 2026.
**Direction (the authority for this pass):** [`2026-09-22-case-os-v2-ratified-direction.md`](2026-09-22-case-os-v2-ratified-direction.md)
**Amendment:** `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` → AM-26
**Reasoning:** `docs/DECISIONS.md`, 22 Sep 2026 entry

---

## Resume pointer

**Next task: AA-39 (K0 — the kernel).** Paperwork is complete and committed. No `src/` file has been touched by this pass yet.

---

## Baselines — measured 22 Sep 2026 at `eb52f6e`, before any AM-26 code

Run fresh this session rather than carried forward from an earlier commit's log.

| Gate | Result | Exit |
|---|---|---|
| `npm run typecheck` | clean | 0 |
| `npm run lint` | No ESLint warnings or errors | 0 |
| `npm run lint:copy` | PASS | 0 |
| `npm run format:check` | All matched files use Prettier code style | 0 |
| `npx vitest run` | **563 passed in 62 files** | 0 |
| `npm run build` | succeeded; middleware 26.8 kB | 0 |

Note on the build figure: exit code and middleware size were observed directly. The full route-table count was not recounted in this run — it was 33 at `4bf2691` and nothing in this pass changed routing. Recount it at the first AA-39 commit.

Playwright and Lighthouse were **not** run for this paperwork step; no UI changed. Both are required before the pass is called complete.

---

## Task log

### AA-38b — paperwork (this step) · docs only, no `src/`

**Done 22 Sep 2026.**

- `Planning/03-PHASE-2-BUILD/02-BUILD-PLAN-AMENDMENTS.md` — AM-26 written in full with AA-39–43; the pre-existing "AM-26 is deliberately not written into this file" note updated to record the ratification rather than being deleted; Definition of Done count 38 → 43 with a 22 Sep status line.
- `docs/DECISIONS.md` — 22 Sep entry, five alternatives considered and why each was rejected.
- `docs/handoffs/2026-09-22-case-os-v2-ratified-direction.md` — new. Contains the two-journey comparison the founder asked for in writing, the verified-code table, the build order, and the two pending founder calls.
- `docs/handoffs/SESSION-START-PROMPT.md` — both PATH lines repointed; current-pass banner rewritten with the two hard rules; changelog entry appended.
- `CLAUDE.md` §4 — new 22 Sep bullet; NEXT 4 ACTIONS rewritten around AA-39 → AA-43.
- This file — new.

**Verified in source before writing any of it** (each claim re-checked at `eb52f6e`, not carried over from a summary):

| Claim | Where it was checked |
|---|---|
| Decoder describes, does not decide | `src/core/noticeParser.ts` — 66 lines, returns category + window + four booleans; `src/core/classifier.ts` picks one of 7 kinds by priority |
| No entity extraction | no ASIN / case-ID / order-ID / date extraction anywhere in `noticeParser.ts` |
| Notice families with no home | `ViolationKind` (`src/core/index.ts`) has 7 members — nothing for verification/INFORM, performance metrics, product safety, restricted products, Seller Challenge |
| IP / related-account / product-safety silently refused | `routeWorkspace()`, `src/core/workspace.ts:120` → `specialist`; identity and funds → `clarification` |
| Nothing ever speaks first | `reminderAt` (`src/lib/caseStore.ts:37`) and `reminderDue` (`src/core/caseState.ts:93`) are written and read; **no delivery mechanism exists** — the only scheduled job is `/api/jobs/purchase-emails` |
| No document reading | zero `FormData` / multipart handlers across `src/app/api` and `src/lib`; no upload endpoint exists |
| Text already leaves the device | `/api/decode`, `/api/compose`, `/api/extract-field`, `/api/analyze-reply` are server routes; `legal/privacy.md` §2 discloses it; `src/app/decode/DecodeClient.tsx:146` renders `<LocalFirstBadge processing="server" />` |
| The two journeys are nested, not parallel | `src/app/(app)/case/page.tsx:52` renders `CaseWorkspace` by default, `?mode=classic` is the only route to the standalone interview, and `CaseWorkspace.tsx:581` embeds `InterviewFlow` |

**Discovered, worth carrying forward:**

1. The §1 amendment index table in `02-BUILD-PLAN-AMENDMENTS.md` stops at AM-17 — AM-18 through AM-25 were never added. Pre-existing, left as-is and flagged in AM-26 rather than half-corrected by adding one row. The §3 per-amendment sections remain authoritative.
2. The 21 Sep session's note reserving AA-39 onward for AM-26 was correct and is now honoured exactly.
3. The founder's privacy instruction, taken at face value, would have scoped a much larger and riskier change than the code actually requires. Reading the source first shrank it to one missing capability plus three copy corrections. Worth repeating as a method, not just an outcome.

---

### AA-39 — K0: the kernel

*Not started.*

### AA-40 — K1: one journey, and the clock speaks first

*Not started.* Founder call pending: retire the classic interview or keep it. Email half needs `RESEND_API_KEY`.

### AA-41 — K2: sensors, the product reads the documents

*Not started.* Founder call pending: identity-document processing split. **Must ship with AA-43 in the same commit.**

### AA-42 — K3: evidence pack and tracks

*Not started.*

### AA-43 — disclosure parity

*Not started.* Blocks AA-41. Targets: `legal/privacy.md` §1 and §2, `src/components/LocalFirstBadge.tsx`, the "Encrypted on your device" label in `src/content/marketing.ts:162`.

---

## Standing reminders for this pass

- Never run `npm run build` while `next dev` is live, or the reverse — this project has hit the resulting `.next` cache corruption twice and lost an hour to false test failures each time.
- Report hashes only from `git log`; exit codes decide gates; a task done at reduced scope is written up as NOT DONE, not as done.
- Batch 3–4 tasks per commit, gates once per batch, push once gates are green — the founder's standing workflow, already authorized.
