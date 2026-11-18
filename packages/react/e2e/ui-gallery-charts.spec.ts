// SPDX-License-Identifier: MIT
import { expect, test, type Page } from '@playwright/test'

// 量化图表页的专属 e2e（G5，体检 §5「无专属 e2e 的页」）：BrushChart、AttributionBars、CalendarHeatmap、HorizonChart、SmallMultiples、
// SeriesExplorer、Ridgeline、QuantileLayers、SlopeChart、ConnectedScatter、SymbolGalaxy。每页量用户看得见的结构与键盘表里写的那几条，
// Console 与 Graphite 各跑一遍。单独一个文件，不往 ui-gallery.spec.ts 里加（那份要按组拆，G7）。

test.use({ viewport: { width: 1100, height: 1500 } })

const THEMES = ['console', 'graphite'] as const

const open = async (page: Page, theme: (typeof THEMES)[number], id: string) => {
  await page.goto(`/?theme=${theme}#/${id}`)
  await page.locator(`[data-gallery="${id}"]`).waitFor()
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
  return page.locator(`[data-gallery="${id}"]`)
}

for (const theme of THEMES) {
  test.describe(`量化图表 · ${theme}`, () => {
    test('BrushChart：主图扫读读出时间与值、Esc 清掉；窗口与两端手柄是 slider，方向键与 Home / End 移动', async ({
      page,
    }) => {
      const demo = (await open(page, theme, 'brush-chart')).locator('[data-gallery-brush]')
      const main = demo.locator('[data-slot="brush-main"]')
      const readout = demo.locator('[data-slot="brush-readout"]')
      await expect(main).toBeVisible()
      await expect(readout).toBeEmpty()
      await main.focus()
      await page.keyboard.press('End')
      await expect(readout).not.toBeEmpty()
      const last = await readout.textContent()
      await page.keyboard.press('ArrowLeft')
      await expect(readout).not.toHaveText(last!)
      await page.keyboard.press('Escape')
      await expect(readout).toBeEmpty()

      const windowSlider = demo.getByRole('slider', { name: '窗口位置' })
      await expect(windowSlider).toHaveAttribute('aria-valuenow', '60')
      await windowSlider.focus()
      await page.keyboard.press('ArrowLeft')
      await expect(windowSlider).toHaveAttribute('aria-valuenow', '59')
      await page.keyboard.press('Home')
      await expect(windowSlider).toHaveAttribute('aria-valuenow', '0')

      const start = demo.getByRole('slider', { name: '窗口起点' })
      const end = demo.getByRole('slider', { name: '窗口终点' })
      await end.focus()
      await page.keyboard.press('End')
      await expect(end).toHaveAttribute('aria-valuenow', '119')
      await start.focus()
      await page.keyboard.press('ArrowRight')
      await expect(start).toHaveAttribute('aria-valuenow', '1')
    })

    test('AttributionBars：超 7 项折「其他 ×n」、费用·税在最底；点一行就是焦点行；表格视图切换', async ({ page }) => {
      const demo = (await open(page, theme, 'attribution-bars')).locator('[data-gallery-attribution]')
      const rows = demo.locator('[data-slot="attribution-row"]')
      await expect(rows.first()).toBeVisible()
      const count = await rows.count()
      expect(count).toBeLessThanOrEqual(9)
      await expect(rows.last()).toContainText('费用 · 税')
      await expect(demo.getByText(/其他 ×\d+/)).toBeVisible()
      await expect(demo.locator('[data-slot="attribution-readouts"]')).toContainText('今日合计')

      const second = rows.nth(1)
      await second.click()
      await expect(second.locator('[data-focus="true"]')).toHaveCount(1)
      await expect(rows.first().locator('[data-focus="true"]')).toHaveCount(0)

      await demo.getByRole('button', { name: '表格视图' }).click()
      await expect(demo.locator('[data-slot="attribution-table"]')).toBeVisible()
      await demo.getByRole('button', { name: '表格视图' }).click()
      await expect(demo.locator('[data-slot="attribution-table"]')).toHaveCount(0)

      // 换维度：账户只有四项，没有「其他」。
      await demo.getByRole('button', { name: '账户', exact: true }).click()
      await expect(rows).toHaveCount(4)
      await expect(demo.getByText(/其他 ×\d+/)).toHaveCount(0)
    })

    test('CalendarHeatmap（日历热力图）：页标题；方向键先落到最后一天、↑ 退一周、Enter 回调、Esc 清掉；年视图一天一格', async ({
      page,
    }) => {
      const sec = await open(page, theme, 'calendar-heatmap')
      await expect(page.getByRole('heading', { level: 1 })).toContainText('日历热力图')
      const month = sec.locator('[data-gallery-calendar="month"]')
      const grid = month.getByRole('grid')
      await grid.focus()
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('Enter')
      const picked = month.locator('[data-gallery-calendar-picked]')
      await expect(picked).toHaveText(/^点了 2026-10-\d\d$/)
      const first = (await picked.textContent())!.slice(3)
      await page.keyboard.press('ArrowUp')
      await page.keyboard.press('Enter')
      const back = new Date(Date.parse(`${first}T00:00:00Z`) - 7 * 86_400_000).toISOString().slice(0, 10)
      await expect(picked).toHaveText(`点了 ${back}`)
      await expect(month.locator('[data-slot="calendar-cell"][data-active="true"]')).toHaveCount(1)
      await page.keyboard.press('Escape')
      await expect(month.locator('[data-slot="calendar-cell"][data-active="true"]')).toHaveCount(0)

      const year = sec.locator('[data-gallery-calendar="year"] rect.k-heat-cell')
      expect(await year.count()).toBeGreaterThanOrEqual(365)
    })

    test('HorizonChart：一行一个品种；键盘先落到最新一格、读数行播报，Esc 清掉', async ({ page }) => {
      const demo = (await open(page, theme, 'horizon-chart')).locator('[data-gallery-horizon="shared"]')
      await expect(demo.locator('[data-slot="horizon-row"]')).toHaveCount(4)
      const readout = demo.locator('[data-slot="horizon-readout"]')
      await expect(readout).toBeEmpty()
      await demo.getByRole('group').first().focus()
      await page.keyboard.press('ArrowRight')
      await expect(readout).not.toBeEmpty()
      await expect(demo.locator('[data-slot="horizon-cross"]').first()).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(readout).toBeEmpty()
    })

    test('SmallMultiples：六格同步十字线、键盘扫读与 Esc；点标题触发 onSelect', async ({ page }) => {
      const sec = await open(page, theme, 'small-multiples')
      const demo = sec.locator('[data-gallery-multiples="each"]')
      await expect(demo.locator('[data-slot="small-multiple"]')).toHaveCount(6)
      const readout = demo.locator('[data-slot="small-multiples-readout"]')
      await demo.getByRole('group').first().focus()
      await page.keyboard.press('Home')
      await expect(readout).toContainText('第 1 点')
      // 十字线在每一格都画（同步）。
      await expect(demo.locator('[data-slot="small-multiple-cross"]')).toHaveCount(6)
      await page.keyboard.press('Escape')
      await expect(demo.locator('[data-slot="small-multiple-cross"]')).toHaveCount(0)
      await demo.getByRole('button', { name: /BBB/ }).click()
      await expect(sec.locator('[data-gallery-multiples-picked]')).toHaveText('点了 BBB')
    })

    test('SeriesExplorer：瓦片展开 / 收起面板，页签 ← → 切指标，图上 End 扫到最后一点，Esc 先清扫读再收起；表格视图与对账灯', async ({
      page,
    }) => {
      const sec = await open(page, theme, 'series-explorer')
      const ok = sec.locator('[data-gallery-explorer="ok"]')
      const panel = ok.locator('[data-slot="series-panel"]')
      await expect(panel).toHaveAttribute('data-metric', 'net')
      const tiles = ok.locator('[data-slot="series-kpis"] [data-key]')
      await expect(tiles.first()).toHaveAttribute('aria-expanded', 'true')
      await tiles.first().click()
      await expect(panel).toHaveCount(0)
      await tiles.first().click()
      await expect(panel).toBeVisible()

      await ok.locator('[data-slot="series-tab"][data-key="net"]').focus()
      await page.keyboard.press('ArrowRight')
      await expect(panel).toHaveAttribute('data-metric', 'realized')
      await page.keyboard.press('ArrowLeft')
      await expect(panel).toHaveAttribute('data-metric', 'net')

      const chart = ok.locator('[data-slot="series-chart"]')
      await chart.focus()
      await page.keyboard.press('End')
      const max = await chart.getAttribute('aria-valuemax')
      await expect(chart).toHaveAttribute('aria-valuenow', max!)
      await expect(ok.locator('[data-slot="series-cross"]')).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(ok.locator('[data-slot="series-cross"]')).toHaveCount(0)
      await page.keyboard.press('Escape')
      await expect(panel).toHaveCount(0)

      await tiles.first().click()
      await ok.getByRole('button', { name: '表格视图' }).click()
      await expect(ok.locator('[data-slot="series-table"]')).toBeVisible()
      // 表格视图是整页表的一套数（#92，.k-table-comfortable）：行 40、表头 48、正文 14px。
      const seriesTable = ok.locator('[data-slot="series-table"] table')
      expect(Math.round((await seriesTable.locator('tbody tr').first().boundingBox())!.height)).toBe(40)
      expect(Math.round((await seriesTable.locator('thead tr').boundingBox())!.height)).toBe(48)
      await expect(seriesTable.locator('tbody td').first()).toHaveCSS('font-size', '14px')
      await expect(ok.locator('[data-slot="series-reconcile"]')).toHaveAttribute('data-tone', 'ok')
      await expect(sec.locator('[data-gallery-explorer="mismatch"] [data-slot="series-reconcile"]')).toHaveAttribute(
        'data-tone',
        'warn',
      )
    })

    test('Ridgeline：一组一条，↑ ↓ 在条间走、到头不绕回，Home / End 跳头尾，读数跟着焦点', async ({ page }) => {
      const demo = (await open(page, theme, 'ridgeline')).locator('[data-gallery-ridge="layers"]')
      const rows = demo.locator('.k-ridge-row')
      const n = await rows.count()
      expect(n).toBeGreaterThanOrEqual(3)
      await rows.first().focus()
      await page.keyboard.press('ArrowUp')
      await expect(rows.first()).toBeFocused()
      await page.keyboard.press('ArrowDown')
      await expect(rows.nth(1)).toBeFocused()
      await page.keyboard.press('End')
      await expect(rows.nth(n - 1)).toBeFocused()
      await expect(demo.locator('.k-ridge-readout')).toHaveText((await rows.nth(n - 1).getAttribute('aria-label'))!)
      await page.keyboard.press('Home')
      await expect(rows.first()).toBeFocused()
    })

    test('QuantileLayers：层按钮 Enter 锁定（aria-pressed），图上扫读，表格视图列出各层', async ({ page }) => {
      const sec = await open(page, theme, 'quantile-layers')
      const demo = sec.locator('[data-slot="quantile-layers"]').first()
      const layers = demo
        .getByRole('group', { name: /层|分层|layer/i })
        .first()
        .getByRole('button')
      expect(await layers.count()).toBeGreaterThanOrEqual(3)
      await layers.first().focus()
      await page.keyboard.press('Enter')
      await expect(layers.first()).toHaveAttribute('aria-pressed', 'true')
      await page.keyboard.press('Enter')
      await expect(layers.first()).toHaveAttribute('aria-pressed', 'false')
      await expect(demo.locator('[data-slot="quantile-line"]').first()).toBeVisible()
      await expect(demo.locator('[data-slot="quantile-long-short"]')).toBeVisible()
      await demo.getByRole('button', { name: '表格视图' }).click()
      await expect(demo.locator('[data-slot="quantile-table"]')).toBeVisible()
    })

    test('SlopeChart：↑ ↓ 按左端从上到下走，Home / End 到头尾，Enter 选中', async ({ page }) => {
      const sec = await open(page, theme, 'slope-chart')
      const demo = sec.locator('[data-gallery-slope="value"]')
      expect(await demo.locator('.k-slope-item[tabindex]').count()).toBeGreaterThanOrEqual(3)
      const focusedId = () => page.evaluate(() => document.activeElement?.getAttribute('data-id') ?? null)
      await demo.locator('.k-slope-item[tabindex="0"]').focus()
      await page.keyboard.press('Home')
      const top = await focusedId()
      await page.keyboard.press('ArrowUp')
      expect(await focusedId()).toBe(top)
      await page.keyboard.press('ArrowDown')
      const second = await focusedId()
      expect(second).not.toBe(top)
      await page.keyboard.press('End')
      const bottom = await focusedId()
      expect(bottom).not.toBe(second)
      await page.keyboard.press('ArrowDown')
      expect(await focusedId()).toBe(bottom)
      await page.keyboard.press('Enter')
      await expect(sec.locator('[data-gallery-slope-picked]')).not.toBeEmpty()
    })

    test('ConnectedScatter：← → 沿轨迹走、到头不绕回，↑ ↓ 换轨迹，读数跟着焦点', async ({ page }) => {
      const demo = (await open(page, theme, 'connected-scatter')).locator('[data-gallery-scatter="two"]')
      const stop = demo.locator('.k-scatter-dot[tabindex="0"]')
      await stop.focus()
      await page.keyboard.press('Home')
      const first = page.locator(':focus')
      const firstLabel = await first.getAttribute('aria-label')
      await page.keyboard.press('ArrowLeft')
      await expect(page.locator(':focus')).toHaveAttribute('aria-label', firstLabel!)
      await page.keyboard.press('ArrowRight')
      await expect(page.locator(':focus')).not.toHaveAttribute('aria-label', firstLabel!)
      const series = await page
        .locator(':focus')
        .evaluate((el) => el.closest('.k-scatter-series')?.getAttribute('aria-label'))
      await page.keyboard.press('ArrowDown')
      const other = await page
        .locator(':focus')
        .evaluate((el) => el.closest('.k-scatter-series')?.getAttribute('aria-label'))
      expect(other).not.toBe(series)
      await expect(demo.locator('.k-scatter-readout')).not.toBeEmpty()
    })

    test('SymbolGalaxy：每团一个 Tab 停靠点，方向键在团内跳点、读数跟着，Enter 选中；切分组后团跟着变', async ({
      page,
    }) => {
      const sec = await open(page, theme, 'symbol-galaxy')
      const demo = sec.locator('[data-gallery-galaxy="svg"]')
      const groups = demo.locator('.k-galaxy-group')
      expect(await groups.count()).toBeGreaterThanOrEqual(2)
      const readout = demo.locator('.k-galaxy-readout')
      const idle = await readout.textContent()
      await groups.first().focus()
      await expect(readout).not.toHaveText(idle!)
      const before = await readout.textContent()
      for (const key of ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp']) {
        await page.keyboard.press(key)
        if ((await readout.textContent()) !== before) break
      }
      await page.keyboard.press('Enter')
      await expect(sec.locator('[data-gallery-galaxy-picked]')).not.toBeEmpty()

      const names = async () => (await demo.locator('[data-group-name]').allTextContents()).join('|')
      const was = await names()
      const options = demo.locator('.k-galaxy-bar').getByRole('group').first().getByRole('button')
      await options.nth(1).click()
      await expect.poll(names).not.toBe(was)
    })
  })
}
