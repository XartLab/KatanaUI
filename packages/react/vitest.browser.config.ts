// SPDX-License-Identifier: MIT
// 组件级截图（Vitest 浏览器模式 + pixelgate）：只渲染改了的件、直接在浏览器里截，不先构建整站。
// 快速模式用它；整页的 423 张仍由 `pnpm vr`（pixelgate run）在合并前跑。
import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
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
    reporters: ['default', new PixelgateReporter({ outDir: '.pixelgate-unit' })],
    browser: {
      enabled: true,
      headless: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      viewport: { width: 480, height: 320 },
      expect: { toMatchScreenshot: pixelgateScreenshots({ outDir: '.pixelgate-unit' }) },
    },
  },
})
