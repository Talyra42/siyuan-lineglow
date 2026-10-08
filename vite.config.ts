/* eslint-disable node/prefer-global/process */
import { existsSync } from "node:fs"
import { resolve } from "node:path"
import fg from "fast-glob"
import minimist from "minimist"
import {
  defineConfig,
  loadEnv,
} from "vite"
import { viteStaticCopy } from "vite-plugin-static-copy"
import zipPack from "vite-plugin-zip-pack"

const pluginInfo = require("./plugin.json")
const packageImageTargets = [
  ["icon", "icon.png"],
  ["preview", "preview.png"],
].flatMap(([field, legacyName]) => {
  const fileName = pluginInfo[field] || (existsSync(legacyName) ? legacyName : "")
  return fileName ? [{ src: `./${fileName}`, dest: "./" }] : []
})

export default defineConfig(({
  mode,
}) => {
  const env = loadEnv(mode, process.cwd(), "")
  const {
    VITE_SIYUAN_WORKSPACE_PATH,
  } = env

  let devDistDir = "./dev"
  if (!VITE_SIYUAN_WORKSPACE_PATH) {
    console.log("\nSiyuan workspace path is not set, build to ./dev instead.")
  } else {
    console.log(`\nSiyuan workspace path is set:\n${VITE_SIYUAN_WORKSPACE_PATH}`)
    devDistDir = `${VITE_SIYUAN_WORKSPACE_PATH}/data/plugins/${pluginInfo.name}`
  }

  const args = minimist(process.argv.slice(2))
  const isWatch = args.watch || args.w || false
  const distDir = isWatch ? devDistDir : "./dist"

  console.log(`mode=> ${mode}`)
  console.log(`isWatch=> ${isWatch}`)
  console.log(`distDir=> ${distDir}`)

  return {
    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
      },
    },

    plugins: [
      viteStaticCopy({
        targets: [
          ...packageImageTargets,
          {
            src: "./README*.md",
            dest: "./",
          },
          {
            // 让包内 README 里的 [MIT](./LICENSE) 链接有效，同时满足 MIT 的署名随副本分发要求
            src: "./LICENSE",
            dest: "./",
          },
          {
            src: "./plugin.json",
            dest: "./",
          },
          {
            src: "./src/i18n/**",
            dest: "./i18n/",
          },
        ],
      }),
    ],

    define: {
      "process.env.DEV_MODE": `"${isWatch}"`,
      "process.env.NODE_ENV": JSON.stringify(process.env.NODE_ENV),
    },

    build: {
      outDir: distDir,
      emptyOutDir: !isWatch,

      sourcemap: isWatch,

      minify: !isWatch,

      lib: {
        entry: resolve(__dirname, "src/index.ts"),
        fileName: "index",
        formats: ["cjs"],
      },
      rollupOptions: {
        plugins: [
          ...(isWatch
            ? [
                {
                  // 监听静态资源文件
                  // 这里只监听项目里的源文件；不要在部署目录上建立文件监视，
                  // 该目录同时被思源读取，Windows 下 chokidar 会抛 EBUSY 直接中断构建。
                  name: "watch-external",
                  async buildStart() {
                    const files = await fg([
                      "src/i18n/*.json",
                      "./README*.md",
                      "./plugin.json",
                    ])
                    for (const file of files) {
                      this.addWatchFile(file)
                    }
                  },
                },
              ]
            : [
                zipPack({
                  inDir: "./dist",
                  outDir: "./",
                  outFileName: "package.zip",
                }),
              ]),
        ],

        external: ["siyuan", "process"],

        output: {
          entryFileNames: "[name].js",
          assetFileNames: (assetInfo) => {
            if (assetInfo.name === "style.css") {
              return "index.css"
            }
            return assetInfo.name
          },
        },
      },
    },
  }
})
