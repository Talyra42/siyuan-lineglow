import type { IEventBusMap, Plugin } from "siyuan";
import { ATTR_LINES, CODE_BLOCK_SELECTOR } from "../constants";
import { getBlockId } from "../core/codeBlock";

export interface IBlockMenuOptions {
  plugin: Plugin;
  onOpen: (blockId: string) => void;
  onClear: (blockId: string) => void;
}

/** 从块标菜单的目标块中取出代码块 */
const pickCodeBlock = (blockElements: HTMLElement[] | undefined): HTMLElement | null => {
  for (const element of blockElements ?? []) {
    if (element.matches(CODE_BLOCK_SELECTOR)) {
      return element;
    }
    const nested = element.querySelector<HTMLElement>(CODE_BLOCK_SELECTOR);
    if (nested) {
      return nested;
    }
  }
  return null;
};

/** 在块标菜单中选择「插件」子菜单里加入行高亮入口 */
export const registerBlockMenu = (options: IBlockMenuOptions): (() => void) => {
  const text = (key: string, fallback: string) => String(options.plugin.i18n[key] ?? fallback);
  const handler = (event: CustomEvent<IEventBusMap["click-blockicon"]>) => {
    const codeBlock = pickCodeBlock(event.detail.blockElements);
    if (!codeBlock) {
      return;
    }
    const blockId = getBlockId(codeBlock);
    if (!blockId) {
      return;
    }
    event.detail.menu.addItem({
      id: "codeLineHighlight",
      icon: "iconMark",
      label: text("lineHighlight", "Highlight lines"),
      click: () => options.onOpen(blockId),
    });
    if (codeBlock.getAttribute(ATTR_LINES)) {
      event.detail.menu.addItem({
        id: "codeLineHighlightClear",
        label: text("lineHighlightClear", "Clear line highlight"),
        click: () => options.onClear(blockId),
      });
    }
  };
  options.plugin.eventBus.on("click-blockicon", handler);
  return () => options.plugin.eventBus.off("click-blockicon", handler);
};
