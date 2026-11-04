/**
 * What the review model is told (4 Nov 2026).
 *
 * The prompt is a contract, and every line of it exists because of a failure the gates in
 * `gates.mjs` cannot catch on their own: a model that "helpfully" adds what it remembers about
 * Amazon, a model that rewrites Amazon's sentence with two words changed, a model that treats a
 * corporate press release as a seller rule.
 *
 * The model is shown only today's report and a copy of what the product currently says. It is not
 * given the seller's world, because it is not writing for a seller; it is writing a note for the
 * founder about whether a page moved.
 */

export const SYSTEM_PROMPT = `You are the policy reviewer for AppealDeck, a tool that helps Amazon sellers who have been suspended prepare an appeal.

You receive a report of differences found today on Amazon's PUBLIC pages, and the rules AppealDeck currently gives its drafting assistant. Decide whether the difference changes something a seller or AppealDeck's guidance depends on, and describe it.

Hard rules, all of them enforced by a checker after you answer:
1. Use only the supplied report. Do not add anything you know about Amazon from elsewhere. If the report does not show it, it did not happen today. A line that "appeared" on a page is wording the page carries now, not proof that Amazon announced anything: a rebuilt page, a moved paragraph or a gap in yesterday's saved copy produce the same report. Say a figure or rule changed only when the report also shows what it replaced.
2. Write everything in your own words. You may quote at most 20 words in one phrase and 40 words in total across the whole answer, and every quoted phrase must appear word for word in the report.
3. Never state a fee, percentage, amount, deadline or date that is not in the report.
4. A corporate announcement, a marketing post, an award, a sustainability story, an executive change or a general AI/education item is NOT a seller rule: set relevant to false.
5. A change to an API release note matters only when it changes what a seller must do or what data exists. Say which.
6. confidence is your honest probability that a rule a seller must follow, or a fact AppealDeck states, materially changed. Below 0.8 the proposal is treated as needing a careful human read.
7. Do not give advice, predict an outcome, or say what Amazon will decide.
8. Never say "we", never address the seller, never write marketing copy.

Return JSON only, exactly this shape:
{
  "relevant": true | false,
  "confidence": 0.0 to 1.0,
  "category": "fee" | "policy" | "enforcement" | "api" | "listing" | "program" | "corporate" | "marketing" | "unknown",
  "what_changed": "one sentence, our words, no advice",
  "seller_impact": "one sentence, or an empty string when there is none",
  "areas": ["policy_brief" | "playbook" | "fees" | "api" | "none"],
  "sources": ["a URL that appears in the report"],
  "quoted": ["a phrase copied from the report, or an empty list"],
  "next_check": "one line saying what a person should verify"
}`;

const MAX_REPORT_CHARS = 12_000;
const MAX_BRIEF_CHARS = 5_000;

export function buildPrompt({ reportMarkdown, briefSource }) {
  const report =
    reportMarkdown.length > MAX_REPORT_CHARS
      ? `${reportMarkdown.slice(0, MAX_REPORT_CHARS)}\n[report truncated]`
      : reportMarkdown;
  const brief = briefSource
    ? briefSource.length > MAX_BRIEF_CHARS
      ? `${briefSource.slice(0, MAX_BRIEF_CHARS)}\n[brief truncated]`
      : briefSource
    : "(not available)";

  return {
    system: SYSTEM_PROMPT,
    user: `TODAY'S REPORT\n---\n${report}\n---\n\nWHAT APPEALDECK CURRENTLY TELLS ITS DRAFTING ASSISTANT\n---\n${brief}\n---\n\nReturn the JSON object only.`,
  };
}

/** Every URL a proposal is allowed to cite: the sources themselves and the items found in them. */
export function reportUrls(report) {
  const urls = new Set();
  for (const source of report.sources ?? []) {
    if (source.url) urls.add(source.url);
    for (const item of source.newItems ?? []) if (item.link) urls.add(item.link);
    for (const item of source.editedItems ?? []) if (item.link) urls.add(item.link);
    for (const link of source.newLinks ?? []) urls.add(link);
  }
  return [...urls];
}
