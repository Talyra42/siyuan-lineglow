import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS, normalizeSettings, resolveStyleFlags, toRgba } from "./settings";

describe("resolveStyleFlags", () => {
  it("falls back to the global settings", () => {
    expect(resolveStyleFlags("", DEFAULT_SETTINGS))
      .toEqual({ background: true, leftBar: false, gutter: true });
  });

  it("applies on and off tokens", () => {
    expect(resolveStyleFlags("bar,num,no-bg", DEFAULT_SETTINGS))
      .toEqual({ background: false, leftBar: true, gutter: true });
  });

  it("supports all and none", () => {
    const off = { ...DEFAULT_SETTINGS, background: false, leftBar: false, gutter: false };
    expect(resolveStyleFlags("all", off)).toEqual({ background: true, leftBar: true, gutter: true });
    expect(resolveStyleFlags("none", DEFAULT_SETTINGS))
      .toEqual({ background: false, leftBar: false, gutter: false });
  });

  it("ignores unknown tokens", () => {
    expect(resolveStyleFlags("whatever", DEFAULT_SETTINGS))
      .toEqual({ background: true, leftBar: false, gutter: true });
  });
});

describe("normalizeSettings", () => {
  it("clamps the opacity", () => {
    expect(normalizeSettings({ backgroundOpacity: 5 }).backgroundOpacity).toBe(1);
    expect(normalizeSettings({ backgroundOpacity: -1 }).backgroundOpacity).toBe(0);
  });

  it("rejects colors that are not hex", () => {
    expect(normalizeSettings({ backgroundColor: "red" }).backgroundColor).toBe(DEFAULT_SETTINGS.backgroundColor);
    expect(normalizeSettings({ backgroundColor: "#AbC" }).backgroundColor).toBe("#AbC");
  });

  it("keeps booleans and falls back for missing values", () => {
    expect(normalizeSettings({ enabled: false }).enabled).toBe(false);
    expect(normalizeSettings({}).enabled).toBe(DEFAULT_SETTINGS.enabled);
    expect(normalizeSettings(null).leftBarWidth).toBe(DEFAULT_SETTINGS.leftBarWidth);
  });
});

describe("toRgba", () => {
  it("expands short hex colors", () => {
    expect(toRgba("#abc", 0.5)).toBe("rgba(170, 187, 204, 0.5)");
  });

  it("converts full hex colors", () => {
    expect(toRgba("#3575f0", 0.16)).toBe("rgba(53, 117, 240, 0.16)");
  });
});
