// SPDX-License-Identifier: MIT
// 功能地图 features/overlays.md：弹层（Popover）与对话框（Dialog）的开、关、Esc，焦点回到触发处。
export default {
  title: '弹出层：Popover 与 Dialog 的开关与 Esc',
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
  },
}
