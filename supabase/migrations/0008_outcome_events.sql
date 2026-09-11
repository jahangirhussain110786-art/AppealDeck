-- 0008_outcome_events.sql
-- EF-5 opt-in outcome-loop schema (04-EVIDENCE-FIRST-HARDENING.md §EF-5, AA-21's AI-owned half).
-- Added 11 Sep 2026 — see docs/handoffs/2026-09-11-full-repo-audit-guidebook.md Section B1.
--
-- Deliberately has NO email, name, user id, case id, or free-text column — nothing here can be
-- traced back to a person or a specific case even if the table were fully exported. Rows are
-- aggregate-analytics data only, never per-user reporting, per the spec's own instruction.
-- RLS enabled: only the service_role key (server-side admin client, via POST /api/outcome) may
-- write; no anon/authenticated read or write policy exists, matching 0001_licenses.sql's pattern.

CREATE TABLE IF NOT EXISTS public.outcome_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  marketplace text NOT NULL DEFAULT 'unknown',
  doc_type text NOT NULL,
  attempts integer NOT NULL CHECK (attempts >= 1),
  readiness_at_submit integer NOT NULL CHECK (readiness_at_submit BETWEEN 0 AND 100),
  outcome text NOT NULL CHECK (outcome IN ('approved', 'rejected', 'no_response', 'withdrawn')),
  days_to_outcome integer NOT NULL CHECK (days_to_outcome >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS outcome_events_kind_idx ON public.outcome_events (kind);
CREATE INDEX IF NOT EXISTS outcome_events_outcome_idx ON public.outcome_events (outcome);
CREATE INDEX IF NOT EXISTS outcome_events_created_at_idx ON public.outcome_events (created_at);

ALTER TABLE public.outcome_events ENABLE ROW LEVEL SECURITY;
