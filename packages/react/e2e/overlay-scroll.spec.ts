// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 浮层滚动即关（#125）：非模态的 Popover 开着时，页面一滚就关，不会跟着锚点滚出屏幕还开着；
// 浮层自己里面滚、页面上不相干的容器滚都不关；在页面滚过的位置打开也不会刚开就关。

test.use({ viewport: { width: 1100, height: 800 } })

const open = async (page: Page, id: string) => {
  await page.goto(`/?theme=graphite#/${id}`)
  const area = page.locator(`[data-gallery="${id}"]`)
  await area.waitFor()
  return area
}

// 用 DOM 点击：Playwright 的 click 在目标被顶栏挡住时会自己再滚一次页面，那一下会被当成用户滚动。
const clickAdd = (page: Page) =>
  page.evaluate(() => {
    const add = document.querySelector<HTMLElement>('[data-slot="news-facet-add"]')!
    add.scrollIntoView({ block: 'center' })
    add.click()
  })

test('Popover：页面滚动就关；浮层里滚、侧栏滚不关；滚过以后再开不会刚开就关', async ({ page }) => {
  await open(page, 'news-feed')
  const pop = page.locator('[data-slot="popover-content"][data-open]')

  await clickAdd(page)
  await expect(pop).toHaveCount(1)
  await pop.evaluate((element) => (element.scrollTop = 40))
  await page.evaluate(() => {
    const nav = document.querySelector('.gal-nav')
    if (nav) nav.scrollTop += 60
  })
  await page.waitForTimeout(200)
  await expect(pop).toHaveCount(1)

  await page.mouse.wheel(0, 600)
  await expect(pop).toHaveCount(0)

  await clickAdd(page)
  await page.waitForTimeout(300)
  await expect(pop).toHaveCount(1)
  await page.keyboard.press('Tab')
  await expect(pop).toHaveCount(1)
  await page.keyboard.press('Escape')
  await expect(pop).toHaveCount(0)
})
