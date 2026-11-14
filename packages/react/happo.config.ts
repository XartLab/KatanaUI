// SPDX-License-Identifier: MIT
// Happo 视觉回归（试用，#1905）：CI 里 Playwright 跑到 happoScreenshot 时把 DOM 与资源交给 Happo 云端渲染，
// PR 跟分支起点那次提交的截图比。key / secret 只从环境读；GitHub Actions 上用 OIDC 登录，不配 secret。
// 配置项出处：https://docs.happo.io/docs/configuration （2026-11-14 读）。
import { defineConfig } from 'happo'

export default defineConfig({
  apiKey: process.env.HAPPO_API_KEY ?? undefined,
  apiSecret: process.env.HAPPO_API_SECRET ?? undefined,

  project: 'default',
  integration: {
    type: 'playwright',
  },

  // https://docs.happo.io/docs/configuration#targets
  targets: {
    'chrome-large': {
      type: 'chrome',
      viewport: '1200x900',
    },

    'chrome-small': {
      type: 'chrome',
      viewport: '375x667',
    },

    accessibility: {
      type: 'accessibility',
      viewport: '1024x768',
    },
  },
})
