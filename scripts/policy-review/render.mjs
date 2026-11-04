/**
 * The proposal a person reads (4 Nov 2026).
 *
 * It is written as a proposal in the first line and stays one: the status, the confidence and the
 * gate log are at the top, above the content, because a reader has to know how much weight to give
 * the sentence underneath before reading it. Nothing here is applied to `src/` automatically.
 */

const AREA_TARGETS = {
  policy_brief: "`src/core/policyBrief.ts` — the rules every draft follows",
  playbook: "`src/content/guides.ts` — the seller-facing Playbook",
  fees: "the fee lines on /pricing — a founder decision, never an automatic edit",
  api: "no seller copy; relevant to the next API-facing change",
  none: "nothing a seller reads",
};

const STATUS_LABEL = {
  ready: "READY for review",
  "needs-review": "NEEDS A CAREFUL READ (confidence below the ready line)",
  "not-relevant": "Not relevant to sellers",
  invalid: "REJECTED by the checks",
  "ai-missing": "No review ran (the AI key is not set)",
};

export function proposalTitle(report) {
  return `Policy review — ${report.day}`;
}

export function renderProposal({ report, answer, verdict, model }) {
  const status = STATUS_LABEL[verdict.status] ?? verdict.status;
  const lines = [`# ${proposalTitle(report)}`, "", `**Status:** ${status}`];

  if (answer) {
    lines.push(`**Confidence:** ${Number(answer.confidence).toFixed(2)}`);
    lines.push(`**Category:** ${answer.category}`);
  }
  if (model) lines.push(`**Reviewed by:** ${model}`);
  lines.push("", "---", "");

  if (verdict.status === "invalid") {
    lines.push("The answer failed the checks below, so it is recorded and not used.", "");
    lines.push("## Failed checks", "");
    for (const error of verdict.errors) lines.push(`- ${error}`);
    return lines.join("\n");
  }

  if (verdict.status === "not-relevant") {
    lines.push("Today's differences do not change a rule a seller follows.");
    if (answer?.what_changed)
      lines.push("", `Why it was classified this way: ${answer.what_changed}`);
    lines.push("", "## Checks", "");
    for (const warning of verdict.warnings) lines.push(`- warning: ${warning}`);
    // The checks ran whether or not there is anything to apply; saying so is the difference between
    // an empty heading and a reader knowing the answer was tested rather than merely short.
    if (!verdict.warnings.length) {
      lines.push(
        "- No check failed: the answer is a valid object of the required shape, and every citation " +
          "it did give is in today's report. There is nothing to apply, so nothing was written to " +
          "`src/`.",
      );
    }
    lines.push("", "---", "");
    lines.push(
      "Written by `scripts/policy-review.mjs`. A day is only recorded as a proposal when the answer " +
        "says a seller-facing rule changed; this day was not, so it stayed a report.",
    );
    return lines.join("\n");
  }

  lines.push("## What changed", "", answer.what_changed, "");
  if (answer.seller_impact)
    lines.push("## What it means for a seller", "", answer.seller_impact, "");

  lines.push("## Where it lands", "");
  for (const area of answer.areas) lines.push(`- **${area}** → ${AREA_TARGETS[area] ?? area}`);
  lines.push("");

  lines.push("## Evidence", "");
  for (const source of answer.sources) lines.push(`- ${source}`);
  lines.push("");

  if (answer.quoted?.length) {
    lines.push("## Quoted from the source", "");
    for (const phrase of answer.quoted) lines.push(`> ${phrase}`, "");
  }

  if (answer.next_check) {
    lines.push("## Before applying it", "", answer.next_check, "");
  }

  lines.push("## Checks", "");
  for (const warning of verdict.warnings) lines.push(`- warning: ${warning}`);
  lines.push(
    verdict.errors.length
      ? ""
      : "- Every hard check passed: the citations are in the report, the " +
          "quotes are verbatim and within the word limit, no figure was invented, and the answer is a " +
          "valid object of the required shape.",
  );
  lines.push("", "---", "");
  lines.push(
    "This file was written by `scripts/policy-review.mjs` and is not a published claim. " +
      "Nothing in `src/` changed. Applying it means editing the named file, then letting the " +
      "normal gates (typecheck, copy lint, tests, build) run as they do for every change.",
  );

  return lines.join("\n");
}
