// SPDX-License-Identifier: MIT
// 功能地图 features/seasonal-chart.md：键盘读数（← / PageUp / End / Esc）、图例开关、表格视图、受控隐藏与至少留一年、窄于 520px 的布局。
export default {
  title: 'SeasonalChart 季节性图：键盘读数、图例、表格视图、受控隐藏、窄图',
  page: 'seasonal-chart',
  async run({ page, section, step, expect, aria }) {
    // 页上四张演示，各在一行里，行头的说明字不一样：按说明字收到具体那张。
    const demo = (caption) => section.locator('.gal-row').filter({ hasText: caption })
    const wide = demo('五年叠画')
    const controlled = demo('受控 hidden')
    const narrow = demo('窄于 520px')
    const legendOf = (area) => area.getByRole('group', { name: 'Years', exact: true })
    const key = (area, year) => legendOf(area).getByRole('button', { name: new RegExp(`^${year} `) })
    const lines = (area) => area.locator('[data-slot="seasonal-line"]')
    const linesYears = async (area) =>
      (await lines(area).evaluateAll((els) => els.map((el) => el.getAttribute('data-year')))).sort()
    const pressedYears = async (area) =>
      (await legendOf(area).getByRole('button', { pressed: true }).allInnerTexts()).map((t) => t.trim().split(/\s+/)[0])
    const plot = wide.getByRole('slider', { name: 'Seasonals', exact: true })
    const now = () => plot.getAttribute('aria-valuenow')
    const text = () => plot.getAttribute('aria-valuetext')
    const tableBtn = wide.getByRole('button', { name: 'Table view', exact: true })
    const table = wide.getByRole('region', { name: 'Month-end change by year', exact: true })
    const box = async (locator) => (await locator.boundingBox()) ?? { y: NaN, height: NaN }

    await step('打开 seasonal-chart 页：五年的开关，2022 默认关着，画四条线', async () => {
      await expect(legendOf(wide).getByRole('button')).toHaveCount(5)
      await expect(key(wide, 2022)).toHaveAttribute('aria-pressed', 'false')
      expect(await pressedYears(wide)).toEqual(['2023', '2024', '2025', '2026'])
      expect(await linesYears(wide)).toEqual(['2023', '2024', '2025', '2026'])
      await aria(wide.getByRole('figure'), 'seasonal-default.aria.yml')
      return { keys: await legendOf(wide).getByRole('button').allInnerTexts(), lines: await linesYears(wide) }
    })
    await step('焦点到图上按 ←：第一下落在今年最后一个点（11 月 20 日，第 324 格），出读数', async () => {
      // 键盘用户 Tab 到图上；这里直接给焦点（图上没有点过的位置，免得指针先选了一天）。
      await plot.focus()
      await expect(plot).toBeFocused()
      expect(await text()).toBeNull()
      await page.keyboard.press('ArrowLeft')
      await expect(plot).toHaveAttribute('aria-valuenow', '324')
      await expect(plot).toHaveAttribute('aria-valuetext', /^Nov 20 {2}2023 \S+ {2}2024 \S+ {2}2025 \S+ {2}2026 \S+$/)
      await expect(wide.getByText('Nov 20', { exact: true })).toBeVisible()
      return { valuenow: await now(), valuetext: await text() }
    })
    await step('按 PageUp：跳到这个月的月初 11 月 1 日（第 305 格）', async () => {
      await page.keyboard.press('PageUp')
      await expect(plot).toHaveAttribute('aria-valuenow', '305')
      await expect(plot).toHaveAttribute('aria-valuetext', /^Nov 1 {2}/)
      return { valuenow: await now(), valuetext: await text() }
    })
    await step('按 End：到 12 月 31 日，往年沿用最后一个点，今年还没到写「—」', async () => {
      await page.keyboard.press('End')
      await expect(plot).toHaveAttribute('aria-valuenow', '365')
      await expect(plot).toHaveAttribute('aria-valuetext', /^Dec 31 {2}.* {2}2026 —$/)
      // 往年在 12 月 31 日的读数就是它图例上那个涨跌幅（这一年最后一个点）。
      const legend2025 = (await key(wide, 2025).innerText()).trim().split(/\s+/)[1]
      expect(await text()).toContain(`2025 ${legend2025}`)
      return { valuenow: await now(), valuetext: await text(), legend2025 }
    })
    await step('按 Esc：读数清掉', async () => {
      await page.keyboard.press('Escape')
      await expect.poll(text).toBeNull()
      // 读数浮层（LcdTooltip）没有角色：看它的标题「月 日」还在不在图里。
      await expect(wide.getByText('Dec 31', { exact: true })).toHaveCount(0)
      return { valuenow: await now(), valuetext: await text() }
    })
    await step('点图例「2023」：它弹起，线少一条；再点一次回来', async () => {
      await key(wide, 2023).click()
      await expect(key(wide, 2023)).toHaveAttribute('aria-pressed', 'false')
      await expect(lines(wide)).toHaveCount(3)
      const off = await linesYears(wide)
      expect(off).toEqual(['2024', '2025', '2026'])
      await key(wide, 2023).click()
      await expect(key(wide, 2023)).toHaveAttribute('aria-pressed', 'true')
      await expect(lines(wide)).toHaveCount(4)
      return { afterOff: off, afterOn: await linesYears(wide) }
    })
    await step('点右上「Table view」：每月一行、每个看得见的年一列，图藏起来', async () => {
      await tableBtn.click()
      await expect(tableBtn).toHaveAttribute('aria-pressed', 'true')
      await expect(table).toBeVisible()
      await expect(plot).toBeHidden()
      const head = (await table.getByRole('columnheader').allInnerTexts()).map((t) => t.trim())
      expect(head).toEqual(['Month', '2023', '2024', '2025', '2026'])
      const rows = table.locator('tbody').getByRole('row')
      await expect(rows).toHaveCount(12)
      // 月份那一格是行头（rowheader），其余是 cell：两种一起读。
      const cells = async (row) => (await row.locator('th, td').allInnerTexts()).map((t) => t.trim())
      const dec = await cells(rows.last())
      expect(dec[0]).toBe('Dec')
      expect(dec.at(-1)).toBe('—')
      await aria(table, 'seasonal-table.aria.yml')
      return { head, jan: await cells(rows.first()), dec }
    })
    await step('再点「Table view」：回到图', async () => {
      await tableBtn.click()
      await expect(tableBtn).toHaveAttribute('aria-pressed', 'false')
      await expect(table).toHaveCount(0)
      await expect(plot).toBeVisible()
      return { pressed: await tableBtn.getAttribute('aria-pressed') }
    })

    const output = controlled.getByText(/^隐去的年：/)
    await step('受控图例：初始隐去 2022、2023；点 2024 关掉，调用方的回显跟着变', async () => {
      await controlled.scrollIntoViewIfNeeded()
      await expect(output).toHaveText('隐去的年：2022、2023')
      expect(await linesYears(controlled)).toEqual(['2024', '2025', '2026'])
      await key(controlled, 2024).click()
      await expect(output).toHaveText('隐去的年：2022、2023、2024')
      await expect(key(controlled, 2024)).toHaveAttribute('aria-pressed', 'false')
      expect(await linesYears(controlled)).toEqual(['2025', '2026'])
      return { output: await output.textContent(), lines: await linesYears(controlled) }
    })
    await step('再关 2025，只剩 2026；点 2026：最后一年关不掉，回显与线都不变', async () => {
      await key(controlled, 2025).click()
      await expect(output).toHaveText('隐去的年：2022、2023、2024、2025')
      await key(controlled, 2026).click()
      await expect(output).toHaveText('隐去的年：2022、2023、2024、2025')
      await expect(key(controlled, 2026)).toHaveAttribute('aria-pressed', 'true')
      expect(await linesYears(controlled)).toEqual(['2026'])
      return { output: await output.textContent(), lines: await linesYears(controlled) }
    })
    await step('窄于 520px 的那张：图例单独占图操作下面一行，横轴只留单数月', async () => {
      await narrow.scrollIntoViewIfNeeded()
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
      const visibleMonths = async (area) => {
        const shown = []
        for (const m of months) if (await area.getByText(m, { exact: true }).isVisible()) shown.push(m)
        return shown
      }
      const actionsOf = (area) => area.getByRole('group', { name: 'Chart actions', exact: true })
      const [nLegend, nActions] = [await box(legendOf(narrow)), await box(actionsOf(narrow))]
      const [wLegend, wActions] = [await box(legendOf(wide)), await box(actionsOf(wide))]
      // 宽图：图例与图操作在同一行；窄图：图例的顶边不高于图操作的底边。
      expect(wLegend.y).toBeLessThan(wActions.y + wActions.height)
      expect(nLegend.y).toBeGreaterThanOrEqual(nActions.y + nActions.height)
      expect(await visibleMonths(narrow)).toEqual(['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'])
      expect(await visibleMonths(wide)).toEqual(months)
      return {
        narrow: { legendTop: Math.round(nLegend.y), actionsBottom: Math.round(nActions.y + nActions.height) },
        wide: { legendTop: Math.round(wLegend.y), actionsBottom: Math.round(wActions.y + wActions.height) },
        narrowMonths: await visibleMonths(narrow),
      }
    })
  },
}
