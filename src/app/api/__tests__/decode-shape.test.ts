import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../decode/route";

/**
 * 6 Oct 2026: a sweep of degraded and real-world pastes found that the decoder either decoded them
 * wrongly without saying so or refused them with a message that did not say what was wrong. Each
 * test below is one of those pastes, run through the real route.
 */
function post(text: string) {
  const req = new Request("http://localhost:3000/api/decode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  }) as unknown as NextRequest;
  return POST(req);
}

async function decode(text: string) {
  const res = await post(text);
  return { status: res.status, body: (await res.json()) as Record<string, any> };
}

const POLICY_HARD_WRAPPED = [
  "Date: 12 September 2026",
  "Subject: Policy violation on your Amazon seller account",
  "",
  "We removed your listings for repeated policy violations. You may",
  "appeal within 90 days of this notice, and you must submit a plan of",
  "action that explains the root cause and the preventive measures.",
].join("\n");

describe("/api/decode normalises what was pasted", () => {
  it("keeps the 90-day window of a 72-column hard-wrapped email", async () => {
    const { status, body } = await decode(POLICY_HARD_WRAPPED);
    expect(status).toBe(200);
    expect(body.kind).toBe("POLICY");
    const window = body.deadlines.find((d: any) => d.kind === "appeal_window");
    // Counted from the notice's own header date: 12 Sep + 90 days.
    expect(window.dueOn).toBe("2026-12-11");
  });

  it("reads a markdown-bold header date and a tabbed, entity-ridden notice", async () => {
    const text =
      "**Date:** 12 September 2026\n**Subject:** Your Amazon&nbsp;seller account\n\nYour&nbsp;listings were removed for\tpolicy violations. You may appeal within 30 days.";
    const { status, body } = await decode(text);
    expect(status).toBe(200);
    expect(body.receivedOn).toBe("2026-09-12");
    expect(body.kind).toBe("POLICY");
    expect(body.normalizedText).not.toContain("&nbsp;");
    expect(body.normalizedText).not.toContain("**");
  });

  it("returns the text it decoded, and every entity span slices back out of it", async () => {
    const text =
      "> Date: 12 September 2026\n> Your Amazon account is suspended. Case ID: 8823471905 concerns ASIN b0abcdef12.\n> Please provide supplier invoices.";
    const { body } = await decode(text);
    for (const e of body.entities) {
      if (e.kind === "requested_record") continue;
      expect(body.normalizedText.slice(e.start, e.end)).toBe(e.value);
    }
    expect(body.entities.some((e: any) => e.kind === "asin" && e.normalized === "B0ABCDEF12")).toBe(
      true,
    );
  });

  it("finds the receipt date when the header was pasted without line breaks", async () => {
    const { body } = await decode(
      "From: Amazon Date: 12 September 2026 Subject: Your Amazon account was suspended\nYour account was suspended for policy violations. You may appeal within 30 days.",
    );
    expect(body.receivedOn).toBe("2026-09-12");
  });
});

describe("/api/decode explains a paste it cannot read", () => {
  it("names a German notice instead of returning UNKNOWN", async () => {
    const { status, body } = await decode(
      "Ihr Amazon-Verkäuferkonto wurde gesperrt, weil wir Verstöße gegen unsere Richtlinien festgestellt haben. Bitte senden Sie uns einen Aktionsplan, der die Ursache und die Maßnahmen beschreibt, die Sie ergriffen haben, um das Problem zu beheben.",
    );
    expect(status).toBe(422);
    expect(body.language).toBe("de");
    expect(body.supported).toBe(false);
    expect(body.message).toContain("This looks like German.");
    expect(body.message).toContain("switch your account language to English");
    expect(body.error).toBe(body.message);
  });

  it("names a Japanese notice instead of calling it 'not an Amazon notice'", async () => {
    const { status, body } = await decode(
      "お客様のAmazonセller アカウントは、ポリシー違反のため停止されました。アカウントを再開するには、改善計画書を提出してください。詳細についてはセラーセントラルをご確認ください。",
    );
    expect(status).toBe(422);
    expect(body.language).toBe("ja");
    expect(body.message).toContain("This looks like Japanese.");
  });

  it("says what is missing from a paste that is not a whole message", async () => {
    const { status, body } = await decode("Please review this and get back to me when you can.");
    expect(status).toBe(422);
    expect(body.error).toContain("whole message");
    expect(body.error).not.toContain("doesn't look like an Amazon notice");
  });

  it("accepts a short genuine verification notice the old gate refused", async () => {
    const { status, body } = await decode(
      "To verify your identity, enter the verification code we sent to your phone. Upload a government-issued ID within 7 days.",
    );
    expect(status).toBe(200);
    expect(body.kind).toBe("VERIFICATION");
    const window = body.deadlines.find((d: any) => d.kind === "appeal_window");
    expect(window.label).toContain("7 days");
  });

  it("recognises the seller's own earlier appeal pasted by mistake", async () => {
    const { status, body } = await decode(
      "Dear Amazon Seller Performance Team,\n\nI am writing to appeal the suspension of my seller account. Please reinstate my account. I take full responsibility and have implemented new checks on every listing.\n\nSincerely,\nJane",
    );
    expect(status).toBe(422);
    expect(body.looksLikeSellerText).toBe(true);
    expect(body.message).toContain("Paste Amazon's notice");
  });

  it("flags OCR damage, repairs the obvious confusions, and says so", async () => {
    const { status, body } = await decode(
      "Dat e: 12 Sep tember 2O26\nSubject: Amaz0n sell1ng privileges\n\nYour Amaz0n sell1ng account was suspended for poIicy vi0lations. You may appeal within 30 days.",
    );
    expect(status).toBe(200);
    expect(body.garbled).toBe(true);
    expect(body.garbledRepaired).toBe(true);
    expect(body.notes.some((n: any) => n.id === "garbled")).toBe(true);
    expect(body.receivedOn).toBe("2026-09-12");
  });
});

describe("/api/decode does not present one message as the whole story", () => {
  const TWO = [
    "From: Amazon Seller Performance",
    "Date: 1 September 2026",
    "Subject: Your account was suspended",
    "",
    "Your selling account was suspended for inauthentic items. You may appeal within 30 days.",
    "",
    "-----Original Message-----",
    "From: Amazon Seller Performance",
    "Date: 20 September 2026",
    "Subject: Policy warning on your listings",
    "",
    "We removed your listings for repeated policy violations. You may appeal within 90 days.",
  ].join("\n");

  it("flags two notices and decodes the most recent", async () => {
    const { body } = await decode(TWO);
    expect(body.multipleNotices).toBe(true);
    expect(body.notes.some((n: any) => n.id === "multiple_notices")).toBe(true);
    expect(body.receivedOn).toBe("2026-09-20");
    expect(body.kind).toBe("POLICY");
    // Spans still point into the full paste.
    for (const e of body.entities) {
      if (e.kind === "requested_record") continue;
      expect(body.normalizedText.slice(e.start, e.end)).toBe(e.value);
    }
  });

  it("does not flag a single forwarded email", async () => {
    const { body } = await decode(
      "---------- Forwarded message ---------\nFrom: Amazon Seller Performance <seller-performance@amazon.com>\nDate: Mon, 1 Sep 2026 10:23:00 -0700\nSubject: Your Amazon account\n\nYour account was suspended for policy violations. You may appeal within 30 days.",
    );
    expect(body.multipleNotices).toBeUndefined();
    expect(body.receivedOn).toBe("2026-09-01");
  });
});

describe("/api/decode dates and windows", () => {
  it("reads an unambiguous all-numeric header date", async () => {
    const { body } = await decode(
      "Date: 25/09/2026\nYour Amazon account was suspended for policy violations. You may appeal within 30 days.",
    );
    expect(body.receivedOn).toBe("2026-09-25");
  });

  it("shows both readings of an ambiguous date and still counts nothing from it", async () => {
    const { body } = await decode(
      "Date: 12/09/2026\nYour Amazon account was suspended for policy violations. You may appeal within 30 days.",
    );
    expect(body.receivedOn).toBeNull();
    expect(body.ambiguousReceipt).toEqual(["2026-09-12", "2026-12-09"]);
    expect(body.notes.find((n: any) => n.id === "ambiguous_receipt").message).toContain(
      "12 Sep 2026 or 9 Dec 2026",
    );
    const window = body.deadlines.find((d: any) => d.kind === "appeal_window");
    expect(window.dueAt).toBeNull();
  });

  it("reports a business-day window as business days, not a calendar date", async () => {
    const { body } = await decode(
      "Date: 12 September 2026\nYour Amazon seller account is under review. Please respond within 3 business days with a Plan of Action.",
    );
    expect(body.statedBusinessDays).toBe(3);
    const window = body.deadlines.find((d: any) => d.kind === "appeal_window");
    expect(window.dueAt).toBeNull();
    expect(body.responseType.type).toBe("PLAN_OF_ACTION");
  });

  it("hints at an ASIN that is one character short instead of dropping it silently", async () => {
    const { body } = await decode(
      "Your Amazon listing for ASIN: B0ABCDEF1 was removed for policy violations. Please provide an invoice.",
    );
    expect(body.idHints[0].value).toBe("B0ABCDEF1");
    expect(body.idHints[0].message).toContain("ten characters");
  });
});

describe("/api/decode tells a warning from an enforcement, and a reply from a notice", () => {
  it("reads an at-risk banner as a warning and raises no performance record", async () => {
    const { status, body } = await decode(
      "Your Amazon Account Health is at risk. Your Order Defect Rate is currently 0.9% and the target is below 1%. Review your metrics in Account Health.",
    );
    expect(status).toBe(200);
    expect(body.notEnforcement).toBe(true);
    expect(body.notes.find((n: any) => n.id === "not_enforcement").message).toContain(
      "warning, not a suspension",
    );
    expect(
      body.entities.some((e: any) => e.kind === "requested_record" && /performance/i.test(e.value)),
    ).toBe(false);
  });

  it("recognises Amazon's reply to an appeal and offers the reply flow", async () => {
    const { body } = await decode(
      "Thank you for your appeal. We have reviewed your plan of action. Your plan of action does not address our concerns, so we are unable to reinstate your selling account at this time. Please provide more detail about the root cause of your Amazon account suspension.",
    );
    expect(body.looksLikeReply.category).toBe("needs_more_information");
    expect(body.looksLikeReply.message).toContain("Amazon's reply");
  });

  it("does not take an ordinary notice for a reply", async () => {
    const { body } = await decode(POLICY_HARD_WRAPPED);
    expect(body.looksLikeReply).toBeUndefined();
  });

  it("reads a pasted support thread by what Amazon said last", async () => {
    const { body } = await decode(
      [
        "Amazon Seller Support case 8823471905 for your selling account.",
        "Please provide the supplier invoice for ASIN B08N5WRWNW.",
        "",
        "Seller (you): Attached the invoice.",
        "",
        "Amazon: Thank you. We have reviewed your invoices and no further action is required. Your account is now active.",
      ].join("\n"),
    );
    expect(body.responseType.type).toBe("NO_ACTION_REQUESTED");
  });
});
