// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// MarketBrowser 市场浏览器（#245 模块 2）：在文档站的页上真点真按，断言看得见的行为与 ARIA。

test.use({ viewport: { width: 1100, height: 1200 } })

const open = async (page: Page) => {
  await page.goto('/?theme=graphite#/market-browser')
  const area = page.locator('[data-gallery="market-browser"]')
  await area.waitFor()
  return area
}
const symbols = (area: ReturnType<Page['locator']>) =>
  area.locator('[data-slot="market-row"] .k-code-chip').allInnerTexts()

test('MarketBrowser：点价格列头按 升序 → 降序 → 原顺序 排，th 带 aria-sort', async ({ page }) => {
  const area = await open(page)
  await area.getByRole('tab', { name: '全部' }).click()
  const original = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'DOGE-USDT', 'XRP-USDT']
  expect(await symbols(area)).toEqual(original)

  const header = area.getByRole('columnheader', { name: /最新价/ })
  await header.getByRole('button').click()
  await expect(header).toHaveAttribute('aria-sort', 'ascending')
  expect(await symbols(area)).toEqual(['DOGE-USDT', 'XRP-USDT', 'SOL-USDT', 'ETH-USDT', 'BTC-USDT'])
  await header.getByRole('button').click()
  await expect(header).toHaveAttribute('aria-sort', 'descending')
  expect((await symbols(area))[0]).toBe('BTC-USDT')
  await header.getByRole('button').click()
  await expect(header).not.toHaveAttribute('aria-sort')
  expect(await symbols(area)).toEqual(original)

  // 换到涨跌列：从升序起，最跌的在前。
  await area
    .getByRole('columnheader', { name: /24h 涨跌/ })
    .getByRole('button')
    .click()
  expect((await symbols(area))[0]).toBe('DOGE-USDT')
})

test('MarketBrowser：搜索在当前分类里找；没找到写提示；换分类搜索词保留', async ({ page }) => {
  const area = await open(page)
  const search = area.getByRole('searchbox', { name: '搜索币对' })
  await search.fill('sol')
  expect(await symbols(area)).toEqual(['SOL-USDT'])
  await search.fill('比特') // 名称是「比特币」
  expect(await symbols(area)).toEqual(['BTC-USDT'])
  await search.fill('zzz')
  await expect(area.getByRole('status')).toHaveText('没有匹配的币对。')
  await search.fill('doge')
  await area.getByRole('tab', { name: '主流币' }).click() // 主流币里没有 DOGE
  await expect(area.getByRole('status')).toHaveText('没有匹配的币对。')
  await area.getByRole('tab', { name: 'Meme' }).click()
  expect(await symbols(area)).toEqual(['DOGE-USDT'])
})

test('MarketBrowser：星标进「自选」页签且不触发选品种；点行与 Enter 选品种', async ({ page }) => {
  const area = await open(page)
  const picked = area.locator('[data-gallery-picked]')
  await expect(picked).toHaveText('点一行选品种')
  await area.getByRole('tab', { name: '全部' }).click()

  const star = area.getByRole('button', { name: '自选 ETH-USDT' })
  await expect(star).toHaveAttribute('aria-pressed', 'false')
  await star.click()
  await expect(star).toHaveAttribute('aria-pressed', 'true')
  await expect(picked).toHaveText('点一行选品种') // 点星标不选品种

  await area.getByRole('tab', { name: '自选' }).click()
  expect(await symbols(area)).toEqual(['BTC-USDT', 'ETH-USDT', 'SOL-USDT'])
  await area.getByRole('button', { name: '自选 BTC-USDT' }).click() // 取消 BTC 的星标
  expect(await symbols(area)).toEqual(['ETH-USDT', 'SOL-USDT'])

  await area.locator('[data-slot="market-row"]').first().click()
  await expect(picked).toHaveText('已选：ETH-USDT')
  const second = area.locator('[data-slot="market-row"]').nth(1)
  await second.focus()
  await page.keyboard.press('Enter')
  await expect(picked).toHaveText('已选：SOL-USDT')
  // 焦点在星标上按 Enter 只切星标，不选品种。
  await area.getByRole('button', { name: '自选 SOL-USDT' }).focus()
  await page.keyboard.press('Enter')
  await expect(picked).toHaveText('已选：SOL-USDT')
  expect(await symbols(area)).toEqual(['ETH-USDT'])
})
