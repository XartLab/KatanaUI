// SPDX-License-Identifier: MIT
// 组件级截图（Vitest 浏览器模式 + pixelgate）：只渲染改了的件、直接在浏览器里截，不先构建整站。
// 快速模式用它；整页的 423 张仍由 `pnpm vr`（pixelgate run）在合并前跑。
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { availableParallelism } from 'node:os'
import { PixelgateReporter, pixelgateScreenshots } from 'pixelgate-cli/vitest'
import { defineConfig } from 'vite-plus'
import { sourceConditions } from './vite.config.ts'

export default defineConfig({
  plugins: [tailwindcss()],
  ...sourceConditions,
  test: {
    include: ['browser/**/*.browser.test.tsx'],
    // Vitest 默认不处理 CSS（换成空）；截图要真样式。
    css: true,
    // 自建机上整套 13 个文件一起开页，WebGL 件（SwiftShader 软渲）把 CPU 占满，别的页「等元素稳定」超时（#219，main 的 run 45412157714 有 5 个超时）：
    // 同时最多 4 页；CI 上整条测试给 60s（#190：main 949e9867 的 dither-chart、strategy-report-panes 超 15s），本地 30s。
    maxWorkers: Math.min(4, availableParallelism()),
    testTimeout: process.env.CI ? 60_000 : 30_000,
    reporters: ['default', new PixelgateReporter({ outDir: '.pixelgate-unit' })],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      viewport: { width: 480, height: 320 },
      expect: { toMatchScreenshot: { ...pixelgateScreenshots({ outDir: '.pixelgate-unit' }), timeout: 10_000 } },
    },
  },
})
