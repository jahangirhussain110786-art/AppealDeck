/**
 * Copy for the optional email reminder on the free decoder (23 Oct 2026). One file so the form, the
 * confirm page and the tests say the same thing. Rules: it states only what is true of the feature
 * as built (one confirmation email, one reminder three days before the date or the next day if that
 * has passed, only the date and the kind of notice kept, deleted 30 days after the date), adds no
 * urgency of its own, and promises nothing about the outcome.
 */
export const GUEST_REMINDER = {
  form: {
    title: "Get one email reminder",
    body: "We will email you once, three days before the date in your notice. For this reminder we keep only your address, that date and the kind of notice, never the notice itself.",
    emailLabel: "Your email address",
    emailPlaceholder: "you@example.com",
    consent:
      "Send me a confirmation email and one reminder about this date. AppealDeck keeps my address and the date until 30 days after it, then deletes them.",
    privacyLink: "How this is kept",
    submit: "Email me a reminder",
    sending: "Sending…",
    pending: "Check your inbox for a link to confirm. The reminder is set once you click it.",
    already: "You already have a reminder for this date.",
    tooLate: "That date is today or has passed, so there is nothing to remind you of.",
    limit: "That address already has the most reminders we send.",
    unavailable: "Email reminders are not available right now. Your decode is unaffected.",
    invalid: "Enter a valid email address and tick the box.",
    tooMany: "Too many requests today. Try again tomorrow.",
  },
  page: {
    title: "Your reminder",
    metaTitle: "Your reminder",
    metaDescription: "Confirm or stop an email reminder from AppealDeck.",
    confirm: {
      heading: "Confirm your reminder",
      body: "Press the button to get one email reminder before the date in your notice. If you did not ask for this, close this page and nothing will be sent.",
      button: "Confirm my reminder",
      done: "Done. You will get one reminder before the date. We keep your address and that date until 30 days after it.",
      already: "This reminder is already confirmed.",
      stopped: "You stopped reminders to this address, so this one will not be sent.",
      expired: "That date has passed, so there is nothing left to remind you of.",
    },
    stop: {
      heading: "Stop reminders",
      body: "Press the button to stop every reminder AppealDeck would send to this address.",
      button: "Stop all reminders",
      done: "Done. No more reminders will be sent to this address.",
    },
    unknown: "This link is not valid or has already been used up. Nothing was changed.",
    error: "Something went wrong. Nothing was changed. Try again in a moment.",
    working: "Working…",
    back: "Back to the free decoder",
  },
} as const;
