// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// DataGrid 的挪行与分节、FlagMark 旗标（#77 G7）：在文档站 data-grid 页的自选表演示（grid-order）与 flag-mark 页上真拖真按。

test.use({ viewport: { width: 1100, height: 1500 } })

const open = async (page: Page, id = 'data-grid') => {
  await page.goto(`/?theme=graphite#/${id}`)
  await page.locator(`[data-gallery="${id}"]`).waitFor()
}
const demo = (page: Page) => page.getByTestId('grid-order')
const value = (page: Page) => page.getByTestId('grid-order-value')
const row = (page: Page, id: string) => demo(page).locator(`[data-row="${id}"]`)
const START = 'BTCUSDT ETHUSDT SOLUSDT NVDA QQQ XAUUSD'

test('data-grid 挪行：Alt+↓ 挪一格并播报，右键「Move to top」', async ({ page }) => {
  await open(page)
  await expect(value(page)).toHaveText(START)
  await row(page, 'BTCUSDT').getByText('BTCUSDT').click()
  await page.keyboard.press('Alt+ArrowDown')
  await expect(value(page)).toHaveText('ETHUSDT BTCUSDT SOLUSDT NVDA QQQ XAUUSD')
  await expect(demo(page).locator('[data-slot="data-grid-order-status"]')).toHaveText(/position 3 of 8/)
  await row(page, 'SOLUSDT').getByText('SOLUSDT').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Move to top' }).click()
  // 移到顶：越过第一个分节标题，成了没分节的第一行
  await expect(value(page)).toHaveText('SOLUSDT ETHUSDT BTCUSDT NVDA QQQ XAUUSD')
  await expect(demo(page).locator('.k-grid-row').first()).toHaveAttribute('data-row', 'SOLUSDT')
})

test('data-grid 挪行：鼠标拖一行到另一行前，拖到一半 Esc 取消', async ({ page }) => {
  await open(page)
  // 自选表排在这页第五个演示（前面有 380 高的 grid-demo、列操作、实时刷新、A 股列两张表），落在 1500 高的视口下面；
  // page.mouse 按坐标发事件、不会自己滚，视口外的坐标点不到行上，先把这张表滚进来再量。
  await demo(page).scrollIntoViewIfNeeded()
  const from = await row(page, 'QQQ').boundingBox()
  const to = await row(page, 'BTCUSDT').boundingBox()
  if (!from || !to) throw new Error('rows not laid out')
  await page.mouse.move(from.x + 60, from.y + from.height / 2)
  await page.mouse.down()
  await page.mouse.move(from.x + 60, from.y - 10, { steps: 4 })
  await page.mouse.move(to.x + 60, to.y + 4, { steps: 8 })
  await expect(demo(page).locator('.k-grid-drop')).toBeVisible()
  await expect(row(page, 'QQQ')).toHaveClass(/is-dragged/)
  await page.mouse.up()
  await expect(value(page)).toHaveText('QQQ BTCUSDT ETHUSDT SOLUSDT NVDA XAUUSD')
  await expect(demo(page).locator('.k-grid-drop')).toHaveCount(0)

  // 再拖一次，Esc 取消：次序不变
  const again = await row(page, 'XAUUSD').boundingBox()
  if (!again) throw new Error('row not laid out')
  await page.mouse.move(again.x + 60, again.y + again.height / 2)
  await page.mouse.down()
  await page.mouse.move(again.x + 60, to.y + 4, { steps: 8 })
  await page.keyboard.press('Escape')
  await page.mouse.up()
  await expect(value(page)).toHaveText('QQQ BTCUSDT ETHUSDT SOLUSDT NVDA XAUUSD')
})

test('data-grid 分节：Alt+↑ 让整节跨过上一节；按列排序后不能挪并读出原因', async ({ page }) => {
  await open(page)
  const section = row(page, 'sec-stocks')
  await expect(section).toHaveClass(/is-section/)
  await section.click()
  await page.keyboard.press('Alt+ArrowUp')
  await expect(value(page)).toHaveText('NVDA QQQ XAUUSD BTCUSDT ETHUSDT SOLUSDT')
  await expect(demo(page).locator('.k-grid-row').first()).toHaveAttribute('data-row', 'sec-stocks')

  await demo(page).locator('[role="columnheader"]').filter({ hasText: 'Last' }).getByRole('button').click()
  await row(page, 'BTCUSDT').getByText('BTCUSDT').click()
  const before = await value(page).textContent()
  await page.keyboard.press('Alt+ArrowDown')
  await expect(value(page)).toHaveText(before!)
  await expect(demo(page).locator('[data-slot="data-grid-order-status"]')).toHaveText(
    'Clear the column sort to reorder rows',
  )
})

test('data-grid 旗标：点旗插上、右键换色、按旗过滤', async ({ page }) => {
  await open(page)
  const flag = row(page, 'SOLUSDT').locator('.k-flag-mark')
  await expect(flag).toHaveAttribute('aria-pressed', 'false')
  await row(page, 'SOLUSDT').hover()
  await flag.click()
  await expect(flag).toHaveAttribute('aria-pressed', 'true')
  await expect(flag).toHaveAttribute('data-flag', 'red')
  // 点旗不算点行：没有选中
  await expect(row(page, 'SOLUSDT')).not.toHaveClass(/is-selected/)
  await row(page, 'SOLUSDT').getByText('SOLUSDT').click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Setup' }).click()
  await expect(flag).toHaveAttribute('data-flag', 'amber')

  const filter = demo(page).getByRole('group', { name: 'Filter by flag' })
  await filter.getByRole('button', { name: 'Watch (1)' }).click()
  await expect(demo(page).locator('.k-grid-row')).toHaveCount(1)
  await expect(demo(page).locator('.k-grid-row').first()).toHaveAttribute('data-row', 'ETHUSDT')
  await filter.getByRole('button', { name: 'Watch (1)' }).click()
  await expect(demo(page).locator('.k-grid-row')).toHaveCount(8)
})

test('flag-mark 页：空心旗点了插上第一面，再点拔掉', async ({ page }) => {
  await open(page, 'flag-mark')
  const area = page.locator('[data-gallery="flag-mark"]')
  const sol = area.getByRole('button', { name: 'Flag SOLUSDT' }).first()
  await expect(sol).toHaveAttribute('aria-pressed', 'false')
  await sol.click()
  await expect(sol).toHaveAttribute('aria-pressed', 'true')
  await expect(area.getByRole('group', { name: 'Filter by flag' }).first()).toContainText('2')
  await sol.click()
  await expect(sol).toHaveAttribute('aria-pressed', 'false')
})

// #87：分节收起、行数与汇总、排序时标题不动；Alt+Enter 插旗。
test('data-grid 分节：三角收起整节、← / → 收起展开；按列排序时标题行不动、各节在节内排', async ({ page }) => {
  await open(page)
  const crypto = row(page, 'sec-crypto')
  await expect(crypto.locator('[data-slot="grid-section-count"]')).toHaveText('3')
  // 本节平均涨跌写在标题行的 Chg% 列下（sectionAggregates）
  await expect(crypto.locator('[data-col="chg"]')).toContainText('%')
  await crypto.getByRole('button', { name: 'Collapse section' }).click()
  await expect(crypto).toHaveAttribute('aria-expanded', 'false')
  await expect(row(page, 'BTCUSDT')).toHaveCount(0)
  // 收起时整节挪：藏着的三行跟着标题走
  await crypto.click()
  await page.keyboard.press('Alt+ArrowDown')
  await expect(value(page)).toHaveText('NVDA QQQ XAUUSD BTCUSDT ETHUSDT SOLUSDT')
  await page.keyboard.press('ArrowRight')
  await expect(crypto).toHaveAttribute('aria-expanded', 'true')
  await expect(row(page, 'BTCUSDT')).toBeVisible()
  await page.keyboard.press('ArrowLeft')
  await expect(crypto).toHaveAttribute('aria-expanded', 'false')
  await page.keyboard.press('Enter')
  await expect(crypto).toHaveAttribute('aria-expanded', 'true')

  await demo(page).locator('[role="columnheader"]').filter({ hasText: 'Last' }).getByRole('button').click()
  const shown = await demo(page)
    .locator('.k-grid-row')
    .evaluateAll((rows) => rows.map((node) => node.getAttribute('data-row')))
  // 标题行留在原位（STOCKS 在前，因为上面整节挪过），各节里的行按 Last 升序
  expect(shown).toEqual(['sec-stocks', 'NVDA', 'QQQ', 'XAUUSD', 'sec-crypto', 'SOLUSDT', 'ETHUSDT', 'BTCUSDT'])
})

test('data-grid 旗标：Alt+Enter 给键盘所在的行插旗、再按拔掉', async ({ page }) => {
  await open(page)
  const flag = row(page, 'QQQ').locator('.k-flag-mark')
  await expect(flag).toHaveAttribute('aria-pressed', 'false')
  await row(page, 'QQQ').getByText('QQQ').click()
  // 点行以后，演示页要经「焦点 → 键盘所在的行 → 重新登记快捷键」几轮 effect 才把 Alt+Enter 开出来；CI 忙时紧跟着按键会落在登记之前，
  // 什么也没发生（2026-11-26 main 与 #258 的 run 都见过首跑红、重跑过）。没开的时候按键是空操作，所以按到插上旗为止是安全的。
  await expect(async () => {
    await page.keyboard.press('Alt+Enter')
    await expect(flag).toHaveAttribute('aria-pressed', 'true', { timeout: 1000 })
  }).toPass({ timeout: 10_000 })
  await page.keyboard.press('Alt+Enter')
  await expect(flag).toHaveAttribute('aria-pressed', 'false')
  // 焦点离开表：Alt+Enter 不再作用在表上
  await page.locator('body').click({ position: { x: 5, y: 5 } })
  await page.keyboard.press('Alt+Enter')
  await expect(flag).toHaveAttribute('aria-pressed', 'false')
})
