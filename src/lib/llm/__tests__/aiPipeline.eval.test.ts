import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { draftResponse, buildDraftSources, type DraftRequest } from "../draftResponse";
import { verifyAiDraft } from "@/core/draftVerification";
import { detectIssues } from "@/core/noticeIssues";

/**
 * Live evaluation of the AI drafting path against researched notices and realistic seller answers.
 *
 * Skipped unless AI_EVAL=1, because it calls Google with the real key (the free tier allows about
 * 20 requests a day per model). Run with:
 *
 *   AI_EVAL=1 AI_EVAL_LABEL=baseline node --env-file=.env.local node_modules/vitest/vitest.mjs run src/lib/llm/__tests__/aiPipeline.eval.test.ts
 *
 * It writes docs/handoffs/2026-10-09-ai-pipeline-eval/<label>.md with every draft in full plus the
 * deterministic scores, so a prompt change can be judged on the same cases before and after.
 */
const RUN = process.env.AI_EVAL === "1";
const LABEL = process.env.AI_EVAL_LABEL ?? "run";
const ONLY = process.env.AI_EVAL_ONLY?.split(",").filter(Boolean);

type Notice = { id: string; text: string };
const notices: Notice[] = JSON.parse(
  readFileSync(join(process.cwd(), "docs/handoffs/2026-09-29-test-notices/notices.json"), "utf8"),
);
const notice = (id: string) => notices.find((n) => n.id === id)!.text;

/** Realistic seller answers: short, specific, with the dates, names and numbers a real seller gives. */
const CASES: Array<{ id: string; req: DraftRequest; mustMention: string[] }> = [
  {
    id: "inauthentic-first-round",
    req: {
      kind: "INAUTHENTIC",
      notice: notice("t01-inauthentic-section3"),
      attempt: 1,
      answers: {
        rootCause:
          "We bought 200 units of B0EXAMPLE1 from Harbor Goods Ltd on 5 Aug 2026. We did not keep the packing slips with the invoice and we did not check the units against the invoice when they arrived, so when 3 customers complained in September we could not show which batch they came from.",
        correctiveActions:
          "On 20 Sep 2026 we removed the listing. On 22 Sep we counted the remaining 142 units and matched them to invoice HG-4471. We refunded the 3 customers on 21 Sep.",
        preventiveMeasures:
          "Since 25 Sep 2026 our warehouse lead, Amina, checks every delivery against the invoice before it is shelved and signs the invoice. We keep invoices in one folder by ASIN. We only buy this product from Harbor Goods.",
      },
      records: [
        {
          label: "Supplier invoice",
          filename: "harbor-goods-HG-4471.pdf",
          note: "Invoice HG-4471 dated 5 Aug 2026, 200 units of B0EXAMPLE1, supplier address and phone on page 1.",
        },
      ],
      declined: [],
      replyReasons: [],
    },
    mustMention: ["HG-4471", "5 Aug 2026", "200", "142", "Amina", "Harbor Goods"],
  },
  {
    id: "odr-first-round",
    req: {
      kind: "PERFORMANCE_METRIC",
      notice: notice("t02-performance-odr"),
      attempt: 1,
      answers: {
        rootCause:
          "between 1 and 28 august we had 14 late shipments out of 610 orders. our only packer was on leave from 10 to 19 august and nobody else knew the label printer. 6 orders also got A-to-z claims because we did not reply to messages during that week.",
        correctiveActions:
          "we shipped the 14 late orders by 21 august. we replied to all open messages on 20 august. we trained a second person (Bilal) on the label printer on 2 september.",
        preventiveMeasures:
          "two people can now pack and print labels. we check unshipped orders at 9am and 4pm every day. messages are answered within 12 hours, my brother covers weekends.",
      },
      records: [
        {
          label: "Sales or performance record",
          filename: "orders-august-2026.csv",
          note: "Order report for August 2026 showing the 14 late orders and ship dates.",
        },
      ],
      declined: [],
      replyReasons: [],
    },
    mustMention: ["14", "610", "Bilal", "9am", "4pm", "12 hours"],
  },
  {
    id: "listing-second-round-after-refusal",
    req: {
      kind: "LISTING",
      notice: notice("t11-listing-policy-header-date"),
      attempt: 2,
      answers: {
        rootCause:
          "The title of B0LST00123 said 'FDA approved' because our listing writer copied it from the supplier's catalogue in June 2026. Nobody on our side checked the title against the detail page rules before it went live.",
        correctiveActions:
          "We removed 'FDA approved' from the title, bullets and A+ content on 4 Sep 2026. We checked our other 38 listings on 5 Sep and found no other medical claims.",
        preventiveMeasures:
          "Every new listing is now reviewed by me against the restricted-claims list before it is published. We keep a list of banned words in our listing template, updated 6 Sep 2026.",
      },
      records: [
        {
          label: "Listing correction record",
          filename: "B0LST00123-before-after.pdf",
          note: "Screenshots of the title before and after the 4 Sep 2026 change.",
        },
      ],
      declined: [],
      replyReasons: [
        "Your plan of action does not address the root cause of the policy violation.",
        "We did not receive sufficient information about the steps you have taken to prevent this from happening again.",
      ],
    },
    mustMention: ["FDA approved", "4 Sep 2026", "38", "6 Sep 2026"],
  },
  {
    id: "related-account-with-declined-record",
    req: {
      kind: "RELATED_ACCOUNT",
      notice: notice("t04-related-account"),
      attempt: 1,
      answers: {
        rootCause:
          "The other account, Nile Trading, belonged to my cousin Omar. In March 2026 he used my home wifi and my laptop for two weeks while his was repaired, and he logged into his Seller Central from it. I did not know that would link the accounts.",
        correctiveActions:
          "Omar has not used my devices or network since 14 March 2026. His account was closed by him on 2 April 2026. I changed my wifi password on 15 March 2026.",
        preventiveMeasures:
          "Nobody else uses my devices or network for Amazon. I keep a written list of the two devices I use for Seller Central.",
      },
      records: [
        {
          label: "Proof of address",
          filename: "utility-bill-march-2026.pdf",
          note: "Electricity bill for my address dated 20 March 2026.",
        },
      ],
      declined: [
        {
          label: "Linked-account resolution record",
          reason:
            "Omar closed his account himself and did not get any letter from Amazon about it. I have asked him and he has nothing to send.",
        },
      ],
      replyReasons: [],
    },
    mustMention: ["Nile Trading", "Omar", "14 March 2026", "2 April 2026", "15 March 2026"],
  },
];

const words = (t: string) => t.split(/\s+/).filter(Boolean).length;

describe.skipIf(!RUN)("AI drafting evaluation (live)", () => {
  it(
    `drafts ${CASES.length} cases and writes the ${LABEL} report`,
    async () => {
      const out: string[] = [
        `# AI drafting evaluation: ${LABEL}`,
        "",
        `Run: ${new Date().toISOString()}`,
        "",
      ];
      const summary: string[] = [];
      for (const c of CASES) {
        if (ONLY && !ONLY.includes(c.id)) continue;
        const started = Date.now();
        const req: DraftRequest = {
          ...c.req,
          issues: detectIssues(c.req.notice).map((i) => ({ kind: i.kind, quote: i.sourceQuote })),
          requested: [
            ...c.req.records.map((r) => ({ label: r.label, status: "reviewed" as const })),
            ...c.req.declined.map((d) => ({ label: d.label, status: "cannot_obtain" as const })),
          ],
        };
        const result = await draftResponse(req);
        const ms = Date.now() - started;
        out.push(`## ${c.id}`, "", `Took ${ms} ms.`, "");
        if (!result.ok) {
          out.push(`**FAILED**: ${result.reason}${result.detail ? ` — ${result.detail}` : ""}`, "");
          summary.push(`${c.id}: FAILED (${result.reason})`);
          continue;
        }
        const check = verifyAiDraft(buildDraftSources(req), result.sections);
        const text = [
          result.sections.rootCause,
          result.sections.correctiveActions,
          result.sections.preventiveMeasures,
        ].join("\n\n");
        const missing = c.mustMention.filter((m) => !text.toLowerCase().includes(m.toLowerCase()));
        const sellerWords = words(
          [
            c.req.answers.rootCause,
            c.req.answers.correctiveActions,
            c.req.answers.preventiveMeasures,
          ].join(" "),
        );
        const recordsMentioned = c.req.records.filter((r) =>
          text.toLowerCase().includes(r.label.toLowerCase()),
        ).length;
        const declinedMentioned = c.req.declined.filter((d) =>
          text.toLowerCase().includes(d.label.toLowerCase().split(" ")[0]!),
        ).length;
        out.push(
          `- retried: ${result.retried}${result.firstFailure ? ` (first draft ${result.firstFailure})` : ""}`,
          `- fact check on final: ${check.ok ? "pass" : "FAIL"}${check.ok ? "" : ` (${JSON.stringify({ added: check.added, dropped: check.dropped, inflated: check.inflated, unsupported: check.unsupportedEvidence })})`}`,
          `- seller words ${sellerWords}, draft words ${words(text)}`,
          `- must-mention missing: ${missing.length ? missing.join(", ") : "none"}`,
          `- records named: ${recordsMentioned}/${c.req.records.length}; declined named: ${declinedMentioned}/${c.req.declined.length}`,
          "",
          "### Root cause",
          "",
          result.sections.rootCause,
          "",
          "### Corrective actions",
          "",
          result.sections.correctiveActions,
          "",
          "### Preventive measures",
          "",
          result.sections.preventiveMeasures,
          "",
        );
        summary.push(
          `${c.id}: ok, retried=${result.retried}, missing=${missing.length}, records=${recordsMentioned}/${c.req.records.length}, words=${words(text)}/${sellerWords}`,
        );
      }
      out.splice(4, 0, "## Summary", "", ...summary.map((s) => `- ${s}`), "");
      const dir = join(process.cwd(), "docs/handoffs/2026-10-09-ai-pipeline-eval");
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${LABEL}.md`), out.join("\n"));
      console.log(summary.join("\n"));
      expect(summary.length).toBeGreaterThan(0);
    },
    10 * 60_000,
  );
});

/** The other two written responses (9 Oct 2026), on the same researched notices. */
import { draftOther, buildOtherSources, type OtherDraftRequest } from "../draftOther";
import { verifyAiTexts } from "@/core/draftVerification";

const OTHER_CASES: Array<{ id: string; req: OtherDraftRequest; mustMention: string[] }> = [
  {
    id: "product-safety-documents",
    req: {
      protocol: "documents",
      kind: "PRODUCT_SAFETY",
      notice: notice("t07-product-safety"),
      attempt: 1,
      explanation:
        "The charger B0CX9L4TQ2 was tested by Sentinel Labs on 3 Sep 2026 and passed UL 62368-1, report number SL-2291. We stopped selling it on 1 Oct 2026 until Amazon finishes the review. We have sold 1,340 units since March 2026 and these are the first two overheating reports.",
      questions: [],
      records: [
        {
          label: "Test report or compliance certificate",
          filename: "sentinel-SL-2291.pdf",
          note: "Report SL-2291 dated 3 Sep 2026, page 2 shows the pass result for UL 62368-1.",
        },
      ],
      declined: [
        {
          label: "Product and label photos",
          reason: "The stock is at our 3PL in Texas and they cannot send photos before 20 October.",
        },
      ],
      requested: [
        { label: "Test report or compliance certificate", status: "reviewed" },
        { label: "Product and label photos", status: "cannot_obtain" },
      ],
      issues: [],
      replyReasons: [],
      dispute: false,
    },
    mustMention: ["SL-2291", "3 Sep 2026", "1 Oct 2026", "1,340", "Texas", "20 October"],
  },
  {
    id: "late-shipment-questionnaire",
    req: {
      protocol: "questionnaire",
      kind: "PERFORMANCE_METRIC",
      notice: notice("t10-questionnaire"),
      attempt: 1,
      explanation: "",
      questions: [
        {
          question: "What caused the late shipments on your seller-fulfilled orders?",
          answer:
            "our packer was on leave 10 to 19 august and nobody else knew how to print labels. 14 of 610 orders went late.",
        },
        {
          question: "What actions have you taken to resolve the orders that shipped late?",
          answer: "all 14 shipped by 21 august and we messaged each buyer on 20 august.",
        },
        {
          question: "What changes have you made to prevent late shipments in the future?",
          answer:
            "trained Bilal on the label printer 2 september. we check unshipped orders at 9am and 4pm every day now.",
        },
      ],
      records: [],
      declined: [],
      requested: [],
      issues: [],
      replyReasons: [],
      dispute: false,
    },
    mustMention: ["14", "610", "21 august", "20 august", "Bilal", "9am", "4pm"],
  },
];

describe.skipIf(!RUN)("AI other-response evaluation (live)", () => {
  it(
    `drafts ${OTHER_CASES.length} other responses and appends to the ${LABEL} report`,
    async () => {
      const out: string[] = ["", "# Other responses", ""];
      const summary: string[] = [];
      for (const c of OTHER_CASES) {
        if (ONLY && !ONLY.includes(c.id)) continue;
        const req: OtherDraftRequest = {
          ...c.req,
          issues: detectIssues(c.req.notice).map((i) => ({ kind: i.kind, quote: i.sourceQuote })),
        };
        const started = Date.now();
        const result = await draftOther(req);
        const ms = Date.now() - started;
        out.push(`## ${c.id}`, "", `Took ${ms} ms.`, "");
        if (!result.ok) {
          out.push(`**FAILED**: ${result.reason}${result.detail ? ` — ${result.detail}` : ""}`, "");
          summary.push(`${c.id}: FAILED (${result.reason})`);
          continue;
        }
        const texts = [result.texts.explanation, ...result.texts.answers];
        const check = verifyAiTexts(buildOtherSources(req), texts);
        const joined = texts.join("\n\n");
        const missing = c.mustMention.filter(
          (m) => !joined.toLowerCase().includes(m.toLowerCase()),
        );
        out.push(
          `- retried: ${result.retried}${result.firstFailure ? ` (first draft ${result.firstFailure})` : ""}`,
          `- fact check on final: ${check.ok ? "pass" : "FAIL"}`,
          `- must-mention missing: ${missing.length ? missing.join(", ") : "none"}`,
          "",
        );
        if (result.texts.explanation) out.push("### Explanation", "", result.texts.explanation, "");
        result.texts.answers.forEach((a, i) =>
          out.push(`### ${c.req.questions[i]!.question}`, "", a, ""),
        );
        summary.push(`${c.id}: ok, retried=${result.retried}, missing=${missing.length}`);
      }
      const dir = join(process.cwd(), "docs/handoffs/2026-10-09-ai-pipeline-eval");
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, `${LABEL}.md`), out.join("\n"), { flag: "a" });
      console.log(summary.join("\n"));
      expect(summary.length).toBeGreaterThan(0);
    },
    10 * 60_000,
  );
});
