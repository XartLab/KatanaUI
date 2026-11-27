// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// A 股件第 2 批（#110）：在文档站各自的页上真点、真按键，断言用户看得见的结果。演示数据是示例，见 gallery/pages/cn-batch2.tsx。

test.use({ viewport: { width: 1100, height: 1400 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

test('SeatTable：买卖两侧各只留前五、买入额从大到小、净额正负着不同色调、取不到的格写破折号', async ({ page }) => {
  const area = await open(page, 'seat-table')
  const table = area.getByTestId('seat-table')
  const sides = table.locator('[data-slot="seat-side"]')
  await expect(sides).toHaveCount(2)
  // 演示每侧给了 6 个席位，只留前五。
  await expect(sides.nth(0).locator('[data-slot="seat-row"]')).toHaveCount(5)
  await expect(sides.nth(1).locator('[data-slot="seat-row"]')).toHaveCount(5)
  // 买入侧的第一名买入额最大（演示里买入侧是倒序传入的，件要自己排）。
  await expect(sides.nth(0).locator('[data-slot="seat-buy"]').first()).toHaveText(/亿/)
  const tones = await table
    .locator('[data-slot="seat-net"]')
    .evaluateAll((cells) => cells.map((cell) => cell.getAttribute('data-tone')))
  expect(tones).toContain('up')
  expect(tones).toContain('down')
  // 卖出额取不到的席位：净额写破折号，不是 0。
  await expect(table.locator('[data-slot="seat-net"]', { hasText: '—' }).first()).toBeVisible()
  await expect(table.locator('[data-slot="seat-spread"]')).toBeVisible()
  // 窄容器上下排。
  const narrow = area.getByTestId('seat-table-narrow')
  const tops = await narrow
    .locator('[data-slot="seat-side"]')
    .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().top))
  expect(tops[1]!).toBeGreaterThan(tops[0]!)
})

test('AuctionStep：读数、昨收参考线、台阶线没有斜线；涨着涨色、跌着跌色；空态没有线；DataGrid 列画迷你台阶', async ({
  page,
}) => {
  const area = await open(page, 'auction-step')
  const up = area.getByTestId('auction-up').locator('[data-slot="auction-step"]')
  await expect(up.locator('[data-slot="auction-price"]')).toHaveText('10.45')
  await expect(up.locator('[data-slot="auction-change"]')).toContainText('4.50%')
  await expect(up).toHaveAttribute('data-tone', 'up')
  await expect(up.locator('[data-slot="auction-ref"]')).toHaveCount(1)
  // 台阶线只有横与竖，没有斜线。
  const d = (await up.locator('[data-slot="auction-line"]').getAttribute('d')) ?? ''
  expect(d).toMatch(/[HV]/)
  expect(d).not.toMatch(/L/)
  await expect(area.getByTestId('auction-down').locator('[data-slot="auction-step"]')).toHaveAttribute(
    'data-tone',
    'down',
  )
  await expect(area.getByTestId('auction-noref').locator('[data-slot="auction-ref"]')).toHaveCount(0)
  await expect(area.getByTestId('auction-empty').locator('[data-slot="auction-line"]')).toHaveCount(0)
  await expect(area.getByTestId('auction-grid').locator('[data-slot="auction-spark"]').first()).toBeVisible()
})

test('TradingDatePicker：前后按钮跳过周末，休市日点不了，选一天后回调收到它', async ({ page }) => {
  const area = await open(page, 'trading-date-picker')
  const picked = area.getByTestId('trading-date-picked')
  const picker = area.locator('[data-slot="trading-date-picker"]')
  await expect(picked).toHaveText('已选：2026-11-20')
  // 周五的下一个交易日是下周一；周一的上一个交易日是上周五，不是周日。
  await picker.locator('[data-slot="trading-date-next"]').click()
  await expect(picked).toHaveText('已选：2026-11-23')
  await picker.locator('[data-slot="trading-date-prev"]').click()
  await expect(picked).toHaveText('已选：2026-11-20')
  // 开日历：休市的格是 unavailable，点了不改值；开市的格能选。
  await picker.locator('[data-slot="trading-date-trigger"]').click()
  const unavailable = page.locator('[role="dialog"] [data-unavailable]:not([data-outside])')
  await expect(unavailable.first()).toBeVisible()
  expect(await unavailable.count()).toBeGreaterThanOrEqual(8)
  await unavailable.first().click({ force: true })
  await expect(picked).toHaveText('已选：2026-11-20')
  const day = page
    .locator('[role="dialog"] [role="gridcell"]:not([data-unavailable]):not([data-outside])')
    .filter({ hasText: /^18$/ })
  await day.first().click()
  await expect(picked).toHaveText('已选：2026-11-18')
})

test('FlowRace：右端按最新值排名、标签不重叠、悬停一行对应的线加粗', async ({ page }) => {
  const area = await open(page, 'flow-race')
  const race = area.getByTestId('flow-race')
  const labels = race.locator('[data-slot="flow-label"]')
  await expect(labels).toHaveCount(6)
  await expect(race.locator('[data-slot="flow-line"]')).toHaveCount(6)
  const rects = await labels.evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))
  for (let i = 1; i < rects.length; i++) expect(rects[i].top).toBeGreaterThanOrEqual(rects[i - 1].bottom - 0.5)
  const ranks = await labels.evaluateAll((els) => els.map((el) => el.getAttribute('data-rank')))
  expect(ranks).toEqual(['1', '2', '3', '4', '5', '6'])
  // 悬停第三行：对应的线 data-current，且比别的线粗。
  const key = await labels.nth(2).getAttribute('data-key')
  await labels.nth(2).hover()
  await expect(race.locator(`[data-slot="flow-line"][data-key="${key}"]`)).toHaveAttribute('data-current', 'true')
  await expect(race.locator('[data-slot="flow-line"][data-current]')).toHaveCount(1)
  const width = (sel: string) =>
    race
      .locator(sel)
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el).strokeWidth))
  const hot = await width(`[data-slot="flow-line"][data-key="${key}"]`)
  const other = await width(`[data-slot="flow-line"]:not([data-key="${key}"])`)
  expect(hot).toBeGreaterThan(other)
})

test('FlowRace：绘图区占容器一半以上宽度，横轴刻度与纵轴读数不折行、横轴刻度两两不相交（宽窄两种容器）', async ({
  page,
}) => {
  const area = await open(page, 'flow-race')
  for (const id of ['flow-race', 'flow-race-narrow']) {
    const race = area.getByTestId(id)
    const box = await race.boundingBox()
    const plot = await race.locator('.k-fr-plot').boundingBox()
    expect(plot!.width).toBeGreaterThanOrEqual(box!.width * 0.5)
    const ticks = await race
      .locator('.k-fr-axis span')
      .evaluateAll((els) => els.map((el) => el.getBoundingClientRect().toJSON()))
    expect(ticks).toHaveLength(3)
    for (let i = 1; i < ticks.length; i++) expect(ticks[i].left).toBeGreaterThanOrEqual(ticks[i - 1].right)
    // 单行：高度不超过一行字（行高 < 2 倍字号）。
    const lines = await race
      .locator('.k-fr-axis span, .k-fr-scale')
      .evaluateAll((els) =>
        els.map((el) => el.getBoundingClientRect().height / parseFloat(getComputedStyle(el).lineHeight)),
      )
    for (const n of lines) expect(n).toBeLessThan(1.5)
    // 排行标签列不超过 220px。
    const rank = await race.locator('[data-slot="flow-rank"]').boundingBox()
    expect(rank!.width).toBeLessThanOrEqual(220)
  }
})

test('MiniKCardGrid：一行 2/3/4 只可切换，点卡片联动，没有蜡烛的卡写暂无 K 线', async ({ page }) => {
  const area = await open(page, 'mini-k-card-grid')
  const grid = area.getByTestId('mini-k-grid').locator('[data-slot="mini-k-card-grid"]')
  const perRow = async () => {
    const tops = await grid
      .locator('[data-slot="mini-k-card"]')
      .evaluateAll((els) => els.map((el) => Math.round(el.getBoundingClientRect().top)))
    return tops.filter((top) => top === tops[0]).length
  }
  for (const n of [2, 3, 4]) {
    await area.getByTestId(`mini-k-cols-${n}`).click()
    await expect(grid).toHaveAttribute('data-columns', String(n))
    expect(await perRow()).toBe(n)
  }
  await expect(grid.locator('[data-slot="mini-k-none"]')).toHaveCount(1)
  await grid.locator('[data-slot="mini-k-card"][data-code="600102"]').click()
  await expect(area.getByTestId('mini-k-picked')).toHaveText('选中：600102 示例乙')
})

test('MoveFeed：类型多选筛选行数，新条目从顶上进，点行联动', async ({ page }) => {
  const area = await open(page, 'move-feed')
  const feed = area.getByTestId('move-feed')
  const rows = feed.locator('[data-slot="move-row"]')
  await expect(rows).toHaveCount(10)
  // 默认从新到旧：最后一条（10:21:08）在最上。
  await expect(rows.first()).toHaveAttribute('data-id', 'm10')
  // 多选筛：火箭发射 2 条，再加大笔买入共 3 条；取消火箭发射剩 1 条；再取消回到全部。
  const chips = feed.locator('[data-slot="move-filter"] button')
  await chips.filter({ hasText: '火箭发射' }).click()
  await expect(rows).toHaveCount(2)
  await chips.filter({ hasText: '大笔买入' }).click()
  await expect(rows).toHaveCount(3)
  await chips.filter({ hasText: '火箭发射' }).click()
  await expect(rows).toHaveCount(1)
  await chips.filter({ hasText: '大笔买入' }).click()
  await expect(rows).toHaveCount(10)
  // 推一条：排到顶上并标 data-fresh。
  await area.getByTestId('move-push').click()
  await expect(rows).toHaveCount(11)
  await expect(rows.first()).toHaveAttribute('data-fresh', 'true')
  // 点行联动。
  await rows.nth(1).locator('button').click()
  await expect(area.getByTestId('move-picked')).not.toHaveText('联动：—')
  await expect(feed.locator('[data-slot="move-row"][data-selected]')).toHaveCount(1)
})
