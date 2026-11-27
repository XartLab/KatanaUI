// SPDX-License-Identifier: MIT
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// 文档站版式（#251 批 C，kubai Vibe Design Tips 008）：页末上一页 / 下一页、左栏跟随当前页与记位置、两端渐隐、窄屏底栏 + 抽屉。
// 断言用户看到的：元素在视口里的位置、点过之后的地址与标题、焦点落在哪，不查元素在不在。

const rail = (page: Page) => page.getByRole('navigation', { name: '文档目录' })
const railScroller = (page: Page) => rail(page).locator('.k-sidenav-scroll')
const link = (page: Page, id: string) => rail(page).locator(`a.k-sidenav-link[href="#/${id}"]`)
const pager = (page: Page) => page.getByRole('navigation', { name: '上一页与下一页' })
const hashOf = (page: Page) => page.evaluate(() => location.hash)

/** 左栏里的所有页，按显示次序。 */
const railOrder = (page: Page) =>
  rail(page)
    .locator('a.k-sidenav-link')
    .evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).getAttribute('href')!))

test.describe('桌面', () => {
  test.use({ viewport: { width: 1100, height: 600 } })

  test('直接打开 #/order-book：左栏里它那一项完整落在左栏可视区内', async ({ page }) => {
    await page.goto('/?theme=graphite#/order-book')
    await page.locator('[data-gallery="order-book"]').waitFor()
    const item = link(page, 'order-book')
    await expect(item).toHaveAttribute('aria-current', 'page')
    const view = (await railScroller(page).boundingBox())!
    await expect
      .poll(async () => {
        const box = (await item.boundingBox())!
        return box.y >= view.y && box.y + box.height <= view.y + view.height
      })
      .toBe(true)
    // 页面本身没被带着滚（吸顶的左栏不能因为露出当前项把整页滚下去）。
    expect(await page.evaluate(() => scrollY)).toBe(0)
  })

  test('页末下一页 / 上一页：次序跟左栏一致，点过去地址与标题对', async ({ page }) => {
    await page.goto('/?theme=graphite#/order-book')
    await page.locator('[data-gallery="order-book"]').waitFor()
    const order = await railOrder(page)
    const at = order.indexOf('#/order-book')
    expect(at).toBeGreaterThan(0)
    const next = pager(page).locator('a[rel="next"]')
    const prev = pager(page).locator('a[rel="prev"]')
    await expect(next).toHaveAttribute('href', order[at + 1])
    await expect(prev).toHaveAttribute('href', order[at - 1])

    const nextId = order[at + 1].slice(2)
    await next.scrollIntoViewIfNeeded()
    await expect(next).toBeInViewport()
    await next.click()
    await expect.poll(() => hashOf(page)).toBe(order[at + 1])
    // 标题对：页头的 h1 就是左栏里那一项的名字（组件页名字是「英文名 + 中文名」，取英文名）。
    const name = (await link(page, nextId).innerText()).split(/\s+/)[0]
    await expect(page.locator('.gal-page h1').first()).toContainText(name)
    await expect.poll(() => page.evaluate(() => scrollY)).toBe(0)

    await pager(page).locator('a[rel="prev"]').click()
    await expect.poll(() => hashOf(page)).toBe(order[at])
    await expect(page.locator('[data-gallery="order-book"]')).toBeVisible()
  })

  test('第一页没有上一页，最后一页没有下一页，另一个方向仍在', async ({ page }) => {
    await page.goto('/?theme=graphite#/developing')
    await page.locator('.gal-page h1').first().waitFor()
    const order = await railOrder(page)
    await expect(pager(page).locator('a[rel="prev"]')).toHaveCount(0)
    await expect(pager(page).locator('a[rel="next"]')).toHaveAttribute('href', order[1])
    await page.goto(`/?theme=graphite${order.at(-1)}`)
    await page.locator('.gal-page h1, .gal-page').first().waitFor()
    await expect(pager(page).locator('a[rel="next"]')).toHaveCount(0)
    await expect(pager(page).locator('a[rel="prev"]')).toHaveAttribute('href', order.at(-2)!)
  })

  test('左栏滚动位置：换页不重置，刷新后放回', async ({ page }) => {
    await page.goto('/?theme=graphite#/developing')
    await page.locator('.gal-page h1').first().waitFor()
    const scroller = railScroller(page)
    await scroller.evaluate((el) => (el.scrollTop = 400))
    await expect.poll(() => scroller.evaluate((el) => el.scrollTop)).toBe(400)
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('katanaui-gallery-side-scroll'))).toBe('400')

    // 点当前视区中间的一项换页：滚动位置不动。
    const middle = await rail(page)
      .locator('a.k-sidenav-link')
      .evaluateAll(
        (anchors, view) => {
          const hit = anchors.find((anchor) => {
            const box = anchor.getBoundingClientRect()
            return box.top > view.y + 160 && box.bottom < view.y + view.height - 160
          })
          return hit?.getAttribute('href') ?? null
        },
        (await scroller.boundingBox())!,
      )
    expect(middle).not.toBeNull()
    await rail(page).locator(`a.k-sidenav-link[href="${middle}"]`).click()
    await expect.poll(() => hashOf(page)).toBe(middle)
    expect(await scroller.evaluate((el) => el.scrollTop)).toBe(400)

    await page.reload()
    await page.locator('.gal-page h1').first().waitFor()
    await expect.poll(() => railScroller(page).evaluate((el) => el.scrollTop)).toBe(400)
    // 刷新后当前项也在左栏可视区内。
    const view = (await railScroller(page).boundingBox())!
    const box = (await rail(page).locator('a[aria-current="page"]').boundingBox())!
    expect(box.y).toBeGreaterThanOrEqual(view.y)
    expect(box.y + box.height).toBeLessThanOrEqual(view.y + view.height)
  })

  test('左栏两端渐隐：顶端没有、滚到中间两端都有、滚到底底端没有', async ({ page }) => {
    await page.goto('/?theme=graphite#/developing')
    await page.locator('.gal-page h1').first().waitFor()
    const scroller = railScroller(page)
    const fade = (name: string) =>
      scroller.evaluate((el, prop) => getComputedStyle(el).getPropertyValue(prop).trim(), name)
    await scroller.evaluate((el) => (el.scrollTop = 0))
    await expect.poll(() => fade('--gal-fade-above')).toBe('0px')
    await expect.poll(() => fade('--gal-fade-below')).toBe('56px')
    await scroller.evaluate((el) => (el.scrollTop = 300))
    await expect.poll(() => fade('--gal-fade-above')).toBe('40px')
    await expect.poll(() => fade('--gal-fade-below')).toBe('56px')
    await scroller.evaluate((el) => (el.scrollTop = el.scrollHeight))
    await expect.poll(() => fade('--gal-fade-above')).toBe('40px')
    await expect.poll(() => fade('--gal-fade-below')).toBe('0px')
  })

  test('按 / 聚焦搜索框，在输入框里打 / 不抢', async ({ page }) => {
    await page.goto('/?theme=graphite#/developing')
    await page.locator('.gal-page h1').first().waitFor()
    await page.keyboard.press('/')
    const search = rail(page).getByRole('searchbox')
    await expect(search).toBeFocused()
    await page.keyboard.type('a/b')
    await expect(search).toHaveValue('a/b')
  })
})

test.describe('窄屏 390px', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  test('没有左栏；底栏固定在底：目录按钮 + 当前节名', async ({ page }) => {
    await page.goto('/?theme=graphite#/order-book')
    await page.locator('[data-gallery="order-book"]').waitFor()
    await expect(page.locator('aside.gal-side')).toHaveCount(0)
    const dock = page.locator('.gal-dock')
    await expect(dock).toBeVisible()
    const box = (await dock.boundingBox())!
    expect(box.y + box.height).toBeLessThanOrEqual(800)
    expect(box.y + box.height).toBeGreaterThan(800 - 16)
    await expect(dock.getByRole('button', { name: '目录' })).toBeVisible()
    // 节名不空，且不撑出底栏（省略号截断）。
    const name = dock.locator('.gal-dock-section')
    await expect(name).not.toHaveText('')
    expect(
      await name.evaluate(
        (el) => el.scrollWidth <= el.clientWidth + 1 || getComputedStyle(el).textOverflow === 'ellipsis',
      ),
    ).toBe(true)
    // 页面本身不横向溢出。
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  })

  test('抽屉：点开、当前项在里面可见；Esc 关，焦点回按钮', async ({ page }) => {
    await page.goto('/?theme=graphite#/order-book')
    await page.locator('[data-gallery="order-book"]').waitFor()
    const button = page.locator('.gal-dock').getByRole('button', { name: '目录' })
    await button.click()
    const drawer = page.getByRole('dialog', { name: '文档目录' })
    await expect(drawer).toBeVisible()
    const item = link(page, 'order-book')
    await expect(item).toBeInViewport({ ratio: 1 })
    const view = (await drawer.boundingBox())!
    expect(view.y + view.height).toBeGreaterThan(800 - 2)
    await page.keyboard.press('Escape')
    await expect(drawer).toBeHidden()
    await expect(button).toBeFocused()
  })

  test('抽屉：点条目换页并关上；点抽屉外面关上', async ({ page }) => {
    await page.goto('/?theme=graphite#/developing')
    await page.locator('.gal-page h1').first().waitFor()
    const button = page.locator('.gal-dock').getByRole('button', { name: '目录' })
    await button.click()
    const drawer = page.getByRole('dialog', { name: '文档目录' })
    await expect(drawer).toBeVisible()
    await link(page, 'styling').click()
    await expect.poll(() => hashOf(page)).toBe('#/styling')
    await expect(drawer).toBeHidden()

    await button.click()
    await expect(drawer).toBeVisible()
    await page.mouse.click(195, 40)
    await expect(drawer).toBeHidden()
    await expect(button).toBeFocused()
  })
})

test.describe('axe', () => {
  test.use({ viewport: { width: 390, height: 800 } })

  // axe 要求页面来自 browser.newContext()（不能用 browser.newPage()），所以这里自己开 context。
  test('窄屏底栏与打开的抽屉没有 WCAG A / AA 违规', async ({ browser, baseURL }) => {
    const context = await browser.newContext({ viewport: { width: 390, height: 800 }, baseURL })
    const page = await context.newPage()
    await page.goto('/?theme=graphite#/order-book')
    await page.locator('[data-gallery="order-book"]').waitFor()
    const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
    const dock = await new AxeBuilder({ page }).withTags(tags).include('.gal-dock').analyze()
    expect(dock.violations.map((violation) => violation.id)).toEqual([])
    await page.locator('.gal-dock').getByRole('button', { name: '目录' }).click()
    await expect(page.getByRole('dialog', { name: '文档目录' })).toBeVisible()
    await page.waitForTimeout(400)
    const sheet = await new AxeBuilder({ page }).withTags(tags).include('.gal-drawer').analyze()
    expect(sheet.violations.map((violation) => violation.id)).toEqual([])
    await context.close()
  })
})
