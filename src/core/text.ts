/** 代码块拆行结果，偏移量为原始文本中的字符下标 */
export interface ICodeLines {
  lines: string[];
  /** 每行首个字符的下标 */
  starts: number[];
  /** 每行末尾的下标（不含换行符） */
  ends: number[];
}

const LINE_BREAK = /\r\n|[\r\n\u2028\u2029]/g;

/**
 * 按思源行号栏的口径拆行：识别 CRLF、CR、LF、行分隔符与段分隔符，
 * 并忽略末尾换行符产生的空行。
 */
export const splitCodeLines = (text: string): ICodeLines => {
  const lines: string[] = [];
  const starts: number[] = [];
  const ends: number[] = [];
  let start = 0;
  LINE_BREAK.lastIndex = 0;
  let matched = LINE_BREAK.exec(text);
  while (matched) {
    lines.push(text.slice(start, matched.index));
    starts.push(start);
    ends.push(matched.index);
    start = matched.index + matched[0].length;
    matched = LINE_BREAK.exec(text);
  }
  lines.push(text.slice(start));
  starts.push(start);
  ends.push(text.length);
  if (lines.length > 1 && lines[lines.length - 1] === "") {
    lines.pop();
    starts.pop();
    ends.pop();
  }
  return {
    lines,
    starts,
    ends,
  };
};

/** 把字符下标定位到元素内的文本节点 */
export const locateText = (element: Element, offset: number): { node: Node; offset: number } | null => {
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  let remaining = offset;
  let node = walker.nextNode();
  while (node) {
    const length = node.nodeValue?.length ?? 0;
    if (remaining <= length) {
      return {
        node,
        offset: remaining,
      };
    }
    remaining -= length;
    node = walker.nextNode();
  }
  return null;
};
