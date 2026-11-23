// SPDX-License-Identifier: MIT
// 功能地图 features/overlays.md：弹层（Popover）与对话框（Dialog）的开、关、Esc，焦点回到触发处；
// 再到 #/news-feed 验弹层滚动即关（#125 / #135）：页面滚、装着锚点的容器滚都关，不相干的容器滚不关。
export default {
  title: '弹出层：Popover 与 Dialog 的开关与 Esc，弹层滚动即关',
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

    // 子功能 popover-scroll-close：#/popover 页在 1500 高的视口里滚不动，换到 #/news-feed。
    // 那页上「News panel」里的新闻流（news-frame）在页面里；「宽 1000px」那张（news-split）装在一个能横向滚的外框里。
    // 开弹层一律用 el.click()：Playwright 的 click 被 sticky 顶栏挡住时会自己再滚一次页面，那一下就会把弹层关掉。
    const feedNav = page.getByRole('navigation', { name: '文档目录' }).locator('a.k-sidenav-link[href="#/news-feed"]')
    const feedArea = page.locator('[data-gallery="news-feed"]').first()
    const frame = feedArea.getByTestId('news-frame')
    const split = feedArea.getByTestId('news-split')
    const frameFacet = frame.getByRole('button', { name: '市场', exact: true })
    const splitFacet = split.getByRole('button', { name: '市场', exact: true })
    const openPop = page.locator('[data-slot="popover-content"][data-state="open"]')
    const scrolls = async () => ({
      pageY: Math.round(await page.evaluate(() => window.scrollY)),
      splitX: Math.round(await split.evaluate((el) => el.scrollLeft)),
    })

    await step(
      '目录里点 NewsFeed，鼠标放在页上的说明文字上，用 el.click() 开「News panel」里的「市场」过滤：弹层打开',
      async () => {
        await feedNav.click()
        await feedArea.waitFor()
        // 先把鼠标放好再开弹层：开着时再 hover，Playwright 可能自己滚页面。
        await feedArea.getByText('演示数据（标题与来源都是虚构的', { exact: false }).hover()
        await frameFacet.evaluate((el) => el.click())
        await expect(openPop).toHaveCount(1)
        await expect(frameFacet).toHaveAttribute('aria-expanded', 'true')
        return { popovers: await openPop.count(), ...(await scrolls()) }
      },
    )
    await step('往下滚滚轮：页面滚了，弹层关', async () => {
      const before = await scrolls()
      await page.mouse.wheel(0, 300)
      await expect.poll(async () => (await scrolls()).pageY).toBeGreaterThan(before.pageY)
      await expect(openPop).toHaveCount(0)
      await expect(frameFacet).toHaveAttribute('aria-expanded', 'false')
      return { before, after: await scrolls(), popovers: await openPop.count() }
    })
    await step(
      '鼠标移到「宽 1000px」外框上，再开「News panel」的「市场」，横向滚：外框滚了、页面没滚，锚点不在这个外框里，弹层不关',
      async () => {
        await split.hover()
        await frameFacet.evaluate((el) => el.click())
        await expect(openPop).toHaveCount(1)
        const before = await scrolls()
        await page.mouse.wheel(200, 0)
        await expect.poll(async () => (await scrolls()).splitX).toBeGreaterThan(before.splitX)
        // 滚动事件晚一帧到：等一会儿再看弹层还在。
        await page.waitForTimeout(300)
        await expect(openPop).toHaveCount(1)
        const after = await scrolls()
        expect(after.pageY).toBe(before.pageY)
        await page.keyboard.press('Escape')
        await expect(openPop).toHaveCount(0)
        return { before, after, stillOpen: true }
      },
    )
    await step('开「宽 1000px」那张里的「市场」，同一处横向滚回去：装着锚点的外框滚了、页面没滚，弹层关', async () => {
      await splitFacet.evaluate((el) => el.click())
      await expect(openPop).toHaveCount(1)
      await page.waitForTimeout(300)
      await expect(openPop).toHaveCount(1)
      const before = await scrolls()
      await page.mouse.wheel(-150, 0)
      await expect.poll(async () => (await scrolls()).splitX).toBeLessThan(before.splitX)
      await expect(openPop).toHaveCount(0)
      await expect(splitFacet).toHaveAttribute('aria-expanded', 'false')
      const after = await scrolls()
      expect(after.pageY).toBe(before.pageY)
      return { before, after, popovers: await openPop.count() }
    })
  },
}
