import type { ILineRange } from "./spec";
import type { ICodeLines } from "./text";
import { locateText } from "./text";

/** 相对代码元素 border box 的一条行带 */
export interface ILineBand {
  top: number;
  height: number;
}

const measureRange = (
  codeElement: HTMLElement,
  startOffset: number,
  endOffset: number,
): { top: number; bottom: number } | null => {
  const start = locateText(codeElement, startOffset);
  const end = locateText(codeElement, endOffset);
  if (!start || !end) {
    return null;
  }
  const range = document.createRange();
  try {
    range.setStart(start.node, start.offset);
    range.setEnd(end.node, end.offset);
  } catch {
    return null;
  }
  const rects = range.getClientRects();
  let top = Number.POSITIVE_INFINITY;
  let bottom = Number.NEGATIVE_INFINITY;
  for (const rect of rects) {
    if (rect.height <= 0) {
      continue;
    }
    top = Math.min(top, rect.top);
    bottom = Math.max(bottom, rect.bottom);
  }
  if (!Number.isFinite(top) || !Number.isFinite(bottom) || bottom <= top) {
    return null;
  }
  return {
    top,
    bottom,
  };
};

/** 估算行高：优先使用计算样式，回退到字号推算 */
export const estimateLineHeight = (codeElement: HTMLElement): number => {
  const style = getComputedStyle(codeElement);
  const lineHeight = Number.parseFloat(style.lineHeight);
  if (Number.isFinite(lineHeight) && lineHeight > 0) {
    return lineHeight;
  }
  const fontSize = Number.parseFloat(style.fontSize);
  return (Number.isFinite(fontSize) && fontSize > 0 ? fontSize : 14) * 1.36;
};

/**
 * 计算每个待高亮区间的行带位置（相对代码元素 border box），用于绘制整行背景。
 * 完全为空行的区间用相邻行位置配合行高推算。
 */
export const measureBands = (codeElement: HTMLElement, info: ICodeLines, ranges: ILineRange[]): ILineBand[] => {
  const codeRect = codeElement.getBoundingClientRect();
  if (codeRect.height <= 0) {
    return [];
  }
  const lineHeight = estimateLineHeight(codeElement);
  const bands: ILineBand[] = [];
  for (const range of ranges) {
    const first = Math.max(1, range.start);
    const last = Math.min(info.lines.length, range.end);
    if (first > last) {
      continue;
    }
    const startOffset = info.starts[first - 1];
    const endOffset = info.ends[last - 1];
    if (endOffset > startOffset) {
      const measured = measureRange(codeElement, startOffset, endOffset);
      if (measured) {
        bands.push({
          top: measured.top - codeRect.top,
          height: measured.bottom - measured.top,
        });
        continue;
      }
    }
    // 空行区间：用上一行或下一行的可见位置推算
    const band = estimateEmptyBand(codeElement, info, codeRect, first, last, lineHeight);
    if (band) {
      bands.push(band);
    }
  }
  return bands;
};

function estimateEmptyBand(
  codeElement: HTMLElement,
  info: ICodeLines,
  codeRect: DOMRect,
  first: number,
  last: number,
  lineHeight: number,
): ILineBand | null {
  const height = (last - first + 1) * lineHeight;
  for (const probe of [first - 1, first + 1]) {
    if (probe < 1 || probe > info.lines.length) {
      continue;
    }
    const startOffset = info.starts[probe - 1];
    const endOffset = info.ends[probe - 1];
    if (endOffset <= startOffset) {
      continue;
    }
    const measured = measureRange(codeElement, startOffset, endOffset);
    if (!measured) {
      continue;
    }
    const anchor = probe < first ? measured.bottom : measured.top - height;
    return {
      top: anchor - codeRect.top,
      height,
    };
  }
  return null;
}
