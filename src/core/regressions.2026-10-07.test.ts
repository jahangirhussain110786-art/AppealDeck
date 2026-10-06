/**
 * Regressions found by an independent review of commit 29929fd (7 Oct 2026). Each case here failed
 * on the code that was reviewed. They are grouped by the item number of that review.
 */
import { describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "../app/api/decode/route";
import { analyzeReply } from "./responseAnalyzer";
import { assessNoticeAuthenticity } from "./noticeAuthenticity";
import { determineResponseType } from "./responseType";
import { genericWindowsOf, parseNotice } from "./noticeParser";
import {
  assessGarbled,
  detectMultipleNotices,
  lastAmazonTurn,
  looksLikeSellerText,
  normalizeNoticeText,
  splitNotices,
} from "./noticeText";
import { detectLanguage } from "../lib/language";
import { insertPasted, stripInvisibleChars } from "../lib/idNormalize";

const ids = (text: string): string[] => assessNoticeAuthenticity(text).signals.map((s) => s.id);

async function decode(body: Record<string, unknown>) {
  const req = new Request("http://localhost:3000/api/decode", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
  const res = await POST(req);
  return { status: res.status, json: (await res.json()) as Record<string, any> };
}

describe("1. an inline 'X Date:' in the body is never the receipt date", () => {
  it.each([
    "Your account was suspended. Order Date: 12 May 2026 Please respond within 90 days.",
    "Your account was suspended. Complaint Date: 1 July 2026 Please respond within 90 days.",
    "Your account was suspended. Deactivation Date: 3 October 2026 Please respond within 90 days.",
    "Your account was suspended. Response Due Date: 30 October 2026 Please respond within 90 days.",
  ])("%s", (flat) => {
    const normalized = normalizeNoticeText(flat);
    expect(normalized.split("\n")).toHaveLength(1);
    expect(parseNotice(normalized).receivedOn).toBeNull();
  });

  it("a real header Date wins over body 'X Date:' lines", () => {
    const text = normalizeNoticeText(
      "Date: 5 October 2026\nSubject: Account\n\nYour account was suspended. Response Due Date: 30 October 2026 and Order Date: 12 May 2026 are listed below.",
    );
    expect(parseNotice(text).receivedOn).toBe("2026-10-05");
  });

  it("still splits a header block flattened onto one line", () => {
    expect(normalizeNoticeText("From: Amazon Date: 12 September 2026 Subject: Account")).toBe(
      "From: Amazon\nDate: 12 September 2026\nSubject: Account",
    );
  });
});

describe("2. a window needs a duty directly governed by it", () => {
  it.each([
    "Provide invoices dated within 365 days of the date of this notice.",
    "Customers may return items within 30 days.",
    "Sellers must confirm shipment within 2 business days.",
    "Invoices from within 180 days are accepted.",
  ])("%s is not the seller's window", (sentence) => {
    const w = genericWindowsOf(sentence);
    expect(w.calendar).toEqual([]);
    expect(w.business).toEqual([]);
    expect(parseNotice(sentence).statedWindowDays).toBeNull();
  });

  it("still reads a real duty", () => {
    expect(genericWindowsOf("Please respond within 7 days.").calendar).toEqual([7]);
    expect(genericWindowsOf("Within 7 days, please upload your ID.").calendar).toEqual([7]);
    expect(
      genericWindowsOf("You must verify your identity within 3 business days.").business,
    ).toEqual([3]);
  });
});

describe("3. the reply analyser never says 'you are back' for a part", () => {
  it("restored ability / lifted ASIN restriction is not a reinstatement", () => {
    expect(
      analyzeReply(
        "We have restored your ability to list in Toys, but your account remains suspended while we review.",
      ).category,
    ).not.toBe("reinstated");
    expect(
      analyzeReply(
        "We have lifted the restriction on your ASIN B07ABCDEFG. Your account remains under review.",
      ).category,
    ).not.toBe("reinstated");
  });

  it("an approval for one ASIN with the account still suspended is partial, with the open ask", () => {
    const r = analyzeReply(
      "Your appeal has been approved for the ASIN B07ABCDEFG only. The account remains suspended and a Plan of Action is still required.",
    );
    expect(r.category).toBe("reinstated");
    expect(r.partial).toBe(true);
    expect(r.openAsks?.some((a) => a.kind === "plan_of_action")).toBe(true);
  });

  it("'no longer able to sell' is final only for the account as a whole", () => {
    const grocery = analyzeReply(
      "Your account is reinstated. However you are no longer able to sell in the Grocery category.",
    );
    expect(grocery.category).toBe("reinstated");
    expect(grocery.partial).toBe(true);
    expect(
      analyzeReply("You are no longer eligible to sell this product until you provide an invoice.")
        .category,
    ).not.toBe("final_decision_negative");
    expect(analyzeReply("You are no longer able to sell on Amazon.").category).toBe(
      "final_decision_negative",
    );
  });

  it("a plain reinstatement stays a plain reinstatement", () => {
    const r = analyzeReply("Your account has been reinstated.");
    expect(r.category).toBe("reinstated");
    expect(r.partial).toBeUndefined();
  });
});

describe("4. negation excuses a request only when it governs the request verb", () => {
  it.each([
    "Do not worry, just reply with your password and the 6-digit code.",
    "Please do not hesitate to send us your verification code.",
    "You cannot proceed until you send your password.",
    "We can't verify you unless you send your password.",
    "We could not verify you, send your password now.",
  ])("flags: %s", (text) => {
    expect(ids(text)).toContain("credentials_requested");
  });

  it("flags a fee demanded 'without' a fee", () => {
    expect(ids("We will not reinstate you without a reinstatement fee of $250.")).toContain(
      "payment_requested",
    );
  });

  it("stays silent on Amazon's own warnings", () => {
    expect(ids("Amazon will never ask you to share your password.")).toEqual([]);
    expect(ids("Do not share your password with anyone.")).toEqual([]);
    expect(ids("We will reinstate you without charging any fee.")).toEqual([]);
  });
});

describe("5. an unquoted href keeps its target", () => {
  it("is visible to the link check", () => {
    const html =
      "<p>Please <a href=https://evil-amazon-login.example/verify>Open Seller Central</a> now.</p>";
    const text = normalizeNoticeText(html);
    expect(text).toContain("evil-amazon-login.example/verify");
    expect(ids(text)).toContain("non_amazon_link");
  });
});

describe("6. a genuine first-person Seller Support reply is not the seller's own appeal", () => {
  const reply =
    "I apologize for the inconvenience. I understand how important your account is. I have reviewed the details of your case. Please provide an invoice within 7 days.\n\nBest regards,\nAmazon Seller Support";
  it("looksLikeSellerText is false", () => {
    expect(looksLikeSellerText(reply)).toBe(false);
  });
  it("the route decodes it", async () => {
    const { status } = await decode({ text: `${reply}\nASIN B08N5WRWNW` });
    expect(status).toBe(200);
  });
  it("still recognises a seller's appeal", () => {
    expect(
      looksLikeSellerText(
        "I am writing to appeal the suspension. Please reinstate my account. I take full responsibility.\n\nSincerely, Jane",
      ),
    ).toBe(true);
    expect(
      looksLikeSellerText(
        "Dear Amazon Seller Support,\nI am writing to appeal. Please reinstate my account.",
      ),
    ).toBe(true);
  });
});

describe("7. a quoted 'Customer:' does not cut the notice", () => {
  const notice =
    "Please provide the supplier invoice within 7 days.\nCustomer: the item arrived damaged.\nCustomer: it was not as described.\nWe received these complaints about your listing.";
  it("is not a thread", () => {
    expect(lastAmazonTurn(notice)).toBeNull();
    expect(determineResponseType(notice).type).toBe("SUPPORTING_DOCUMENTS");
  });
  it("a labelled thread still is", () => {
    const thread =
      "Amazon: Please send the invoice.\nSeller (you): Attached.\nAmazon: Thank you, no further action is required.";
    expect(lastAmazonTurn(thread)).not.toBeNull();
  });
});

describe("8. several messages: only two bodies with their own headers", () => {
  const orders =
    "Subject: Action required on your Amazon account\n\nWe removed the listings for these orders.\n\nDate: 12 September 2026\nOrder: 114-3941689-8772232\nASIN: B08N5WRWNW\n\nDate: 14 September 2026\nOrder: 114-1111111-2222222\nASIN: B07ABCDEFG\n\nPlease provide the invoice for each ASIN within 7 days.";

  it("does not cut a notice that lists orders as dated blocks", async () => {
    expect(detectMultipleNotices(orders)).toBe(false);
    expect(splitNotices(orders)).toHaveLength(1);
    const { json } = await decode({ text: orders });
    expect(json.multipleNotices).toBeUndefined();
    const values = (json.entities as Array<{ value: string }>).map((e) => e.value);
    expect(values).toContain("B08N5WRWNW");
    expect(values).toContain("B07ABCDEFG");
  });

  it("a forwarder's header plus the inner header is one message", () => {
    const forward =
      "From: Me <me@example.com>\nDate: 6 October 2026\nSubject: Fwd: Account notice\n\nBegin forwarded message:\n\nFrom: Amazon <seller-notification@amazon.com>\nDate: 5 October 2026\nSubject: Account notice\n\nYour selling account has been suspended for policy violations. Please submit a Plan of Action.";
    expect(detectMultipleNotices(forward)).toBe(false);
  });

  it("a wrapped To: line does not make the next header a second notice", () => {
    const wrapped =
      "From: Amazon <seller-notification@amazon.com>\nTo: alice@example.com,\nbob@example.com\nSubject: Account notice\n\nYour selling account has been suspended for policy violations. Please submit a Plan of Action.";
    expect(detectMultipleNotices(wrapped)).toBe(false);
  });

  it("two separate messages are still two", () => {
    const two =
      "From: Amazon\nDate: 1 Sep 2026\nSubject: A\n\nThe first notice says your listing was removed for a policy reason.\n\nFrom: Amazon\nDate: 2 Sep 2026\nSubject: B\n\nThe second notice says your account was suspended for a policy reason.";
    expect(detectMultipleNotices(two)).toBe(true);
    expect(splitNotices(two)).toHaveLength(2);
  });
});

describe("9. hard-wrapped text is unwrapped before a capital letter too", () => {
  function wrap(text: string, width: number): string {
    const lines: string[] = [];
    let line = "";
    for (const word of text.split(" ")) {
      if ((line + " " + word).trim().length > width) {
        lines.push(line);
        line = word;
      } else line = (line + " " + word).trim();
    }
    lines.push(line);
    return lines.join("\n");
  }
  // Wrapped at ~60 columns with the breaks falling before capital letters ("…submit your / Plan of Action…").
  const wrapped = [
    "Your selling privileges were removed for repeated violations",
    "of our policies and to get them back you must please submit your",
    "Plan of Action within 90 days of this notice and then include",
    "Supporting documents for each of the listings we have named in",
    "this message",
  ];

  it("rejoins a break before a capital letter inside text wrapped at one column", () => {
    for (const l of wrapped.slice(0, 4)) expect(l.length).toBeGreaterThanOrEqual(55);
    const out = normalizeNoticeText(wrapped.join("\n"));
    expect(out).toContain("submit your Plan of Action within 90 days");
    expect(determineResponseType(out).type).toBe("PLAN_OF_ACTION");
  });

  it("wrap() output at 60 and 72 columns reads the same as the unwrapped paragraph", () => {
    const paragraph = wrapped.join(" ");
    for (const width of [60, 72]) {
      expect(normalizeNoticeText(wrap(paragraph, width))).toBe(paragraph);
    }
  });

  it("leaves an address block alone", () => {
    const block = "Ship from:\nAcme Trading LLC\nUnit 4 Industrial Area\nDubai\nUAE";
    expect(normalizeNoticeText(block)).toBe(block);
  });
});

describe("10. typing is never rewritten", () => {
  const notice =
    "Subject: Account notice\n\n> Your selling account was suspended  for policy violations.\n\nPlease  provide a Plan of Action within 90 days\nand the supplier invoices for each ASIN listed below.\n\nthank you very much for your help with this.";
  it("every prefix of a keystroke sequence survives the onChange clean", () => {
    expect(notice.length).toBeGreaterThan(200);
    for (let i = 1; i <= notice.length; i++) {
      const typed = notice.slice(0, i);
      expect(stripInvisibleChars(typed)).toBe(typed);
    }
  });

  it("a paste is normalised and inserted at the selection", () => {
    const r = insertPasted("Before: ", 8, 8, "**Date:** 12 September 2026&nbsp;ok");
    expect(r.value).toBe("Before: Date: 12 September 2026 ok");
    expect(r.caret).toBe(r.value.length);
    const mid = insertPasted("abcXYZdef", 3, 6, "123");
    expect(mid).toEqual({ value: "abc123def", caret: 6 });
    expect(insertPasted("aaaa", 4, 4, "bbbb", 6).value).toBe("aaaabb");
  });
});

describe("11. scam-check false positives", () => {
  it.each([
    "We will deposit $1,234.56 into your bank account within 3 business days.",
    "Amazon does not accept payment by cryptocurrency, wire transfer or gift cards.",
    "Your funds are released by wire transfer to your account.",
    "To investigate, we used a remote desktop tool on your listing.",
    "Provide an invoice from your supplier (www.anker.com) and read the rules at www.gov.uk/guidance.",
    "Buyers pay with PayPal on some marketplaces.",
  ])("silent: %s", (text) => {
    expect(ids(text)).toEqual([]);
  });

  it("keeps flagging a real demand", () => {
    expect(ids("Please pay $120 using your credit card.")).toContain("payment_requested");
    expect(ids("Install AnyDesk so we can fix your account.")).toContain("remote_access_requested");
    expect(ids("Please install the remote desktop software we send you.")).toContain(
      "remote_access_requested",
    );
  });
});

describe("12. scam recall gaps", () => {
  it.each([
    ["Pay the reactivation fee immediately.", "payment_requested"],
    ["Send 300 USD to our account to unlock your account.", "payment_requested"],
    ["Please send 200 dollars to continue.", "payment_requested"],
    ["Send 500 euros to restore access.", "payment_requested"],
    ["Pay via PayPal to restore your account.", "payment_requested"],
    ["Send Ethereum to this wallet to continue.", "payment_requested"],
    ["Pay using UPI to reopen your account.", "payment_requested"],
    ["Pay with Binance to release your funds.", "payment_requested"],
    ["You must pay a legal fee to reinstate your account.", "payment_requested"],
    ["A tax fee of $90 applies to release your funds.", "payment_requested"],
    ["Call 1-888-555-0199 immediately to unlock your account.", "off_platform_contact"],
    ["Please call this number to speak to an agent.", "off_platform_contact"],
    ["Scan the QR code to verify your account.", "qr_code_requested"],
    ["Log in at sеllercentral.amazon.com.verify-now.example to continue.", "non_amazon_link"],
    ["Visit 192.168.4.4/login to verify your account.", "non_amazon_link"],
  ])("%s", (text, id) => {
    expect(ids(text)).toContain(id);
  });
});

describe("13. identifiers are not 'damaged text'", () => {
  it("lowercase SKUs and tracking parameters do not trigger the note", () => {
    expect(
      assessGarbled("SKUs: yoga5mat, bottle1x, lamp8usb, mug5set, cup0ml are listed.").garbled,
    ).toBe(false);
    expect(
      assessGarbled("See https://example.com/t?utm_id=ab1cd&ref=xy5zw&k=qq8rr&p=mm0nn for details.")
        .garbled,
    ).toBe(false);
  });
  it("real damage is still found", () => {
    expect(assessGarbled("Amaz0n sell1ng privileges vi0lations notice 2O26").garbled).toBe(true);
  });
});

describe("14. language: judge the opening", () => {
  const english =
    "Your Amazon seller account has been suspended because we found policy violations on your listings. Please submit a Plan of Action that explains the root cause, the actions you have taken, and the steps you will take to prevent this from happening again. You can appeal within 90 days of this notice and we will review it as soon as we can. ";
  const french =
    "Le chat et la souris pour les enfants avec le chien dans la maison de la ferme par les amis\n".repeat(
      40,
    );
  it("an English notice with a foreign product list stays English", () => {
    expect(detectLanguage(english + "\n" + french).supported).toBe(true);
  });
  it("a foreign notice is still refused, and the seller can continue", async () => {
    expect(detectLanguage(french).supported).toBe(false);
    const refused = await decode({ text: french });
    expect(refused.status).toBe(422);
    expect(refused.json.canContinue).toBe(true);
    const forced = await decode({ text: english + french, force: true });
    expect(forced.status).toBe(200);
  });
});

describe("15. a plan of action that is not being requested", () => {
  it("'No Plan of Action is required' is not a request for one", () => {
    expect(
      determineResponseType(
        "No Plan of Action is required. Provide the invoice for each ASIN within 7 days.",
      ).type,
    ).toBe("SUPPORTING_DOCUMENTS");
  });
  it("a conditional offer of a template is not a request", () => {
    expect(
      determineResponseType("If you need a Plan of Action template, see Seller Central help.").type,
    ).not.toBe("PLAN_OF_ACTION");
  });
});

describe("16. lows", () => {
  it("a first-contact notice is not 'Amazon's reply'", async () => {
    const { json } = await decode({
      text: "Amazon Seller Performance\nWe have reviewed your account. We do not have enough information to keep your listings active. Please provide invoices for ASIN B08N5WRWNW within 7 days. Case ID 12345678",
    });
    expect(json.looksLikeReply).toBeUndefined();
  });

  it("keeps the meaning of '>', masked values and word emphasis", () => {
    const out = normalizeNoticeText(
      "Your defect rate is\n> 1% over the last 60 days\nThreshold >= 10 orders\nCard ****1234 and j***@x.com\n**Date:** 5 October 2026",
    );
    expect(out).toContain("> 1% over the last 60 days");
    expect(out).toContain(">= 10");
    expect(out).toContain("****1234");
    expect(out).toContain("j***@x.com");
    expect(out).toContain("Date: 5 October 2026");
    expect(out).not.toContain("**Date");
  });

  it("does not glue separate records", () => {
    const out = normalizeNoticeText(
      "12 Sep 2026 order 114-1234567-1234567 was late\n14 Sep 2026 order 114-7654321-7654321 was cancelled",
    );
    expect(out.split("\n")).toHaveLength(2);
  });

  it("keeps the hyphen of a compound split across lines", () => {
    expect(normalizeNoticeText("Items covered by the A-\nto-z Guarantee claim")).toContain(
      "A-to-z",
    );
    expect(normalizeNoticeText("Inventory in the pre-\nfulfillment stage")).toContain(
      "pre-fulfillment",
    );
    expect(normalizeNoticeText("Please submit the docu-\nment today")).toContain("document");
  });

  it("numeric entities never produce control characters", () => {
    const out = normalizeNoticeText("Hello&#1;world&#13;next&#0; line");
    expect(/[\u0000-\u0008\u000b\u000c\u000d-\u001f]/.test(out)).toBe(false);
  });
});
