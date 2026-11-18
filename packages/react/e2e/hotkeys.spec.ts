// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 快捷键注册表、快捷键总览、命令面板「最近」（#77 G9）：在文档站 hotkeys、shortcut-sheet、command-palette 三页上真按键。
// Playwright 的 Chromium 跑在 Linux 上，Mod 是 Ctrl。

test.use({ viewport: { width: 1100, height: 1500 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  await page.locator(`[data-gallery="${id}"]`).waitFor()
  return page.locator(`[data-gallery="${id}"]`)
}

test('hotkeys：Alt+R 触发、输入框里不触发；Ctrl+/ 开总览，冲突标出、可搜、关掉作用域变灰', async ({ page }) => {
  const area = await open(page, 'hotkeys')
  const log = area.getByTestId('hotkey-log')
  await expect(log).toHaveText('最近触发：无')
  await area.getByRole('textbox', { name: '试着在这里按 Alt+R' }).focus()
  await page.keyboard.press('Alt+R')
  await expect(log).toHaveText('最近触发：无')
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Alt+R')
  await expect(log).toHaveText('最近触发：重置图表')

  await page.keyboard.press('Control+/')
  const dialog = page.getByRole('dialog', { name: '键盘快捷键' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('heading', { name: '图表' })).toBeVisible()
  await expect(dialog.locator('[data-shortcut="chart-alert"]')).toContainText('与「画线工具」冲突')
  await expect(dialog.locator('[data-shortcut="chart-drawing"]')).toHaveAttribute('data-conflict', '')
  await dialog.getByRole('searchbox', { name: '查找快捷键' }).fill('截图')
  await expect(dialog.locator('[data-shortcut]')).toHaveCount(1)
  await dialog.getByRole('searchbox', { name: '查找快捷键' }).fill('')
  await page.keyboard.press('Escape')
  await expect(dialog).toBeHidden()

  await area.getByRole('switch', { name: '自选表作用域' }).click()
  await page.keyboard.press('Control+/')
  await expect(dialog.locator('[data-shortcut="watch-flag"]')).toHaveAttribute('data-disabled', '')
})

test('command-palette：Ctrl+Shift+P 打开（文档站搜索占着 Ctrl+K），执行一条后它进「最近」，刷新后还在', async ({
  page,
}) => {
  const area = await open(page, 'command-palette')
  await page.evaluate(() => localStorage.removeItem('katana-ui-gallery:command-recent'))
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Control+Shift+P')
  const palette = page.getByRole('dialog', { name: '命令面板' })
  await expect(palette).toBeVisible()
  await expect(palette.getByRole('group', { name: '最近' })).toHaveCount(0)
  await page.keyboard.type('主题')
  await page.keyboard.press('Enter')
  await expect(palette).toBeHidden()
  await expect(area.getByTestId('palette-log')).toContainText('执行了：切换主题')

  await page.reload()
  await page.locator('[data-gallery="command-palette"]').waitFor()
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Control+Shift+P')
  const recent = palette.getByRole('group', { name: '最近' })
  await expect(recent.getByRole('option')).toHaveText(['切换主题'])
  // 一输入，最近就不出，同一条不会出现两次
  await page.keyboard.type('主题')
  await expect(palette.getByRole('option', { name: '切换主题' })).toHaveCount(1)
})

test('shortcut-sheet：打开改键后录一个新组合，占用的组合提示冲突不写入', async ({ page }) => {
  const area = await open(page, 'shortcut-sheet')
  const sheet = area.getByTestId('sheet-inline')
  await area.getByRole('switch', { name: '改键' }).click()
  const reset = sheet.getByRole('button', { name: '重置图表' })
  await reset.click()
  await page.keyboard.press('Alt+A')
  await expect(sheet.locator('[data-shortcut="chart-reset"]')).toContainText('已被')
  await page.keyboard.press('Alt+X')
  await expect(sheet.locator('[data-shortcut="chart-reset"] .k-rec-field')).toContainText('X')
  // 新键真的生效：页上按 Alt+X 不报错、旧的 Alt+R 不再属于重置图表
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await expect(sheet.locator('[data-shortcut="chart-reset"] .k-rec-field')).not.toContainText('R')
})
