import antfu from "@antfu/eslint-config"

export default antfu(
  {
    type: "lib",
    stylistic: {
      indent: 2,
      quotes: "double",
      semi: true,
    },
    typescript: true,
    formatters: true,
    ignores: [
      "dist",
      "dev",
      "node_modules",
    ],
  },
  {
    rules: {
      "antfu/if-newline": "off",
      "antfu/top-level-function": "off",

      "no-console": "off",
      "no-empty": "off",

      "style/brace-style": "off",
      "style/padded-blocks": "off",
      "style/quotes": "off",
      "style/semi": "off",

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
)
