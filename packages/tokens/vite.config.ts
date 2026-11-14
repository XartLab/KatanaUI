// SPDX-License-Identifier: MIT
import { defineConfig } from 'vite-plus'

// token 包自己的 Vite+ 配置（单测、格式化、代码检查）。格式化与代码检查的规则跟 packages/react 一致，改的时候两边一起改。
export default defineConfig({
  test: { environment: 'node', include: ['scripts/**/*.test.ts'] },
  fmt: {
    semi: false,
    singleQuote: true,
    printWidth: 120,
    ignorePatterns: [
      '**/*.md',
      // 生成物。
      'src/tokens.css',
      // token 源头沿用原来 design/tokens.json 的手排格式（KATANAview 里 design/** 不格式化）。
      'src/tokens.json',
      'src/motion.tokens.json',
    ],
  },
  lint: {
    plugins: ['eslint', 'typescript', 'unicorn', 'oxc'],
    options: { typeAware: true, denyWarnings: true, reportUnusedDisableDirectives: 'deny' },
    rules: {
      'typescript/unbound-method': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    },
  },
})
