# Siyuan Line Glow

<div align="center">

一个给思源代码块做「指定行高亮」的插件

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Talyra42/siyuan-lineglow/blob/main/LICENSE)
</div>

[English](./README.md)

## ✨ 功能特性

- 🎯 **指定行高亮** - 按 VitePress 的行区间语法高亮代码块中的任意行
- 🎨 **整行背景** - 背景颜色与不透明度可调
- 🔢 **行号联动** - 高亮所在行的行号同步变色，可选加粗
- ⚙️ **按块覆盖** - 单个代码块可用块属性覆盖全局样式
- 🌐 **主题适配** - 内置中英文界面，颜色可自由配置

> 发布前请先替换 `icon.png` 与 `preview.png`。

## 📦 安装

### 方式一：集市安装（推荐）

1. 打开思源笔记
2. 进入 `设置` - `集市` - `插件`
3. 搜索 "Line Glow"
4. 点击安装并启用

### 方式二：手动安装

1. 从 [Releases](https://github.com/Talyra42/siyuan-lineglow/releases) 下载 `package.zip`
2. 解压到思源工作空间的 `data/plugins/siyuan-lineglow` 目录
3. 重启思源笔记
4. 在 `设置` - `集市` - `已下载` 中启用

## 🚀 使用方法

1. 点击代码块左侧块标，选择 `插件 - Line Glow 行高亮`
2. 或把光标置于代码块内，使用默认快捷键 `⌥⌘H`（可在 `设置` - `快捷键` 中修改）
3. 输入行区间，输入过程中会实时预览，确认后生效

## 📝 语法

行区间遵循 VitePress 约定：

| 取值 | 含义 |
|---|---|
| `3` | 第 3 行 |
| `1-5` | 第 1 到第 5 行 |
| `1,3-5,9` | 第 1、3、4、5、9 行 |

行号从 1 开始，区间为闭区间，多段之间用英文逗号分隔。

数值保存在代码块的 `custom-code-hl` 属性中，可随同步、历史与导出一起保留，也可以在块属性面板中直接编辑。

## 🎛️ 按块覆盖样式

在代码块上设置 `custom-code-hl-style` 可以覆盖插件设置里的样式开关：

| 标记 | 作用 |
|---|---|
| `bg` / `no-bg` | 开启 / 关闭整行背景 |
| `num` / `no-num` | 开启 / 关闭行号变色 |
| `all` / `none` | 全部开启 / 全部关闭 |

例如 `custom-code-hl-style="num,no-bg"` 表示只保留行号变色。

## ⚠️ 已知限制

导出的 PDF、HTML 与图片由思源在插件运行环境之外生成，因此导出结果中不包含行高亮。

## 🛠️ 开发

需要先安装 [NodeJS](https://nodejs.org/en/download) 与 [pnpm](https://pnpm.io/installation)。

```bash
pnpm install
cp .env.example .env    # 填入 VITE_SIYUAN_WORKSPACE_PATH
pnpm dev                # 构建到 <工作空间>/data/plugins/siyuan-lineglow
pnpm test               # 单元测试
pnpm typecheck          # 类型检查
pnpm lint               # 代码检查
pnpm build              # 生成 dist/ 与发布用的 package.zip
pnpm release            # 交互式发版（更新版本号、提交、打标签、推送）
```

## ⚡ 性能与稳定性

- 不改动代码块内部结构：高亮完全由代码正文元素的内联样式与一条注入的 CSS 规则实现，不向块内插入任何节点，因此不会被思源序列化写进笔记，也不影响光标与撤销
- 背景图层数量恒定：所有行带合并进同一条竖向渐变，无论高亮多少段，永远只有 1 个背景图层
- 渲染有防抖与上限：DOM 变化以 160ms 防抖合并；单块最多处理 200 段区间，属性超过 4096 字符直接忽略
- 长文档分批处理：整篇扫描按每批 40 个代码块让出主线程
- 无泄漏：卸载时移除全部监听、观察器与注入样式；ResizeObserver 观察过的失效节点会在全量扫描时释放

## 📄 许可证

[MIT](./LICENSE)
