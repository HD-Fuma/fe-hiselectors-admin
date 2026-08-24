import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist", "coverage", "playwright-report", "test-results"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: { ecmaVersion: 2022, globals: globals.node },
  },
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
    plugins: { "react-hooks": reactHooks, "react-refresh": reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
    },
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?:\\.\\./)+(?:applicants|auth|campaigns|content|creators|notifications|performance|selectors|settlements|task-runs)(?:/|$)",
              message: "Feature끼리 직접 import하지 말고 app 조합 또는 entities/shared 경계를 사용하세요.",
            },
            {
              regex: "^(?:\\.\\./)+entities/[^/]+/(?:model|ui)(?:/|$)",
              message: "Entity 내부 경로 대신 해당 entity의 공개 index.ts를 사용하세요.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/app/**/*.{ts,tsx}", "src/components/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?:\\.\\./)+entities/[^/]+/(?:model|ui)(?:/|$)",
              message: "Entity 내부 경로 대신 해당 entity의 공개 index.ts를 사용하세요.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ["src/entities/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              regex: "^(?:\\.\\./)+features(?:/|$)",
              message: "Entity 계층은 feature 계층에 의존할 수 없습니다.",
            },
          ],
        },
      ],
    },
  },
);
