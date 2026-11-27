// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// StrategyLauncher 策略入口（#245 模块 2）：在文档站的页上真点真按，断言看得见的行为与 ARIA。

test.use({ viewport: { width: 1100, height: 1200 } })

const open = async (page: Page) => {
  await page.goto('/?theme=graphite#/strategy-launcher')
  const area = page.locator('[data-gallery="strategy-launcher"]')
  await area.waitFor()
  return area
}

test('StrategyLauncher：风险提示可关；点卡与 Enter / 空格打开；键盘逐张走', async ({ page }) => {
  const area = await open(page)
  const opened = area.locator('[data-gallery-opened]')
  const notice = area.getByRole('note')
  await expect(notice).toContainText('策略会按设定自动下单')
  await expect(opened).toHaveText('点一张卡')

  const cards = area.getByRole('list').getByRole('button')
  await expect(cards).toHaveCount(4)
  await expect(area.getByText('震荡行情 / 自动低买高卖 / 区间可调')).toBeVisible()
  await expect(area.locator('[data-slot="launcher-new"]')).toHaveText('新') // 只有一张带角标

  await cards.filter({ hasText: '网格策略' }).click()
  await expect(opened).toHaveText('打开：grid')

  // Tab：关闭钮 → 各张卡；Enter 与空格都能打开。
  await area.getByRole('button', { name: '关闭风险提示' }).focus()
  await page.keyboard.press('Tab')
  await expect(cards.nth(0)).toBeFocused()
  await page.keyboard.press('Tab')
  await expect(cards.nth(1)).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(opened).toHaveText('打开：dca')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Space')
  await expect(opened).toHaveText('打开：signal')

  await area.getByRole('button', { name: '关闭风险提示' }).click()
  await expect(notice).toHaveCount(0)
  await expect(cards).toHaveCount(4)
})
