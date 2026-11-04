/**
 * Two ways to tell the founder, one of which always works for free (4 Nov 2026).
 *
 * 1. A GitHub issue, created with the token the workflow already has. Assigning it to the repository
 *    owner sends GitHub's own notification email, so this path needs no mail provider, no domain, no
 *    account and no money. It is also the durable log: a month of alerts stays searchable.
 * 2. A direct email through Resend when `RESEND_API_KEY` and `POLICY_ALERT_EMAIL` are set. Same
 *    provider the purchase-confirmation mail already uses, so it adds no third party.
 *
 * A run that found something and delivered it nowhere is a failure, not a quiet success. That is
 * the whole point: an unwatched watch is worse than no watch, because it is believed.
 */

const GITHUB_API = "https://api.github.com";

async function github(path, init) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  if (!token || !repo) return { ok: false, reason: "GITHUB_TOKEN/GITHUB_REPOSITORY not set" };
  const response = await fetch(`${GITHUB_API}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/vnd.github+json",
      "x-github-api-version": "2022-11-28",
      "content-type": "application/json",
      "user-agent": "AppealDeckPolicyWatch/1.0",
      ...(init?.headers ?? {}),
    },
  });
  if (!response.ok) {
    return {
      ok: false,
      reason: `GitHub ${response.status}: ${(await response.text()).slice(0, 300)}`,
    };
  }
  return { ok: true, json: await response.json() };
}

/** Comments on today's issue when one already exists, so a re-run does not open a second one. */
export async function upsertIssue({ title, body, marker }) {
  const repo = process.env.GITHUB_REPOSITORY;
  if (!repo) return { ok: false, reason: "GITHUB_REPOSITORY not set" };

  const listed = await github(`/repos/${repo}/issues?state=open&per_page=30`, { method: "GET" });
  if (listed.ok) {
    const existing = listed.json.find((issue) => issue.title === title && !issue.pull_request);
    if (existing) {
      const commented = await github(`/repos/${repo}/issues/${existing.number}/comments`, {
        method: "POST",
        body: JSON.stringify({ body: `${marker}\n\n${body}` }),
      });
      if (commented.ok) return { ok: true, url: existing.html_url, updated: true };
      return { ok: false, reason: commented.reason };
    }
  }

  const owner = process.env.GITHUB_REPOSITORY_OWNER;
  const created = await github(`/repos/${repo}/issues`, {
    method: "POST",
    body: JSON.stringify({
      title,
      body,
      ...(owner ? { assignees: [owner] } : {}),
    }),
  });
  if (!created.ok) return { ok: false, reason: created.reason };
  return { ok: true, url: created.json.html_url, updated: false };
}

export async function sendEmail({ subject, text }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.POLICY_ALERT_EMAIL || process.env.OPS_ALERT_EMAIL;
  if (!key || !to) return { ok: false, reason: "RESEND_API_KEY/POLICY_ALERT_EMAIL not set" };

  // Resend's shared sender only delivers to the account owner's own address, which is exactly the
  // recipient here. A verified domain sender can be named with POLICY_ALERT_FROM.
  const from = process.env.POLICY_ALERT_FROM ?? "AppealDeck Watch <onboarding@resend.dev>";
  const html = `<div style="font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.6;white-space:pre-wrap">${text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")}</div>`;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, text, html }),
  });
  if (!response.ok) {
    return {
      ok: false,
      reason: `Resend ${response.status}: ${(await response.text()).slice(0, 300)}`,
    };
  }
  return { ok: true, to };
}

/**
 * Tries every configured channel and reports each one's outcome. The caller decides what to do with
 * zero deliveries; this function never pretends one happened.
 */
export async function notify({ title, body, text, subject, marker = "" }) {
  const attempts = [];
  const issue = await upsertIssue({ title, body: `${body}\n\n---\n${text}`, marker });
  attempts.push({ channel: "github-issue", ...issue });

  const email = await sendEmail({ subject, text });
  if (email.ok || process.env.RESEND_API_KEY || process.env.POLICY_ALERT_EMAIL) {
    attempts.push({ channel: "email", ...email });
  }

  return { delivered: attempts.filter((a) => a.ok), attempts };
}
