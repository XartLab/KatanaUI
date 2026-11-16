// SPDX-License-Identifier: MIT
import { expect, test } from 'pixelgate-cli/playwright'

// pixelgate 视觉回归试点：组件文档站挑几页，在两个主题下各截预览容器；再各截一张打开的对话框。
// 只挑静止的页：有计时器或画布循环的页（matrix-orb、market-heatmap、rolling-text、skeleton、总览的行情滚动）不在这里。
// 页面不稳就换页，不加遮罩。行为断言不在这里，见 e2e/ui-gallery.spec.ts。

test.use({ viewport: { width: 1100, height: 1500 } })

const THEMES = ['graphite', 'console'] as const
const PAGE_IDS = ['button', 'select', 'tabs', 'badge', 'data-grid', 'quote-card'] as const

for (const theme of THEMES) {
  test.describe(theme, () => {
    for (const id of PAGE_IDS) {
      test(id, async ({ page, pixelgate }) => {
        await page.goto(`/?theme=${theme}#/${id}`)
        const preview = page.locator(`[data-gallery="${id}"]`)
        await preview.waitFor()
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await pixelgate.screenshot(`${theme}/${id}`, { locator: preview })
      })
    }

    test('dialog-open', async ({ page, pixelgate }) => {
      await page.goto(`/?theme=${theme}#/dialog`)
      await page.locator('[data-gallery="dialog"]').waitFor()
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
      await page.locator('[data-gallery="dialog"]').getByRole('button', { name: '对话框', exact: true }).click()
      const dialog = page.getByRole('dialog', { name: '恢复默认布局' })
      await expect(dialog).toBeVisible()
      await pixelgate.screenshot(`${theme}/dialog-open`, { locator: dialog })
    })
  })
}
