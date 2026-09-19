import { describe, expect, it } from "vitest";
import { withDraftValue, withoutDraftKeys } from "./workspaceDraft";

describe("workspaceDraft", () => {
  it("adds a draft value and drops the map once every key is removed", () => {
    const withOne = withDraftValue(undefined, "request.notice", "hello");
    expect(withOne).toEqual({ "request.notice": "hello" });
    expect(withDraftValue(withOne, "request.notice", undefined)).toBeUndefined();
  });

  it("treats an empty string the same as clearing the key", () => {
    const draft = withDraftValue({ "a.b": "x" }, "a.b", "");
    expect(draft).toBeUndefined();
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
});
