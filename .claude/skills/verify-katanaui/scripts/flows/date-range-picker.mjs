// SPDX-License-Identifier: MIT
// 功能地图 features/date-range-picker.md：commit="apply" 先挑再应用——状态字、悬停预览、Esc 丢草稿、应用、清除、键盘。
export default {
  title: 'DateRangePicker：先挑再应用（commit=apply）',
  page: 'date-range-picker',
  async run({ page, section, step, expect, aria }) {
    const row = section.locator('.k-dr').nth(2)
    const trigger = row.getByRole('button', { name: '选择区间' })
    const out = section.locator('[data-gallery-range-apply]')
    const foot = page.locator('.k-dr-foot')
    // 看得见的状态字（跟着悬停走）；role=status 那份是读屏播报的，只在点选后更新。
    const status = foot.locator('[data-slot="date-range-status"]')
    const spoken = foot.getByRole('status')
    const applyBtn = foot.getByRole('button', { name: '应用' })
    const day = (n) => page.getByRole('button', { name: new RegExp(`12月${n}日`) }).first()
    const focused = () => page.evaluate(() => document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.tagName)

    await step('点「选择区间」：脚上「选第一天」，「应用」禁用，今天的格子有标记', async () => {
      await trigger.click()
      await expect(status).toHaveText('选第一天')
      await expect(applyBtn).toBeDisabled()
      await expect(page.locator('.k-cal-cell[data-k-today]')).toHaveCount(1)
      await aria(page.locator('[data-slot="popover-content"]'), 'range-apply-open.aria.yml')
      return { status: await status.innerText(), today: await page.locator('.k-cal-cell[data-k-today]').count() }
    })
    await step('点 7 号：脚「已选 1 天」，起点框填好、终点仍是占位', async () => {
      await day(7).click()
      await expect(status).toHaveText('已选 1 天')
      await expect(row.getByRole('group', { name: '起点' }).getByRole('spinbutton', { name: /日/ })).toHaveText('07')
      await expect(row.getByRole('group', { name: '终点' }).getByRole('spinbutton', { name: /年/ })).toHaveAttribute(
        'data-placeholder',
        'true',
      )
      return { status: await status.innerText() }
    })
    await step('悬停 18 号：预览 12 天，脚「已选 12 天」，「应用」仍禁用', async () => {
      await day(18).hover()
      await expect(status).toHaveText('已选 12 天')
      await expect(spoken).toHaveText('已选 1 天') // 悬停不播报
      await expect(page.locator('.k-rcal .k-cal-cell[data-selected]')).toHaveCount(12)
      await expect(applyBtn).toBeDisabled()
      return { status: await status.innerText(), spoken: await spoken.innerText(), previewCells: await page.locator('.k-rcal .k-cal-cell[data-selected]').count() }
    })
    await step('点 18 号、Esc：「应用」曾可点；Esc 后值没变，焦点回触发钮', async () => {
      await day(18).click()
      await expect(applyBtn).toBeEnabled()
      await page.keyboard.press('Escape')
      await expect(foot).toHaveCount(0)
      await expect(out).toHaveText('未选')
      await expect(trigger).toBeFocused()
      return { out: await out.innerText(), focus: await focused() }
    })
    await step('再开：草稿重新来；点外面同样丢草稿', async () => {
      await trigger.click()
      await expect(status).toHaveText('选第一天')
      await day(7).click()
      await day(18).click()
      await page.mouse.click(5, 5)
      await expect(foot).toHaveCount(0)
      await expect(out).toHaveText('未选')
      return { out: await out.innerText() }
    })
    await step('再开、挑好、点「应用」：上报区间、收起、焦点回触发钮', async () => {
      await trigger.click()
      await day(7).click()
      await day(18).click()
      await applyBtn.click()
      await expect(out).toHaveText('2026-12-07 ~ 2026-12-18')
      await expect(foot).toHaveCount(0)
      await expect(trigger).toBeFocused()
      return { out: await out.innerText(), focus: await focused() }
    })
    await step('再开点「清除」：草稿清空、不收起、已生效的值不变', async () => {
      await trigger.click()
      await expect(status).toHaveText('已选 12 天')
      await foot.getByRole('button', { name: '清除' }).click()
      await expect(status).toHaveText('选第一天')
      await expect(applyBtn).toBeDisabled()
      await expect(foot).toBeVisible()
      await expect(out).toHaveText('2026-12-07 ~ 2026-12-18')
      await page.keyboard.press('Escape')
      return { out: await out.innerText() }
    })
    // 前面已应用过 12-07 ~ 12-18，打开时日历聚焦在当前值的起点（12-07）。
    await step('键盘：Enter 开、Enter 选起点、→ → 、Enter 选终点、Tab Tab 到「应用」、Enter', async () => {
      await trigger.focus()
      await page.keyboard.press('Enter')
      await page.keyboard.press('Enter')
      await expect(status).toHaveText('已选 2 天')
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('ArrowRight')
      await expect(status).toHaveText('已选 4 天')
      await page.keyboard.press('Enter')
      await expect(applyBtn).toBeEnabled()
      await page.keyboard.press('Tab')
      await expect(foot.getByRole('button', { name: '清除' })).toBeFocused()
      await page.keyboard.press('Tab')
      await expect(applyBtn).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(out).toHaveText('2026-12-07 ~ 2026-12-10')
      await expect(trigger).toBeFocused()
      return { out: await out.innerText(), focus: await focused() }
    })
  },
}
