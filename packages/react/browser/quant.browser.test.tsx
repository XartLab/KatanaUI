// SPDX-License-Identifier: MIT
// src/quant: one screenshot per public component, from the gallery usage demos (minimal data).
import { beforeAll, afterAll, describe, expect, test, vi } from 'vite-plus/test'
import { page, userEvent } from 'vite-plus/test/browser'
import { BrushChartUsage } from '../gallery/usage/BrushChartUsage.tsx'
import { CalendarHeatmapUsage } from '../gallery/usage/CalendarHeatmapUsage.tsx'
import { ConnectedScatterUsage } from '../gallery/usage/ConnectedScatterUsage.tsx'
import { DecimalFieldUsage } from '../gallery/usage/DecimalFieldUsage.tsx'
import { EquityCurveUsage } from '../gallery/usage/EquityCurveUsage.tsx'
import { EventCalendarUsage } from '../gallery/usage/EventCalendarUsage.tsx'
import { FlowSankeyUsage } from '../gallery/usage/FlowSankeyUsage.tsx'
import { HorizonChartUsage } from '../gallery/usage/HorizonChartUsage.tsx'
import { LimitLadderUsage } from '../gallery/usage/LimitLadderUsage.tsx'
import { MarketHeatmapUsage } from '../gallery/usage/MarketHeatmapUsage.tsx'
import { ParamScatterUsage } from '../gallery/usage/ParamScatterUsage.tsx'
import { QuantileLayersUsage } from '../gallery/usage/QuantileLayersUsage.tsx'
import { RidgelineUsage } from '../gallery/usage/RidgelineUsage.tsx'
import { SeasonalChartUsage } from '../gallery/usage/SeasonalChartUsage.tsx'
import { SlopeChartUsage } from '../gallery/usage/SlopeChartUsage.tsx'
import { VintageSeriesUsage } from '../gallery/usage/VintageSeriesUsage.tsx'
import { MaeMfeScatterUsage } from '../gallery/usage/MaeMfeScatterUsage.tsx'
import { ParamSurfaceHeatmapUsage } from '../gallery/usage/ParamSurfaceHeatmapUsage.tsx'
import { PeriodReturnsTableUsage } from '../gallery/usage/PeriodReturnsTableUsage.tsx'
import { RobustnessGateUsage } from '../gallery/usage/RobustnessGateUsage.tsx'
import { UnderwaterChartUsage } from '../gallery/usage/UnderwaterChartUsage.tsx'
import { WalkForwardMatrixUsage } from '../gallery/usage/WalkForwardMatrixUsage.tsx'
import { mount } from './render.tsx'

const items: Record<string, React.ReactNode> = {
  'brush-chart': <BrushChartUsage />,
  'calendar-heatmap': <CalendarHeatmapUsage />,
  'connected-scatter': <ConnectedScatterUsage />,
  'decimal-field': <DecimalFieldUsage />,
  'equity-curve': <EquityCurveUsage />,
  'event-calendar': <EventCalendarUsage />,
  'flow-sankey': <FlowSankeyUsage />,
  'horizon-chart': <HorizonChartUsage />,
  'limit-ladder': <LimitLadderUsage />,
  'market-heatmap': <MarketHeatmapUsage />,
  'param-scatter': <ParamScatterUsage />,
  'mae-mfe-scatter': <MaeMfeScatterUsage />,
  'underwater-chart': <UnderwaterChartUsage />,
  'period-returns-table': <PeriodReturnsTableUsage />,
  'param-surface-heatmap': <ParamSurfaceHeatmapUsage />,
  'walk-forward-matrix': <WalkForwardMatrixUsage />,
  'robustness-gate': <RobustnessGateUsage />,
  'quantile-layers': <QuantileLayersUsage />,
  ridgeline: <RidgelineUsage />,
  'seasonal-chart': <SeasonalChartUsage />,
  'slope-chart': <SlopeChartUsage />,
  'vintage-series': <VintageSeriesUsage />,
}

const settle: Record<string, number> = { 'page-preloader': 1500 }
// A 股件按 A 股的涨跌约定截：根上 data-updown="cn"（红涨绿跌，照 #78 的 cn-pack），截完还原。
const cnUpdown = new Set(['limit-ladder'])

// Freeze the clock (Date only, so timers still run): today/relative-time cells must not drift between days.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-17T09:00:00'))
})
afterAll(() => vi.useRealTimers())

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    for (const [name, node] of Object.entries(items)) {
      test(name, async ({ onTestFinished }) => {
        if (cnUpdown.has(name)) {
          document.documentElement.dataset.updown = 'cn'
          onTestFinished(() => {
            delete document.documentElement.dataset.updown
          })
        }
        await page.viewport(960, 1800)
        await mount(
          <div
            style={{
              width: 720,
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            {node}
          </div>,
          theme,
        )
        await new Promise((r) => setTimeout(r, settle[name] ?? 250)) // let measuring / enter transitions finish
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-quant-${name}`)
        // 日历热力图再截一张「换手」视图：序数格用 --k-heat-1…5（中性灰浓度）与配套字色。
        if (name === 'calendar-heatmap') {
          await page.getByRole('button', { name: '换手' }).click()
          await new Promise((r) => setTimeout(r, 400))
          await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-quant-${name}-turnover`)
        }
        if (name === 'seasonal-chart') await seasonalChecks(theme)
      })
    }
  })
}

// 季节性图（#147）：键盘读数、往年沿用与今年「—」、图例开关、表格视图、窄于 520px 的布局。用法示例的数据是 2024、2025 全年与 2026 到 6 月 28 日。
async function seasonalChecks(theme: 'graphite' | 'console') {
  const box = (slot: string) => document.querySelector<HTMLElement>(`[data-slot="${slot}"]`)!.getBoundingClientRect()
  const lines = () => document.querySelectorAll('[data-slot="seasonal-line"]').length
  // 560px 宽：图例与右上的图操作在同一行。
  expect(box('seasonal-legend').top).toBeLessThan(box('chart-actions').bottom)
  const plot = document.querySelector<HTMLElement>('[data-slot="seasonal-plot"]')!
  plot.focus()
  // 第一下 ← 落在今年最后一个点（6 月 28 日，第 179 格），PageUp 跳到 6 月 1 日（第 152 格）。
  await userEvent.keyboard('{ArrowLeft}')
  expect(plot.getAttribute('aria-valuenow')).toBe('179')
  await userEvent.keyboard('{PageUp}')
  expect(plot.getAttribute('aria-valuenow')).toBe('152')
  await new Promise((r) => setTimeout(r, 250))
  await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-quant-seasonal-chart-readout`)
  // 12 月 31 日：往年沿用最后一个点，今年还没到写「—」。
  await userEvent.keyboard('{End}')
  expect(plot.getAttribute('aria-valuetext')).toBe('Dec 31  2024 +8.00%  2025 +6.48%  2026 —')
  // 图例：每年带涨跌幅；点 2024 关掉那一年。
  const key2024 = page.getByRole('button', { name: '2024 +8.00%' })
  await key2024.click()
  expect(lines()).toBe(2)
  expect(key2024.element().getAttribute('aria-pressed')).toBe('false')
  // 表格视图：每月一行、每个看得见的年一列，写月末涨跌幅；图藏起来。
  await page.getByRole('button', { name: 'Table view' }).click()
  const table = document.querySelector<HTMLElement>('[data-slot="seasonal-table"]')!
  expect(table.getAttribute('aria-label')).toBe('Month-end change by year')
  expect([...table.querySelectorAll('thead th')].map((cell) => cell.textContent)).toEqual(['Month', '2025', '2026'])
  const body = [...table.querySelectorAll('tbody tr')].map((row) => [...row.children].map((cell) => cell.textContent))
  expect(body).toHaveLength(12)
  expect(body[0]).toEqual(['Jan', '+0.93%', '+0.87%'])
  expect(body[11]).toEqual(['Dec', '+6.48%', '—'])
  expect(plot.closest<HTMLElement>('.k-seasonal-plotwrap')!.hidden).toBe(true)
  await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-quant-seasonal-chart-table`)
  // 窄于 520px：图例单独占图操作下面的一整行，横轴只留单数月。
  await mount(
    <div style={{ width: 400 }}>
      <SeasonalChartUsage />
    </div>,
    theme,
  )
  await new Promise((r) => setTimeout(r, 250))
  expect(box('seasonal-legend').top).toBeGreaterThanOrEqual(box('chart-actions').bottom)
  const months = [...document.querySelectorAll<HTMLElement>('.k-seasonal-xaxis > span')]
  expect(
    months.filter((label) => getComputedStyle(label).display !== 'none').map((label) => label.textContent),
  ).toEqual(['Jan', 'Mar', 'May', 'Jul', 'Sep', 'Nov'])
  await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-quant-seasonal-chart-narrow`)
}
