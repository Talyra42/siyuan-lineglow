import antfu from "@antfu/eslint-config";
import prettier from "eslint-config-prettier";

export default antfu(
  {
    type: "lib",
    // 代码风格统一交给 Prettier（见 .prettierrc.json），ESLint 只负责代码质量
    stylistic: false,
    typescript: true,
    formatters: true,
    ignores: ["dist", "dev", "node_modules"],
  },
  {
    rules: {
      "antfu/if-newline": "off",
      "antfu/top-level-function": "off",

      "no-console": "off",
      "no-empty": "off",

      "ts/consistent-type-imports": "off",
      "ts/explicit-function-return-type": "off",
      "ts/no-require-imports": "off",
      "ts/no-use-before-define": "warn",
      "ts/strict-boolean-expressions": "off",

      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": "warn",

      "unicorn/prefer-dom-node-text-content": "off",

      "format/prettier": "off",
    },
  },
  // 关闭所有可能与 Prettier 冲突的规则
  prettier,
);
