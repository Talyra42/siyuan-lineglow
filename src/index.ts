import type { IPluginSettings } from "@/settings";
import { getFrontend, Plugin, showMessage } from "siyuan";
import PluginInfoString from "@/../plugin.json";
import { setBlockAttrs } from "@/api";
import { ATTR_LINES, CODE_BLOCK_SELECTOR, STORAGE_NAME } from "@/constants";
import { getBlockId } from "@/core/codeBlock";
import { destroyScanner, endPreview, initScanner, refreshAll, setPreview } from "@/core/scanner";
import { parseLineSpec } from "@/core/spec";
import { DEFAULT_SETTINGS, normalizeSettings } from "@/settings";
import { openHighlightDialog } from "@/ui/dialog";
import { registerBlockMenu } from "@/ui/menu";
import { createSettingPanel } from "@/ui/settingsPanel";
import "@/index.scss";

let PluginInfo = {
  version: "",
};
try {
  PluginInfo = PluginInfoString;
} catch (error) {
  console.log("Plugin info parse error: ", error);
}

export default class CodeLineHighlight extends Plugin {
  public isMobile = false;
  public readonly version = PluginInfo.version;

  private settings: IPluginSettings = { ...DEFAULT_SETTINGS };
  private disposeMenu: (() => void) | null = null;

  async onload() {
    const frontEnd = getFrontend();
    this.isMobile = frontEnd === "mobile" || frontEnd === "browser-mobile";

    initScanner(this, () => this.settings);
    this.disposeMenu = registerBlockMenu({
      plugin: this,
      onOpen: blockId => this.openHighlightDialog(blockId),
      onClear: blockId => this.clearHighlight(blockId),
    });
    this.setting = createSettingPanel({
      plugin: this,
      isMobile: this.isMobile,
      getSettings: () => this.settings,
      onChange: () => refreshAll(),
      onPersist: () => this.persistSettings(),
    });

    try {
      const data = await this.loadData(STORAGE_NAME);
      if (data && typeof data === "object") {
        this.settings = normalizeSettings(data);
      }
    } catch (error) {
      console.warn("[lineglow] load settings failed", error);
    }
    refreshAll();
    this.registerCommand();
  }

  onunload() {
    this.disposeMenu?.();
    this.disposeMenu = null;
    destroyScanner(this);
  }

  private text(key: string, fallback: string) {
    const value = this.i18n[key];
    return typeof value === "string" ? value : fallback;
  }

  private findCodeBlockElement(blockId: string): HTMLElement | null {
    const escaped = typeof CSS !== "undefined" && typeof CSS.escape === "function" ? CSS.escape(blockId) : blockId;
    return document.querySelector<HTMLElement>(`.code-block[data-node-id="${escaped}"]`);
  }

  private findCodeBlockAtCaret(range?: Range): HTMLElement | null {
    const node = range?.startContainer;
    if (!node) {
      return null;
    }
    const element = node.nodeType === Node.ELEMENT_NODE ? node as HTMLElement : node.parentElement;
    return element?.closest<HTMLElement>(CODE_BLOCK_SELECTOR) ?? null;
  }

  private registerCommand() {
    if (typeof this.addCommand !== "function") {
      return;
    }
    try {
      this.addCommand({
        langKey: "lineHighlight",
        hotkey: "⌥⌘H",
        editorCallback: (_protyle, context) => {
          const codeBlock = this.findCodeBlockAtCaret(context?.range);
          if (!codeBlock) {
            showMessage(this.text("codeBlockNotFound", "Place the cursor inside a code block first"), 3000, "info");
            return;
          }
          const blockId = getBlockId(codeBlock);
          if (blockId) {
            this.openHighlightDialog(blockId);
          }
        },
      });
    } catch (error) {
      console.warn("[lineglow] register command failed", error);
    }
  }

  private openHighlightDialog(blockId: string) {
    const codeBlock = this.findCodeBlockElement(blockId);
    if (!codeBlock) {
      return;
    }
    openHighlightDialog({
      title: this.text("lineHighlight", "Highlight lines"),
      initialSpec: codeBlock.getAttribute(ATTR_LINES) ?? "",
      isMobile: this.isMobile,
      texts: {
        cancel: this.text("cancel", "Cancel"),
        clear: this.text("clear", "Clear"),
        confirm: this.text("confirm", "Confirm"),
        placeholder: this.text("lineHighlightPlaceholder", "1,3-5"),
        tip: this.text("lineHighlightTip", "VitePress style line ranges, for example 1,3-5"),
      },
      countLines: spec => parseLineSpec(spec).reduce((total, range) => total + range.end - range.start + 1, 0),
      formatCount: count => this.text("lineHighlightPreview", "{{count}} lines will be highlighted").replace("{{count}}", String(count)),
      onPreview: spec => setPreview(codeBlock, spec),
      onEndPreview: () => endPreview(codeBlock),
      onConfirm: spec => this.writeLineSpec(blockId, codeBlock, spec),
      onClear: () => this.writeLineSpec(blockId, codeBlock, ""),
    });
  }

  private writeLineSpec(blockId: string, codeBlock: HTMLElement, spec: string) {
    setBlockAttrs(blockId, { [ATTR_LINES]: spec || null }, (ok, msg) => {
      endPreview(codeBlock);
      refreshAll();
      if (!ok) {
        showMessage(msg || this.text("saveFailed", "Failed to save the block attribute"), 4000, "error");
      }
    });
  }

  private clearHighlight(blockId: string) {
    const codeBlock = this.findCodeBlockElement(blockId);
    setBlockAttrs(blockId, { [ATTR_LINES]: null }, (ok, msg) => {
      if (codeBlock) {
        endPreview(codeBlock);
      }
      refreshAll();
      if (!ok) {
        showMessage(msg || this.text("saveFailed", "Failed to save the block attribute"), 4000, "error");
      }
    });
  }

  private persistSettings() {
    this.saveData(STORAGE_NAME, this.settings)
      .catch(error => console.warn("[lineglow] save settings failed", error));
  }
}
