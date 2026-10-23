-- 0022_guest_reminders.sql
-- An opt-in email reminder for a visitor who has just decoded a notice and has no account (23 Oct 2026).
--
-- WHY: a seller who decodes a notice and leaves has a real deadline running and nothing that brings
-- them back. `case_reminders` (0011) covers a signed-in seller's follow-up dates; this covers the
-- visitor, with the one date their notice states. It is the only list the free decoder can build, and
-- it is built by giving the reader something they need first.
--
-- WHAT IS KEPT: an email address, the date the notice states, a short label for it (our own wording,
-- for example "Appeal window"), the coarse kind of notice, and the dates of what we did. NEVER the
-- notice text, a case, a name, or anything the visitor typed other than the address.
--
-- HOW IT IS KEPT HONEST: double opt-in. Someone could type another person's address, so nothing is
-- sent beyond one confirmation email until the owner of the address clicks a link in it. One reminder
-- is sent, on the day computed from the date (three days before, or the next day if sooner). Every
-- email carries a link that stops all reminders to that address. Rows are deleted 30 days after the
-- date they refer to, by the same job that sends the reminders.
--
-- RLS is on with no policy for anon or authenticated: only the service role (server) reads or
-- writes, as with 0011 and 0008. Disclosed in src/content/legal.ts in the same commit.

create table if not exists public.guest_reminders (
  id uuid primary key default gen_random_uuid(),
  -- Lower-cased by the application. Not a foreign key: the visitor has no account.
  email text not null check (length(email) between 5 and 254),
  kind text not null,
  -- The calendar day the notice states, and when we will send the reminder (a day, UTC).
  due_on date not null,
  remind_on date not null,
  label text not null check (length(label) between 1 and 80),
  -- Opaque, random, single purpose: confirms or stops this row's address. Never reused for anything.
  token text not null unique check (length(token) = 48),
  confirm_sent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  sent_at timestamptz,
  attempts integer not null default 0 check (attempts >= 0),
  claimed_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

-- One row per address, kind and date, so asking twice never doubles the email.
create unique index if not exists guest_reminders_once
  on public.guest_reminders (email, kind, due_on);

-- The delivery job's only query.
create index if not exists guest_reminders_due
  on public.guest_reminders (remind_on)
  where confirmed_at is not null and sent_at is null and unsubscribed_at is null;

-- "Stop all reminders to this address" and the open-reminders cap look rows up by address.
create index if not exists guest_reminders_email on public.guest_reminders (email);

alter table public.guest_reminders enable row level security;
revoke all on public.guest_reminders from anon, authenticated;
