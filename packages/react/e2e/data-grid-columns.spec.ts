// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// DataGrid 的列头右键菜单、拖动重排、ColumnPicker（#27）：在文档站的 data-grid 页上真点真拖，断言用户看到的列头与次序。

test.use({ viewport: { width: 1100, height: 1500 } })

const open = async (page: Page) => {
  await page.goto('/?theme=graphite#/data-grid')
  await page.locator('[data-gallery="data-grid"]').waitFor()
  return page.getByTestId('grid-columns')
}
const heads = (demo: ReturnType<Page['getByTestId']>) => demo.locator('[role="columnheader"]')
const names = async (demo: ReturnType<Page['getByTestId']>) =>
  (await heads(demo).allTextContents()).map((text) => text.replace(/[▲▼]/g, '').trim())

test('列头右键菜单：隐藏、左右移、固定、排序', async ({ page }) => {
  const demo = await open(page)
  await expect(heads(demo)).toHaveCount(9)
  await heads(demo).filter({ hasText: 'Price' }).click({ button: 'right' })
  await expect(page.getByRole('menu', { name: 'Price column menu' })).toBeVisible()
  await page.getByRole('menuitem', { name: 'Hide column' }).click()
  expect(await names(demo)).not.toContain('Price')

  await heads(demo).filter({ hasText: 'Qty' }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Move left' }).click()
  expect((await names(demo)).slice(0, 4)).toEqual(['Symbol', 'Qty', 'Side', 'PnL'])

  await heads(demo).filter({ hasText: 'PnL' }).click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Pin to left' }).click()
  expect((await names(demo))[0]).toBe('PnL')
  await expect(heads(demo).first()).toHaveClass(/is-fixed/)

  await heads(demo).filter({ hasText: 'Qty' }).click({ button: 'right' })
  await page.getByRole('menuitemcheckbox', { name: 'Sort descending' }).click()
  await expect(heads(demo).filter({ hasText: 'Qty' })).toHaveAttribute('aria-sort', 'descending')
})

test('拖动列头重排，刷新后还在', async ({ page }) => {
  const demo = await open(page)
  await heads(demo)
    .filter({ hasText: 'Qty' })
    .dragTo(heads(demo).filter({ hasText: 'Side' }))
  expect((await names(demo)).slice(0, 4)).toEqual(['Symbol', 'Qty', 'Side', 'Price'])
  await page.reload()
  await demo.waitFor()
  expect((await names(await open(page))).slice(0, 4)).toEqual(['Symbol', 'Qty', 'Side', 'Price'])
})

test('重置列回到默认次序', async ({ page }) => {
  const demo = await open(page)
  await heads(demo)
    .filter({ hasText: 'Qty' })
    .dragTo(heads(demo).filter({ hasText: 'Side' }))
  await heads(demo).first().click({ button: 'right' })
  await page.getByRole('menuitem', { name: 'Reset columns' }).click()
  expect((await names(demo)).slice(0, 4)).toEqual(['Symbol', 'Side', 'Price', 'Qty'])
})

test('ColumnPicker：切列集、逐列勾选', async ({ page }) => {
  const demo = await open(page)
  await demo.getByRole('button', { name: 'Columns' }).click()
  const picker = page.getByRole('dialog', { name: 'Columns' })
  await picker.getByRole('button', { name: 'Execution' }).click()
  expect(await names(demo)).toEqual(['Symbol', 'Side', 'Qty', 'Time (UTC)', 'Fills'])
  await expect(picker.getByRole('button', { name: 'Execution' })).toHaveAttribute('aria-pressed', 'true')

  await picker.getByRole('checkbox', { name: 'Note' }).click()
  expect(await names(demo)).toContain('Note')
  await expect(picker.getByRole('button', { name: 'Execution' })).toHaveAttribute('aria-pressed', 'false')
})

test('列优先级：窄容器收起低优先级的列，「+N cols」点开显示全部、再点收起（#122）', async ({ page }) => {
  await page.goto('/?theme=graphite#/data-grid')
  const demo = page.getByTestId('grid-priority')
  await demo.waitFor()
  const scroll = demo.locator('.k-grid-scroll')
  const overflow = () => scroll.evaluate((el) => el.scrollWidth - el.clientWidth)
  const toggle = demo.locator('.k-grid-cols-toggle')

  // 300px 放不下八列：留名称、方向与 PnL（PnL 写了 priority: 2，比声明在前的 Price 晚收），胶囊写收起了 5 列，不出横向滚动
  await expect(toggle).toHaveText('+5 cols')
  expect(await names(demo)).toEqual(['Symbol', 'Side', 'PnL'])
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
  expect(await overflow()).toBeLessThanOrEqual(0)
  // 胶囊在表头最右，不压在最后一列的表头上
  const lastHead = (await heads(demo).last().boundingBox())!
  const toggleBox = (await toggle.boundingBox())!
  expect(toggleBox.x).toBeGreaterThanOrEqual(lastHead.x + lastHead.width - 0.5)
  // stretch 的表：保留的列撑满的是「容器宽 - 胶囊宽」，最后一列的表头与数据格都不越过胶囊左缘（#128）；表头文字没被盖住
  const lastId = await heads(demo).last().getAttribute('data-col')
  const lastCell = (await demo.locator(`[role="gridcell"][data-col="${lastId}"]`).first().boundingBox())!
  expect(lastCell.x + lastCell.width).toBeLessThanOrEqual(toggleBox.x + 0.5)
  const lastHeadAt = await heads(demo).last().boundingBox()
  const covered = await demo.evaluate(
    (root, point) => {
      const hit = document.elementFromPoint(point.x, point.y)
      return !!hit?.closest('.k-grid-cols-end')
    },
    { x: lastHeadAt!.x + lastHeadAt!.width - 4, y: lastHeadAt!.y + lastHeadAt!.height / 2 },
  )
  expect(covered).toBe(false)

  // 点开：全部八列，横向滚动，胶囊写「Collapse」
  await toggle.click()
  expect(await names(demo)).toHaveLength(8)
  await expect(toggle).toHaveText('Collapse')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  expect(await overflow()).toBeGreaterThan(0)
  // 横向滚到头，胶囊还在可视区里（不跟着滚走）
  await scroll.evaluate((el) => (el.scrollLeft = el.scrollWidth))
  const view = (await scroll.boundingBox())!
  const after = (await toggle.boundingBox())!
  expect(after.x + after.width).toBeLessThanOrEqual(view.x + view.width + 1)
  expect(after.x).toBeGreaterThanOrEqual(view.x)

  // 再点：回到收起
  await toggle.click()
  expect(await names(demo)).toEqual(['Symbol', 'Side', 'PnL'])
  await expect(toggle).toHaveText('+5 cols')

  // 容器变宽放得下全部：没有胶囊，八列都在
  await demo.evaluate((el) => (el.style.width = '700px'))
  await expect(toggle).toHaveCount(0)
  expect(await names(demo)).toHaveLength(8)
})
