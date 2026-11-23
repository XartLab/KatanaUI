// SPDX-License-Identifier: MIT
// 品种搜索（#77 第 1 条）：打字即开、方向键走行、回车回调、最近搜索出现、Esc 关后焦点回到图上。只量用户看得见的行为。
import { expect, test, type Page } from '@playwright/test'

test.use({ viewport: { width: 1100, height: 1000 } })

const open = async (page: Page, theme: string) => {
  await page.goto(theme === 'graphite' ? '/#/symbol-search' : `/?theme=${theme}#/symbol-search`)
  await page.locator('[data-gallery="symbol-search"]').waitFor()
}

for (const theme of ['graphite', 'console']) {
  test(`SymbolSearch（${theme}）：在图上打字即开且带上打的字，↓ 走行、回车回调并关上，再开时「最近搜索」里有它，Esc 关后焦点回到图上`, async ({
    page,
  }) => {
    await open(page, theme)
    const area = page.getByTestId('symbol-search-area')
    await area.focus()
    await page.keyboard.type('a')

    const dialog = page.getByRole('dialog', { name: '品种搜索' })
    await expect(dialog).toBeVisible()
    const input = dialog.getByRole('combobox')
    await expect(input).toBeFocused()
    await expect(input).toHaveValue('a')
    // 接着打的字进输入框，不会再开一次。
    await page.keyboard.type('a')
    await expect(input).toHaveValue('aa')
    await page.keyboard.press('Backspace')

    const rows = dialog.getByRole('option')
    await expect(rows.first()).toBeVisible()
    // 演示的搜索代码前缀优先：a → ADAUSDT、AAPL、AMD，再是名称里有 a 的 NVDA；命中段是 mark。
    await expect(rows).toHaveCount(4)
    await expect(rows.first()).toHaveAttribute('data-symbol', 'ADAUSDT')
    await expect(rows.first().locator('mark').first()).toHaveText('A')
    await expect(rows.first()).toHaveAttribute('aria-selected', 'true')

    await page.keyboard.press('ArrowDown')
    await expect(rows.nth(1)).toHaveAttribute('aria-selected', 'true')
    await expect(rows.first()).toHaveAttribute('aria-selected', 'false')
    const second = await rows.nth(1).getAttribute('data-symbol')

    await page.keyboard.press('Enter')
    await expect(dialog).toBeHidden()
    await expect(page.getByTestId('symbol-search-picked')).toContainText(`:${second}`)

    // 再开：空查询时「最近搜索」组里第一行就是刚选的。
    await area.focus()
    await page.keyboard.type('x')
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Backspace')
    const recent = dialog.locator('[data-slot="symbol-search-recent"]')
    await expect(recent).toBeVisible()
    await expect(recent.getByRole('option').first()).toHaveAttribute('data-symbol', second!)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(area).toBeFocused()
  })
}

test('SymbolSearch：市场分段过滤结果，点分段后焦点回到输入框；没有匹配时写空态', async ({ page }) => {
  await open(page, 'graphite')
  await page.getByTestId('symbol-search-area').focus()
  await page.keyboard.type('6')
  const dialog = page.getByRole('dialog', { name: '品种搜索' })
  await expect(dialog.getByRole('option').first()).toBeVisible()

  await dialog.getByRole('button', { name: '指数' }).click()
  await expect(dialog.getByRole('button', { name: '指数' })).toHaveAttribute('aria-pressed', 'true')
  await expect(dialog.getByRole('combobox')).toBeFocused()
  await expect(dialog.getByRole('option')).toHaveCount(0)
  await expect(dialog.getByText('没有匹配的品种')).toBeVisible()

  await dialog.getByRole('button', { name: '股票' }).click()
  await expect(dialog.getByRole('option').first()).toHaveAttribute('data-symbol', '600519')
})
