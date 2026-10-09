import type { IPluginSettings, IStyleFlags } from "../settings";
import type { ILineBand } from "./geometry";
import type { ILineRange } from "./spec";
import { ATTR_STYLE, MAX_RANGES, MAX_SPEC_LENGTH, STYLE_ELEMENT_ID } from "../constants";
import { resolveStyleFlags, toRgba } from "../settings";
import { getBlockId, getCodeElement } from "./codeBlock";
import { measureBands } from "./geometry";
import { parseLineSpec } from "./spec";
import { splitCodeLines } from "./text";

const BLOCK_ID_PATTERN = /^[\w-]+$/;

/** 行号颜色规则，按块 id 维护，统一写入同一个 style 元素 */
const gutterRules = new Map<string, string>();
let gutterStyleElement: HTMLStyleElement | null = null;

const flushGutterRules = () => {
  if (gutterRules.size === 0) {
    gutterStyleElement?.remove();
    gutterStyleElement = null;
    return;
  }
  if (!gutterStyleElement) {
    gutterStyleElement = document.createElement("style");
    gutterStyleElement.id = STYLE_ELEMENT_ID;
    document.head.appendChild(gutterStyleElement);
  }
  gutterStyleElement.textContent = [...gutterRules.values()].join("\n");
};

/** 写入或移除某个代码块的行号颜色规则 */
export const setGutterRule = (blockId: string, css: string | null) => {
  if (!blockId || !BLOCK_ID_PATTERN.test(blockId)) {
    return;
  }
  if (!css) {
    if (gutterRules.delete(blockId)) {
      flushGutterRules();
    }
    return;
  }
  if (gutterRules.get(blockId) === css) {
    return;
  }
  gutterRules.set(blockId, css);
  flushGutterRules();
};

/** 清理已不在文档中的代码块对应的行号规则 */
export const pruneGutterRules = () => {
  let changed = false;
  for (const blockId of [...gutterRules.keys()]) {
    if (!document.querySelector(`.code-block[data-node-id="${blockId}"]`)) {
      gutterRules.delete(blockId);
      changed = true;
    }
  }
  if (changed) {
    flushGutterRules();
  }
};

/** 移除全部行号颜色规则与注入的 style 元素 */
export const clearGutterRules = () => {
  gutterRules.clear();
  flushGutterRules();
};

/** 生成让指定行号变色的选择器列表，作用范围限定在该代码块内 */
export const buildGutterRule = (blockId: string, ranges: ILineRange[], settings: IPluginSettings): string => {
  if (!BLOCK_ID_PATTERN.test(blockId) || ranges.length === 0) {
    return "";
  }
  const selectors = ranges.map(
    (range) =>
      `.code-block[data-node-id="${blockId}"] .protyle-linenumber__rows > span` +
      `:nth-child(n+${range.start}):nth-child(-n+${range.end})`,
  );
  const declarations = [`color: ${settings.gutterColor}`];
  if (settings.gutterBold) {
    declarations.push("font-weight: 600");
  }
  return `${selectors.join(",\n")} { ${declarations.join("; ")}; }`;
};

/** 由行带与样式开关生成背景图层参数 */
export interface IBackgroundLayers {
  images: string[];
  positions: string[];
  sizes: string[];
}

/**
 * 把行带合并成一条竖向渐变。
 * 所有行带共用一个图层，图层数量与行区间数量无关，避免出现上百个背景图层。
 */
const buildGradient = (color: string, bands: ILineBand[]): string => {
  const stops: string[] = [];
  let cursor = 0;
  for (const band of bands) {
    const top = Math.max(cursor, band.top);
    const bottom = Math.max(top, band.top + band.height);
    if (top > cursor) {
      stops.push(`transparent ${cursor.toFixed(2)}px ${top.toFixed(2)}px`);
    }
    stops.push(`${color} ${top.toFixed(2)}px ${bottom.toFixed(2)}px`);
    cursor = bottom;
  }
  stops.push(`transparent ${cursor.toFixed(2)}px 100%`);
  return `linear-gradient(to bottom, ${stops.join(", ")})`;
};

export const buildBackgroundLayers = (
  bands: ILineBand[],
  flags: IStyleFlags,
  settings: IPluginSettings,
): IBackgroundLayers => {
  if (bands.length === 0 || !flags.background) {
    return {
      images: [],
      positions: [],
      sizes: [],
    };
  }
  const images = [buildGradient(toRgba(settings.backgroundColor, settings.backgroundOpacity), bands)];
  return {
    images,
    positions: ["0 0"],
    sizes: ["100% 100%"],
  };
};

const clearBackground = (codeElement: HTMLElement) => {
  codeElement.style.backgroundImage = "";
  codeElement.style.backgroundPosition = "";
  codeElement.style.backgroundSize = "";
  codeElement.style.backgroundRepeat = "";
  codeElement.style.backgroundOrigin = "";
};

/** 仅在取值变化时写入，避免编辑过程中反复触发样式重算 */
const setStyle = (
  codeElement: HTMLElement,
  property: "backgroundImage" | "backgroundPosition" | "backgroundSize" | "backgroundRepeat" | "backgroundOrigin",
  value: string,
) => {
  if (codeElement.style[property] !== value) {
    codeElement.style[property] = value;
  }
};

/**
 * 用背景图层绘制整行背景。
 * 背景始终绘制在元素文字下方，不改动代码块内部结构，因此不会影响思源的序列化与光标。
 */
const applyBackground = (
  codeElement: HTMLElement,
  bands: ILineBand[],
  flags: IStyleFlags,
  settings: IPluginSettings,
) => {
  const layers = buildBackgroundLayers(bands, flags, settings);
  if (layers.images.length === 0) {
    clearBackground(codeElement);
    return;
  }
  setStyle(codeElement, "backgroundImage", layers.images.join(", "));
  setStyle(codeElement, "backgroundPosition", layers.positions.join(", "));
  setStyle(codeElement, "backgroundSize", layers.sizes.join(", "));
  setStyle(codeElement, "backgroundRepeat", "no-repeat");
  setStyle(codeElement, "backgroundOrigin", "border-box");
};

/** 清除某个代码块的全部高亮 */
export const clearBlock = (codeBlock: HTMLElement) => {
  const codeElement = getCodeElement(codeBlock);
  if (codeElement && codeElement.style.backgroundImage) {
    clearBackground(codeElement);
  }
  setGutterRule(getBlockId(codeBlock), null);
};

/** 按行区间规格为代码块绘制高亮 */
export const applyBlock = (codeBlock: HTMLElement, spec: string, settings: IPluginSettings) => {
  const codeElement = getCodeElement(codeBlock);
  // 异常长的取值直接忽略，避免解析与测量开销失控
  const ranges = spec && spec.length <= MAX_SPEC_LENGTH ? parseLineSpec(spec).slice(0, MAX_RANGES) : [];
  if (!codeElement || ranges.length === 0) {
    clearBlock(codeBlock);
    return;
  }
  const info = splitCodeLines(codeElement.textContent ?? "");
  const bands = measureBands(codeElement, info, ranges);
  if (bands.length === 0) {
    clearBlock(codeBlock);
    return;
  }
  const flags = resolveStyleFlags(codeBlock.getAttribute(ATTR_STYLE) ?? "", settings);
  applyBackground(codeElement, bands, flags, settings);
  const blockId = getBlockId(codeBlock);
  setGutterRule(blockId, flags.gutter ? buildGutterRule(blockId, ranges, settings) || null : null);
};
