// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 联动组（#22 G8）：在文档站 link-group 页上真点真移。自选与两张图默认都在 A 组；示例数据。

test.use({ viewport: { width: 1100, height: 1200 } })

const open = async (page: Page) => {
  await page.goto('/?theme=graphite#/link-group')
  const area = page.locator('[data-gallery="link-group"]')
  await area.waitFor()
  return area
}
const chart = (area: ReturnType<Page['locator']>, name: string) => area.locator(`[data-link-chart="${name}"]`)

test('link-group：自选点品种同组的图一起换；十字线同组同步；换到不联动就各走各的', async ({ page }) => {
  const area = await open(page)
  const one = chart(area, '图 1')
  const two = chart(area, '图 2')
  await area.getByRole('group', { name: '自选', exact: true }).getByRole('button', { name: 'NVDA' }).click()
  await expect(one.locator('header')).toContainText('NVDA')
  await expect(two.locator('header')).toContainText('NVDA')

  // 图 1 上移动指针：图 2 同时写出同一个十字线时刻
  const strip = one.locator('[data-slot="crosshair-strip"]')
  const box = await strip.boundingBox()
  if (!box) throw new Error('strip not laid out')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await expect(one.locator('[data-slot="crosshair-readout"]')).toHaveText('十字线：02:00')
  await expect(two.locator('[data-slot="crosshair-readout"]')).toHaveText('十字线：02:00')
  await page.mouse.move(box.x - 40, box.y - 40)
  await expect(two.locator('[data-slot="crosshair-readout"]')).toHaveText('十字线：—')

  // 图 2 换到不联动：再点品种它不跟
  await two.getByRole('group', { name: '图 2 联动组' }).getByRole('button', { name: '不联动' }).click()
  await area.getByRole('group', { name: '自选', exact: true }).getByRole('button', { name: 'QQQ' }).click()
  await expect(one.locator('header')).toContainText('QQQ')
  await expect(two.locator('header')).not.toContainText('QQQ')
})
