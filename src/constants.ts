/** 插件设置存储文件名 */
export const STORAGE_NAME = "settings";

/**
 * 代码块上记录待高亮行的自定义属性名，取值为 VitePress 风格的行区间，例如 `1,3-5`
 */
export const ATTR_LINES = "custom-code-hl";

/**
 * 思源在渲染（hljs 高亮、图表渲染）完成后写在元素上的标记，
 * 用于确认代码块已经重建完毕，可以安全测量与绘制
 */
export const ATTR_RENDER = "data-render";

/**
 * 代码块上覆盖插件全局样式的自定义属性名，取值为 `bg`/`num` 及其否定形式 `no-bg`/`no-num`
 * 组成的逗号分隔列表，也支持 `all` 与 `none`
 */
export const ATTR_STYLE = "custom-code-hl-style";

/** 注入行号颜色规则所用的 style 元素 id */
export const STYLE_ELEMENT_ID = "lineglow-gutter";

/** 代码块选择器，已渲染为图表等自定义渲染的代码块不参与 */
export const CODE_BLOCK_SELECTOR = '.code-block[data-type="NodeCodeBlock"]:not(.render-node)';

/** 单个代码块最多处理的行区间数量，避免异常取值生成过大的样式字符串 */
export const MAX_RANGES = 200;

/** 行区间属性值的长度上限，超过则忽略，避免异常取值进入解析与测量流程 */
export const MAX_SPEC_LENGTH = 4096;
