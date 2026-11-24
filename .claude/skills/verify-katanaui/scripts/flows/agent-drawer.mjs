// SPDX-License-Identifier: MIT
// 功能地图 features/agent-drawer.md：Agent 档案抽屉的三种状态、页签、热力格读数与方向键、最近运行点行、列表点开抽屉。
export default {
  title: 'AgentDrawer Agent 档案抽屉：状态、页签、热力格、最近运行、列表点开',
  page: 'agent-drawer',
  async run({ page, section, step, expect, aria }) {
    const drawers = section.locator('[data-slot="agent-drawer"]')
    const first = drawers.first()
    const cells = first.getByRole('gridcell')
    const readout = first.locator('[data-slot="agent-activity-readout"]')
    const focusedDate = () => page.evaluate(() => document.activeElement?.getAttribute('data-date'))

    await step('打开 agent-drawer 页：三个抽屉，状态词是 在跑 / 暂停 / 停用，属性区五项、三个页签、两张指标卡', async () => {
      await expect(drawers).toHaveCount(3)
      const words = []
      for (const [index, word] of ['在跑', '暂停', '停用'].entries()) {
        const pill = drawers.nth(index).locator('[data-slot="agent-drawer-status"]')
        await expect(pill).toHaveText(word)
        words.push({ word, tone: await pill.getAttribute('data-tone') })
      }
      await expect(first.locator('[data-slot="agent-drawer-props"] dt')).toHaveText(['状态', '标签', '触发', '负责人', '创建时间'])
      await expect(first.getByRole('tab')).toHaveText(['用量', '配置', '历史'])
      await expect(first.locator('[data-slot="agent-drawer-metric"]')).toHaveCount(2)
      await aria(first, 'agent-drawer-running.aria.yml')
      return { words }
    })
    await step('点「配置」页签：内容换成调用方给的槽，指标卡不在了；点回「用量」又出现', async () => {
      await first.getByRole('tab', { name: '配置' }).click()
      await expect(first.getByText('配置页由调用方给')).toBeVisible()
      await expect(first.locator('[data-slot="agent-drawer-metric"]')).toHaveCount(0)
      await first.getByRole('tab', { name: '用量' }).click()
      await expect(first.locator('[data-slot="agent-drawer-metric"]')).toHaveCount(2)
      return { tab: await first.getByRole('tab', { selected: true }).innerText() }
    })
    await step('热力格：role=grid，84 格，0 次空格与 5 档都有，读屏名是整句', async () => {
      const grid = first.getByRole('grid', { name: '最近 12 周每天跑的次数' })
      await grid.scrollIntoViewIfNeeded()
      await expect(cells).toHaveCount(84)
      const levels = await cells.evaluateAll((els) => [...new Set(els.map((el) => el.getAttribute('data-level')))].sort((a, b) => Number(a) - Number(b)))
      expect(levels).toEqual(['0', '1', '2', '3', '4', '5'])
      return { levels, sample: await cells.nth(30).getAttribute('aria-label') }
    })
    await step('悬停第 31 格：格子下面的读数行写那一格的整句；移开回到总览', async () => {
      const cell = cells.nth(30)
      await cell.hover()
      await expect(readout).toHaveText((await cell.getAttribute('aria-label')))
      const shown = (await readout.innerText()).trim()
      await page.mouse.move(0, 0)
      await expect(readout).toHaveText(/共 12 周/)
      return { hovered: shown }
    })
    await step('键盘落到第 31 格，按 →：前进一周（日期加 7 天），按 ↓：再前进一天，读数行跟着换', async () => {
      await cells.nth(30).focus()
      const start = await focusedDate()
      await page.keyboard.press('ArrowRight')
      const week = await focusedDate()
      await page.keyboard.press('ArrowDown')
      const day = await focusedDate()
      const plus = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86_400_000).toISOString().slice(0, 10)
      expect(week).toBe(plus(start, 7))
      expect(day).toBe(plus(start, 8))
      await expect(readout).toHaveText((await page.locator(':focus').getAttribute('aria-label')))
      return { start, week, day, readout: (await readout.innerText()).trim() }
    })
    await step('最近运行：点「价格突破」那一行，页下面写 onOpenRun：r4；Enter 打开第四行，写 r2', async () => {
      const rows = first.locator('[data-slot="agent-drawer-run"]')
      const opened = section.getByTestId('agent-drawer-opened').first()
      await expect(rows).toHaveCount(5)
      await rows.nth(1).getByRole('button').click()
      await expect(opened).toHaveText('onOpenRun：r4')
      await rows.nth(3).getByRole('button').focus()
      await page.keyboard.press('Enter')
      await expect(opened).toHaveText('onOpenRun：r2')
      return { opened: await opened.innerText(), results: await rows.locator('.k-ad-run-result').allInnerTexts() }
    })
    await step('Agent 列表：点「回补日线」那一行，右边的抽屉打开，状态「暂停」；Esc 关闭', async () => {
      const table = section.getByTestId('agent-table')
      await table.scrollIntoViewIfNeeded()
      await table.getByRole('rowheader', { name: '回补日线' }).click()
      const dialog = page.getByRole('dialog', { name: '回补日线' })
      await expect(dialog).toBeVisible()
      await expect(dialog.locator('[data-slot="agent-drawer-status"]')).toHaveText('暂停')
      await aria(dialog, 'agent-drawer-sheet.aria.yml')
      await page.keyboard.press('Escape')
      await expect(dialog).toHaveCount(0)
      return { closed: true }
    })
  },
}
