// SPDX-License-Identifier: MIT
// 功能地图 features/research-calendar.md 的「日历事件点与洞察」：有事件的格子带点，悬停与键盘聚焦读出，洞察行在。
export default {
  title: '日历事件点与洞察：在 DateTimeInput 的日历里走一遍',
  page: 'date-time-input',
  async run({ page, section, step, expect, aria }) {
    const pop = page.locator('.k-dt-pop')
    const eventCells = pop.locator('[data-has-events]')
    const readout = pop.locator('.k-cal-readout')

    await step('点「选回放起点的日期」：日历弹出，11 月有 5 个带事件的格子，脚上有洞察行', async () => {
      await section.getByRole('button', { name: '选回放起点的日期' }).click()
      await expect(eventCells).toHaveCount(5)
      await expect(pop.locator('.k-cal-insight')).toContainText('已避开 11-27 美股半日市')
      await aria(pop, 'calendar-events.aria.yml')
      return { eventCells: await eventCells.count(), insight: await pop.locator('.k-cal-insight').innerText() }
    })
    await step('11-20 有两件事：两个点，格子的描述读出「期权到期和600519 除权」', async () => {
      const day = eventCells.filter({ hasText: /^20/ }).first()
      await expect(day.locator('.k-cal-dot')).toHaveCount(2)
      const id = await day.getAttribute('aria-describedby')
      await expect(page.locator(`[id="${id}"]`)).toHaveText('期权到期和600519 除权')
      return { dots: await day.locator('.k-cal-dot').count(), description: await page.locator(`[id="${id}"]`).innerText() }
    })
    await step('鼠标悬停 11-27：读数行写出「美股半日市」；移开后回到选中日 11-20 的事', async () => {
      await eventCells.last().hover()
      await expect(readout).toContainText('美股半日市')
      const hovered = await readout.innerText()
      await page.mouse.move(0, 0)
      await expect(readout).toContainText('期权到期')
      return { hovered, afterLeave: await readout.innerText() }
    })
    await step('键盘聚焦到 11-25：读数行跟到「000001 除权」', async () => {
      await eventCells.filter({ hasText: /^20/ }).first().focus()
      for (let i = 0; i < 5; i++) await page.keyboard.press('ArrowRight')
      await expect(readout).toContainText('000001 除权')
      return { focused: await page.evaluate(() => document.activeElement?.getAttribute('aria-label')), readout: await readout.innerText() }
    })
    await step('没传 events 的日历（第二行「截止」）：没有点、没有脚', async () => {
      await page.keyboard.press('Escape')
      await section.locator('.k-dt').nth(1).getByRole('button', { name: '选截止的日期' }).click()
      await expect(pop.locator('.k-cal-dot, .k-cal-foot, [data-has-events]')).toHaveCount(0)
      return { dots: await pop.locator('.k-cal-dot').count(), foot: await pop.locator('.k-cal-foot').count() }
    })
  },
}
