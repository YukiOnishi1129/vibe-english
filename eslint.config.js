import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";

import queryKeysInQueriesOnly from "./eslint-rules/query-keys-in-queries-only.js";
import presenterIsPure from "./eslint-rules/presenter-is-pure.js";
import componentFolderStructure from "./eslint-rules/component-folder-structure.js";

const local = {
  rules: {
    "query-keys-in-queries-only": queryKeysInQueriesOnly,
    "presenter-is-pure": presenterIsPure,
    "component-folder-structure": componentFolderStructure,
  },
};

export default tseslint.config(
  {
    ignores: [
      "**/dist/**",
      "**/dist-types/**",
      "**/node_modules/**",
      "**/.wrangler/**",
      "**/generated.ts",
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  // ---------------------------------------------------------------- web app
  {
    files: ["apps/web/src/**/*.{ts,tsx}"],
    plugins: { local, "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,

      "local/query-keys-in-queries-only": "error",
      "local/presenter-is-pure": "error",
      "local/component-folder-structure": "error",

      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*", "./../*"],
              message:
                "相対パスではなく絶対パス（@/...）で import してください。同一コンポーネント内の ./ のみ許可されます。",
            },
            {
              group: ["@/features/*/components/*/*"],
              message:
                "コンポーネントは index.ts 経由で import してください（Presenter の直接参照は禁止）。",
            },
          ],
        },
      ],
    },
  },

  // Containers own data access; presenters receive props.
  {
    files: ["apps/web/src/**/*Presenter.tsx"],
    rules: {
      "react-hooks/rules-of-hooks": "error",
    },
  },

  // Only hooks may reach into the queries layer.
  {
    files: ["apps/web/src/features/*/components/**/*.tsx"],
    plugins: { local },
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/features/*/queries/*"],
              message:
                "コンポーネントから queries を直接 import せず、hooks 経由で使ってください。",
            },
            {
              group: ["../*", "./../*"],
              message: "絶対パス（@/...）で import してください。",
            },
          ],
        },
      ],
    },
  },

  // --------------------------------------------------------------- api app
  {
    files: ["apps/api/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@vibe-english/db",
              // The route layer gets its database handle from context; the
              // repositories themselves belong behind a usecase.
              importNames: ["chunkRepo", "progressRepo", "flagRepo"],
              message:
                "ルートから repository を直接使わず、usecase（@vibe-english/domain）を経由してください。",
            },
          ],
          patterns: [
            {
              group: ["@vibe-english/db/*", "**/repository/*"],
              message:
                "ルートから repository を直接使わず、usecase（@vibe-english/domain）を経由してください。",
            },
          ],
        },
      ],
    },
  },

  // Usecases stay transport-agnostic so a future mobile BFF can reuse them.
  {
    files: ["packages/domain/src/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            { name: "hono", message: "usecase は HTTP 層に依存できません。" },
          ],
        },
      ],
    },
  },

  {
    files: ["**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },

  // Scripts and tests run in Node.
  {
    files: ["scripts/**/*.ts", "tests/**/*.ts", "**/*.config.ts"],
    rules: { "no-restricted-imports": "off" },
  },
);
