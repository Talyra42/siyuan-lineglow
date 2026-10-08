/** 一个待高亮的行区间，行号从 1 开始，闭区间 */
export interface ILineRange {
  start: number;
  end: number;
}

const RANGE = /^(\d+)(?:\s*-\s*(\d+))?$/;

/** 合并重叠或相邻的区间，返回按行号升序排列的区间列表 */
export function mergeRanges(ranges: ILineRange[]): ILineRange[] {
  const sorted = [...ranges].sort((a, b) => a.start - b.start || a.end - b.end);
  const merged: ILineRange[] = [];
  for (const range of sorted) {
    const last = merged[merged.length - 1];
    if (last && range.start <= last.end + 1) {
      last.end = Math.max(last.end, range.end);
      continue;
    }
    merged.push({ start: range.start, end: range.end });
  }
  return merged;
}

/**
 * 解析 VitePress 风格的行区间语法，例如 `1,3-5`。
 * 无法识别的片段会被忽略，返回的区间已合并去重。
 */
export function parseLineSpec(spec: string): ILineRange[] {
  if (!spec) {
    return [];
  }
  const ranges: ILineRange[] = [];
  for (const part of spec.split(",")) {
    const matched = RANGE.exec(part.trim());
    if (!matched) {
      continue;
    }
    const first = Number.parseInt(matched[1], 10);
    const second = matched[2] ? Number.parseInt(matched[2], 10) : first;
    if (first < 1 || second < 1) {
      continue;
    }
    ranges.push({
      start: Math.min(first, second),
      end: Math.max(first, second),
    });
  }
  return mergeRanges(ranges);
}

/** 把区间列表还原为 `1,3-5` 形式的字符串 */
export function formatLineSpec(ranges: ILineRange[]): string {
  return ranges
    .map(range => (range.start === range.end ? `${range.start}` : `${range.start}-${range.end}`))
    .join(",");
}
