import { describe, expect, it, vi, beforeEach } from "vitest";

const getApiUserMock = vi.fn();
const fetchLicenseForUserMock = vi.fn();
const fetchDocumentReviewMock = vi.fn();
const fetchSingleResponseMock = vi.fn();

vi.mock("@/lib/auth", () => ({
  getApiUser: () => getApiUserMock(),
  unauthorizedJsonResponse: () =>
    new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 }),
}));

vi.mock("@/lib/license", () => ({
  fetchLicenseForUser: (...args: unknown[]) => fetchLicenseForUserMock(...args),
  fetchDocumentReview: (...args: unknown[]) => fetchDocumentReviewMock(...args),
  fetchSingleResponse: (...args: unknown[]) => fetchSingleResponseMock(...args),
}));

import { GET } from "../license/status/route";

beforeEach(() => {
  getApiUserMock.mockReset();
  fetchLicenseForUserMock.mockReset();
  fetchDocumentReviewMock.mockReset();
  fetchDocumentReviewMock.mockResolvedValue(false);
  fetchSingleResponseMock.mockReset();
  fetchSingleResponseMock.mockResolvedValue(false);
});

describe("GET /api/license/status", () => {
  it("returns 401 JSON when unauthenticated", async () => {
    getApiUserMock.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("returns the typed license summary when signed in", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    fetchLicenseForUserMock.mockResolvedValue({
      status: "active",
      plan: "appeal-pass",
      licenseKey: "key-1",
    });
    const res = await GET();
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-store");
    const body = await res.json();
    expect(body).toEqual({
      status: "active",
      plan: "appeal-pass",
      expiresAt: null,
      hasReview: false,
      single: false,
    });
  });

  it("tells the page when an Account Pass ends, and never exposes the licence key", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    fetchLicenseForUserMock.mockResolvedValue({
      status: "active",
      plan: "account_pass",
      licenseKey: "AD-SECRET",
      expiresAt: "2027-10-22T10:00:00.000Z",
    });
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({
      status: "active",
      plan: "account_pass",
      expiresAt: "2027-10-22T10:00:00.000Z",
      hasReview: false,
      single: false,
    });
    expect(JSON.stringify(body)).not.toContain("AD-SECRET");
  });

  it("returns status none when signed in with no license", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    fetchLicenseForUserMock.mockResolvedValue({ status: "none", plan: null, licenseKey: null });
    const res = await GET();
    const body = await res.json();
    expect(body).toEqual({
      status: "none",
      plan: null,
      expiresAt: null,
      hasReview: false,
      single: false,
    });
  });
});

describe("GET /api/license/status for a case's document review (22 Oct 2026)", () => {
  const get = (query: string) =>
    GET(new Request("http://localhost:3000/api/license/status" + query));
  const signedIn = () =>
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });

  it("says whether the case has a review, so the page can show the credited price", async () => {
    signedIn();
    fetchLicenseForUserMock.mockResolvedValue({ status: "none", plan: null });
    fetchDocumentReviewMock.mockResolvedValue(true);
    const body = await (await get("?caseId=c1")).json();
    expect(body).toEqual({
      status: "none",
      plan: null,
      expiresAt: null,
      hasReview: true,
      single: false,
    });
    expect(fetchDocumentReviewMock).toHaveBeenCalledWith("u1", "c1");
  });

  it("does not call a review a Pass when asked whether a response may be prepared", async () => {
    signedIn();
    fetchLicenseForUserMock.mockResolvedValue({ status: "none", plan: null });
    fetchDocumentReviewMock.mockResolvedValue(true);
    const body = await (await get("?caseId=c1")).json();
    expect(body.status).toBe("none");
  });

  it("lets the AI read the case's documents when asked for documents and a review exists", async () => {
    signedIn();
    fetchLicenseForUserMock.mockResolvedValue({ status: "none", plan: null });
    fetchDocumentReviewMock.mockResolvedValue(true);
    const body = await (await get("?caseId=c1&for=documents")).json();
    expect(body).toMatchObject({ status: "active", plan: "document_review" });
  });

  it("does not let the AI read when asked for documents and there is neither a Pass nor a review", async () => {
    signedIn();
    fetchLicenseForUserMock.mockResolvedValue({ status: "none", plan: null });
    fetchDocumentReviewMock.mockResolvedValue(false);
    const body = await (await get("?caseId=c1&for=documents")).json();
    expect(body.status).toBe("none");
  });

  it("keeps the Pass's own answer when asked for documents and the case has a Pass", async () => {
    signedIn();
    fetchLicenseForUserMock.mockResolvedValue({ status: "active", plan: "appeal_pass" });
    fetchDocumentReviewMock.mockResolvedValue(true);
    const body = await (await get("?caseId=c1&for=documents")).json();
    expect(body).toMatchObject({ status: "active", plan: "appeal_pass" });
  });

  it("never asks about a review without a case", async () => {
    signedIn();
    fetchLicenseForUserMock.mockResolvedValue({ status: "none", plan: null });
    await get("?for=documents");
    expect(fetchDocumentReviewMock).not.toHaveBeenCalled();
  });

  it("answers 503 when the review lookup fails", async () => {
    signedIn();
    fetchLicenseForUserMock.mockResolvedValue({ status: "none", plan: null });
    fetchDocumentReviewMock.mockRejectedValue(new Error("down"));
    expect((await get("?caseId=c1")).status).toBe(503);
  });
});

describe("GET /api/license/status failure handling (6 Oct 2026)", () => {
  it("answers 503 when the lookup throws", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    fetchLicenseForUserMock.mockRejectedValue(new Error("License lookup unavailable"));
    const res = await GET();
    expect(res.status).toBe(503);
  });
});

describe("GET /api/license/status for a case's One Response (23 Oct 2026)", () => {
  it("reports it as its own flag and never as a Pass", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    fetchLicenseForUserMock.mockResolvedValue({ status: "none", plan: null });
    fetchSingleResponseMock.mockResolvedValue(true);
    const body = await (await GET(new Request("http://x/api/license/status?caseId=c1"))).json();
    expect(body).toMatchObject({ status: "none", single: true });
    expect(fetchSingleResponseMock).toHaveBeenCalledWith("u1", "c1");
  });

  it("lets the AI read the case's documents, which it includes", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    fetchLicenseForUserMock.mockResolvedValue({ status: "none", plan: null });
    fetchSingleResponseMock.mockResolvedValue(true);
    const body = await (
      await GET(new Request("http://x/api/license/status?caseId=c1&for=documents"))
    ).json();
    expect(body).toMatchObject({ status: "active", plan: "single_response", single: true });
  });

  it("asks about no case when none is named", async () => {
    getApiUserMock.mockResolvedValue({ id: "u1", email: "seller@example.com" });
    fetchLicenseForUserMock.mockResolvedValue({ status: "none", plan: null });
    const body = await (await GET(new Request("http://x/api/license/status"))).json();
    expect(body.single).toBe(false);
    expect(fetchSingleResponseMock).not.toHaveBeenCalled();
  });
});
