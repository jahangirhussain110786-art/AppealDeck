/**
 * The two emails of the guest deadline reminder (23 Oct 2026): the confirmation, and the reminder.
 *
 * Tone rules, as for the case reminder (`buildCaseReminderEmail`): they arrive at a person in a
 * crisis, so they state only the date the notice gave, never imply Amazon has been in touch or that
 * anything changed, make no prediction, add no urgency of their own, and say how to stop. The
 * confirmation must also make plain that nothing more is sent unless the reader clicks it, because
 * the address may have been typed by someone else.
 */
import { formatLongDate } from "@/lib/format";
import { SITE_URL } from "@/lib/urls";
import { escapeHtml, sendRawEmail, type BuiltEmail } from "@/lib/email";

export interface GuestConfirmInput {
  to: string;
  token: string;
  label: string;
  dueOn: string;
  kindLabel: string;
}
export interface GuestReminderInput extends GuestConfirmInput {
  daysLeft: number;
}

const confirmUrl = (token: string) => `${SITE_URL}/reminder?do=confirm&token=${token}`;
const stopUrl = (token: string) => `${SITE_URL}/reminder?do=stop&token=${token}`;

function toHtml(lines: string[]): string {
  return `<div>${lines.map((l) => (l === "" ? "<br />" : `<p>${escapeHtml(l)}</p>`)).join("\n")}</div>`;
}

export function buildGuestConfirmEmail(input: GuestConfirmInput): BuiltEmail {
  const date = formatLongDate(`${input.dueOn}T00:00:00Z`);
  const lines = [
    `Someone, we hope you, asked AppealDeck to send one email reminder before ${date}. That is the date an Amazon ${input.kindLabel} notice gave: ${input.label}.`,
    "",
    `To get the reminder, confirm here: ${confirmUrl(input.token)}`,
    "",
    "If this was not you, ignore this email. Nothing will be sent to you unless you confirm.",
    "",
    "We keep your email address and that date until 30 days after it, and then delete them. For this reminder we keep only the date and the kind of notice, never the notice itself.",
    "",
    `To stop all reminders to this address: ${stopUrl(input.token)}`,
    "",
    "AppealDeck by Hawlton",
  ];
  return {
    subject: `Confirm your reminder before ${date}`,
    html: toHtml(lines),
    text: lines.join("\n"),
  };
}

export function buildGuestReminderEmail(input: GuestReminderInput): BuiltEmail {
  const date = formatLongDate(`${input.dueOn}T00:00:00Z`);
  const when =
    input.daysLeft <= 0
      ? "is today"
      : input.daysLeft === 1
        ? "is tomorrow"
        : `is in ${input.daysLeft} days`;
  const lines = [
    `You asked us to remind you about the date in your Amazon ${input.kindLabel} notice: ${input.label}, ${date}. It ${when}.`,
    "",
    "This is the date your notice gave. Your Account Health page is the one to go by, and Amazon decides what happens after it. Nothing about your case has changed on our side: we never sign in to your account.",
    "",
    `Read your notice again, free: ${SITE_URL}/decode`,
    "",
    `To stop all reminders to this address: ${stopUrl(input.token)}`,
    "",
    "AppealDeck by Hawlton",
  ];
  return {
    subject: `Your date ${when}: ${input.label}`,
    html: toHtml(lines),
    text: lines.join("\n"),
  };
}

export async function sendGuestReminderConfirmEmail(input: GuestConfirmInput): Promise<void> {
  const built = buildGuestConfirmEmail(input);
  await sendRawEmail({
    to: input.to,
    ...built,
    idempotencyKey: `guest-confirm/${input.token}/${hourKey()}`,
  });
}

export async function sendGuestReminderEmail(input: GuestReminderInput): Promise<void> {
  const built = buildGuestReminderEmail(input);
  await sendRawEmail({ to: input.to, ...built, idempotencyKey: `guest-reminder/${input.token}` });
}

/** Keyed on the hour so a deliberate re-request an hour later is not swallowed as a duplicate. */
const hourKey = () => new Date().toISOString().slice(0, 13);
