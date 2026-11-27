// SPDX-License-Identifier: MIT
import { resolve } from 'node:path'
import { defineConfig } from '@playwright/test'

// 文档站的浏览器测试（#2 第 4 步，从 KATANAview 的 e2e/ui-gallery*.spec.ts 搬来）：打包文档站，再用 `vp preview` 给页面，
// 跟线上的站点一样走打包产物。只跑 dpr-1 一个项目（用户 2026-11-14 定）；Happo 云端截图（ui-gallery-happo.spec.ts）不在这里，见 test:happo。
// 端口默认 5331；同一台机器上几个工作副本同时跑时各设一个 E2E_PORT。不复用已有的服务器：端口上要是别的副本起的服务，测到的就是别人的代码。
const port = Number(process.env.E2E_PORT ?? 5331)
const outDir = resolve('node_modules', '.cache', 'katana-ui-e2e', 'site')

export default defineConfig({
  testDir: 'e2e',
  // Happo 那份要云端账号：`pnpm test:happo`（设 E2E_HAPPO=1）才跑，别的时候不跑它。
  testMatch: process.env.E2E_HAPPO ? '**/ui-gallery-happo.spec.ts' : undefined,
  testIgnore: process.env.E2E_HAPPO ? undefined : ['**/ui-gallery-happo.spec.ts'],
  fullyParallel: true,
  reporter: process.env.CI ? [['list'], ['github']] : [['list']],
  // 并行数写死，不随机器核数变。原来照 KATANAview 写 8；#190 换到自建机（WSL，16 核 8 GB）后 8 个并行把按时间点量动画的断言
  // 挤到重跑一次都过不了（2026-11-24 run 45316916034：一片 4 分钟、6 条重跑后仍红），降到 4。
  workers: process.env.CI ? 4 : undefined,
  // CI 上失败的用例重跑一次（#190，2026-11-24）：自建机忙时，按时间点量动画、闪色、过场的断言每轮随机红几条，
  // 两次跑红的用例完全不同。重跑后才过的记成 flaky，报告里看得到；本机不重跑。
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: `http://127.0.0.1:${port}`,
    viewport: { width: 680, height: 360 },
    timezoneId: 'UTC',
    locale: 'zh-CN',
    deviceScaleFactor: 1,
  },
  webServer: {
    command: `pnpm exec vp build --logLevel error --outDir ${outDir} && pnpm exec vp preview --outDir ${outDir} --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}/`,
    reuseExistingServer: false,
    timeout: 5 * 60_000,
  },
  projects: [{ name: 'dpr-1' }],
})
