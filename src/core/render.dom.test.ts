// @vitest-environment jsdom
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../settings";
import { getCodeElement, getGutterElement } from "./codeBlock";
import { applyBlock, clearBlock, clearGutterRules, pruneGutterRules, setGutterRule } from "./render";

// jsdom 不提供布局，行带位置由 measureBands 决定，这里固定为一条行带
vi.mock("./geometry", () => ({
  measureBands: vi.fn(() => [{ top: 10, height: 20 }]),
}));

const BLOCK_ID = "20240101120000-abcdefg";

const buildDom = (attrs = "") => {
  document.body.innerHTML = `<div class="protyle-wysiwyg">
  <div class="code-block" data-type="NodeCodeBlock" data-node-id="${BLOCK_ID}"${attrs}>
    <div class="protyle-action"><span class="protyle-action__language">js</span></div>
    <div class="hljs">
      <div class="protyle-linenumber__rows"><span></span><span></span><span></span></div>
      <div contenteditable="true" spellcheck="false">const a = 1;
const b = 2;
const c = 3;</div>
    </div>
  </div>
</div>`;
  return document.querySelector<HTMLElement>(".code-block")!;
};

const gutterStyleOf = () => document.getElementById("lineglow-gutter");

const layerCount = (codeElement: HTMLElement) =>
  codeElement.style.backgroundImage.split("linear-gradient(").length - 1;

beforeEach(() => {
  document.head.innerHTML = "";
  clearGutterRules();
});

describe("code block dom plumbing", () => {
  it("finds the code body and the line number gutter", () => {
    const block = buildDom();
    const codeElement = getCodeElement(block);
    expect(codeElement).not.toBeNull();
    expect(codeElement?.getAttribute("contenteditable")).toBe("true");
    expect(codeElement?.textContent).toContain("const c = 3;");
    expect(getGutterElement(block)?.children).toHaveLength(3);
  });
});

describe("applyBlock", () => {
  it("paints the background layer and colors the line numbers", () => {
    const block = buildDom(` custom-code-hl-style="bg,num"`);
    applyBlock(block, "1,3-5", DEFAULT_SETTINGS);
    const code = getCodeElement(block)!;
    expect(layerCount(code)).toBe(1);
    // jsdom 会规范化取值，这里只校验关键数值是否写入
    expect(code.style.backgroundImage).toMatch(/10(\.00)?px/);
    expect(code.style.backgroundImage).toMatch(/30(\.00)?px/);
    expect(code.style.backgroundPosition).toBe("0px 0px");
    expect(code.style.backgroundSize).toBe("100% 100%");
    expect(code.style.backgroundRepeat).toBe("no-repeat");
    expect(code.style.backgroundOrigin).toBe("border-box");
    const css = gutterStyleOf()?.textContent ?? "";
    expect(css).toContain(`.code-block[data-node-id="${BLOCK_ID}"]`);
    expect(css).toContain(":nth-child(n+3):nth-child(-n+5)");
  });

  it("honours the per block style override", () => {
    const block = buildDom(` custom-code-hl-style="no-bg"`);
    applyBlock(block, "2", DEFAULT_SETTINGS);
    const code = getCodeElement(block)!;
    expect(code.style.backgroundImage).toBe("");
    // 只关掉背景时，行号仍然变色
    expect(gutterStyleOf()?.textContent).toContain(':nth-child(n+2):nth-child(-n+2)');
  });

  it("clears everything when the spec is unparsable", () => {
    const block = buildDom();
    applyBlock(block, "1-3", DEFAULT_SETTINGS);
    expect(getCodeElement(block)!.style.backgroundImage).not.toBe("");
    applyBlock(block, "not-a-range", DEFAULT_SETTINGS);
    expect(getCodeElement(block)!.style.backgroundImage).toBe("");
    expect(gutterStyleOf()).toBeNull();
  });

  it("clears everything when the line numbers are the only style left off", () => {
    const block = buildDom(` custom-code-hl-style="no-num"`);
    applyBlock(block, "1", DEFAULT_SETTINGS);
    expect(getCodeElement(block)!.style.backgroundImage).not.toBe("");
    expect(gutterStyleOf()).toBeNull();
  });
});

describe("clearBlock", () => {
  it("removes the background and the gutter rule", () => {
    const block = buildDom();
    applyBlock(block, "1", DEFAULT_SETTINGS);
    clearBlock(block);
    expect(getCodeElement(block)!.style.backgroundImage).toBe("");
    expect(gutterStyleOf()).toBeNull();
  });
});

describe("gutter rules", () => {
  it("prunes rules whose code block is gone", () => {
    const block = buildDom();
    applyBlock(block, "1", DEFAULT_SETTINGS);
    expect(gutterStyleOf()).not.toBeNull();
    block.remove();
    pruneGutterRules();
    expect(gutterStyleOf()).toBeNull();
  });

  it("rejects block ids that cannot be used in a selector", () => {
    setGutterRule("bad\"id", "span { color: red }");
    expect(gutterStyleOf()).toBeNull();
  });
});
