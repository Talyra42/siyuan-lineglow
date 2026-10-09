import type { Plugin } from "siyuan";
import type { IPluginSettings } from "../settings";
import { Setting } from "siyuan";

export interface ISettingPanelOptions {
  plugin: Plugin;
  isMobile: boolean;
  getSettings: () => IPluginSettings;
  /** 任意设置变化后调用，用于重新绘制 */
  onChange: () => void;
  /** 设置面板确认后调用，用于持久化 */
  onPersist: () => void;
}

/** 一行「标签 + 控件」，控件靠右，与思源自带设置项排版一致 */
const createRow = (label: string, control: HTMLElement) => {
  const row = document.createElement("label");
  row.className = "clh-settings__row";
  const labelElement = document.createElement("span");
  labelElement.className = "clh-settings__label";
  labelElement.textContent = label;
  control.classList.add("clh-settings__control");
  row.append(labelElement, control);
  return row;
};

/** 一组相关控件，共用一个小标题 */
const createGroup = (title: string, rows: HTMLElement[]) => {
  const group = document.createElement("div");
  group.className = "clh-settings__group";
  const titleElement = document.createElement("div");
  titleElement.className = "clh-settings__group-title";
  titleElement.textContent = title;
  group.append(titleElement, ...rows);
  return group;
};

/**
 * 创建设置面板。
 * 只有 3 个设置项，外观相关的 6 个控件按「整行背景 / 行号」放进两列自适应网格：
 * 既不会出现一串无意义的分隔线，窗口变窄时也会自动退回单列。
 */
export const createSettingPanel = (options: ISettingPanelOptions): Setting => {
  const text = (key: string, fallback: string) => String(options.plugin.i18n[key] ?? fallback);
  const current = () => options.getSettings();
  const setting = new Setting({
    height: options.isMobile ? undefined : "auto",
    confirmCallback: () => options.onPersist(),
  });

  const createSwitch = (read: () => boolean, write: (value: boolean) => void) => {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "b3-switch";
    input.checked = read();
    input.addEventListener("change", () => {
      write(input.checked);
      options.onChange();
    });
    return input;
  };

  const createColor = (read: () => string, write: (value: string) => void) => {
    const input = document.createElement("input");
    input.type = "color";
    input.className = "b3-text-field clh-setting-color";
    input.value = read();
    input.addEventListener("input", () => {
      write(input.value);
      options.onChange();
    });
    return input;
  };

  const createNumber = (
    read: () => number,
    write: (value: number) => void,
    attributes: { min: number; max: number; step: number },
  ) => {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "b3-text-field clh-setting-number";
    input.min = String(attributes.min);
    input.max = String(attributes.max);
    input.step = String(attributes.step);
    input.value = String(read());
    input.addEventListener("change", () => {
      write(Number.parseFloat(input.value));
      options.onChange();
    });
    return input;
  };

  setting.addItem({
    title: text("settingEnabled", "Enable code line highlight"),
    direction: "column",
    createActionElement: () =>
      createSwitch(
        () => current().enabled,
        (value) => {
          current().enabled = value;
        },
      ),
  });

  setting.addItem({
    title: text("settingAppearance", "Appearance"),
    direction: "row",
    createActionElement: () => {
      const container = document.createElement("div");
      const grid = document.createElement("div");
      grid.className = "clh-settings";
      grid.append(
        createGroup(text("settingGroupBackground", "Line background"), [
          createRow(
            text("settingEnable", "Enabled"),
            createSwitch(
              () => current().background,
              (value) => {
                current().background = value;
              },
            ),
          ),
          createRow(
            text("settingColor", "Color"),
            createColor(
              () => current().backgroundColor,
              (value) => {
                current().backgroundColor = value;
              },
            ),
          ),
          createRow(
            text("settingOpacity", "Opacity"),
            createNumber(
              () => current().backgroundOpacity,
              (value) => {
                current().backgroundOpacity = value;
              },
              { min: 0, max: 1, step: 0.02 },
            ),
          ),
        ]),
        createGroup(text("settingGroupGutter", "Line numbers"), [
          createRow(
            text("settingEnable", "Enabled"),
            createSwitch(
              () => current().gutter,
              (value) => {
                current().gutter = value;
              },
            ),
          ),
          createRow(
            text("settingColor", "Color"),
            createColor(
              () => current().gutterColor,
              (value) => {
                current().gutterColor = value;
              },
            ),
          ),
          createRow(
            text("settingBold", "Bold"),
            createSwitch(
              () => current().gutterBold,
              (value) => {
                current().gutterBold = value;
              },
            ),
          ),
        ]),
      );
      container.append(grid);
      return container;
    },
  });

  setting.addItem({
    title: text("settingStyleTipTitle", "Per block override"),
    description: text(
      "settingStyleTip",
      "Set the custom-code-hl-style attribute on a code block to turn styles on individually with bg and num, or off with no-bg and no-num. all and none toggle every style",
    ),
  });

  return setting;
};
