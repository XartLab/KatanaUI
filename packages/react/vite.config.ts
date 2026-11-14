// SPDX-License-Identifier: MIT
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite-plus'

// 组件库自己的 Vite+ 配置。XartLab/KatanaUI 是组件库的源头仓库（#2），文档站、测试、格式化、代码检查都在包里配，不靠仓库根目录。
// 格式化与代码检查的规则跟 packages/tokens 一致，改的时候两边一起改。
export default defineConfig({
  // 文档站的地址前缀：Pages 发布在 /KatanaUI/ 下，用 SITE_BASE=/KatanaUI/ 给；不给就是根路径（本地 dev 与预览）。
  base: process.env.SITE_BASE ?? '/',
  // 样式用 Tailwind v4（决策记录 0049）。JSX 由 tsconfig 的 jsx: react-jsx 交给 Vite+ 自带的转换，不用 React 插件。
  plugins: [tailwindcss()],
  build: { outDir: 'dist', emptyOutDir: true },
  // 单测：Node 环境；组件用 react-dom/server 渲染成字符串测结构。浏览器里的行为在 e2e/（`pnpm test:e2e`，Playwright）。
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'gallery/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts', 'ds/**/*.test.{ts,tsx}'],
  },
  // 格式化（Oxfmt）：无分号、单引号、行宽 120；Markdown 与生成文件不格式化。
  fmt: {
    semi: false,
    singleQuote: true,
    printWidth: 120,
    ignorePatterns: [
      '**/*.md',
      // 设计系统包由 ds-build.mjs 生成、shadcn 清单由 registry-json.mjs 生成，格式归生成器管（与 KATANAview 根目录的配置一致）。
      'design-system/**',
      'registry.json',
      'dist/**',
      'r/**',
    ],
  },
  // 代码检查（Oxlint，带类型信息）：有一条提示就不过；用不上的豁免注释也报。
  lint: {
    plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'react'],
    options: { typeAware: true, denyWarnings: true, reportUnusedDisableDirectives: 'deny' },
    ignorePatterns: ['dist/**', 'r/**'],
    rules: {
      'typescript/unbound-method': 'off',
      'unicorn/no-new-array': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'typescript/restrict-template-expressions': ['warn', { allowArray: true }],
    },
  },
})
