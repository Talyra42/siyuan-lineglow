import type { Plugin } from "siyuan";
import type { IPluginSettings } from "../settings";
import { ATTR_LINES, ATTR_STYLE, CODE_BLOCK_SELECTOR } from "../constants";
import { applyBlock, clearBlock, clearGutterRules, pruneGutterRules } from "./render";

const SCAN_DEBOUNCE = 160;
const BATCH_SIZE = 40;

let getSettings: () => IPluginSettings;
let observer: MutationObserver | null = null;
let resizeObserver: ResizeObserver | null = null;
let activePlugin: Plugin | null = null;
let scanTimer = 0;
let resizeTimer = 0;
let fullScan = false;
/** 生命周期代数，卸载或重新初始化后旧的分批扫描会自行终止 */
let generation = 0;

/** 预览时的行规格覆盖，键为代码块元素 */
const previews = new WeakMap<HTMLElement, string>();
/**
 * 已被尺寸观察的代码块。
 * ResizeObserver 会强引用被观察元素，因此必须显式解除已脱离文档的块，否则切换文档会持续累积。
 */
const observed = new Set<HTMLElement>();
/** 尺寸发生变化、等待重新测量的代码块 */
const resized = new Set<HTMLElement>();
/** 待处理的代码块 */
const pending = new Set<HTMLElement>();

const toElement = (node: Node | null): HTMLElement | null => {
  if (!node) {
    return null;
  }
  if (node.nodeType === Node.ELEMENT_NODE) {
    return node as HTMLElement;
  }
  return node.parentElement;
};

/** 收集节点所属或所包含的代码块 */
const collectBlocks = (node: Node | null, into: Set<HTMLElement>) => {
  const element = toElement(node);
  if (!element) {
    return;
  }
  if (element.matches(CODE_BLOCK_SELECTOR)) {
    into.add(element);
  }
  element.querySelectorAll<HTMLElement>(CODE_BLOCK_SELECTOR).forEach(block => into.add(block));
  const ancestor = element.closest<HTMLElement>(CODE_BLOCK_SELECTOR);
  if (ancestor) {
    into.add(ancestor);
  }
};

const observeSize = (codeBlock: HTMLElement) => {
  if (observed.has(codeBlock) || typeof ResizeObserver === "undefined") {
    return;
  }
  if (!resizeObserver) {
    resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        resized.add(entry.target as HTMLElement);
      }
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        const blocks = [...resized];
        resized.clear();
        blocks.forEach((block) => {
          if (block.isConnected) {
            renderOne(block);
          }
        });
      }, SCAN_DEBOUNCE);
    });
  }
  observed.add(codeBlock);
  resizeObserver.observe(codeBlock);
};

/** 解除已脱离文档的代码块的尺寸观察，避免 ResizeObserver 持有失效节点 */
const pruneObservations = () => {
  if (observed.size === 0) {
    return;
  }
  for (const element of observed) {
    if (!element.isConnected) {
      resizeObserver?.unobserve(element);
      observed.delete(element);
    }
  }
};

/** 渲染单个代码块，预览值优先于块属性 */
function renderOne(codeBlock: HTMLElement) {
  if (!codeBlock.isConnected) {
    return;
  }
  const settings = getSettings();
  const preview = previews.get(codeBlock);
  if (preview === undefined && !settings.enabled) {
    clearBlock(codeBlock);
    return;
  }
  const spec = preview ?? codeBlock.getAttribute(ATTR_LINES) ?? "";
  applyBlock(codeBlock, spec, settings);
  observeSize(codeBlock);
}

const runScan = () => {
  const settings = getSettings();
  const blocks = Array.from(document.querySelectorAll<HTMLElement>(CODE_BLOCK_SELECTOR));
  if (!settings.enabled) {
    blocks.forEach(block => clearBlock(block));
    clearGutterRules();
    return;
  }
  pruneGutterRules();
  pruneObservations();
  const current = generation;
  let index = 0;
  const next = () => {
    if (current !== generation) {
      return;
    }
    const end = Math.min(index + BATCH_SIZE, blocks.length);
    for (; index < end; index++) {
      renderOne(blocks[index]);
    }
    if (index < blocks.length) {
      window.setTimeout(next, 0);
    }
  };
  next();
};

const schedule = (scope: "all" | "pending") => {
  if (scope === "all") {
    fullScan = true;
  }
  if (scanTimer) {
    return;
  }
  scanTimer = window.setTimeout(() => {
    scanTimer = 0;
    if (fullScan) {
      fullScan = false;
      pending.clear();
      runScan();
      return;
    }
    const blocks = [...pending];
    pending.clear();
    blocks.forEach(renderOne);
  }, SCAN_DEBOUNCE);
};

const onMutations = (mutations: MutationRecord[]) => {
  for (const mutation of mutations) {
    if (mutation.type === "attributes") {
      collectBlocks(mutation.target, pending);
      continue;
    }
    collectBlocks(mutation.target, pending);
    mutation.addedNodes.forEach(node => collectBlocks(node, pending));
  }
  if (pending.size > 200) {
    pending.clear();
    schedule("all");
    return;
  }
  if (pending.size > 0) {
    schedule("pending");
  }
};

const onProtyleEvent = () => schedule("all");

const onWindowResize = () => schedule("all");

/** 初始化扫描：订阅思源事件与 DOM 变化 */
export const initScanner = (plugin: Plugin, settingsGetter: () => IPluginSettings) => {
  // 同一实例重复初始化（热重载）时先清理，避免观察器与事件监听叠加
  if (activePlugin) {
    destroyScanner(activePlugin);
  }
  activePlugin = plugin;
  generation++;
  getSettings = settingsGetter;
  plugin.eventBus.on("loaded-protyle-dynamic", onProtyleEvent);
  plugin.eventBus.on("loaded-protyle-static", onProtyleEvent);
  plugin.eventBus.on("switch-protyle", onProtyleEvent);
  plugin.eventBus.on("destroy-protyle", onProtyleEvent);
  observer = new MutationObserver(onMutations);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: [ATTR_LINES, ATTR_STYLE],
  });
  window.addEventListener("resize", onWindowResize);
  // 字体加载完成会改变行高，需要重新测量
  const fonts = document.fonts;
  if (fonts) {
    fonts.ready.then(() => schedule("all")).catch(() => undefined);
  }
  schedule("all");
};

/** 设置变化或需要整体重建时调用 */
export const refreshAll = () => schedule("all");

/** 为对话框提供实时预览 */
export const setPreview = (codeBlock: HTMLElement, spec: string) => {
  previews.set(codeBlock, spec);
  renderOne(codeBlock);
};

/** 结束预览并恢复为块属性中的取值 */
export const endPreview = (codeBlock: HTMLElement) => {
  previews.delete(codeBlock);
  renderOne(codeBlock);
};

/** 卸载扫描：移除监听、观察器与所有注入内容 */
export function destroyScanner(plugin: Plugin) {
  plugin.eventBus.off("loaded-protyle-dynamic", onProtyleEvent);
  plugin.eventBus.off("loaded-protyle-static", onProtyleEvent);
  plugin.eventBus.off("switch-protyle", onProtyleEvent);
  plugin.eventBus.off("destroy-protyle", onProtyleEvent);
  window.removeEventListener("resize", onWindowResize);
  observer?.disconnect();
  observer = null;
  resizeObserver?.disconnect();
  resizeObserver = null;
  window.clearTimeout(scanTimer);
  window.clearTimeout(resizeTimer);
  scanTimer = 0;
  resizeTimer = 0;
  pending.clear();
  resized.clear();
  observed.clear();
  activePlugin = null;
  generation++;
  document.querySelectorAll<HTMLElement>(CODE_BLOCK_SELECTOR).forEach(block => clearBlock(block));
  clearGutterRules();
}
