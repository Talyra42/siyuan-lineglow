# 仓库指南

本仓库是 **SiYuan Line Glow** 插件：一个用 TypeScript 编写的思源（SiYuan）插件，
根据 VitePress 风格的行区间语法高亮代码块中的指定行，区间存储在块属性
`custom-code-hl` 中。使用 Vite 打包、Vitest 测试。

## 项目结构与模块组织

- `src/index.ts` – 插件入口，串联生命周期、设置与 UI。
- `src/core/` – 核心逻辑：`scanner.ts`（DOM 扫描与渲染）、`render.ts`、
  `geometry.ts`、`text.ts`、`codeBlock.ts`、`spec.ts`（行区间解析）。
- `src/ui/` – `settingsPanel.ts`、`menu.ts`、`dialog.ts`。
- `src/settings.ts`、`src/constants.ts`、`src/api.ts` – 设置模型、共享常量
  （如 `ATTR_LINES`）与思源 API 封装。
- `src/i18n/{en_US,zh_CN}.json` – 本地化文案，构建时拷贝进产物。
- `asset/` – 源 SVG；`icon.png` / `preview.png` 为打包用图片。
- 测试与被测代码同目录，命名为 `*.test.ts`（如 `src/core/scanner.test.ts`）。
- `dist/` 与 `dev/` 是构建产物，请勿手动修改。

## 构建、测试与开发命令

使用 pnpm（见 `package.json`）。

| 命令                | 作用                                                  |
| ------------------- | ----------------------------------------------------- |
| `pnpm dev`          | Vite 监听构建，输出到 `dev/` 或思源工作空间的插件目录 |
| `pnpm build`        | 生产构建到 `dist/`，并生成 `package.zip`              |
| `pnpm test`         | 运行一次 Vitest 测试套件（`vitest run`）              |
| `pnpm typecheck`    | 用 `tsc --noEmit` 做类型检查                          |
| `pnpm lint`         | 用 ESLint 检查 `src`                                  |
| `pnpm format`       | 用 Prettier 格式化仓库（含 `src`、配置与文档）        |
| `pnpm format:check` | 只校验格式，不写回文件                                |
| `pnpm release`      | 升级版本、提交并打 `vX.Y.Z` 标签（见 `release.js`）   |

本地开发时，在 `.env`（从 `.env.example` 复制）中设置
`VITE_SIYUAN_WORKSPACE_PATH`，指向包含 `data/` 的工作空间目录。

## 代码风格与命名约定

- 遵循 `.editorconfig`：2 空格缩进、UTF-8、文件末尾换行、去除行尾空白。
- 代码风格统一交给 Prettier（`.prettierrc.json`：120 列、双引号、分号、2 空格缩进），
  改完代码运行 `pnpm format`。
- ESLint 扁平配置（`eslint.config.mjs`，`@antfu/eslint-config`，`type: "lib"`）
  只负责代码质量；与 Prettier 冲突的格式规则已由 `eslint-config-prettier` 关闭。
  提交前运行 `pnpm lint`。
- 通过 `@/` 别名导入（映射到 `src/`），例如
  `import { parseLineSpec } from "@/core/spec"`。
- 命名：变量/函数/文件名用 `camelCase`（`settingsPanel.ts`），类型与类用
  `PascalCase`，常量用 `SCREAMING_SNAKE_CASE`。
- 已开启 `noUnusedLocals` / `noUnusedParameters`，请保持导入整洁。

## 测试规范

- 框架：Vitest（`vitest.config.ts`），默认 `node` 环境；DOM 测试需加
  `// @vitest-environment jsdom` 注解（见 `render.dom.test.ts`）。
- 文件命名为 `<模块>.test.ts`，`describe` 以被测模块命名。
- 运行 `pnpm test`（可用 `pnpm test -- <pattern>` 过滤）。不强制覆盖率，但新增
  解析/渲染逻辑应附带测试。

## 提交与 PR 规范

- 提交遵循 Conventional Commits，摘要使用简洁中文，例如
  `feat: 初始化 Line Glow 代码块行高亮插件`、`fix: 修复 pnpm dev ...EBUSY`、
  `ui: 重排设置面板`、`ci:`、`docs:`、`chore:`。
- PR 需说明改动内容与动机、关联相关 issue；UI 改动请附截图或录屏。
- 提交 PR 前确认 `pnpm format:check`、`pnpm lint`、`pnpm typecheck`、`pnpm test` 均通过。

## 发布与 CI

推送 `v*` 标签会触发 `.github/workflows/release.yml`，依次执行类型检查、测试、
`pnpm build`，并把 `package.zip` 附加到 GitHub Release。请保持 `plugin.json`
与 `package.json` 的版本一致（`pnpm release` 会同时更新两者）。
