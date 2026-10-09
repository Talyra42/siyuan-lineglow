# 更新日志

本项目的重要变更都记录在这里，格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/1.1.0/)，
版本号遵循[语义化版本](https://semver.org/lang/zh-CN/)。

新增功能、修复问题、行为变更都要写进下面的 `[Unreleased]`；发布时 `pnpm release`
会自动把它归档成对应的版本小节。

## [Unreleased]

## [1.1.0] - 2026-10-09

### 修复

- 打开或重新打开文档时，高亮不再"先无高亮、再弹出"：渲染提前到首帧绘制之前完成，
  并且只扫描事件携带的那个 protyle，不再整篇重扫
- 单个 protyle 超过 60 个代码块时，首屏不再被批量扫描拖慢

### 变更

- 监听思源渲染完成的 `data-render` 标记，代码块被重建后会及时重新测量与绘制

### 文档

- 更正说明：导出为图片、复制为 PNG 会保留高亮，导出 PDF 与 HTML 不支持

### 工程

- 引入 Prettier（`.prettierrc.json`）并统一全仓库代码格式，新增 `pnpm format` 与 `pnpm format:check`
- ESLint 改为只负责代码质量，格式相关规则交给 Prettier
- 新增本更新日志与 `AGENTS.md` 仓库贡献指南

## [1.0.0] - 2026-10-08

首个版本。

### 新增

- 按 VitePress 行区间语法高亮代码块中的指定行，区间存进块属性 `custom-code-hl`
- 整行背景（颜色、不透明度可调）与行号联动变色（可加粗）
- 按块覆盖全局样式：`custom-code-hl-style` 支持 `bg` / `num` / `no-bg` / `no-num` / `all` / `none`
- 三个入口：块标菜单、快捷键 `⌘/Ctrl+H`、直接编辑块属性，输入过程实时预览
- 内置简体中文与英文界面
