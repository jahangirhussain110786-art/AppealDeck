// Re-exports a single non-gated fixture for the "Try a sample notice" button on /decode.
// policy-1 is classified POLICY (severityGated=false) so the sample shows the full reveal.
import { FIXTURES } from "@/core/fixtures";

export const SAMPLE_NOTICE_ID = "policy-1";

const sample = FIXTURES.find((f) => f.id === SAMPLE_NOTICE_ID);
if (!sample) {
  throw new Error(`Sample notice fixture "${SAMPLE_NOTICE_ID}" is missing from FIXTURES`);
}

export const SAMPLE_NOTICE_TEXT: string = sample.raw;
