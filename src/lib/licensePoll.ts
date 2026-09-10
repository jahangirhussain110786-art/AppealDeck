export interface LicensePollResult {
  status: string;
  plan: string | null;
}

export interface PollLicenseOptions {
  fetchImpl?: typeof fetch;
  intervalMs?: number;
  timeoutMs?: number;
  sleep?: (ms: number) => Promise<void>;
}

export class LicensePollTimeoutError extends Error {
  constructor() {
    super("License activation timed out");
    this.name = "LicensePollTimeoutError";
  }
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * Polls GET /api/license/status until the license is active, or throws
 * LicensePollTimeoutError after timeoutMs. The webhook stays the only writer
 * of license state — this only ever reads.
 */
export async function pollLicenseStatus(
  options: PollLicenseOptions = {},
): Promise<LicensePollResult> {
  const {
    fetchImpl = fetch,
    intervalMs = 3_000,
    timeoutMs = 90_000,
    sleep = defaultSleep,
  } = options;

  const deadline = Date.now() + timeoutMs;
  for (;;) {
    const res = await fetchImpl("/api/license/status", { cache: "no-store" });
    if (res.ok) {
      const data = (await res.json()) as LicensePollResult;
      if (data.status === "active") return data;
    }
    if (Date.now() + intervalMs > deadline) {
      throw new LicensePollTimeoutError();
    }
    await sleep(intervalMs);
  }
}
