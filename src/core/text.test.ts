import { describe, expect, it } from "vitest";
import { splitCodeLines } from "./text";

describe("splitCodeLines", () => {
  it("keeps the offsets of every line", () => {
    expect(splitCodeLines("a\nbb\n\nc\n")).toEqual({
      lines: ["a", "bb", "", "c"],
      starts: [0, 2, 5, 6],
      ends: [1, 4, 5, 7],
    });
  });

  it("handles CRLF", () => {
    expect(splitCodeLines("a\r\nb")).toEqual({
      lines: ["a", "b"],
      starts: [0, 3],
      ends: [1, 4],
    });
  });

  it("handles a single line without trailing newline", () => {
    expect(splitCodeLines("only")).toEqual({
      lines: ["only"],
      starts: [0],
      ends: [4],
    });
  });

  it("handles empty content", () => {
    expect(splitCodeLines("")).toEqual({
      lines: [""],
      starts: [0],
      ends: [0],
    });
  });
});
