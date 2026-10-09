import { describe, expect, it } from "vitest";
import { formatLineSpec, mergeRanges, parseLineSpec } from "./spec";

describe("parseLineSpec", () => {
  it("parses single lines and ranges", () => {
    expect(parseLineSpec("1,3-5")).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 5 },
    ]);
  });

  it("normalizes reversed ranges", () => {
    expect(parseLineSpec("5-3")).toEqual([{ start: 3, end: 5 }]);
  });

  it("merges adjacent and overlapping ranges", () => {
    expect(parseLineSpec("1,2,3")).toEqual([{ start: 1, end: 3 }]);
    expect(parseLineSpec("1-4,3-6")).toEqual([{ start: 1, end: 6 }]);
    expect(parseLineSpec("1-2,4")).toEqual([
      { start: 1, end: 2 },
      { start: 4, end: 4 },
    ]);
  });

  it("ignores unparsable tokens", () => {
    expect(parseLineSpec("abc,0,-3,")).toEqual([]);
    expect(parseLineSpec("")).toEqual([]);
  });

  it("tolerates spaces", () => {
    expect(parseLineSpec(" 1 , 3 - 5 ")).toEqual([
      { start: 1, end: 1 },
      { start: 3, end: 5 },
    ]);
  });
});

describe("mergeRanges", () => {
  it("sorts by start line", () => {
    expect(
      mergeRanges([
        { start: 5, end: 6 },
        { start: 1, end: 2 },
      ]),
    ).toEqual([
      { start: 1, end: 2 },
      { start: 5, end: 6 },
    ]);
  });
});

describe("formatLineSpec", () => {
  it("renders ranges back to the VitePress syntax", () => {
    expect(
      formatLineSpec([
        { start: 1, end: 1 },
        { start: 3, end: 5 },
      ]),
    ).toBe("1,3-5");
    expect(formatLineSpec([])).toBe("");
  });
});
