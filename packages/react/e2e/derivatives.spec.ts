// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 交易数据看板与加密异动（#245 模块 1）：在文档站页上真点、真悬停、真按键，断言用户看得见的结果。演示数据见 gallery/usage/DerivativesBoardUsage.tsx。

test.use({ viewport: { width: 1300, height: 1500 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

test('DerivativesBoard：六张卡各有周期按钮，切一张只动这一张并发回调', async ({ page }) => {
  const area = await open(page, 'derivatives-board')
  const board = area.getByTestId('derivatives-board')
  const cards = board.locator('[data-slot="derivatives-card"]')
  await expect(cards).toHaveCount(6)
  await expect(cards.nth(0)).toHaveAttribute('data-kind', 'openInterestVolume')
  await expect(board.locator('[data-slot="derivatives-info"]')).toHaveCount(6)
  const oi = board.locator('[data-kind="openInterestVolume"]')
  await oi.getByRole('button', { name: '1 小时', exact: true }).click()
  await expect(oi.getByRole('button', { name: '1 小时', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(oi.getByRole('button', { name: '5 分钟', exact: true })).toHaveAttribute('aria-pressed', 'false')
  await expect(area.getByTestId('derivatives-last')).toHaveText('周期回调：持仓量及成交量 → 1 小时')
  // 别的卡不动：主动买卖量还在默认的 5 分钟。
  await expect(
    board.locator('[data-kind="takerVolume"]').getByRole('button', { name: '5 分钟', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true')
  // 资金费率只有近 7 / 14 天，演示里受控在 14 天。
  const fund = board.locator('[data-kind="fundingRate"]')
  await expect(fund.locator('[data-slot="derivatives-periods"] button')).toHaveText(['近 7 天', '近 14 天'])
  await expect(fund.getByRole('button', { name: '近 14 天' })).toHaveAttribute('aria-pressed', 'true')
  await fund.getByRole('button', { name: '近 7 天' }).click()
  await expect(area.getByTestId('derivatives-last')).toHaveText('周期回调：资金费率 → 近 7 天')
})

test('DerivativesBoard：悬停与键盘扫读出竖线和悬停窗，Esc 清掉', async ({ page }) => {
  const area = await open(page, 'derivatives-board')
  const card = area.getByTestId('derivatives-board').locator('[data-kind="openInterestVolume"]')
  const plot = card.locator('.k-deriv-plot')
  const box = (await plot.boundingBox())!
  await page.mouse.move(box.x + box.width / 2, box.y + 40)
  await expect(card.locator('[data-slot="derivatives-cross"]')).toHaveCount(1)
  const tip = card.locator('[data-slot="lcd-tooltip"]')
  await expect(tip).toContainText('持仓量')
  await expect(tip).toContainText('成交量')
  await page.mouse.move(5, 5)
  await expect(card.locator('[data-slot="derivatives-cross"]')).toHaveCount(0)
  await plot.focus()
  await page.keyboard.press('ArrowRight')
  await expect(tip).toContainText('11-24 23:00')
  await page.keyboard.press('Home')
  await expect(tip).toContainText('11-24 00:00')
  await page.keyboard.press('Escape')
  await expect(card.locator('[data-slot="derivatives-cross"]')).toHaveCount(0)
})

test('DerivativesBoard：缺数据的卡写自己的空态，别的卡照画', async ({ page }) => {
  const area = await open(page, 'derivatives-board')
  const sparse = area.getByTestId('derivatives-sparse')
  await expect(sparse.locator('[data-slot="derivatives-empty"]')).toHaveCount(2)
  await expect(sparse.locator('[data-kind="openInterestVolume"] [data-slot="derivatives-empty"]')).toHaveText(
    '暂无数据',
  )
  await expect(sparse.locator('[data-kind="basis"] [data-slot="derivatives-empty"]')).toHaveText('暂无数据')
  await expect(sparse.locator('[data-kind="fundingRate"] [data-slot="derivatives-chart"]')).toBeVisible()
})

test('MoveFeed 加密例子：只看当前品种，切品种跟着换；类型写「5 分钟涨幅 / 跌幅」', async ({ page }) => {
  const area = await open(page, 'move-feed')
  const feed = area.getByTestId('move-feed-crypto')
  const rows = feed.locator('[data-slot="move-row"]')
  await expect(rows).toHaveCount(7)
  await expect(feed.locator('[data-slot="move-type"]').filter({ hasText: '5 分钟涨幅' }).first()).toBeVisible()
  await expect(feed.locator('[data-slot="move-type"]').filter({ hasText: '15 分钟涨幅' })).toHaveCount(1)
  const only = feed.getByRole('checkbox', { name: '当前币对' })
  await only.click()
  await expect(rows).toHaveCount(3)
  await expect(feed.locator('[data-slot="move-summary"]')).toHaveText('共 3 条')
  await area.getByRole('button', { name: 'ETH-USDT-SWAP' }).click()
  await expect(rows).toHaveCount(2)
  await expect(feed.locator('[data-slot="move-summary"]')).toHaveText('共 2 条')
  await only.click()
  await expect(rows).toHaveCount(7)
})
