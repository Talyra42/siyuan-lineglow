// @vitest-environment jsdom
import type { Plugin } from "siyuan";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_SETTINGS } from "../settings";
import { measureBands } from "./geometry";
import { destroyScanner, endPreview, initScanner, refreshAll, setPreview } from "./scanner";

// jsdom 无布局，行带位置由 measureBands 决定
vi.mock("./geometry", () => ({
  measureBands: vi.fn(() => [{ top: 10, height: 20 }]),
}));

const BLOCK_ID = "20240101120000-abcdefg";

/** 构造插件替身：只实现 eventBus 的 on/off 与一个 emit 便于测试触发事件 */
const createPluginStub = () => {
  const listeners = new Map<string, Set<(event: unknown) => void>>();
  const stub = {
    eventBus: {
      on(type: string, listener: (event: unknown) => void) {
        if (!listeners.has(type)) {
          listeners.set(type, new Set());
        }
        listeners.get(type)!.add(listener);
      },
      off(type: string, listener: (event: unknown) => void) {
        listeners.get(type)?.delete(listener);
      },
    },
    emit(type: string, detail: Record<string, unknown> = {}) {
      listeners.get(type)?.forEach((listener) => listener({ detail }));
    },
    listenerCount() {
      return [...listeners.values()].reduce((total, set) => total + set.size, 0);
    },
  };
  return stub;
};

const settings = { get: () => DEFAULT_SETTINGS };

const buildDom = (attrs = "") => {
  document.body.innerHTML = `<div class="protyle-wysiwyg">
  <div class="code-block" data-type="NodeCodeBlock" data-node-id="${BLOCK_ID}"${attrs}>
    <div class="protyle-action"><span class="protyle-action__language">js</span></div>
    <div class="hljs">
      <div class="protyle-linenumber__rows"><span></span><span></span><span></span></div>
      <div contenteditable="true">const a = 1;
const b = 2;
const c = 3;</div>
    </div>
  </div>
  <div class="code-block" data-type="NodeCodeBlock" data-node-id="20240101120000-hijklmn">
    <div class="protyle-action"><span class="protyle-action__language">js</span></div>
    <div class="hljs">
      <div class="protyle-linenumber__rows"><span></span></div>
      <div contenteditable="true">plain</div>
    </div>
  </div>
</div>`;
  return {
    highlighted: document.querySelector<HTMLElement>(`.code-block[data-node-id="${BLOCK_ID}"]`)!,
    plain: document.querySelector<HTMLElement>('.code-block[data-node-id="20240101120000-hijklmn"]')!,
  };
};

const codeOf = (block: HTMLElement) => block.querySelector<HTMLElement>(".hljs > div:last-child")!;
const gutterStyle = () => document.getElementById("lineglow-gutter");

/** 等待 MutationObserver 微任务与防抖定时器 */
const settle = async () => {
  await vi.advanceTimersByTimeAsync(400);
};

let plugin: ReturnType<typeof createPluginStub>;

beforeEach(() => {
  vi.useFakeTimers();
  vi.mocked(measureBands).mockClear();
  document.head.innerHTML = "";
  plugin = createPluginStub();
  initScanner(plugin as unknown as Plugin, settings.get);
});

afterEach(() => {
  destroyScanner(plugin as unknown as Plugin);
  vi.useRealTimers();
});

describe("scanner", () => {
  it("highlights only the code blocks that carry the attribute", async () => {
    const { highlighted, plain } = buildDom(` custom-code-hl="1,3-5"`);
    plugin.emit("loaded-protyle-static");
    await settle();
    expect(codeOf(highlighted).style.backgroundImage).not.toBe("");
    expect(codeOf(plain).style.backgroundImage).toBe("");
    expect(gutterStyle()?.textContent).toContain(BLOCK_ID);
    expect(gutterStyle()?.textContent).not.toContain("20240101120000-hijklmn");
  });

  it("renders the loaded protyle before the debounce fires", async () => {
    const { highlighted } = buildDom(` custom-code-hl="1,3-5"`);
    const scope = document.querySelector<HTMLElement>(".protyle-wysiwyg")!;
    vi.mocked(measureBands).mockClear();

    plugin.emit("loaded-protyle-static", { protyle: { wysiwyg: { element: scope } } });
    // 防抖定时器是 160ms，这里只推进一帧，验证渲染不依赖防抖
    await vi.advanceTimersByTimeAsync(20);

    expect(vi.mocked(measureBands).mock.calls.length).toBe(1);
    expect(codeOf(highlighted).style.backgroundImage).not.toBe("");
    expect(gutterStyle()?.textContent).toContain(BLOCK_ID);
  });

  it("only renders code blocks inside the protyle carried by the event", async () => {
    const { highlighted } = buildDom(` custom-code-hl="1"`);
    const scope = document.querySelector<HTMLElement>(".protyle-wysiwyg")!;
    document.body.insertAdjacentHTML(
      "beforeend",
      `<div class="code-block" data-type="NodeCodeBlock"
      data-node-id="20240101120000-outside" custom-code-hl="1"><div class="hljs">
      <div contenteditable="true">const outside = 1;</div></div></div>`,
    );
    const outside = document.querySelector<HTMLElement>('.code-block[data-node-id="20240101120000-outside"]')!;

    plugin.emit("loaded-protyle-static", { protyle: { wysiwyg: { element: scope } } });
    await vi.advanceTimersByTimeAsync(20);

    expect(codeOf(highlighted).style.backgroundImage).not.toBe("");
    expect(codeOf(outside).style.backgroundImage).toBe("");
  });

  it("cancels the queued fast render when the scanner is destroyed", async () => {
    const { highlighted } = buildDom(` custom-code-hl="1"`);
    const scope = document.querySelector<HTMLElement>(".protyle-wysiwyg")!;
    vi.mocked(measureBands).mockClear();

    plugin.emit("loaded-protyle-static", { protyle: { wysiwyg: { element: scope } } });
    destroyScanner(plugin as unknown as Plugin);
    await vi.advanceTimersByTimeAsync(20);

    expect(vi.mocked(measureBands).mock.calls.length).toBe(0);
    expect(codeOf(highlighted).style.backgroundImage).toBe("");
  });

  it("re-renders when the attribute changes and clears when it is removed", async () => {
    const { highlighted } = buildDom();
    plugin.emit("loaded-protyle-static");
    await settle();
    expect(codeOf(highlighted).style.backgroundImage).toBe("");

    highlighted.setAttribute("custom-code-hl", "2");
    await settle();
    expect(codeOf(highlighted).style.backgroundImage).not.toBe("");

    highlighted.removeAttribute("custom-code-hl");
    await settle();
    expect(codeOf(highlighted).style.backgroundImage).toBe("");
    expect(gutterStyle()).toBeNull();
  });

  it("does not loop on its own style writes", async () => {
    const { highlighted } = buildDom(` custom-code-hl="1"`);
    vi.mocked(measureBands).mockClear();
    plugin.emit("loaded-protyle-static");
    await settle();
    const afterFirst = vi.mocked(measureBands).mock.calls.length;
    expect(afterFirst).toBe(1);
    // 空闲期间不应再有任何测量（自己的样式写入不会触发重扫）
    await settle();
    await settle();
    expect(vi.mocked(measureBands).mock.calls.length).toBe(afterFirst);
    expect(codeOf(highlighted).style.backgroundImage).not.toBe("");
  });

  it("debounces bursts of mutations into a single render per block", async () => {
    const { highlighted } = buildDom(` custom-code-hl="1"`);
    vi.mocked(measureBands).mockClear();
    const code = codeOf(highlighted);
    for (let index = 0; index < 20; index++) {
      code.appendChild(document.createTextNode("x"));
    }
    await settle();
    expect(vi.mocked(measureBands).mock.calls.length).toBe(1);
  });

  it("previews a spec and restores the stored attribute afterwards", async () => {
    const { highlighted } = buildDom(` custom-code-hl="1,3-5"`);
    plugin.emit("loaded-protyle-static");
    await settle();
    const stored = codeOf(highlighted).style.backgroundImage;

    setPreview(highlighted, "");
    expect(codeOf(highlighted).style.backgroundImage).toBe("");
    endPreview(highlighted);
    expect(codeOf(highlighted).style.backgroundImage).toBe(stored);
  });

  it("stops working after destroy and releases the event listeners", async () => {
    const { highlighted } = buildDom(` custom-code-hl="1"`);
    plugin.emit("loaded-protyle-static");
    await settle();
    expect(plugin.listenerCount()).toBe(4);

    destroyScanner(plugin as unknown as Plugin);
    expect(plugin.listenerCount()).toBe(0);
    expect(codeOf(highlighted).style.backgroundImage).toBe("");
    expect(gutterStyle()).toBeNull();

    vi.mocked(measureBands).mockClear();
    highlighted.setAttribute("custom-code-hl", "2");
    await settle();
    expect(vi.mocked(measureBands).mock.calls.length).toBe(0);
  });

  it("is safe to initialise twice", async () => {
    buildDom(` custom-code-hl="1"`);
    initScanner(plugin as unknown as Plugin, settings.get);
    // 重新初始化会先清理旧的监听，再注册一份
    expect(plugin.listenerCount()).toBe(4);
    plugin.emit("loaded-protyle-static");
    await settle();
    expect(gutterStyle()).not.toBeNull();
  });

  it("keeps working through a full refresh", async () => {
    const { highlighted } = buildDom(` custom-code-hl="1"`);
    refreshAll();
    await settle();
    expect(codeOf(highlighted).style.backgroundImage).not.toBe("");
  });
});
