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
import { formatLongDate } from "@/lib/format";

export interface PurchaseConfirmationInput {
  /** Buyer's email, already validated by the caller. */
  to: string;
  /** ISO date string (or Date) the purchase completed. */
  purchasedAt: string | Date;
  consentText?: string;
  idempotencyKey?: string;
}

export interface BuiltEmail {
  subject: string;
  html: string;
  text: string;
}

/**
 * Pure content builder — no network, fully unit-testable. Echoes what D8 / the checkout-consent
 * spec (legal/withdrawal-consent.md item 4) requires: what was bought, the price, the consent
 * given, and the refund route.
 */
export function buildPurchaseConfirmationEmail(input: PurchaseConfirmationInput): BuiltEmail {
  const dateLabel = formatLongDate(input.purchasedAt);
  const subject = `Your ${PRICING.pass} receipt and consent copy`;
  const consentLine = input.consentText ?? LEGAL.consent.withdrawalCheckbox.label;
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
  if (!apiKey) throw new Error("Confirmation email is not configured");

  const { subject, html, text } = buildPurchaseConfirmationEmail(input);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(5000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
      },
      body: JSON.stringify({ from, to: input.to, subject, html, text }),
    });
    if (!res.ok) throw new Error("Confirmation email provider returned " + res.status);
  } catch {
    throw new Error("Confirmation email delivery failed");
  }
}

export interface CaseReminderInput {
  to: string;
  /** Coarse violation kind. Never the notice text — see migration 0011's header. */
  kindLabel: string;
  /** ISO date the seller themselves chose. */
  dueAt: string | Date;
  /** Absolute URL back to the dashboard. */
  dashboardUrl: string;
  idempotencyKey?: string;
}

/**
 * AA-40: the follow-up reminder email. Pure content builder, same pattern as the purchase email.
 *
 * Tone rules, which matter more here than anywhere else in the product. This email arrives
 * unprompted at a person in a crisis, so it: states only the date they set, never implies Amazon
 * has been in touch or that anything has changed, contains no deadline arithmetic we cannot stand
 * behind, makes no prediction, and says plainly how to stop receiving it. A reminder that
 * manufactures urgency would undo the honesty the rest of the product is built on.
 */
export function buildCaseReminderEmail(input: CaseReminderInput): BuiltEmail {
  const dateLabel = formatLongDate(input.dueAt);
  const subject = "The follow-up date you set has arrived";

  const lines = [
    `You asked us to remind you about your ${input.kindLabel} case${
      dateLabel ? ` on ${dateLabel}` : ""
    }. That date has arrived.`,
    "",
    "Nothing about your case has changed on our side — Amazon does not notify us, and we never sign in to your account. This is only the date you chose.",
    "",
    `Open your case: ${input.dashboardUrl}`,
    "",
    "To stop these, turn off email reminders for this case on your dashboard.",
    "",
    "AppealDeck by Hawlton",
  ];

  const text = lines.join("\n");
  const html = `<div>${lines
    .map((line) => (line === "" ? "<br />" : `<p>${escapeHtml(line)}</p>`))
    .join("\n")}</div>`;

  return { subject, html, text };
}

/** Sends a case reminder. Throws on failure so the caller can record it and retry. */
export async function sendCaseReminderEmail(input: CaseReminderInput): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM ?? "AppealDeck <billing@appealdeck.com>";
  if (!apiKey) throw new Error("Reminder email is not configured");

  const { subject, html, text } = buildCaseReminderEmail(input);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      signal: AbortSignal.timeout(5000),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        ...(input.idempotencyKey ? { "Idempotency-Key": input.idempotencyKey } : {}),
      },
      body: JSON.stringify({ from, to: input.to, subject, html, text }),
    });
    if (!res.ok) throw new Error("Reminder email provider returned " + res.status);
  } catch {
    throw new Error("Reminder email delivery failed");
  }
}
