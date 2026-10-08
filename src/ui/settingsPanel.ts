import type { Plugin } from "siyuan";
import type { IPluginSettings } from "../settings";
import { Setting } from "siyuan";

export interface ISettingPanelOptions {
  plugin: Plugin;
  getSettings: () => IPluginSettings;
  /** 任意设置变化后调用，用于重新绘制 */
  onChange: () => void;
  /** 设置面板确认后调用，用于持久化 */
  onPersist: () => void;
}

/** 创建设置面板，控件直接读写设置对象，确认时由调用方落盘 */
export const createSettingPanel = (options: ISettingPanelOptions): Setting => {
  const text = (key: string, fallback: string) => String(options.plugin.i18n[key] ?? fallback);
  const current = () => options.getSettings();
  const setting = new Setting({
    confirmCallback: () => options.onPersist(),
  });

  const addSwitch = (
    label: string,
    read: (settings: IPluginSettings) => boolean,
    write: (settings: IPluginSettings, value: boolean) => void,
    description?: string,
  ) => {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.className = "b3-switch fn__flex-center";
    input.checked = read(current());
    input.addEventListener("change", () => {
      write(current(), input.checked);
      options.onChange();
    });
    setting.addItem({
      title: label,
      description,
      direction: "row",
      createActionElement: () => input,
    });
  };

  const addColor = (
    label: string,
    read: (settings: IPluginSettings) => string,
    write: (settings: IPluginSettings, value: string) => void,
  ) => {
    const input = document.createElement("input");
    input.type = "color";
    input.className = "b3-text-field fn__flex-center clh-setting-color";
    input.value = read(current());
    input.addEventListener("input", () => {
      write(current(), input.value);
      options.onChange();
    });
    setting.addItem({
      title: label,
      direction: "row",
      createActionElement: () => input,
    });
  };

  const addNumber = (
    label: string,
    read: (settings: IPluginSettings) => number,
    write: (settings: IPluginSettings, value: number) => void,
    attributes: { min: number; max: number; step: number },
  ) => {
    const input = document.createElement("input");
    input.type = "number";
    input.className = "b3-text-field fn__flex-center clh-setting-number";
    input.min = String(attributes.min);
    input.max = String(attributes.max);
    input.step = String(attributes.step);
    input.value = String(read(current()));
    input.addEventListener("change", () => {
      write(current(), Number.parseFloat(input.value));
      options.onChange();
    });
    setting.addItem({
      title: label,
      direction: "row",
      createActionElement: () => input,
    });
  };

  addSwitch(
    text("settingEnabled", "Enable code line highlight"),
    settings => settings.enabled,
    (settings, value) => {
      settings.enabled = value;
    },
  );
  addSwitch(
    text("settingBackground", "Line background"),
    settings => settings.background,
    (settings, value) => {
      settings.background = value;
    },
  );
  addColor(
    text("settingBackgroundColor", "Background color"),
    settings => settings.backgroundColor,
    (settings, value) => {
      settings.backgroundColor = value;
    },
  );
  addNumber(
    text("settingBackgroundOpacity", "Background opacity"),
    settings => settings.backgroundOpacity,
    (settings, value) => {
      settings.backgroundOpacity = value;
    },
    { min: 0, max: 1, step: 0.02 },
  );
  addSwitch(
    text("settingLeftBar", "Left bar"),
    settings => settings.leftBar,
    (settings, value) => {
      settings.leftBar = value;
    },
  );
  addColor(
    text("settingLeftBarColor", "Bar color"),
    settings => settings.leftBarColor,
    (settings, value) => {
      settings.leftBarColor = value;
    },
  );
  addNumber(
    text("settingLeftBarWidth", "Bar width (px)"),
    settings => settings.leftBarWidth,
    (settings, value) => {
      settings.leftBarWidth = value;
    },
    { min: 1, max: 16, step: 1 },
  );
  addSwitch(
    text("settingGutter", "Color the line numbers"),
    settings => settings.gutter,
    (settings, value) => {
      settings.gutter = value;
    },
  );
  addColor(
    text("settingGutterColor", "Line number color"),
    settings => settings.gutterColor,
    (settings, value) => {
      settings.gutterColor = value;
    },
  );
  addSwitch(
    text("settingGutterBold", "Bold line numbers"),
    settings => settings.gutterBold,
    (settings, value) => {
      settings.gutterBold = value;
    },
  );
  setting.addItem({
    title: text("settingStyleTipTitle", "Per block override"),
    description: text(
      "settingStyleTip",
      "Set the custom-code-hl-style attribute on a code block to override the styles above, e.g. bar,num,no-bg",
    ),
  });
  return setting;
};
