# AI pipeline: notice to final response (9 Oct 2026)

Founder's instruction: improve the AI path from a pasted notice to the written response; make sure the model is well prompted for every relevant task and the output is accurate. Everything here is measured on researched notices with realistic seller answers (`src/lib/llm/__tests__/aiPipeline.eval.test.ts`, live, `AI_EVAL=1`), not judged by eye alone.

## What the pipeline is, and where the model is used

| Step | Who does it | Checked by |
|---|---|---|
| Decode the notice (kind, response type, records, deadline, scam check) | Code, deterministic (`runDecode`) | 48 fixtures + 13 researched notices + 9 Oct fresh families, all unit-tested |
| Build the case (records with sources, issues, clocks) | Code | unit + e2e |
| Read an uploaded business document | AI (Gemini, paid tier) when signed in with a Pass; otherwise on-device pdf.js/Tesseract | field-level rules; never a verdict |
| **Write the Plan of Action's three sections** | **AI**, from the seller's answers | `verifyAiDraft`: discards a draft that adds or drops a date, number, name, identifier, document or action; one retry with the exact complaint; then the seller's own wording |
| **Write a document-request explanation** | **AI (new today)** | same gate (`verifyAiTexts`) |
| **Write each questionnaire answer** | **AI (new today)** | same gate, plus a per-question check that no fact moved between answers |
| Improve the wording of one section (opt-in) | AI | wording lock |
| Read Amazon's reply | Code, deterministic | fixtures + 9 Oct fresh wordings |
| Critique before sending | Code | unit |

Until today the AI wrote only the Plan of Action. A document request (the most common response after a POA) and a questionnaire were assembled from the seller's text with no model.

## Baseline, same four cases (`baseline.md`)

- 4 of 4 drafts passed the fact check in the end, but **3 of 4 needed a second model call** (first draft failed the check), so 7 calls for 4 drafts.
- Records were named by file name or not at all (**2 of 4** named the record Amazon asked for).
- The model never saw what Amazon asked for, which issues the notice raised, or the response page's instructions; a second attempt after a refusal read like a first.
- The main model (`gemini-3.5-flash`) was over its free-tier quota; the fallback model wrote every draft.

## After (`after-prompt.md`)

Prompt now carries: every record Amazon asked for with its state (attached / still being obtained / could not be obtained), every issue the notice raised with its sentence, the form's instructions, and rules written from the specific slips seen (name records by label, state each record's position, no filler clauses, no restating the notice, say what is different after a refusal, write dates and names exactly as the seller did). Section shape is stated.

- **3 of 4 first drafts passed** (one retry, for a dropped ASIN), 5 calls for 4 drafts.
- **4 of 4** name the record by its label; the declined record is stated in the seller's words.
- Document-request explanation: passed first time, every fact kept, the test report named, the photos the seller could not get stated with their reason.
- Questionnaire: one answer per question in Amazon's order, passed after one retry (first draft dropped "10" from "10 to 19 august").
- Two filler phrases still slipped through on one draft ("to ensure coverage", "To prevent this from happening again"). Not a fact error; the critic does not block them. Left for the next prompt round rather than tightening the gate to a point where good drafts fail.

## Fact-check false positives found and fixed

- "I could not obtain the Product and label photos" was rejected as an invented negation, because the status wording ("could not be obtained") is ours, not the seller's. The status wording now counts as source text.
- "14 orders out of 610" for the seller's "14 of 610 orders" was rejected as a new number-unit pair. A re-pairing where both the number and the unit word already appear in the seller's text is now accepted; "14 weeks" (unit never written) and "15" (number never written) are still rejected. Tests in `draftVerification.test.ts`.

## Thinking budget

Tried `thinkingBudget: 1024` on the drafting call: one main-model request stalled for 25 s before the fallback answered (the same stall documented on 25 Sep for schema mode with thinking on). Default is now 0; `GEMINI_DRAFT_THINKING=1024` turns it on for a measured trial once the paid tier is confirmed.

## Not done, needs a founder decision (cost)

- **AI fallback for a notice the deterministic decoder cannot classify** (UNKNOWN kind or undetermined response type): a schema-constrained call choosing among the known kinds, with a quote that must be a substring of the notice, shown as "our best reading, confirm it". `/decode` is anonymous, so this spends model calls for visitors with no Pass; it needs the paid tier and a per-IP cap decision (D9).
- **AI fallback for an Amazon reply the deterministic reader does not recognise**, same shape, never allowed to say "reinstated" on its own.

## How to re-run

```bash
AI_EVAL=1 AI_EVAL_LABEL=<label> node --env-file=.env.local node_modules/vitest/vitest.mjs run src/lib/llm/__tests__/aiPipeline.eval.test.ts
```

`AI_EVAL_ONLY=id1,id2` limits the cases. The free tier allows about 20 requests a day per model; the harness writes `docs/handoffs/2026-10-09-ai-pipeline-eval/<label>.md`.
