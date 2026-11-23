// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 细滚动条（#126）：scrollbar-width 不继承，只写在 :root 上时页面里的滚动容器还是原生宽条；
// 窄档的新闻列表在窄预览区里不该横向溢出；.k-reel 仍是 ::-webkit-scrollbar 定的 4px（不能被继承来的 scrollbar-color 冲掉）。
// 默认的无头浏览器隐藏滚动条，量不到像素宽，这里断言算出来的样式。

test.use({ viewport: { width: 900, height: 900 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

test('news-feed：列表滚动容器是细滚动条；窄 640px 在窄预览区里不横向溢出', async ({ page }) => {
  const area = await open(page, 'news-feed')
  const list = area.getByTestId('news-frame').locator('.k-news-scroll')
  await expect(list).toHaveCSS('scrollbar-width', 'thin')
  const split = area.getByTestId('news-split')
  await split.getByText('窄 640px').click()
  await expect.poll(() => split.evaluate((element) => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(0)
})

test('reel：不吃全站的 scrollbar-width / scrollbar-color，仍走 ::-webkit-scrollbar', async ({ page }) => {
  const area = await open(page, 'reel')
  const reel = area.locator('.k-reel').first()
  await expect(reel).toHaveCSS('scrollbar-width', 'auto')
  await expect(reel).toHaveCSS('scrollbar-color', 'auto')
})
