// SPDX-License-Identifier: MIT
import { defineConfig } from 'vite-plus'

// 徽标包自己的 Vite+ 配置（单测、格式化、代码检查）。格式化与代码检查的规则跟 packages/react、packages/tokens 一致，改的时候几处一起改。
export default defineConfig({
  test: { environment: 'node', isolate: false, include: ['src/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'] },
  fmt: {
    semi: false,
    singleQuote: true,
    printWidth: 120,
    ignorePatterns: [
      '**/*.md',
      'lib/**',
      // 生成物：scripts/sync-web3icons.mjs 写的，格式归生成器管。
      'src/web3icons-map.ts',
    ],
  },
  lint: {
    plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'react'],
    options: { typeAware: true, denyWarnings: true, reportUnusedDisableDirectives: 'deny' },
    ignorePatterns: ['lib/**'],
    rules: {
      'typescript/unbound-method': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
})
