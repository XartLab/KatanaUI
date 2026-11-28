// SPDX-License-Identifier: MIT
// 功能地图 features/tag-combobox.md：点字段开、点两项成标签、打字过滤并加强命中字、空输入退格两次删标签、标签换行时弹层下移。
export default {
  title: 'TagCombobox 带标签的多选：点开、点选、过滤高亮、退格删、换行',
  page: 'tag-combobox',
  async run({ page, section, step, expect, aria }) {
    // 页上有三个字段（评审人、策略类型、只读评审人）：只走第一个，名字要 exact。
    const field = section.getByRole('combobox', { name: '评审人', exact: true })
    const box = field.locator('xpath=..')
    const tags = box.locator('.k-tagcb-tag')
    // 弹层在页面根部的 portal 里，不在 section 里。
    const list = page.getByRole('listbox', { name: '评审人', exact: true })
    const option = (name) => list.getByRole('option', { name: new RegExp(`^${name}`) })
    const tagNames = async () => (await tags.locator('.k-tagcb-tag-text').allInnerTexts()).map((t) => t.trim())
    const height = async () => Math.round((await box.boundingBox()).height)

    await step('点字段：列表开，光标在输入框里', async () => {
      const b = await box.boundingBox()
      await page.mouse.click(b.x + b.width - 60, b.y + 6)
      await expect(field).toBeFocused()
      await expect(field).toHaveAttribute('aria-expanded', 'true')
      await expect(list).toBeVisible()
      await expect(list).toHaveAttribute('aria-multiselectable', 'true')
      await aria(list, 'tag-combobox-open.aria.yml')
      return { expanded: await field.getAttribute('aria-expanded'), tags: await tagNames(), rows: await list.getByRole('option').count() }
    })
    await step('点两项（Ben Carter、Hiro Tanaka）：两个标签进框，两行有勾，列表仍开', async () => {
      await option('Ben Carter').click()
      await option('Hiro Tanaka').click()
      await expect(tags).toHaveCount(4)
      await expect(option('Ben Carter')).toHaveAttribute('aria-selected', 'true')
      await expect(option('Hiro Tanaka')).toHaveAttribute('aria-selected', 'true')
      await expect(list).toBeVisible()
      await expect(field).toBeFocused()
      return { tags: await tagNames(), ben: await option('Ben Carter').getAttribute('aria-selected'), listOpen: await list.isVisible() }
    })
    await step('打「an」：只剩含 an 的行，命中的字加强', async () => {
      await field.pressSequentially('an')
      const rows = list.getByRole('option')
      const texts = (await rows.allInnerTexts()).map((t) => t.replace(/\s+/g, ' ').toLowerCase())
      for (const text of texts) expect(text).toContain('an')
      const hits = list.locator('[data-hit]')
      expect(await hits.count()).toBeGreaterThan(0)
      const weight = await hits.first().evaluate((n) => getComputedStyle(n).fontWeight)
      await aria(list, 'tag-combobox-filtered.aria.yml')
      return { rows: texts.length, hits: await hits.allInnerTexts(), hitWeight: weight }
    })
    await step('清空输入后按 Backspace：最后一个标签高亮；再按一次删掉它，对应行的勾消失', async () => {
      await field.fill('')
      await page.keyboard.press('Backspace')
      await expect(tags.last()).toHaveAttribute('data-picked', '')
      const afterFirst = await tagNames()
      await page.keyboard.press('Backspace')
      await expect(tags).toHaveCount(3)
      await expect(option('Hiro Tanaka')).toHaveAttribute('aria-selected', 'false')
      return { afterFirst, afterSecond: await tagNames(), hiro: await option('Hiro Tanaka').getAttribute('aria-selected') }
    })
    await step('再选几项直到标签换行：字段长高，弹层上沿仍在字段下沿之下', async () => {
      const before = await height()
      for (const name of ['Camille Girard', 'Chloe Martin', 'Daniel Foster', 'Elif Demir', 'Fatima Al-Sayed'])
        await option(name).click()
      await expect.poll(height).toBeGreaterThan(before + 10)
      const b = await box.boundingBox()
      const popup = page.locator('[data-slot="popover-content"]')
      await expect.poll(async () => (await popup.boundingBox()).y >= b.y + b.height - 1).toBe(true)
      return { fieldHeight: { before, after: await height() }, fieldBottom: Math.round(b.y + b.height), popupTop: Math.round((await popup.boundingBox()).y) }
    })
  },
}
