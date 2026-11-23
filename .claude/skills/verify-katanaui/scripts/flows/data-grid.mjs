// SPDX-License-Identifier: MIT
// 功能地图 features/data-grid.md：点表头排序、窄容器按优先级收列。
export default {
  title: 'DataGrid 数据表：排序与按优先级收列',
  page: 'data-grid',
  async run({ section, step, expect, aria }) {
    const grid = section.getByTestId('grid-demo')
    const pnlHead = grid.getByRole('columnheader', { name: 'PnL' })
    // 品种格里还有徽标字与交易所名：只取代码那一行。
    const code = (text) =>
      text
        .split('\n')
        .find((line) => /^[A-Z0-9]{2,}$/.test(line.trim()))
        ?.trim() ?? text
    const symbols = async () => (await grid.locator('[role="gridcell"][data-col="symbol"]').allInnerTexts()).map(code)
    const firstSymbol = async () => (await symbols())[0]
    let initial

    await step('打开 data-grid 页，看示例表的默认行序', async () => {
      await grid.scrollIntoViewIfNeeded()
      await expect(pnlHead).toBeVisible()
      initial = await symbols()
      return { sort: await pnlHead.getAttribute('aria-sort'), rows: await symbols() }
    })
    await step('点 PnL 表头：升序，亏的那行排到最前', async () => {
      await pnlHead.getByRole('button').click()
      await expect(pnlHead).toHaveAttribute('aria-sort', 'ascending')
      await expect(grid.getByRole('row').nth(1).locator('[data-col="symbol"]')).toContainText('600519')
      return { sort: await pnlHead.getAttribute('aria-sort'), first: await firstSymbol() }
    })
    await step('再点一次：降序', async () => {
      await pnlHead.getByRole('button').click()
      await expect(pnlHead).toHaveAttribute('aria-sort', 'descending')
      expect(await firstSymbol()).toBe('BTCUSDT')
      return { sort: await pnlHead.getAttribute('aria-sort'), first: await firstSymbol() }
    })
    await step('第三次：回到不排序', async () => {
      await pnlHead.getByRole('button').click()
      await expect(pnlHead).not.toHaveAttribute('aria-sort', /ascending|descending/)
      expect(await symbols()).toEqual(initial)
      return { sort: await pnlHead.getAttribute('aria-sort'), rows: await symbols() }
    })

    const narrow = section.getByTestId('grid-priority')
    const toggle = narrow.locator('.k-grid-cols-toggle')
    const names = async () =>
      (await narrow.locator('[role="columnheader"]').allTextContents()).map((t) => t.replaceAll(/[▲▼]/g, '').trim())
    const overflow = () => narrow.locator('.k-grid-scroll').evaluate((el) => el.scrollWidth - el.clientWidth)

    await step('300px 宽的八列表：放不下的列收起，表头右端出「+N cols」', async () => {
      await narrow.scrollIntoViewIfNeeded()
      await expect(toggle).toHaveText('+5 cols')
      expect(await names()).toEqual(['Symbol', 'Side', 'PnL'])
      await expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(await overflow()).toBeLessThanOrEqual(0)
      await aria(narrow, 'grid-priority-collapsed.aria.yml')
      return { toggle: await toggle.innerText(), columns: await names(), overflowPx: await overflow() }
    })
    await step('点「+5 cols」：八列全出，横向可滚，胶囊写 Collapse', async () => {
      await toggle.click()
      await expect(toggle).toHaveText('Collapse')
      await expect(toggle).toHaveAttribute('aria-expanded', 'true')
      expect(await names()).toHaveLength(8)
      expect(await overflow()).toBeGreaterThan(0)
      return { toggle: await toggle.innerText(), columns: await names(), overflowPx: await overflow() }
    })
    await step('再点 Collapse：回到三列', async () => {
      await toggle.click()
      await expect(toggle).toHaveText('+5 cols')
      expect(await names()).toEqual(['Symbol', 'Side', 'PnL'])
      return { toggle: await toggle.innerText(), columns: await names() }
    })
  },
}
