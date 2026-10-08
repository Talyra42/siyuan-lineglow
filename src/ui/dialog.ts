import { Dialog } from "siyuan";
import { parseLineSpec } from "../core/spec";

export interface IHighlightDialogTexts {
  cancel: string;
  clear: string;
  confirm: string;
  placeholder: string;
  tip: string;
}

export interface IHighlightDialogOptions {
  title: string;
  initialSpec: string;
  isMobile: boolean;
  texts: IHighlightDialogTexts;
  /** 统计高亮行数，用于实时提示 */
  countLines: (spec: string) => number;
  formatCount: (count: number) => string;
  onPreview: (spec: string) => void;
  onEndPreview: () => void;
  onConfirm: (spec: string) => void;
  onClear: () => void;
}

/** 打开行区间编辑对话框，输入过程实时预览，确定后由调用方写入块属性 */
export const openHighlightDialog = (options: IHighlightDialogOptions) => {
  let committed = false;
  let previewTimer = 0;

  const dialog = new Dialog({
    title: options.title,
    content: `<div class="b3-dialog__content clh-dialog">
    <div class="b3-label">
        <div class="fn__flex">
            <span class="fn__flex-1">${options.texts.tip}</span>
        </div>
        <div class="fn__hr"></div>
        <input class="b3-text-field fn__block" spellcheck="false" placeholder="${options.texts.placeholder}">
        <div class="b3-label__text clh-dialog__count"></div>
    </div>
</div>
<div class="b3-dialog__action">
    <button class="b3-button b3-button--cancel" data-type="cancel">${options.texts.cancel}</button>
    <div class="fn__space"></div>
    <span class="fn__flex-1"></span>
    <button class="b3-button b3-button--text" data-type="clear">${options.texts.clear}</button>
    <div class="fn__space"></div>
    <button class="b3-button b3-button--text" data-type="confirm">${options.texts.confirm}</button>
</div>`,
    width: options.isMobile ? "92vw" : "520px",
    destroyCallback: () => {
      window.clearTimeout(previewTimer);
      if (!committed) {
        options.onEndPreview();
      }
    },
  });

  const input = dialog.element.querySelector<HTMLInputElement>(".clh-dialog input");
  const countElement = dialog.element.querySelector<HTMLElement>(".clh-dialog__count");
  if (!input || !countElement) {
    dialog.destroy();
    return;
  }
  input.value = options.initialSpec;

  const renderCount = (spec: string) => {
    const count = options.countLines(spec);
    countElement.textContent = count > 0 ? options.formatCount(count) : "";
  };

  input.addEventListener("input", () => {
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(() => {
      const spec = input.value.trim();
      renderCount(spec);
      options.onPreview(parseLineSpec(spec).length > 0 ? spec : "");
    }, 120);
  });

  const commit = () => {
    committed = true;
    options.onConfirm(input.value.trim());
    dialog.destroy();
  };

  dialog.bindInput(input, commit);

  dialog.element.querySelector<HTMLElement>('[data-type="confirm"]')?.addEventListener("click", commit);
  dialog.element.querySelector<HTMLElement>('[data-type="cancel"]')?.addEventListener("click", () => dialog.destroy());
  dialog.element.querySelector<HTMLElement>('[data-type="clear"]')?.addEventListener("click", () => {
    committed = true;
    options.onClear();
    dialog.destroy();
  });

  renderCount(options.initialSpec);
  input.focus();
  input.select();
};
