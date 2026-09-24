import { describe, expect, it } from "vitest";
import {
  withDraftValue,
  withoutDraftKeys,
  answerDraftKey,
  migrateAnswerDrafts,
  responseDraftKeys,
} from "./workspaceDraft";
import { newWorkspace } from "@/core/workspace";
import { WorkspaceSchema } from "./workspaceSchema";

describe("workspaceDraft", () => {
  it("adds a draft value and drops the map once every key is removed", () => {
    const withOne = withDraftValue(undefined, "request.notice", "hello");
    expect(withOne).toEqual({ "request.notice": "hello" });
    expect(withDraftValue(withOne, "request.notice", undefined)).toBeUndefined();
  });

  it("preserves an intentional blank so reopening does not restore the saved text", () => {
    const draft = withDraftValue({ "a.b": "x" }, "a.b", "");
    expect(draft?.["a.b"] ?? "old saved text").toBe("");
  });

  it("removes only the requested keys and keeps the rest", () => {
    const draft = { "response.explanation": "x", "response.correctiveActions": "y" };
    expect(withoutDraftKeys(draft, ["response.explanation"])).toEqual({
      "response.correctiveActions": "y",
    });
  });

  it("returns undefined once the last remaining key is stripped", () => {
    const draft = { "history.replyText": "x" };
    expect(withoutDraftKeys(draft, ["history.replyText"])).toBeUndefined();
  });

  it("passes an undefined draft through unchanged", () => {
    expect(withoutDraftKeys(undefined, ["a"])).toBeUndefined();
  });

  it("migrates positional answers to their original questions before a form can change", () => {
    const first = "What caused the late shipments?";
    const second = "What have you changed to prevent this?";
    const w = {
      ...newWorkspace(),
      protocol: "questionnaire" as const,
      formInstructions: `${first}\n${second}`,
      draft: { "response.answer.0": "Carrier missed collection", "response.answer.1": "" },
    };
    const draft = migrateAnswerDrafts(w);
    expect(draft).toEqual({
      [answerDraftKey(first)]: "Carrier missed collection",
      [answerDraftKey(second)]: "",
    });
    expect(draft?.[answerDraftKey("What records can you supply?")]).toBeUndefined();
    expect(migrateAnswerDrafts({ ...w, draft, formInstructions: `${second}\n${first}` })).toEqual(
      draft,
    );
    expect(withoutDraftKeys(draft, responseDraftKeys([second]))).toEqual({
      [answerDraftKey(first)]: "Carrier missed collection",
    });
  });

  it("accepts drafts for a full questionnaire and its evidence notes", () => {
    const draft = Object.fromEntries(
      Array.from({ length: 50 }, (_, i) => [
        answerDraftKey(`${"x".repeat(480)} ${i}?`),
        "An answer",
      ]),
    );
    expect(WorkspaceSchema.safeParse({ ...newWorkspace(), draft }).success).toBe(true);
  });
});
