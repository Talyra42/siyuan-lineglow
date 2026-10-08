import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "../settings";
import { buildBackgroundLayers, buildGutterRule } from "./render";

const bands = [
  { top: 10, height: 20 },
  { top: 50.5, height: 20 },
];

describe("buildBackgroundLayers", () => {
  it("collapses every band into a single gradient layer", () => {
    const layers = buildBackgroundLayers(bands, { background: true, gutter: true }, DEFAULT_SETTINGS);
    // 图层数量与行带数量无关，永远只有一层
    expect(layers.images).toHaveLength(1);
    expect(layers.positions).toEqual(["0 0"]);
    expect(layers.sizes).toEqual(["100% 100%"]);
    expect(layers.images[0]).toBe(
      "linear-gradient(to bottom, transparent 0.00px 10.00px, "
      + "rgba(53, 117, 240, 0.16) 10.00px 30.00px, transparent 30.00px 50.50px, "
      + "rgba(53, 117, 240, 0.16) 50.50px 70.50px, transparent 70.50px 100%)",
    );
  });

  it("emits nothing when the background is disabled or there is no band", () => {
    const layers = buildBackgroundLayers(bands, { background: false, gutter: true }, DEFAULT_SETTINGS);
    expect(layers.images).toEqual([]);
    expect(buildBackgroundLayers([], { background: true, gutter: true }, DEFAULT_SETTINGS).images).toEqual([]);
  });

  it("uses the configured color and opacity", () => {
    const layers = buildBackgroundLayers(
      [bands[0]],
      { background: true, gutter: false },
      { ...DEFAULT_SETTINGS, backgroundColor: "#ff0000", backgroundOpacity: 0.5 },
    );
    expect(layers.images[0]).toContain("rgba(255, 0, 0, 0.5)");
    expect(layers.sizes).toEqual(["100% 100%"]);
  });

  it("keeps a single layer regardless of the band count", () => {
    const many = Array.from({ length: 500 }, (_, index) => ({ top: index * 20, height: 10 }));
    const layers = buildBackgroundLayers(many, { background: true, gutter: true }, DEFAULT_SETTINGS);
    expect(layers.images).toHaveLength(1);
  });
});

describe("buildGutterRule", () => {
  it("scopes the rule to the code block and uses nth-child ranges", () => {
    const css = buildGutterRule(
      "20240101120000-abcdefg",
      [{ start: 1, end: 1 }, { start: 3, end: 5 }],
      DEFAULT_SETTINGS,
    );
    expect(css).toContain('.code-block[data-node-id="20240101120000-abcdefg"] .protyle-linenumber__rows > span:nth-child(n+1):nth-child(-n+1)');
    expect(css).toContain(":nth-child(n+3):nth-child(-n+5)");
    expect(css).toContain(`color: ${DEFAULT_SETTINGS.gutterColor}`);
    expect(css).not.toContain("font-weight");
  });

  it("bolds the line numbers when configured", () => {
    const css = buildGutterRule(
      "20240101120000-abcdefg",
      [{ start: 2, end: 4 }],
      { ...DEFAULT_SETTINGS, gutterBold: true },
    );
    expect(css).toContain("font-weight: 600");
  });

  it("returns an empty rule for unusable input", () => {
    expect(buildGutterRule("bad id\"", [{ start: 1, end: 1 }], DEFAULT_SETTINGS)).toBe("");
    expect(buildGutterRule("20240101120000-abcdefg", [], DEFAULT_SETTINGS)).toBe("");
  });
});
