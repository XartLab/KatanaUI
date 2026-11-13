// SPDX-License-Identifier: MIT
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite-plus'

// 组件库自己的 Vite+ 配置：本包要能单独成仓库（XartLab/KatanaUI，由 KATANAview 的 packages/ui 同步出去），
// 所以文档站、测试、格式化、代码检查都不靠根目录。在 KATANAview 里跑时根目录有自己的配置（vite.config.ts），不读这份。
// 格式化与代码检查的规则跟根目录一致，改的时候两边一起改。
export default defineConfig({
  // 文档站的地址前缀：Pages 发布在 /KatanaUI/ 下，用 SITE_BASE=/KatanaUI/ 给；不给就是根路径（本地 dev 与预览）。
  base: process.env.SITE_BASE ?? '/',
  // 样式用 Tailwind v4（决策记录 0049）。JSX 由 tsconfig 的 jsx: react-jsx 交给 Vite+ 自带的转换，不用 React 插件。
  plugins: [tailwindcss()],
  build: { outDir: 'dist', emptyOutDir: true },
  // 单测：Node 环境；组件用 react-dom/server 渲染成字符串测结构。浏览器里的行为在 KATANAview 的 e2e/ui-gallery.spec.ts。
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}', 'gallery/**/*.test.{ts,tsx}', 'scripts/**/*.test.ts'],
  },
  // 格式化（Oxfmt）：无分号、单引号、行宽 120；Markdown 不格式化；tokens.css 是脚本生成的。
  fmt: {
    semi: false,
    singleQuote: true,
    printWidth: 120,
    ignorePatterns: ['**/*.md', 'src/tokens/tokens.css', 'src/tokens/tokens.json', 'dist/**', 'r/**'],
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
