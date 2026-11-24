// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 跑马灯、自动刷新、表尾合计（#77 第 5 条）：在文档站的页上真点真按，断言看得见的行为与 ARIA。

test.use({ viewport: { width: 1100, height: 1200 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

// 第一项相对滚动区的横向位置：在滚就一直变小。
const offsetOf = (page: Page) =>
  page
    .locator('[data-gallery="ticker-tape"] [data-slot="ticker-tape"][data-mode="scroll"] [data-slot="ticker-item"]')
    .first()
    .evaluate((el) => el.getBoundingClientRect().x)

test('TickerTape：在滚、悬停停住、暂停钮切换、点品种联动；第二遍不可达', async ({ page }) => {
  const area = await open(page, 'ticker-tape')
  const tape = area.locator('[data-slot="ticker-tape"][data-mode="scroll"]')
  await expect(tape).toHaveAttribute('aria-label', '行情跑马灯')
  await expect(tape.locator('[data-copy]')).toHaveAttribute('aria-hidden', 'true')
  await expect(tape.getByRole('listitem')).toHaveCount(6)

  const a = await offsetOf(page)
  await page.waitForTimeout(400)
  expect(await offsetOf(page)).toBeLessThan(a) // 往左走

  const toggle = tape.getByRole('button', { name: '暂停滚动' })
  await toggle.click()
  await expect(tape).toHaveAttribute('data-paused', 'true')
  await expect(tape.getByRole('button', { name: '继续滚动' })).toBeVisible()
  await expect(tape.getByRole('button', { name: '继续滚动' })).not.toHaveAttribute('aria-pressed')
  await page.mouse.move(0, 0)
  const b = await offsetOf(page)
  await page.waitForTimeout(400)
  expect(await offsetOf(page)).toBe(b)
  await tape.getByRole('button', { name: '继续滚动' }).click()

  // 悬停停住：指针停在条上。
  await tape.locator('.k-ticker-viewport').hover()
  await expect(tape.locator('.k-ticker-track')).toHaveCSS('animation-play-state', 'paused')

  await tape.getByRole('listitem').filter({ hasText: 'BTCUSD' }).getByRole('button').click()
  await expect(area.locator('[data-gallery-ticker]')).toHaveAttribute('data-picked', 'BTCUSD')
})

test('TickerTape：系统减少动态效果时不动、只画一遍、没有暂停钮、可横向滚动', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  const area = await open(page, 'ticker-tape')
  const tape = area.locator('[data-slot="ticker-tape"]').first()
  await expect(tape).toHaveAttribute('data-mode', 'static')
  await expect(tape.locator('[data-copy]')).toHaveCount(0)
  await expect(tape.locator('[data-slot="ticker-toggle"]')).toHaveCount(0)
  const viewport = tape.locator('.k-ticker-viewport')
  await expect(viewport).toHaveAttribute('tabindex', '0')
  await viewport.evaluate((el) => (el.scrollLeft = 200))
  expect(await viewport.evaluate((el) => el.scrollLeft)).toBeGreaterThan(0)
})

test('RefreshControl：到点自动刷新、立即刷新、切到不刷新没有倒计时', async ({ page }) => {
  await page.clock.install()
  const area = await open(page, 'refresh-control')
  const demo = area.locator('[data-gallery-refresh]')
  await expect(demo.locator('[data-slot="refresh-countdown"]')).toHaveText(/下次 (10|9)s/)
  await page.clock.runFor(11_000)
  await expect(demo).toHaveAttribute('data-count', '1')

  await demo.getByRole('button', { name: '立即刷新' }).click()
  await expect(demo.locator('[data-slot="refresh-control"]')).toHaveAttribute('data-refreshing', 'true')
  await page.clock.runFor(700)
  await expect(demo).toHaveAttribute('data-count', '2')

  await demo.getByRole('button', { name: '不刷新' }).click()
  await expect(demo.locator('[data-slot="refresh-countdown"]')).toHaveCount(0)
  await page.clock.runFor(30_000)
  await expect(demo).toHaveAttribute('data-count', '2')
})

test('GridSummaryRow：合计与均值照列类型写，跟表头对齐，横向滚动时固定列粘左、汇总粘底', async ({ page }) => {
  const area = await open(page, 'grid-summary-row')
  const grid = area.locator('[data-slot="data-grid"]')
  const total = grid.locator('[data-summary="total"]')
  await expect(total.getByRole('rowheader')).toHaveText('合计')
  await expect(total.locator('[data-col="value"]')).toHaveText('106,843.70')
  await expect(total.locator('[data-col="pnl"]')).toHaveText(/^\+[\d,.]+ USDT$/)
  await expect(grid.locator('[data-slot="data-grid-body"]')).toHaveAttribute('aria-rowcount', '14')

  const head = grid.locator('.k-grid-head [data-col="value"]')
  const cell = total.locator('[data-col="value"]')
  const x = async (l: typeof cell) => (await l.boundingBox())!.x
  expect(Math.round(await x(cell))).toBe(Math.round(await x(head)))

  // 整张表在演示里放得下；把容器收窄到 360 再看横滚：汇总行跟表体一起滚，固定列仍粘左。
  // DataGrid 默认按列优先级收列（#122）：360 放不下，带聚合的市值、盈亏、涨跌幅先收起，汇总行跟着不画；
  // 点表头右端的「+N cols」切成横向滚动、显示全部列，汇总行回来。
  await area.locator('[data-gallery-summary]').evaluate((el) => ((el as HTMLElement).style.width = '360px'))
  await expect(grid).toHaveAttribute('data-columns-hidden', /^\d+$/)
  const toggle = grid.locator('.k-grid-cols-toggle')
  await toggle.click()
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(grid.locator('[data-summary="median"] [data-col="value"]')).not.toBeEmpty()
  const scroll = grid.locator('.k-grid-scroll')
  const fixedBefore = await x(total.locator('[data-col="symbol"]'))
  await scroll.evaluate((el) => {
    el.scrollLeft = 120
    el.scrollTop = 0
  })
  expect(Math.round(await x(total.locator('[data-col="symbol"]')))).toBe(Math.round(fixedBefore))
  await expect.poll(() => scroll.evaluate((el) => el.scrollLeft)).toBe(120)
  expect(Math.round(await x(cell))).toBe(Math.round(await x(head))) // 汇总格跟表头一起横滚
  const row = grid.locator('.k-grid-row [data-col="value"]').first()
  expect(Math.round(await x(cell))).toBe(Math.round(await x(row)))
  const box = (await scroll.boundingBox())!
  const rows = grid.locator('[data-slot="grid-summary"]')
  const sum = (await rows.boundingBox())!
  expect(Math.round(sum.y + sum.height)).toBeLessThanOrEqual(Math.round(box.y + box.height))
})
