// SPDX-License-Identifier: MIT
import { test } from 'happo/playwright'
import { PAGES } from '../gallery/registry'

// Happo 视觉回归（试用，#1905）：组件文档站每一页的预览在两个主题下各交一张给 Happo，PR 跟分支起点比。
// 只在 `happo -- playwright test` 下真的发（它设 HAPPO_E2E_PORT）；平时跑这条只走一遍页面，不截不传。
// 这是对 2026-10-28「不比截图基线」的试用例外（decisions.md 2026-11-14）：截图在 Happo 云端渲染，不进仓库、不占 CI 带宽。
// 行为断言仍在 ui-gallery.spec.ts，这里只交图。

const THEMES = ['console', 'graphite'] as const

for (const theme of THEMES) {
  test(`组件文档站每一页交给 Happo（${theme}）`, async ({ page, happoScreenshot }) => {
    await page.goto(`/?theme=${theme}#/${PAGES[0].id}`)
    for (const { id } of PAGES) {
      await page.getByRole('navigation', { name: '组件' }).getByRole('link', { name: id, exact: true }).click()
      const preview = page.locator(`[data-gallery="${id}"]`)
      await preview.waitFor()
      await happoScreenshot(preview, { component: id, variant: theme })
    }
  })
}
