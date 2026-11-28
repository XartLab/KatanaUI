// SPDX-License-Identifier: MIT
// 功能地图 features/overlays.md：弹层（Popover）与对话框（Dialog）的开、关、Esc，焦点回到触发处；
// 外加「滚动即关」：页面或装着锚点的容器一滚就关，浮层自己里面滚、侧栏滚不关（#125）。
export default {
  title: '弹出层：Popover 与 Dialog 的开关、Esc 与滚动即关',
  page: 'popover',
  async run({ page, section, step, expect, aria }) {
    const focused = () =>
      page.evaluate(() => {
        const el = document.activeElement
        return el ? `${el.tagName.toLowerCase()}「${(el.textContent ?? '').trim().slice(0, 20)}」` : null
      })
    const trigger = section.getByRole('button', { name: '弹层', exact: true })
    const popover = page.locator('[data-slot="popover-content"]')

    await step('点「弹层」：弹层打开，标题「取数口径」', async () => {
      await trigger.click()
      await expect(popover).toBeVisible()
      await expect(popover).toContainText('取数口径')
      await expect(trigger).toHaveAttribute('aria-expanded', 'true')
      await aria(popover, 'popover-open.aria.yml')
      return { expanded: await trigger.getAttribute('aria-expanded'), focus: await focused() }
    })
    await step('按 Esc：弹层收起，焦点回到「弹层」钮', async () => {
      await page.keyboard.press('Escape')
      await expect(popover).toHaveCount(0)
      await expect(trigger).toBeFocused()
      return {
        popovers: await popover.count(),
        expanded: await trigger.getAttribute('aria-expanded'),
        focus: await focused(),
      }
    })
    await step('焦点在钮上按 Enter：键盘也能打开', async () => {
      await page.keyboard.press('Enter')
      await expect(popover).toBeVisible()
      return { popovers: await popover.count() }
    })
    await step('点弹层外的空白（触发钮右边 300px）：弹层收起', async () => {
      const box = await trigger.boundingBox()
      await page.mouse.click(box.x + box.width + 300, box.y + box.height / 2)
      await expect(popover).toHaveCount(0)
      return { popovers: await popover.count() }
    })

    // 同一个功能的第二个入口：对话框。单页应用里换页，点左侧目录，不重载。
    const nav = page.getByRole('navigation', { name: '文档目录' }).locator('a.k-sidenav-link[href="#/dialog"]')
    const dialogArea = page.locator('[data-gallery="dialog"]').first()
    const opener = dialogArea.getByRole('button', { name: '对话框', exact: true })
    const dialog = page.getByRole('dialog', { name: '恢复默认布局' })

    await step('目录里点 Dialog，点「对话框」：模态框「恢复默认布局」打开', async () => {
      await nav.click()
      await dialogArea.waitFor()
      await opener.click()
      await expect(dialog).toBeVisible()
      await aria(dialog, 'dialog-open.aria.yml')
      return { dialogs: await page.getByRole('dialog').count(), focus: await focused() }
    })
    await step('按 Esc：对话框关上，焦点回到「对话框」钮', async () => {
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      await expect(opener).toBeFocused()
      return { dialogs: await page.getByRole('dialog').count(), focus: await focused() }
    })
    await step('再开，点「取消」：同样关上', async () => {
      await opener.click()
      await expect(dialog).toBeVisible()
      await dialog.getByRole('button', { name: '取消' }).click()
      await expect(page.getByRole('dialog')).toHaveCount(0)
      return { dialogs: await page.getByRole('dialog').count(), focus: await focused() }
    })

    // 滚动即关（#125）：新闻流上的「添加过滤」是一处真的非模态浮层，锚点在长页面里，滚一下就该关。
    // 开浮层一律用 DOM 点击：Playwright 的 click 在目标被顶栏挡住时会自己再滚一次页面，那一下滚动本身就会关浮层。
    const openFacet = () =>
      page.evaluate(() => {
        const add = document.querySelector('[data-slot="news-facet-add"]')
        if (!add) return false
        add.scrollIntoView({ block: 'center' })
        add.click()
        return true
      })
    const openPop = page.locator('[data-slot="popover-content"][data-state="open"]')
    await step('换到 NewsFeed，DOM 点开「添加过滤」：浮层开着', async () => {
      await page.getByRole('navigation', { name: '文档目录' }).locator('a.k-sidenav-link[href="#/news-feed"]').click()
      await page.locator('[data-gallery="news-feed"]').first().waitFor()
      expect(await openFacet()).toBe(true)
      await expect(openPop).toHaveCount(1)
      return { popovers: await openPop.count() }
    })
    // 1100×1500 下侧栏与新闻列表都没长过一屏、滚不动；压到 1100×800 才有真的滚动容器（见 features/overlays.md）。
    await step('压到 1100×800：侧栏高过一屏，滚它不关浮层', async () => {
      await page.setViewportSize({ width: 1100, height: 800 })
      const side = page.locator('.k-sidenav-scroll')
      const before = await side.evaluate((el) => el.scrollTop)
      await side.evaluate((el) => el.scrollTop += 200)
      await page.waitForTimeout(200)
      const after = await side.evaluate((el) => el.scrollTop)
      expect(after).toBeGreaterThan(before)
      await expect(openPop).toHaveCount(1)
      return { sideScrollTop: { before, after }, popovers: await openPop.count() }
    })
    await step('页面滚一下：浮层关掉，不跟着锚点滚出屏幕', async () => {
      const before = await page.evaluate(() => window.scrollY)
      // 滚轮要落在没有自己滚动条的地方：移到正文右侧的空白处（左边 420 是面板，再往右是 .gal-main 的底色）。
      await page.mouse.move(900, 600)
      await page.mouse.wheel(0, 600)
      await expect(openPop).toHaveCount(0)
      const after = await page.evaluate(() => window.scrollY)
      expect(after).toBeGreaterThan(before)
      return { scrollY: { before, after } }
    })
    await step('滚过以后再开：浮层在，不会刚开就被上一次滚动关掉', async () => {
      expect(await openFacet()).toBe(true)
      await expect(openPop).toHaveCount(1)
      await page.waitForTimeout(300)
      await expect(openPop).toHaveCount(1)
      await page.keyboard.press('Escape')
      await expect(openPop).toHaveCount(0)
      return { popovers: await openPop.count() }
    })
  },
}