import { describe, expect, it } from "vitest";
import { assessNoticeAuthenticity } from "./noticeAuthenticity";

const ids = (text: string) => assessNoticeAuthenticity(text).signals.map((s) => s.id);

/**
 * 6 Oct 2026. A sweep of genuine and degraded notices found the check crying wolf on real Amazon
 * messages and silent on common lures. A seller told to doubt a genuine notice may delay answering
 * it inside a short window, so every silence below is as deliberate as every flag.
 */
describe("stays silent on genuine notices", () => {
  it("does not judge the recipients of a forwarded message", () => {
    expect(
      ids(
        "From: Amazon Seller Performance <seller-performance@amazon.com>\nTo: me@mystore.com\nCc: partner@mybrand.co\nBcc: bookkeeper@mystore.com\nSubject: Your account\nYour listing was removed for a policy violation.",
      ),
    ).toEqual([]);
  });

  it("does not judge quoted lines, a signature, or a supplier named in an invoice request", () => {
    expect(
      ids(
        "Thanks,\nJane (janedoe@gmail.com)\n> On Monday Amazon wrote: reply to ops@elsewhere.example",
      ),
    ).toEqual([]);
    expect(
      ids(
        "Please provide an invoice from your supplier (sales@acme-supply.com) for ASIN B08N5WRWNW.",
      ),
    ).toEqual([]);
  });

  it("allows Amazon's own tracking and short links, and checks what a tracker wraps", () => {
    expect(
      ids(
        "Open https://r.us-east-1.awstrack.me/L0/https:%2F%2Fsellercentral.amazon.com%2Fperformance%2Fdashboard/1/abc-def to review.",
      ),
    ).toEqual([]);
    expect(
      ids("See https://amzn.to/3abcdef, https://www.amzn.com/x and https://a.co/d/abc."),
    ).toEqual([]);
    expect(ids("Visit https://sellercentral.amazon.com.")).toEqual([]);
  });

  it("still flags a tracker that wraps a foreign destination, or wraps nothing", () => {
    expect(
      ids(
        "Open https://r.us-east-1.awstrack.me/L0/https:%2F%2Famazon-verify.com%2Funlock/1/x to review.",
      ),
    ).toContain("non_amazon_link");
    expect(ids("Open https://r.us-east-1.awstrack.me/L0/abc to review.")).toContain(
      "non_amazon_link",
    );
  });

  it("does not read Amazon's own warning about passwords as a request for one", () => {
    expect(
      ids(
        "Amazon will never ask you for your password or a one-time passcode. Do not share your password or OTP with anyone.",
      ),
    ).toEqual([]);
  });

  it("does not read a policy sentence about gift cards as a payment demand", () => {
    expect(
      ids(
        "Offering gift cards or payment to customers in exchange for reviews violates our policy.",
      ),
    ).toEqual([]);
    expect(ids("Amazon will never ask you to pay with gift cards.")).toEqual([]);
  });

  it("does not read a genuine 'enter the code we sent' as a request to hand the code over", () => {
    expect(
      ids(
        "To verify your identity, enter the verification code we sent to your phone in Seller Central.",
      ),
    ).toEqual([]);
  });

  it("does not read a policy notice about WhatsApp as a request to move the conversation", () => {
    expect(
      ids(
        "Your listing was removed because you were communicating with buyers through WhatsApp. Communicating with buyers outside Amazon is not allowed.",
      ),
    ).toEqual([]);
    expect(ids("You may not contact buyers via WhatsApp or Telegram.")).toEqual([]);
  });

  it("does not read 'there is no fee' as a fee", () => {
    expect(ids("There is no fee to appeal. Amazon does not charge a reinstatement fee.")).toEqual(
      [],
    );
  });
});

describe("still catches the lures", () => {
  it("catches the same lures when they are worded as a request", () => {
    expect(ids("We could not verify your account; reply with your password.")).toContain(
      "credentials_requested",
    );
    expect(ids("Enter your password at amazon-verify.com to continue.")).toContain(
      "credentials_requested",
    );
  });

  it("catches a bare-domain lure written without http or www", () => {
    expect(ids("visit amazon-sellercentral-help.com/unlock to restore your account")).toContain(
      "non_amazon_link",
    );
    expect(ids("Log in at amazon-seller-verify.net to continue")).toContain("non_amazon_link");
    expect(ids("Visit sellercentral.amazon.com/performance for details")).toEqual([]);
  });

  it("catches a request to reply with a code Amazon just sent", () => {
    expect(ids("reply with the 6-digit code we just sent you")).toContain("credentials_requested");
    expect(ids("Please read out the one-time passcode to our agent.")).toContain(
      "credentials_requested",
    );
  });

  it("catches branded gift cards", () => {
    for (const method of [
      "iTunes gift cards",
      "Google Play cards",
      "a Steam card",
      "Apple gift cards",
    ]) {
      expect(
        ids(`To reinstate your account, buy ${method} and send us the codes.`),
        method,
      ).toContain("payment_requested");
    }
  });

  it("catches a success fee or upfront payment for an appeal", () => {
    expect(
      ids("Our success fee of $300 is due upfront via Zelle before we file your appeal."),
    ).toContain("payment_requested");
    expect(ids("Send the deposit by CashApp or Venmo to start your appeal.")).toContain(
      "payment_requested",
    );
  });

  it("catches remote-access tools", () => {
    for (const tool of ["AnyDesk", "TeamViewer", "UltraViewer"]) {
      expect(ids(`Install ${tool} so our agent can fix your account.`), tool).toContain(
        "remote_access_requested",
      );
    }
    expect(ids("Amazon will never ask you to install AnyDesk or TeamViewer.")).toEqual([]);
  });

  it("catches a sender address in a From line and a reply-to in the body", () => {
    expect(ids("From: appeals@amazon.xyz\nYour account is suspended.")).toContain(
      "non_amazon_sender",
    );
    expect(
      ids("Reply to seller-performance@amazon-support-team.net with your documents."),
    ).toContain("non_amazon_sender");
  });

  it("still reaches no verdict in words", () => {
    const text = JSON.stringify(
      assessNoticeAuthenticity(
        "Pay the reinstatement fee via Bitcoin, install AnyDesk and reply with your password on WhatsApp at amazon-help.top/x",
      ),
    ).toLowerCase();
    for (const banned of ["is a scam", "fraudulent", "is genuine", "is legitimate"]) {
      expect(text).not.toContain(banned);
    }
  });
});
