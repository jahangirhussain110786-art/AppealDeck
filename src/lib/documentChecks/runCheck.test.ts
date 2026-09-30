import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { runDocumentCheck, isBrowserOnly, BROWSER_ONLY_EVIDENCE_KINDS } from "./runCheck";
import type { EvidenceKind } from "@/core";
import { MAX_CHECK_BYTES } from "./limits";

/**
 * A, 23 Sep 2026. The workspace stored every upload as `evidenceKind: "other"`, hardcoded, and this
 * module read that value back to decide whether a document may leave the device. So an identity
 * document attached to an identity requirement missed the browser-only branch entirely and was
 * base64-encoded into a request body.
 *
 * The caller now derives the kind from the requirement Amazon actually asked for. These tests pin
 * the routing decision itself, because it is the one decision here with a consequence that cannot
 * be taken back once it is wrong: a passport that has been transmitted has been transmitted.
 *
 * `fetch` is asserted rather than mocked away — "did this leave the device" is the question, and
 * the only honest way to answer it is to watch the wire.
 */
const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47]);
/** These tests are about the AI path; the reading on the device is tested in localReading.test.ts. */
const noDeviceReading = async () => null;

let fetchSpy: ReturnType<typeof vi.fn>;
/** What the two endpoints answer; a test overrides one to see how the client copes. */
let licenseAnswer: () => Promise<unknown>;
let readAnswer: () => Promise<unknown>;

/** The requests that carried a document. The licence question before them carries none. */
const documentCalls = () =>
  fetchSpy.mock.calls.filter(([url]) => String(url).includes("/api/read-document"));

beforeEach(() => {
  licenseAnswer = async () => ({ ok: true, status: 200, json: async () => ({ status: "active" }) });
  readAnswer = async () => ({
    ok: true,
    json: async () => ({ ok: true, check: { findings: [], summary: "" } }),
  });
  fetchSpy = vi.fn(async (url: string) =>
    String(url).includes("/api/license/status") ? licenseAnswer() : readAnswer(),
  );
  vi.stubGlobal("fetch", fetchSpy);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("document check routing", () => {
  it("never puts a browser-only document on the network", async () => {
    for (const evidenceKind of BROWSER_ONLY_EVIDENCE_KINDS) {
      fetchSpy.mockClear();
      const outcome = await runDocumentCheck({
        caseId: "case-1",
        kind: "VERIFICATION",
        evidenceKind,
        bytes: PNG,
        mimeType: "image/png",
      });
      expect(fetchSpy, evidenceKind).not.toHaveBeenCalled();
      // It still answers — an unavailable result is a result, silence is not.
      expect(["image", "unavailable"], evidenceKind).toContain(outcome.kind);
    }
  });

  /**
   * The specific defect. `"other"` was what every upload used to be stored as, and it is not
   * browser-only, so it took the network branch. It now stops here as well as on the server: an
   * unidentified document is never put on the wire in the first place.
   */
  it("does not send a document it cannot name", async () => {
    const outcome = await runDocumentCheck({
      caseId: "case-1",
      kind: "PRODUCT_SAFETY",
      evidenceKind: "other",
      bytes: PNG,
      mimeType: "image/png",
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(outcome.kind).toBe("unavailable");
    expect(outcome.kind === "unavailable" && outcome.message).toMatch(/not one of the document/i);
  });

  it("refuses an unreadable format without sending it", async () => {
    const outcome = await runDocumentCheck({
      caseId: "case-1",
      kind: "INAUTHENTIC_DOCUMENTS",
      evidenceKind: "supplier_invoice",
      bytes: PNG,
      mimeType: "application/msword" as never,
    });
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(outcome.kind).toBe("unavailable");
  });

  it("sends a named business document, and only that", async () => {
    const outcome = await runDocumentCheck({
      caseId: "case-1",
      kind: "INAUTHENTIC_DOCUMENTS",
      evidenceKind: "supplier_invoice",
      bytes: PNG,
      mimeType: "image/png",
    });
    expect(documentCalls()).toHaveLength(1);
    const body = JSON.parse(documentCalls()[0]![1].body as string);
    expect(body.evidenceKind).toBe("supplier_invoice");
    expect(outcome.kind).toBe("fields");
  });

  /**
   * 30 Sep 2026. The server refuses a file it may not read, but only after the whole file has
   * crossed the wire. A free account, or a Pass that covers another case, was posting up to 3 MB of
   * a seller's invoice to be told so. The client now asks first and sends nothing it knows will be
   * refused.
   */
  describe("asks whether the AI reading is available before sending a file", () => {
    const input = {
      caseId: "case-1",
      kind: "INAUTHENTIC" as const,
      evidenceKind: "supplier_invoice" as const,
      bytes: new Uint8Array(10),
      mimeType: "application/pdf",
    };

    it("sends nothing for a free account, and says the AI reading needs a Pass", async () => {
      licenseAnswer = async () => ({
        ok: true,
        status: 200,
        json: async () => ({ status: "none" }),
      });
      const outcome = await runDocumentCheck(input, noDeviceReading);
      expect(documentCalls()).toHaveLength(0);
      expect(outcome).toMatchObject({ kind: "unavailable" });
      expect((outcome as { message: string }).message).toMatch(
        /part of the Appeal Pass for this case/,
      );
      // Nothing was sent, so nothing may say it was.
      expect((outcome as { fileSent?: boolean }).fileSent).toBeUndefined();
    });

    it("asks about this case, so a Pass for another case does not count", async () => {
      await runDocumentCheck({ ...input, caseId: "case a/b" }, noDeviceReading);
      const asked = fetchSpy.mock.calls.find(([url]) =>
        String(url).includes("/api/license/status"),
      );
      expect(String(asked![0])).toContain("caseId=case%20a%2Fb");
    });

    it("sends nothing when the session has ended, and says to sign in", async () => {
      licenseAnswer = async () => ({ ok: false, status: 401, json: async () => ({}) });
      const outcome = await runDocumentCheck(input, noDeviceReading);
      expect(documentCalls()).toHaveLength(0);
      expect((outcome as { message: string }).message).toMatch(/needs you to be signed in/);
    });

    it("still sends when the question itself cannot be answered, since a paid seller must not be blocked", async () => {
      for (const answer of [
        async () => {
          throw new Error("offline");
        },
        async () => ({ ok: false, status: 503, json: async () => ({}) }),
        async () => ({ ok: true, status: 200, json: async () => ({ unexpected: true }) }),
      ] as const) {
        fetchSpy.mockClear();
        licenseAnswer = answer;
        await runDocumentCheck(input, noDeviceReading);
        expect(documentCalls()).toHaveLength(1);
      }
    });

    it("does not ask at all for a guest, or for a file it would not send", async () => {
      await runDocumentCheck({ ...input, signedIn: false }, noDeviceReading);
      await runDocumentCheck({ ...input, mimeType: "application/msword" }, noDeviceReading);
      await runDocumentCheck(
        { ...input, bytes: new Uint8Array(MAX_CHECK_BYTES + 1) },
        noDeviceReading,
      );
      expect(fetchSpy).not.toHaveBeenCalled();
    });
  });

  /**
   * 23 Sep 2026. A file over roughly 3.3 MB was base64-encoded past Vercel's 4.5 MB request limit;
   * the host answered with a page that is not JSON and the seller read only "We could not check that
   * document". The workspace accepts 10 MB, so this was an ordinary scanned invoice.
   */
  it("does not send a file too large for the host, and says why", async () => {
    const outcome = await runDocumentCheck(
      {
        caseId: "case-1",
        kind: "INAUTHENTIC",
        evidenceKind: "supplier_invoice",
        bytes: new Uint8Array(MAX_CHECK_BYTES + 1),
        mimeType: "application/pdf",
      },
      noDeviceReading,
    );
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(outcome).toMatchObject({ kind: "unavailable" });
    const message = (outcome as { message: string }).message;
    // The size, the limit, that nothing was lost, and what to do — in the same unit.
    expect(message).toContain("This file is 3.1 MB, and the AI reading takes files up to 3 MB.");
    expect(message).toContain("saved in your case");
  });

  it("still sends a file at the limit, whose request fits under the host's", async () => {
    await runDocumentCheck({
      caseId: "case-1",
      kind: "INAUTHENTIC",
      evidenceKind: "supplier_invoice",
      bytes: new Uint8Array(MAX_CHECK_BYTES),
      mimeType: "application/pdf",
    });
    expect(documentCalls()).toHaveLength(1);
    const sent = documentCalls()[0]![1].body as string;
    expect(sent.length).toBeLessThan(4_500_000);
  });

  it("names the case and sends the notice's identifiers for comparison", async () => {
    await runDocumentCheck({
      caseId: "case-1",
      kind: "INAUTHENTIC",
      evidenceKind: "supplier_invoice",
      bytes: new Uint8Array(10),
      mimeType: "application/pdf",
      caseData: { asins: ["B0ABCDEF12"], referenceIds: [] },
    });
    const sent = JSON.parse(documentCalls()[0]![1].body as string);
    expect(sent.caseId).toBe("case-1");
    expect(sent.context).toEqual({ asins: ["B0ABCDEF12"], referenceIds: [] });
  });

  it("explains a rejection by the host rather than calling it a failed check", async () => {
    readAnswer = async () => ({
      ok: false,
      status: 413,
      json: async () => {
        throw new SyntaxError("Unexpected token 'R'");
      },
    });
    const outcome = await runDocumentCheck(
      {
        caseId: "case-1",
        kind: "INAUTHENTIC",
        evidenceKind: "supplier_invoice",
        bytes: PNG,
        mimeType: "image/png",
      },
      noDeviceReading,
    );
    expect((outcome as { message: string }).message).toMatch(/AI reading takes files up to 3 MB/);
  });

  it("agrees with the server about which kinds are browser-only", async () => {
    // Not a restatement of the same constant: this asserts the two modules' lists match, which is
    // what the old header claimed was true "by construction" while they quietly diverged in effect.
    const route = await import("@/app/api/read-document/route");
    expect([...route.BROWSER_ONLY_EVIDENCE_KINDS].sort()).toEqual(
      [...BROWSER_ONLY_EVIDENCE_KINDS].sort(),
    );
    for (const k of route.BROWSER_ONLY_EVIDENCE_KINDS) {
      expect(isBrowserOnly(k as EvidenceKind), k).toBe(true);
    }
  });
});
