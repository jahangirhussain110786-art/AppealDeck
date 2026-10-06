import { describe, expect, it } from "vitest";
import { extractJsonObject } from "../extractJson";

describe("extractJsonObject", () => {
  it("reads plain JSON and a fenced block", () => {
    expect(extractJsonObject('{"a":1}')).toEqual({ a: 1 });
    expect(extractJsonObject('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it("ignores trailing prose that holds a brace", () => {
    expect(extractJsonObject('{"text":"ok"}\nNote: I kept the {original} order.')).toEqual({
      text: "ok",
    });
  });

  it("ignores leading prose with a brace and braces inside strings", () => {
    expect(extractJsonObject('Here {is} it: {"text":"a } b { c"}')).toEqual({ text: "a } b { c" });
  });

  it("returns undefined when there is no object", () => {
    expect(extractJsonObject("no json here")).toBeUndefined();
    expect(extractJsonObject('{"unterminated": ')).toBeUndefined();
  });
});
