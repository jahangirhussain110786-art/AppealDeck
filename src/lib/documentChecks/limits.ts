/**
 * How large a document the server can read, shared by the client that sends it and the route that
 * receives it so the two cannot drift apart.
 *
 * Set 23 Sep 2026. The workspace accepts files up to 10 MB, which is right for storing them — they
 * stay on the seller's device. Reading one sends it to `/api/read-document` as base64, and Vercel
 * rejects any request body over 4.5 MB before our code runs, with a response that is not JSON. So
 * anything above roughly 3.3 MB failed with "We could not check that document" and no reason, and
 * the route's own 9.5 MB limit — sized for the upstream model, not the host — was never reached.
 *
 * 3 MB of file is 4 MB of base64, which leaves room for the rest of the request. Most scanned
 * invoices fit easily; a large one can be re-saved at a lower resolution or cut to the pages
 * Amazon asks about.
 */
export const MAX_CHECK_BYTES = 3_000_000;

/** The base64 length of the largest file we read. Every 3 bytes become 4 characters. */
export const MAX_CHECK_BASE64_CHARS = Math.ceil(MAX_CHECK_BYTES / 3) * 4;
