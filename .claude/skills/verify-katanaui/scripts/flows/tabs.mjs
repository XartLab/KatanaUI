// SPDX-License-Identifier: MIT
// 功能地图 features/tabs.md：点页签换内容、底块跟过去、禁用页签点不动、方向键切换。
export default {
  title: 'Tabs 页签：点选、键盘、禁用',
  page: 'tabs',
  async run({ page, section, step, expect, aria }) {
    // 页上不止一组页签（还有「日线 / 周线」那组）：只看第一组。
    const list = section.getByRole('tablist').first()
    const tab = (name) => list.getByRole('tab', { name, exact: true })
    const pill = list.locator('[data-slot="tabs-pill"]')
    const pillX = async () => Math.round((await pill.boundingBox()).x)
    const selected = async () => (await list.getByRole('tab', { selected: true }).innerText()).trim()
    const names = async () => (await list.getByRole('tab').allInnerTexts()).map((t) => t.trim())

    await step('打开 tabs 页：默认选中「涨幅榜」，底块在它下面', async () => {
      await expect(tab('涨幅榜')).toHaveAttribute('aria-selected', 'true')
      const x = Math.round((await tab('涨幅榜').boundingBox()).x)
      await expect.poll(pillX).toBe(x)
      await aria(list, 'tabs-default.aria.yml')
      return { tabs: await names(), selected: await selected(), tabX: x, pillX: await pillX() }
    })
    await step('点「换手榜」：内容换成换手榜的，底块滑过去', async () => {
      await tab('换手榜').click()
      await expect(tab('换手榜')).toHaveAttribute('aria-selected', 'true')
      await expect(section.getByText('换手榜的内容')).toBeVisible()
      await expect(section.getByText('涨幅榜的内容')).toHaveCount(0)
      const x = Math.round((await tab('换手榜').boundingBox()).x)
      await expect.poll(pillX).toBe(x)
      return { selected: await selected(), tabX: x, pillX: await pillX() }
    })
    await step('焦点在「换手榜」上按 ←：焦点与选中一起移到「成交额榜」，内容跟着换', async () => {
      await page.keyboard.press('ArrowLeft')
      await expect(tab('成交额榜')).toBeFocused()
      await expect(tab('成交额榜')).toHaveAttribute('aria-selected', 'true')
      await expect(section.getByText('换手榜的内容')).toHaveCount(0)
      return {
        selected: await selected(),
        focus: await page.evaluate(() => document.activeElement?.textContent?.trim()),
      }
    })
    await step('「已禁用」页签：禁用，点不动', async () => {
      await expect(tab('已禁用')).toBeDisabled()
      const before = await selected()
      await tab('已禁用').click({ force: true })
      expect(await selected()).toBe(before)
      return { disabled: await tab('已禁用').isDisabled(), selected: await selected() }
    })
  },
}
