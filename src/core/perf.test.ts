import { describe, expect, it } from "vitest";
import { MAX_RANGES } from "../constants";
import { DEFAULT_SETTINGS } from "../settings";
import { buildBackgroundLayers } from "./render";
import { parseLineSpec } from "./spec";
import { splitCodeLines } from "./text";

const timeOf = (run: () => void) => {
  const started = performance.now();
  run();
  return performance.now() - started;
};

describe("performance guardrails", () => {
  it("parses a pathological line list quickly", () => {
    const spec = Array.from({ length: 2000 }, (_, index) => `${index * 2 + 1}`).join(",");
    let ranges = 0;
    const ms = timeOf(() => {
      ranges = parseLineSpec(spec).length;
    });
    console.log(`[perf] parse 2000 ranges: ${ms.toFixed(1)}ms, spec ${spec.length} chars`);
    expect(ranges).toBe(2000);
    expect(ms).toBeLessThan(250);
  });

  it("splits a large code block quickly", () => {
    const text = Array.from({ length: 20_000 }, (_, index) => `const value${index} = ${index};`).join("\n");
    let lines = 0;
    const ms = timeOf(() => {
      lines = splitCodeLines(text).lines.length;
    });
    console.log(`[perf] split 20000 lines (${(text.length / 1024).toFixed(0)} KiB): ${ms.toFixed(1)}ms`);
    expect(lines).toBe(20_000);
    expect(ms).toBeLessThan(400);
  });

  it("keeps the generated style string bounded at the range cap", () => {
    const bands = Array.from({ length: MAX_RANGES }, (_, index) => ({
      top: index * 22.5,
      height: 22.5,
    }));
    const layers = buildBackgroundLayers(bands, { background: true, gutter: true }, DEFAULT_SETTINGS);
    const styleLength = layers.images.join(", ").length + layers.positions.join(", ").length
      + layers.sizes.join(", ").length;
    console.log(`[perf] style length at ${MAX_RANGES} ranges: ${styleLength} chars`);
    // 行带合并进单条渐变，图层数量恒定
    expect(layers.images).toHaveLength(1);
    expect(styleLength).toBeLessThan(40_000);
  });

  it("caps the spec length so that absurd values are ignored", () => {
    const spec = "1-999999,".repeat(2000);
    console.log(`[perf] oversized spec: ${spec.length} chars`);
    expect(spec.length).toBeGreaterThan(4096);
    expect(parseLineSpec(spec).length).toBe(1);
  });
});
