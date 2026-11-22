// SPDX-License-Identifier: MIT
import tailwindcss from '@tailwindcss/vite'
import { defaultClientConditions, defaultServerConditions, defineConfig } from 'vite-plus'

// 同仓库的包（@katana-ui/logos）在 exports 里给了 katana-source 条件（不用通用的 source：@internationalized/date 等第三方包也用它指向自己的 TS 源码）指向 TS 源码：开发、单测、文档站构建都读源码，不等它先构建 lib/（#94）。
// 装好的包没有这个条件也能用（落到 default 的 lib/）。浏览器截图的配置与 ds-build 也引这两个。
export const sourceConditions = {
  resolve: { conditions: ['katana-source', ...defaultClientConditions] },
  ssr: {
    resolve: { conditions: ['katana-source', ...defaultServerConditions], externalConditions: ['katana-source'] },
  },
}

// 组件库自己的 Vite+ 配置。XartLab/KatanaUI 是组件库的源头仓库（#2），文档站、测试、格式化、代码检查都在包里配，不靠仓库根目录。
// 格式化与代码检查的规则跟 packages/tokens 一致，改的时候两边一起改。
export default defineConfig({
  // 文档站的地址前缀：Pages 发布在 /KatanaUI/ 下，用 SITE_BASE=/KatanaUI/ 给；不给就是根路径（本地 dev 与预览）。
  base: process.env.SITE_BASE ?? '/',
  // 样式用 Tailwind v4（决策记录 0049）。JSX 由 tsconfig 的 jsx: react-jsx 交给 Vite+ 自带的转换，不用 React 插件。
  plugins: [tailwindcss()],
  ...sourceConditions,
  build: { outDir: 'dist', emptyOutDir: true },
  // 单测：Node 环境；组件用 react-dom/server 渲染成字符串测结构。浏览器里的行为在 e2e/（`pnpm test:e2e`，Playwright）。
  test: {
    environment: 'node',
    // 不隔离：同一 worker 里的测试文件共用模块缓存。测试多半经 src/index 引件，隔离时每个文件都重新加载整个库（导入占八成时间）；
    // 关掉后全量从约 43 秒降到约 12 秒，快速模式受影响的单测从约 20 秒降到约 5 秒（2026-11-18 实测）。测试之间不共享可变状态是前提。
    isolate: false,
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
      'lib/**',
      'r/**',
      // A2UI 的 JSON Schema 是原样拷贝（Apache-2.0，不许改动格式）；目录 JSON 由 pnpm a2ui:catalog 生成，格式归生成器管。
      'src/a2ui/__fixtures__/**',
      'public/**',
    ],
  },
  // 代码检查（Oxlint，带类型信息）：有一条提示就不过；用不上的豁免注释也报。
  lint: {
    plugins: ['eslint', 'typescript', 'unicorn', 'oxc', 'react'],
    options: { typeAware: true, denyWarnings: true, reportUnusedDisableDirectives: 'deny' },
    ignorePatterns: ['dist/**', 'lib/**', 'r/**'],
    rules: {
      'typescript/unbound-method': 'off',
      'unicorn/no-new-array': 'off',
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', ignoreRestSiblings: true }],
      'typescript/restrict-template-expressions': ['warn', { allowArray: true }],
    },
  },
  // 带缓存的任务（`vp run <名>`，Vite+ 任务缓存）：输入文件没变就直接命中，不重跑——快速模式与全量都走它们。
  run: {
    tasks: {
      tsc: { command: 'tsc -p tsconfig.json' },
      unit: { command: 'vp test run' },
      'docs-check': {
        command: [
          'node scripts/ui-coverage.mjs --check',
          'node scripts/docs-props.mjs --check',
          'node scripts/ds-build.mjs --check',
        ],
      },
    },
  },
  // 提交前只查暂存的文件（`vp staged`，由 .vite-hooks/pre-commit 调用）：格式与 lint 能自动修的就修。
  staged: {
    '*.{ts,tsx,mts,js,mjs,css,json}': 'vp check --fix',
  },
})
