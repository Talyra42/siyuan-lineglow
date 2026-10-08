/** 代码块正文元素（`.hljs` 的最后一个子元素），未渲染或已渲染为图表时返回 null */
export const getCodeElement = (codeBlock: HTMLElement): HTMLElement | null => {
  const hljs = codeBlock.querySelector<HTMLElement>(":scope > .hljs");
  if (!hljs) {
    return null;
  }
  const codeElement = hljs.lastElementChild as HTMLElement | null;
  return codeElement ?? null;
};

/** 代码块的行号栏，未开启行号显示时为 null */
export const getGutterElement = (codeBlock: HTMLElement): HTMLElement | null =>
  codeBlock.querySelector<HTMLElement>(".protyle-linenumber__rows");

/** 读取块 id */
export const getBlockId = (codeBlock: HTMLElement): string => codeBlock.getAttribute("data-node-id") ?? "";
