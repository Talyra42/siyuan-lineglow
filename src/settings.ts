/** 插件全局设置 */
export interface IPluginSettings {
  /** 总开关 */
  enabled: boolean;
  /** 是否绘制整行背景 */
  background: boolean;
  /** 整行背景色 */
  backgroundColor: string;
  /** 整行背景不透明度 */
  backgroundOpacity: number;
  /** 是否绘制左侧竖条 */
  leftBar: boolean;
  /** 左侧竖条颜色 */
  leftBarColor: string;
  /** 左侧竖条宽度（px） */
  leftBarWidth: number;
  /** 是否让行号随之变色 */
  gutter: boolean;
  /** 行号高亮颜色 */
  gutterColor: string;
  /** 行号是否加粗 */
  gutterBold: boolean;
}

/** 单个代码块实际生效的样式开关 */
export interface IStyleFlags {
  background: boolean;
  leftBar: boolean;
  gutter: boolean;
}

export const DEFAULT_SETTINGS: IPluginSettings = {
  enabled: true,
  background: true,
  backgroundColor: "#3575f0",
  backgroundOpacity: 0.16,
  // 左侧竖条可单独开启，默认关闭，避免在默认主题下与代码块边距叠加出双线观感
  leftBar: false,
  leftBarColor: "#3575f0",
  leftBarWidth: 3,
  gutter: true,
  gutterColor: "#3575f0",
  gutterBold: false,
};

const HEX_COLOR = /^#(?:[\da-f]{3}|[\da-f]{6})$/i;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const normalizeColor = (value: unknown, fallback: string) =>
  typeof value === "string" && HEX_COLOR.test(value.trim()) ? value.trim() : fallback;

const normalizeBool = (value: unknown, fallback: boolean) =>
  typeof value === "boolean" ? value : fallback;

const normalizeNumber = (value: unknown, fallback: number, min: number, max: number) => {
  const num = typeof value === "number" ? value : Number.parseFloat(String(value));
  return Number.isFinite(num) ? clamp(num, min, max) : fallback;
};

/** 合并并校正外部读入的设置，保证取值始终合法 */
export function normalizeSettings(raw: unknown): IPluginSettings {
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  return {
    enabled: normalizeBool(data.enabled, DEFAULT_SETTINGS.enabled),
    background: normalizeBool(data.background, DEFAULT_SETTINGS.background),
    backgroundColor: normalizeColor(data.backgroundColor, DEFAULT_SETTINGS.backgroundColor),
    backgroundOpacity: normalizeNumber(data.backgroundOpacity, DEFAULT_SETTINGS.backgroundOpacity, 0, 1),
    leftBar: normalizeBool(data.leftBar, DEFAULT_SETTINGS.leftBar),
    leftBarColor: normalizeColor(data.leftBarColor, DEFAULT_SETTINGS.leftBarColor),
    leftBarWidth: normalizeNumber(data.leftBarWidth, DEFAULT_SETTINGS.leftBarWidth, 1, 16),
    gutter: normalizeBool(data.gutter, DEFAULT_SETTINGS.gutter),
    gutterColor: normalizeColor(data.gutterColor, DEFAULT_SETTINGS.gutterColor),
    gutterBold: normalizeBool(data.gutterBold, DEFAULT_SETTINGS.gutterBold),
  };
}

const STYLE_ON: Record<string, keyof IStyleFlags> = {
  bg: "background",
  background: "background",
  bar: "leftBar",
  num: "gutter",
  gutter: "gutter",
};

const STYLE_OFF: Record<string, keyof IStyleFlags> = {
  "no-bg": "background",
  "no-background": "background",
  "no-bar": "leftBar",
  "no-num": "gutter",
  "no-gutter": "gutter",
};

/**
 * 解析代码块上的样式覆盖属性，得到该块最终生效的样式开关。
 * 未书写任何标记时全部沿用插件全局设置；`all`/`none` 可整体开启或关闭。
 */
export function resolveStyleFlags(attrValue: string, settings: IPluginSettings): IStyleFlags {
  const flags: IStyleFlags = {
    background: settings.background,
    leftBar: settings.leftBar,
    gutter: settings.gutter,
  };
  const tokens = attrValue.split(",").map(token => token.trim().toLowerCase()).filter(Boolean);
  for (const token of tokens) {
    if (token === "all") {
      flags.background = true;
      flags.leftBar = true;
      flags.gutter = true;
      continue;
    }
    if (token === "none") {
      flags.background = false;
      flags.leftBar = false;
      flags.gutter = false;
      continue;
    }
    const offKey = STYLE_OFF[token];
    if (offKey) {
      flags[offKey] = false;
      continue;
    }
    const onKey = STYLE_ON[token];
    if (onKey) {
      flags[onKey] = true;
    }
  }
  return flags;
}

/** 把十六进制颜色转换为带透明度的 rgba，非十六进制取值原样返回 */
export function toRgba(color: string, alpha: number): string {
  const matched = /^#?([\da-f]{3}|[\da-f]{6})$/i.exec(color.trim());
  if (!matched) {
    return color;
  }
  let hex = matched[1];
  if (hex.length === 3) {
    hex = hex.split("").map(char => char + char).join("");
  }
  const value = Number.parseInt(hex, 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}
