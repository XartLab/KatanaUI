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
  await heads(demo).filter({ hasText: 'Qty' }).dragTo(heads(demo).filter({ hasText: 'Side' }))
  expect((await names(demo)).slice(0, 4)).toEqual(['Symbol', 'Qty', 'Side', 'Price'])
  await page.reload()
  await demo.waitFor()
  expect((await names(await open(page))).slice(0, 4)).toEqual(['Symbol', 'Qty', 'Side', 'Price'])
})

test('重置列回到默认次序', async ({ page }) => {
  const demo = await open(page)
  await heads(demo).filter({ hasText: 'Qty' }).dragTo(heads(demo).filter({ hasText: 'Side' }))
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
