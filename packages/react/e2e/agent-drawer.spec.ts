// SPDX-License-Identifier: MIT
import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

// Agent 档案抽屉（#225）：在文档站 #/agent-drawer 上真点、真按键，断言用户看得见的结果。演示数据是示例，见 gallery/usage/AgentDrawerUsage.tsx。

test.use({ viewport: { width: 1200, height: 1500 } })

const open = async (page: Page) => {
  await page.goto('/?theme=graphite#/agent-drawer')
  const area = page.locator('[data-gallery="agent-drawer"]')
  await area.waitFor()
  return area
}

test('三种状态各有自己的状态词与语气，在跑转圈、暂停与停用不转；属性区、页签、指标卡齐全', async ({ page }) => {
  const area = await open(page)
  const drawers = area.locator('[data-slot="agent-drawer"]')
  await expect(drawers).toHaveCount(3)
  const expected = [
    ['running', '在跑', 'progress'],
    ['paused', '暂停', 'warn'],
    ['disabled', '停用', 'neutral'],
  ] as const
  for (const [index, [status, word, tone]] of expected.entries()) {
    const drawer = drawers.nth(index)
    await expect(drawer).toHaveAttribute('data-status', status)
    const pill = drawer.locator('[data-slot="agent-drawer-status"]')
    await expect(pill).toHaveText(word)
    await expect(pill).toHaveAttribute('data-tone', tone)
    // 属性区五项、三个页签、两张指标卡。
    await expect(drawer.locator('[data-slot="agent-drawer-props"] dt')).toHaveText([
      '状态',
      '标签',
      '触发',
      '负责人',
      '创建时间',
    ])
    await expect(drawer.getByRole('tab')).toHaveText(['用量', '配置', '历史'])
    await expect(drawer.locator('[data-slot="agent-drawer-metric"]')).toHaveCount(2)
  }
  // 「在跑」不用强调色：状态字的颜色就是中性亮色（--k-content-primary-foreground），不是 --accent。
  const running = drawers.nth(0)
  const colorOf = (token: string) =>
    page.evaluate((name) => {
      const probe = document.createElement('i')
      probe.style.color = `var(${name})`
      document.body.append(probe)
      const color = getComputedStyle(probe).color
      probe.remove()
      return color
    }, token)
  const own = await running.locator('[data-slot="agent-drawer-status"]').evaluate((el) => getComputedStyle(el).color)
  expect(own).toBe(await colorOf('--k-content-primary-foreground'))
  expect(own).not.toBe(await colorOf('--accent'))
  await expect(running.locator('[data-slot="agent-drawer-status"] .k-ad-spin')).toHaveCount(1)
  await expect(drawers.nth(1).locator('[data-slot="agent-drawer-status"] .k-ad-spin')).toHaveCount(0)
})

test('页签：点配置换内容，方向键在页签间走', async ({ page }) => {
  const area = await open(page)
  const drawer = area.locator('[data-slot="agent-drawer"]').first()
  await drawer.getByRole('tab', { name: '配置' }).click()
  await expect(drawer.getByText('配置页由调用方给')).toBeVisible()
  await expect(drawer.locator('[data-slot="agent-drawer-metric"]')).toHaveCount(0)
  await page.keyboard.press('ArrowRight')
  await expect(drawer.getByRole('tab', { name: '历史' })).toHaveAttribute('aria-selected', 'true')
  await drawer.getByRole('tab', { name: '用量' }).click()
  await expect(drawer.locator('[data-slot="agent-drawer-metric"]')).toHaveCount(2)
})

test('热力格：role=grid，0 次空格加 5 档都出现，悬停与键盘聚焦读出日期与次数，方向键走格', async ({ page }) => {
  const area = await open(page)
  const drawer = area.locator('[data-slot="agent-drawer"]').first()
  const grid = drawer.getByRole('grid', { name: '最近 12 周每天跑的次数' })
  await expect(grid).toBeVisible()
  await expect(grid.getByRole('row')).toHaveCount(7)
  const cells = grid.getByRole('gridcell')
  await expect(cells).toHaveCount(84)
  const levels = await cells.evaluateAll((els) =>
    [...new Set(els.map((el) => el.getAttribute('data-level')))].sort((a, b) => Number(a) - Number(b)),
  )
  expect(levels).toEqual(['0', '1', '2', '3', '4', '5'])
  // 每格的读屏名是整句，且与 data-count 一致。
  const named = await cells.evaluateAll((els) =>
    els.every((el) => {
      const count = el.getAttribute('data-count')
      const label = el.getAttribute('aria-label') ?? ''
      return count === '0' ? label.endsWith('没跑') : label.endsWith(`跑了 ${count} 次`)
    }),
  )
  expect(named).toBe(true)
  const readout = drawer.locator('[data-slot="agent-activity-readout"]')
  // 悬停：读数行写那一格的整句。
  const hovered = cells.nth(30)
  await hovered.scrollIntoViewIfNeeded()
  await hovered.hover()
  await expect(readout).toHaveText((await hovered.getAttribute('aria-label'))!)
  await page.mouse.move(0, 0)
  await expect(readout).toHaveText(/共 12 周/)
  // 月份与星期标签：9、10、11 月各一枚，星期只写一三五，每一行都有名字。
  await expect(drawer.locator('[data-slot="agent-activity-months"] span')).toHaveText(['9 月', '10 月', '11 月'])
  await expect(drawer.locator('[data-slot="agent-activity-weekday"]:not(:empty)')).toHaveText(['一', '三', '五'])
  await expect(grid.getByRole('row')).toHaveCount(7)
  await expect(grid.getByRole('row').first()).toHaveAttribute('aria-label', '一')
  // 只有一个 Tab 停点；键盘聚焦读出。
  expect(await cells.evaluateAll((els) => els.filter((el) => el.getAttribute('tabindex') === '0').length)).toBe(1)
  const cell = (date: string) => grid.locator(`[data-date="${date}"]`)
  const focused = () => page.locator(':focus')
  await cell('2026-09-09').focus()
  await expect(readout).toHaveText((await cell('2026-09-09').getAttribute('aria-label'))!)
  // ← → 前后一周（日期 ±7 天），↑ ↓ 前后一天。
  await page.keyboard.press('ArrowRight')
  await expect(focused()).toHaveAttribute('data-date', '2026-09-16')
  await expect(readout).toHaveText((await focused().getAttribute('aria-label'))!)
  await page.keyboard.press('ArrowDown')
  await expect(focused()).toHaveAttribute('data-date', '2026-09-17')
  await page.keyboard.press('ArrowUp')
  // PageDown 跳 4 周，PageUp 跳回；Home / End 是这一行（周三）的第一周与最后一周；Ctrl+Home / Ctrl+End 是第一天与最后一天。
  await page.keyboard.press('PageDown')
  await expect(focused()).toHaveAttribute('data-date', '2026-10-14')
  await page.keyboard.press('PageUp')
  await expect(focused()).toHaveAttribute('data-date', '2026-09-16')
  await page.keyboard.press('Home')
  await expect(focused()).toHaveAttribute('data-date', '2026-09-02')
  await page.keyboard.press('End')
  await expect(focused()).toHaveAttribute('data-date', '2026-11-18')
  await page.keyboard.press('Control+End')
  await expect(focused()).toHaveAttribute('data-date', '2026-11-23')
  await page.keyboard.press('Control+Home')
  await expect(focused()).toHaveAttribute('data-date', '2026-09-01')
  // 残缺的首周没有周一：第二周的周一按 ← 取最近的一行（周二），不是死路。
  await cell('2026-09-07').focus()
  await page.keyboard.press('ArrowLeft')
  await expect(focused()).toHaveAttribute('data-date', '2026-09-01')
  // 残缺的末周只有周一：上一周的周日按 → 取最近的一行（周一）。
  await cell('2026-11-22').focus()
  await page.keyboard.press('ArrowRight')
  await expect(focused()).toHaveAttribute('data-date', '2026-11-23')
})

test('最近运行：点一行回调带运行 id，键盘 Enter 也行', async ({ page }) => {
  const area = await open(page)
  const drawer = area.locator('[data-slot="agent-drawer"]').first()
  const opened = area.getByTestId('agent-drawer-opened').first()
  const rows = drawer.locator('[data-slot="agent-drawer-run"]')
  await expect(rows).toHaveCount(5)
  await rows.nth(1).getByRole('button').click()
  await expect(opened).toHaveText('onOpenRun：r4')
  await rows.nth(3).getByRole('button').focus()
  await page.keyboard.press('Enter')
  await expect(opened).toHaveText('onOpenRun：r2')
  // 结果是图标加词，不只靠颜色。
  await expect(rows.nth(1).locator('.k-ad-run-result')).toHaveText('失败')
  await expect(rows.nth(0).locator('.k-ad-run-result')).toHaveText('在跑')
})

test('Agent 列表（DataGrid）点一行，右边 Sheet 里打开抽屉；Esc 关闭、焦点回到那一行', async ({ page }) => {
  const area = await open(page)
  const table = area.getByTestId('agent-table')
  await table.scrollIntoViewIfNeeded()
  await expect(table.getByRole('columnheader')).toHaveText(['名字', '触发', '上次运行', '总次数'])
  await expect(table.getByRole('row')).toHaveCount(5)
  await table.getByRole('rowheader', { name: '回补日线' }).click()
  const dialog = page.getByRole('dialog', { name: '回补日线' })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('[data-slot="agent-drawer-status"]')).toHaveText('暂停')
  await expect(dialog.locator('[data-slot="agent-drawer-trigger"]')).toContainText('事件')
  // 30 周放不下：格子不压到 10px 以下，整张图横向滚动并停在最新一端。
  const scroller = dialog.locator('[data-slot="agent-activity-scroller"]')
  const sizes = await scroller.evaluate((el) => ({
    scrollable: el.scrollWidth - el.clientWidth,
    atEnd: Math.abs(el.scrollLeft - (el.scrollWidth - el.clientWidth)),
    cell: el.querySelector('[data-slot="agent-activity-cell"]')!.getBoundingClientRect().width,
  }))
  expect(sizes.scrollable).toBeGreaterThan(0)
  expect(sizes.atEnd).toBeLessThan(2)
  expect(sizes.cell).toBeGreaterThanOrEqual(10)
  // 抽屉打开着也没有 axe 违规（Sheet 里的标题与说明是 SheetTitle、SheetDescription）。
  const axe = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze()
  expect(axe.violations.map((v) => v.id)).toEqual([])
  await page.keyboard.press('Escape')
  await expect(dialog).toHaveCount(0)
  await expect(table.getByRole('row').filter({ hasText: '回补日线' })).toBeVisible()
})
