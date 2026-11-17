// SPDX-License-Identifier: MIT
import { defineConfig } from 'pixelgate-cli'
import { PAGES } from './gallery/registry.ts'
import { base, componentPages, wholePage } from './pixelgate.shared.ts'

// 视觉回归主配置：文档站每个组件页的预览，graphite（默认主题）与 console 各一张，1440x900、dpr 1。
// 高清（dpr 2）的一小组关键页在 pixelgate.hidpi.config.ts；`pnpm vr` 两份都跑。
export default defineConfig({
  ...base,
  targets: {
    desktop: { viewport: '1440x900', deviceScaleFactor: 1 },
  },
  pages: [
    ...componentPages('graphite'),
    ...componentPages('console'),
    // 文档站外壳三张：首页（落到第一个组件页）、一个组件页的整页、一个基础页。
    wholePage('graphite', PAGES[0].id, 'shell-home'),
    wholePage('graphite', 'input', 'shell-component'),
    wholePage('graphite', 'color', 'shell-foundation'),
  ],
})
