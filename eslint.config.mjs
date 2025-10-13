import { FlatCompat } from "@eslint/eslintrc"
import js from "@eslint/js"
import globals from "globals"
import { fileURLToPath } from "node:url"

const baseDir = fileURLToPath(new URL("./", import.meta.url))

const compat = new FlatCompat({
  baseDirectory: baseDir,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
})

export default [
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "coverage/**",
      "*.config.ts",
    ],
  },
  ...compat.extends(
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:testing-library/react",
    "plugin:jest-dom/recommended",
  ),
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: baseDir,
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.node,
        ...globals.browser,
        JSX: true,
      },
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      semi: ["error", "never"],
  quotes: ["error", "double", { avoidEscape: true }],
      indent: ["error", 2, { SwitchCase: 1, VariableDeclarator: 1 }],
      "comma-dangle": ["error", "always-multiline"],
      "object-curly-spacing": ["error", "always"],
      "arrow-parens": ["error", "always"],
      "max-len": ["error", { code: 100, ignoreUrls: true }],
      "no-console": "error",
      "@typescript-eslint/no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_",
        ignoreRestSiblings: true,
      }],
      "@typescript-eslint/explicit-module-boundary-types": "off",
      "@typescript-eslint/explicit-function-return-type": "off",
      "react/react-in-jsx-scope": "off",
      "react/jsx-uses-react": "off",
      "react/jsx-filename-extension": ["error", { extensions: [".tsx"] }],
      "testing-library/await-async-queries": "off",
      "testing-library/no-unnecessary-act": "off",
    },
  },
  {
    files: ["**/*.spec.ts", "**/*.spec.tsx", "**/*.test.ts", "**/*.test.tsx"],
    languageOptions: {
      globals: {
        ...globals.jest,
        ...globals.node,
      },
    },
    rules: {
      "max-len": "off",
      "no-console": "off",
    },
  },
]
