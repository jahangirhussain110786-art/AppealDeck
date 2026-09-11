// Transactional email — currently just the D8-required purchase confirmation.
//
// D8 (CLAUDE.md §2): EU-withdrawal-compliant checkout consent requires "explicit prior consent +
// permanent-form confirmation email." The checkout already collects consent (ConsentRow) and the
// pricing page already promises "You will receive a receipt and a copy of this consent by email"
// (LEGAL.consent.deliveryNote) — this module is what actually sends it. Before this file existed,
// that promise was never fulfilled (found during the 11 Sep 2026 full-repo audit, Section F3).
//
// Uses Resend's plain REST API via fetch — no new npm dependency. No-ops with a console warning
// when RESEND_API_KEY is unset, matching the Gemini/Upstash pattern elsewhere in this codebase:
// wired in code, inert until the founder adds a real key.

import { PRICING } from "@/content/marketing";
import { LEGAL } from "@/content/legal";

export interface PurchaseConfirmationInput {
  /** Buyer's email, already validated by the caller. */
  to: string;
  /** ISO date string (or Date) the purchase completed. */
  purchasedAt: string | Date;
}

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

/**
 * Pure content builder — no network, fully unit-testable. Echoes what D8 / the checkout-consent
 * spec (legal/withdrawal-consent.md item 4) requires: what was bought, the price, the consent
 * given, and the refund route.
 */
export function buildPurchaseConfirmationEmail(input: PurchaseConfirmationInput): BuiltEmail {
  const dateLabel = formatDate(input.purchasedAt);
  const subject = `Your ${PRICING.pass} receipt and consent copy`;
  const consentLine = LEGAL.consent.withdrawalCheckbox.label;
  const refundLine =
    "You can request a full refund within 7 days of purchase, no questions asked, by replying to this email or writing to billing@appealdeck.com.";

  const lines = [
    `Thanks for buying the ${PRICING.pass}${dateLabel ? ` on ${dateLabel}` : ""}.`,
    `Price: ${PRICING.price} (${PRICING.priceNote})`,
    "",
    "The consent you gave at checkout:",
    `"${consentLine}"`,
    "",
    refundLine,
    "",
    "This email is your permanent record of this purchase and the consent above — keep it for your records.",
    "",
    "AppealDeck by Hawlton",
  ];

  const text = lines.join("\n");
  const html = `<div>${lines
    .map((line) => (line === "" ? "<br />" : `<p>${escapeHtml(line)}</p>`))
    .join("\n")}</div>`;

  return { subject, html, text };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Sends the purchase confirmation via Resend's REST API. No-ops (logs a warning, does not throw)
 * when RESEND_API_KEY is unset — callers should not let a missing key break the webhook response.
 */
export async function sendPurchaseConfirmationEmail(
  input: PurchaseConfirmationInput,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "AppealDeck <billing@appealdeck.com>";
  if (!apiKey) {
    console.warn(
      "sendPurchaseConfirmationEmail: RESEND_API_KEY not set — confirmation email not sent. " +
        "Set RESEND_API_KEY (and optionally EMAIL_FROM) to enable this D8-required email.",
    );
    return;
  }

  const { subject, html, text } = buildPurchaseConfirmationEmail(input);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to: input.to, subject, html, text }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("sendPurchaseConfirmationEmail: Resend API error", res.status, body);
    }
  } catch (e) {
    console.error("sendPurchaseConfirmationEmail: request failed", (e as Error).message);
  }
}
