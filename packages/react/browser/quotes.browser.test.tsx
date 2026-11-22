// SPDX-License-Identifier: MIT
// src/quotes: one screenshot per public component, from the gallery usage demos (minimal data).
import { beforeAll, afterAll, describe, expect, test, vi } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { ChangeTextUsage } from '../gallery/usage/ChangeTextUsage.tsx'
import { GaugeBarUsage } from '../gallery/usage/GaugeBarUsage.tsx'
import { KeyStatsUsage } from '../gallery/usage/KeyStatsUsage.tsx'
import { MetricCardUsage } from '../gallery/usage/MetricCardUsage.tsx'
import { MiniChartUsage } from '../gallery/usage/MiniChartUsage.tsx'
import { PeerCardsUsage } from '../gallery/usage/PeerCardsUsage.tsx'
import { PerformanceStripUsage } from '../gallery/usage/PerformanceStripUsage.tsx'
import { PnlTextUsage } from '../gallery/usage/PnlTextUsage.tsx'
import { PriceTagUsage } from '../gallery/usage/PriceTagUsage.tsx'
import { QuoteCardUsage } from '../gallery/usage/QuoteCardUsage.tsx'
import { QuoteTableUsage } from '../gallery/usage/QuoteTableUsage.tsx'
import { RangeBarUsage } from '../gallery/usage/RangeBarUsage.tsx'
import { RatingGaugeUsage } from '../gallery/usage/RatingGaugeUsage.tsx'
import { RatingTextUsage } from '../gallery/usage/RatingTextUsage.tsx'
import { RowActionsUsage } from '../gallery/usage/RowActionsUsage.tsx'
import { SparkTileUsage } from '../gallery/usage/SparkTileUsage.tsx'
import { SparklineUsage } from '../gallery/usage/SparklineUsage.tsx'
import { SymbolMarkUsage } from '../gallery/usage/SymbolMarkUsage.tsx'
import { TechnicalRatingUsage } from '../gallery/usage/TechnicalRatingUsage.tsx'
import { TreemapUsage } from '../gallery/usage/TreemapUsage.tsx'
import { WatchlistUsage } from '../gallery/usage/WatchlistUsage.tsx'
import { CompareBar, QuoteStrip } from '../src/index'
import { mount } from './render.tsx'

const items: Record<string, React.ReactNode> = {
  'change-text': <ChangeTextUsage />,
  'gauge-bar': <GaugeBarUsage />,
  'key-stats': <KeyStatsUsage />,
  'metric-card': <MetricCardUsage />,
  'mini-chart': <MiniChartUsage />,
  'peer-cards': <PeerCardsUsage />,
  'performance-strip': <PerformanceStripUsage />,
  'pnl-text': <PnlTextUsage />,
  'price-tag': <PriceTagUsage />,
  'quote-card': <QuoteCardUsage />,
  'quote-table': <QuoteTableUsage />,
  'range-bar': <RangeBarUsage />,
  'rating-gauge': <RatingGaugeUsage />,
  'rating-text': <RatingTextUsage />,
  'row-actions': <RowActionsUsage />,
  'spark-tile': <SparkTileUsage />,
  sparkline: <SparklineUsage />,
  'symbol-mark': <SymbolMarkUsage />,
  'technical-rating': <TechnicalRatingUsage />,
  treemap: <TreemapUsage />,
  watchlist: <WatchlistUsage />,
  'compare-bar': (
    <div style={{ maxWidth: 320 }}>
      <CompareBar
        a={{ label: 'Volume', value: 59.2e6, text: '59.2M' }}
        b={{ label: 'Avg. volume (30D)', value: 74.6e6, text: '74.6M' }}
        label="Volume versus 30-day average"
      />
    </div>
  ),
  'quote-strip': (
    <div style={{ maxWidth: 420 }}>
      <QuoteStrip
        label="Sample strip"
        items={[
          {
            id: 'a',
            name: 'Sample A',
            symbol: 'AAA',
            last: 11.8,
            change: 1.8,
            changePct: 18,
            spark: [10, 10.5, 10.2, 11, 11.8],
          },
          {
            id: 'b',
            name: 'Sample B',
            symbol: 'BBB',
            last: 10.2,
            change: -1.8,
            changePct: -15,
            spark: [12, 11.5, 11, 10.6, 10.2],
          },
          { id: 'c', name: 'Sample C', symbol: 'CCC', last: 10, change: 0, changePct: 0, spark: [10, 10, 10, 10, 10] },
        ].map((card) => ({ ...card, labels: { spark: 'Sample trend' } }))}
      />
    </div>
  ),
}

const settle: Record<string, number> = { 'page-preloader': 1500 }

// Freeze the clock (Date only, so timers still run): today/relative-time cells must not drift between days.
beforeAll(() => {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-11-17T09:00:00'))
})
afterAll(() => vi.useRealTimers())

for (const theme of ['graphite', 'console'] as const) {
  describe(theme, () => {
    for (const [name, node] of Object.entries(items)) {
      test(name, async () => {
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
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-quotes-${name}`)
      })
    }
  })
}
