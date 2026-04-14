import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'
import pluginRouter from '@tanstack/eslint-plugin-router'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'src/routeTree.gen.ts']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommendedTypeChecked,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
      reactX.configs['recommended-typescript'],
      reactDom.configs.recommended,
      pluginRouter.configs['flat/recommended'],
    ],
    rules: {
      "react-refresh/only-export-components": ["error", { "extraHOCs": ["createFileRoute", "createRootRouteWithContext"]}],
      "@typescript-eslint/only-throw-error": [
        "error",
        {
          "allow": [
            {
              "from": "package",
              "package": "@tanstack/router-core",
              "name": "Redirect"
            },
            {
              "from": "package",
              "package": "@tanstack/router-core",
              "name": "NotFoundError"
            }
          ]
        }
      ]
    },
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
