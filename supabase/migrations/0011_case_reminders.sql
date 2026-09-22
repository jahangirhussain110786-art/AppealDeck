-- 0011_case_reminders.sql
-- AA-40 (AM-26): the clock speaks first — server-side rows so a follow-up date can actually reach
-- a seller who is not on the site. Added 22 Sep 2026.
--
-- WHY A SERVER TABLE AT ALL, given the local-first design:
-- the case file lives in the seller's encrypted browser vault, so the server has no idea a
-- follow-up date exists. Email is the only channel that reaches someone who is not here, and an
-- email cannot be sent from a device that is closed. AM-26 point 4 authorises this explicitly.
--
-- WHAT IS DELIBERATELY NOT HERE:
-- no notice text, no evidence, no draft, no case content of any kind, and no free text. A row is
-- a due date plus a coarse violation kind. `case_ref` is the vault's own opaque local case id --
-- meaningless without the seller's vault -- and exists only so a seller with several cases gets
-- one row per case instead of one row total.
--
-- This is opt-in per case (see /api/reminders) and is disclosed in src/content/legal.ts, updated
-- in the same commit that adds this table.
--
-- RLS enabled with no anon/authenticated policy: only the service_role key (server-side admin
-- client) may read or write, matching 0001_licenses.sql and 0008_outcome_events.sql.

CREATE TABLE IF NOT EXISTS public.case_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  -- Opaque case id from the seller's own vault. Not a foreign key: the case itself never
  -- leaves the device, so there is nothing here to reference.
  case_ref text NOT NULL,
  kind text NOT NULL,
  due_at timestamptz NOT NULL,
  sent_at timestamptz,
  -- Set when delivery failed, so a permanently broken address stops being retried forever.
  attempts integer NOT NULL DEFAULT 0 CHECK (attempts >= 0),
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One live reminder per case per seller. Re-setting the date updates the row rather than
-- accumulating duplicates that would each send their own email.
CREATE UNIQUE INDEX IF NOT EXISTS case_reminders_user_case_idx
  ON public.case_reminders (user_id, case_ref);

-- The cron job's only query: unsent rows whose time has come.
CREATE INDEX IF NOT EXISTS case_reminders_due_idx
  ON public.case_reminders (due_at)
  WHERE sent_at IS NULL;

ALTER TABLE public.case_reminders ENABLE ROW LEVEL SECURITY;
