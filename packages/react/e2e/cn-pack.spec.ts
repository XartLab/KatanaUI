// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// A 股面板几件（#11，开盘啦对照）：在文档站各自的页上真点、真按键，断言用户看得见的结果。演示数据见 gallery/usage/ 各文件。

test.use({ viewport: { width: 1100, height: 1400 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

test('SentimentGauge：读数、昨日差着涨跌色、阶段带与图例、点图例高亮一个阶段', async ({ page }) => {
  const area = await open(page, 'sentiment-gauge')
  const gauge = area.locator('[data-slot="sentiment-gauge"]').first()
  await expect(gauge.locator('[data-slot="sentiment-score"]')).toHaveText(/^\d+$/)
  const delta = gauge.locator('[data-slot="sentiment-delta"]')
  const tone = await delta.getAttribute('data-tone')
  const color = await delta.evaluate((el) => getComputedStyle(el).color)
  const want = await page.evaluate((t) => {
    const probe = document.createElement('span')
    probe.style.color =
      t === 'up'
        ? 'var(--k-tone-up-foreground)'
        : t === 'down'
          ? 'var(--k-tone-down-foreground)'
          : 'var(--k-tone-flat-foreground)'
    document.body.append(probe)
    const out = getComputedStyle(probe).color
    probe.remove()
    return out
  }, tone)
  expect(color).toBe(want)
  await expect(gauge.getByRole('meter')).toHaveAttribute('aria-valuemax', '100')
  await expect(gauge.locator('.k-regime-legend li[data-current]')).toHaveCount(1)
  await expect(gauge.locator('[data-slot="small-multiple"]')).toHaveCount(4)
  await gauge.getByRole('button', { name: /冰点/ }).click()
  await expect(gauge.getByRole('button', { name: /冰点/ })).toHaveAttribute('aria-pressed', 'true')
  const dim = await gauge.locator('.k-regime-band i[data-dim]').count()
  const all = await gauge.locator('.k-regime-band i').count()
  expect(dim).toBeGreaterThan(0)
  expect(dim).toBeLessThan(all)
  // 空态：传空数组只画一行字。
  await expect(area.locator('[data-slot="sentiment-gauge"]').nth(1).getByRole('status')).toHaveText('没有情绪数据')
})

test('ThemeHeatMatrix：格子按只数分档着色，方向键走格，Enter 选中', async ({ page }) => {
  const area = await open(page, 'theme-heat-matrix')
  const grid = area.getByRole('grid', { name: '题材热度矩阵（演示数据）' })
  await expect(grid.getByRole('row')).toHaveCount(7)
  // 最大只数那格在最高一档，空格（null）不着色也不写字。
  await expect(grid.locator('[data-seq="4"]').first()).toBeVisible()
  const empty = grid.locator('[data-empty]')
  await expect(empty).toHaveCount(1)
  await expect(empty).toHaveText('')
  await expect(page.getByTestId('heat-picked')).toHaveText('选中：示例机器人 · 11-18')
  const start = grid.locator('[role="gridcell"][tabindex="0"]')
  await start.focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('ArrowLeft')
  await page.keyboard.press('Enter')
  await expect(page.getByTestId('heat-picked')).toHaveText('选中：示例算力 · 11-17')
  await expect(grid.locator('[role="gridcell"][aria-selected="true"]')).toHaveAttribute('data-row-index', '1')
})

test('ReasonGroupList：组头写家数与最高板，点组头收起，芯片筛原因，点个股打开', async ({ page }) => {
  const area = await open(page, 'reason-group-list')
  const list = area.locator('[data-slot="reason-group-list"]')
  const robot = list.locator('[data-kind="group"][data-group="robot"]')
  await expect(robot).toContainText('机器人')
  await expect(robot).toContainText('3 家')
  await expect(robot).toContainText('最高 4 板')
  await expect(robot).toHaveAttribute('aria-expanded', 'true')
  await expect(list.locator('[data-kind="stock"][data-group="robot"]')).toHaveCount(3)
  await robot.click()
  await expect(list.locator('[data-kind="group"][data-group="robot"]')).toHaveAttribute('aria-expanded', 'false')
  await expect(list.locator('[data-kind="stock"][data-group="robot"]')).toHaveCount(0)
  await list
    .getByRole('group', { name: '按原因筛选' })
    .getByRole('button', { name: /算力/ })
    .click()
  await expect(list.locator('[data-kind="group"]')).toHaveCount(1)
  await list.locator('[data-code="000201"]').click()
  await expect(page.getByTestId('reason-picked')).toHaveText('打开：000201 示例光模块')
})

test('BoardStrengthRank：按强度排名次，名次变化带箭头与涨跌色，limit 只留前几', async ({ page }) => {
  const area = await open(page, 'board-strength-rank')
  const table = area.locator('[data-slot="board-strength-rank"]').first()
  const rows = table.locator('[data-board]')
  await expect(rows).toHaveCount(5)
  await expect(rows.first()).toHaveAttribute('data-board', 'b1')
  await expect(table.locator('[data-board="b1"] [data-slot="board-move"]')).toHaveText('▲2')
  await expect(table.locator('[data-board="b1"] [data-slot="board-move"]')).toHaveAttribute('data-tone', 'up')
  await expect(table.locator('[data-board="b2"] [data-slot="board-move"]')).toHaveText('▼1')
  await expect(table.locator('[data-board="b3"] [data-slot="board-move"]')).toHaveText('新')
  await expect(table.locator('[data-board="b1"] .k-sparkline, [data-board="b1"] svg').first()).toBeVisible()
  await table.locator('[data-board="b3"]').click()
  await expect(page.getByTestId('board-picked')).toHaveText('打开：3 示例低空')
  await expect(page.getByTestId('board-top3').locator('[data-board]')).toHaveCount(3)
})

test('NetBuyBar：净买往右净卖往左，点行展开席位，机构席位带标签', async ({ page }) => {
  const area = await open(page, 'net-buy-bar')
  const box = area.locator('[data-slot="net-buy-bar"]')
  const barOf = (code: string) => box.locator(`[data-code="${code}"] [data-slot="netbuy-bar"]`)
  const track = await box.locator('[data-code="300401"] .k-netbuy-track').boundingBox()
  const buy = await barOf('300401').boundingBox()
  const sell = await barOf('600403').boundingBox()
  const mid = track!.x + track!.width / 2
  expect(buy!.x).toBeGreaterThanOrEqual(mid - 1)
  expect(sell!.x + sell!.width).toBeLessThanOrEqual(mid + 1)
  await expect(box.locator('[data-code="300401"] [data-slot="netbuy-net"]')).toHaveText('+1.86 亿')
  await expect(box.locator('[data-code="600403"] [data-slot="netbuy-net"]')).toHaveText('−0.93 亿')
  const first = box.locator('[data-code="300401"] [data-slot="netbuy-row"]')
  await expect(first).toHaveAttribute('aria-expanded', 'true')
  await expect(box.locator('[data-slot="netbuy-seat"]')).toHaveCount(10)
  await expect(box.locator('[data-slot="netbuy-seat"][data-institution]')).toHaveCount(3)
  await expect(box.locator('[data-slot="netbuy-seat"][data-institution]').first()).toContainText('机构')
  await first.click()
  await expect(first).toHaveAttribute('aria-expanded', 'false')
  await expect(box.locator('[data-slot="netbuy-detail"]')).toHaveCount(0)
})
