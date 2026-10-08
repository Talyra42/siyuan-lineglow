# Siyuan Line Glow

<div align="center">

Highlight the specified lines of a code block in SiYuan

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Talyra42/siyuan-lineglow/blob/main/LICENSE)
</div>

[简体中文](./README.zh-CN.md)

## ✨ Features

- 🎯 **Line ranges** - Highlight any lines of a code block with the VitePress line range syntax
- 🎨 **Whole line background** - Configurable color and opacity
- 🔢 **Line numbers** - The matching line numbers change color, optionally bold
- ⚙️ **Per block override** - Override the global styles on a single code block with a block attribute
- 🌐 **Theming** - Chinese and English UI, fully configurable colors

> Replace `icon.png` and `preview.png` before publishing.

## 📦 Installation

### From the marketplace (recommended)

1. Open SiYuan
2. Go to `Settings` - `Marketplace` - `Plugins`
3. Search for "Line Glow"
4. Install and enable

### Manually

1. Download `package.zip` from [Releases](https://github.com/Talyra42/siyuan-lineglow/releases)
2. Unzip it into `<workspace>/data/plugins/siyuan-lineglow`
3. Restart SiYuan
4. Enable it in `Settings` - `Marketplace` - `Downloaded`

## 🚀 Usage

1. Click the block icon on the left of a code block and choose `Plugin - Line Glow`
2. Or place the cursor inside the code block and press `⌥⌘H` (remappable in `Settings` - `Keymap`)
3. Type the line ranges, the preview updates while typing, then confirm

## 📝 Syntax

The line ranges follow the VitePress convention:

| Value | Meaning |
|---|---|
| `3` | the third line |
| `1-5` | lines 1 to 5 |
| `1,3-5,9` | lines 1, 3, 4, 5 and 9 |

Lines are counted from 1, ranges are inclusive, and several ranges are separated by an ASCII comma.

The value is stored in the `custom-code-hl` attribute of the code block, so it survives sync, history and export, and it can also be edited in the block attribute panel.

## 🎛️ Per block styles

Set `custom-code-hl-style` on a code block to override the plugin settings:

| Token | Effect |
|---|---|
| `bg` / `no-bg` | turn the line background on / off |
| `num` / `no-num` | turn the line number coloring on / off |
| `all` / `none` | turn every style on / off |

For example, `custom-code-hl-style="num,no-bg"` keeps only the line number coloring.

## ⚠️ Known limitation

Exported PDF, HTML and images are produced outside of the plugin runtime, so the highlight is not part of the exported output.

## 🛠️ Development

Install [NodeJS](https://nodejs.org/en/download) and [pnpm](https://pnpm.io/installation) first.

```bash
pnpm install
cp .env.example .env    # set VITE_SIYUAN_WORKSPACE_PATH
pnpm dev                # build into <workspace>/data/plugins/siyuan-lineglow
pnpm test               # unit tests
pnpm typecheck          # type check
pnpm lint               # lint
pnpm build              # produce dist/ and package.zip
pnpm release            # interactive release (version, commit, tag, push)
```

## ⚡ Performance and stability

- The code block markup is never modified: the highlight is drawn with inline styles on the code body plus one injected CSS rule, so nothing is serialized into the note and the caret and undo history stay intact
- The number of background layers is constant: every band is merged into a single vertical gradient, so exactly 1 layer exists no matter how many ranges are highlighted
- Rendering is debounced and bounded: DOM changes are coalesced with a 160ms debounce, a single block handles at most 200 ranges, and an attribute longer than 4096 characters is ignored
- Long documents are scanned in batches of 40 code blocks
- Nothing leaks: unload removes every listener, observer and injected style, and ResizeObserver entries for detached blocks are released during a full scan

## 📄 License

[MIT](./LICENSE)
