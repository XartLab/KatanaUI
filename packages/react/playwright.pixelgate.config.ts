// SPDX-License-Identifier: MIT
import type { PixelgateOptions } from 'pixelgate-cli/playwright'
import { defineConfig } from '@playwright/test'
import base from './playwright.config'

// pixelgate 视觉回归试点（只报告，不进门禁）：沿用 playwright.config.ts 的 webServer 与 dpr-1 项目，只把 testDir 换成 visual/。
// 所以 `pnpm test:e2e` 不跑这里的用例，`pnpm test:visual` 不跑行为断言。
// 基线按平台分目录（<项目>-<平台>）：只提交 Linux 的，由 CI 产出，本机 Windows 的基线被 .gitignore 挡掉。
// 本机：没有基线就写新的（new）；CI：不写（none），缺基线只报告。
export default defineConfig<{ pixelgateOptions: PixelgateOptions }>({
  ...base,
  testDir: 'visual',
  testMatch: undefined,
  testIgnore: undefined,
  reporter: [['list'], ['pixelgate-cli/playwright-reporter']],
  use: {
    ...base.use,
    pixelgateOptions: { update: process.env.CI ? 'none' : 'new' },
  },
})
