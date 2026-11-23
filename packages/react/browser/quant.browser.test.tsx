// SPDX-License-Identifier: MIT
// src/quant: one screenshot per public component, from the gallery usage demos (minimal data).
import { beforeAll, afterAll, describe, expect, test, vi } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
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
      })
    }
  })
}
