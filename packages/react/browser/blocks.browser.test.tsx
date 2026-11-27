// SPDX-License-Identifier: MIT
// src/blocks: one screenshot per public component, from the gallery usage demos (minimal data).
import { beforeAll, afterAll, describe, expect, test, vi } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { AttributionBarsUsage } from '../gallery/usage/AttributionBarsUsage.tsx'
import { ColumnSetTabsUsage } from '../gallery/usage/ColumnSetTabsUsage.tsx'
import { ComponentCatalogUsage } from '../gallery/usage/ComponentCatalogUsage.tsx'
import { ComponentCatalogMenuUsage } from '../gallery/usage/ComponentCatalogMenuUsage.tsx'
import { ConsensusBlockUsage } from '../gallery/usage/ConsensusBlockUsage.tsx'
import { DataGridUsage } from '../gallery/usage/DataGridUsage.tsx'
import { DepthChartUsage } from '../gallery/usage/DepthChartUsage.tsx'
import { DecisionQueueUsage } from '../gallery/usage/DecisionQueueUsage.tsx'
import { EmptyStateUsage } from '../gallery/usage/EmptyStateUsage.tsx'
import { EstimateBadgeUsage } from '../gallery/usage/EstimateBadgeUsage.tsx'
import { EventTimelineUsage } from '../gallery/usage/EventTimelineUsage.tsx'
import { FlowGaugesUsage } from '../gallery/usage/FlowGaugesUsage.tsx'
import { HypothesisLedgerUsage } from '../gallery/usage/HypothesisLedgerUsage.tsx'
import { MeterUsage } from '../gallery/usage/MeterUsage.tsx'
import { NewsFeedUsage } from '../gallery/usage/NewsFeedUsage.tsx'
import { DocReaderUsage } from '../gallery/usage/DocReaderUsage.tsx'
import { NewsReaderUsage } from '../gallery/usage/NewsReaderUsage.tsx'
import { OrderBookUsage } from '../gallery/usage/OrderBookUsage.tsx'
import { OrderTicketUsage } from '../gallery/usage/OrderTicketUsage.tsx'
import { PanelFrameUsage } from '../gallery/usage/PanelFrameUsage.tsx'
import { PositionCalculatorUsage } from '../gallery/usage/PositionCalculatorUsage.tsx'
import { PanelTabsUsage } from '../gallery/usage/PanelTabsUsage.tsx'
import { RegimeStripUsage } from '../gallery/usage/RegimeStripUsage.tsx'
import { SeriesExplorerUsage } from '../gallery/usage/SeriesExplorerUsage.tsx'
import { SmallMultiplesUsage } from '../gallery/usage/SmallMultiplesUsage.tsx'
import { StatusBarUsage } from '../gallery/usage/StatusBarUsage.tsx'
import { FloatingWindowUsage } from '../gallery/usage/FloatingWindowUsage.tsx'
import { StrategyLauncherUsage } from '../gallery/usage/StrategyLauncherUsage.tsx'
import { StrategyReportUsage } from '../gallery/usage/StrategyReportUsage.tsx'
import { SwapPanelUsage } from '../gallery/usage/SwapPanelUsage.tsx'
import { SymbolGalaxyUsage } from '../gallery/usage/SymbolGalaxyUsage.tsx'
import { SystemMonitorUsage } from '../gallery/usage/SystemMonitorUsage.tsx'
import { ToolbarUsage } from '../gallery/usage/ToolbarUsage.tsx'
import { TradeTapeUsage } from '../gallery/usage/TradeTapeUsage.tsx'
import { TransmissionChainUsage } from '../gallery/usage/TransmissionChainUsage.tsx'
import { UptimeBarsUsage } from '../gallery/usage/UptimeBarsUsage.tsx'
import { PortfolioRunGridUsage } from '../gallery/usage/PortfolioRunGridUsage.tsx'
import { ReplayTransportUsage } from '../gallery/usage/ReplayTransportUsage.tsx'
import { RunModeBadgeUsage } from '../gallery/usage/RunModeBadgeUsage.tsx'
import { WhiteboardUsage } from '../gallery/usage/WhiteboardUsage.tsx'
import { WorkspaceTabsUsage } from '../gallery/usage/WorkspaceTabsUsage.tsx'
import { GridSummaryRowUsage } from '../gallery/usage/GridSummaryRowUsage.tsx'
import { DataGrid, type SeriesExplorerColumn } from '../src/blocks/index.ts'
import { SeriesTable } from '../src/blocks/series-explorer/series-explorer-table.tsx'
import { ChartTable } from '../src/lib/chart/chart-kit/chart-table.tsx'
import { STOCKS, STOCK_COLUMNS, STOCK_LAYOUT } from '../gallery/pages/screener-data.tsx'
import { UseUndoStackUsage } from '../gallery/usage/UseUndoStackUsage.tsx'
import { mount } from './render.tsx'
import { settled } from './settle.ts'

// comfortable 档的整页选股器（#90）：16 行演示数据，列覆盖代码芯片、单位小字、缩写、横条、评级、标签、迷你图、区间。
const COMFORTABLE_COLUMNS = [
  'symbol',
  'price',
  'change',
  'volume',
  'rvol',
  'mcap',
  'rating',
  'sector',
  'trend',
  'range',
]
const comfortable = (
  <div style={{ display: 'flex', height: 700 }}>
    <DataGrid
      columns={STOCK_COLUMNS}
      layout={STOCK_LAYOUT.map((column) => ({ ...column, visible: COMFORTABLE_COLUMNS.includes(column.id) }))}
      rows={STOCKS}
      rowId={(row) => row.code}
      label="Screener"
      sort={{ id: 'mcap', desc: true }}
      onSortChange={() => {}}
      density="comfortable"
      timeZone="utc"
    />
  </div>
)

// 报告类的原生表（#92）：跟 comfortable 同一套数（.k-table-comfortable）。数据是编的。
const SX_COLUMNS: readonly SeriesExplorerColumn[] = [
  {
    key: 'net',
    label: '净盈亏',
    text: (p) => (p.values.net ?? 0).toLocaleString('en-US'),
    tone: (p) => p.values.net ?? null,
  },
  { key: 'fee', label: '费税', text: (p) => (p.values.fee ?? 0).toLocaleString('en-US') },
  { key: 'equity', label: '权益', text: (p) => (p.values.equity ?? 0).toLocaleString('en-US') },
]
const SX_ROWS = [3, 2, 1, 0].map((i) => ({
  i,
  point: {
    at: Date.UTC(2025, i, 1),
    values: { net: [1240, -380, 2210, 0][i]!, fee: -120 - 10 * i, equity: 50_000 + 1000 * i },
  },
}))
const seriesTable = (
  <SeriesTable
    rows={SX_ROWS}
    columns={SX_COLUMNS}
    labels={{ table: '明细表', time: '月份' } as Parameters<typeof SeriesTable>[0]['labels']}
    formatAt={(at) => new Date(at).toISOString().slice(0, 7)}
    active={2}
  />
)
const chartTable = (
  <ChartTable
    label="分组收益表"
    head={['分组', '中位数', '25%', '75%']}
    numeric={[1, 2, 3]}
    slot="chart-table"
    rows={[
      ['价值', '1.20%', '-0.80%', '3.10%'],
      ['成长', '0.80%', '-1.00%', '2.60%'],
      ['动量', '0.40%', '-1.20%', '2.10%'],
      ['低波', '0.10%', '-1.40%', '1.60%'],
    ].map((cells) => ({ key: cells[0]!, cells }))}
  />
)

const items: Record<string, React.ReactNode> = {
  'attribution-bars': <AttributionBarsUsage />,
  'column-set-tabs': <ColumnSetTabsUsage />,
  'consensus-block': <ConsensusBlockUsage />,
  'data-grid': <DataGridUsage />,
  'data-grid-comfortable': comfortable,
  'chart-table': chartTable,
  'series-explorer-table': seriesTable,
  'strategy-report-panes': <StrategyReportUsage defaultTab="performance" />,
  'strategy-report-trades': <StrategyReportUsage defaultTab="trades" />,
  'hypothesis-ledger-watch': <HypothesisLedgerUsage defaultView="watch" />,
  'decision-queue': <DecisionQueueUsage />,
  'depth-chart': <DepthChartUsage />,
  'empty-state': <EmptyStateUsage />,
  'estimate-badge': <EstimateBadgeUsage />,
  'event-timeline': <EventTimelineUsage />,
  'flow-gauges': <FlowGaugesUsage />,
  'hypothesis-ledger': <HypothesisLedgerUsage />,
  meter: <MeterUsage />,
  'news-feed': <NewsFeedUsage />,
  'doc-reader': <DocReaderUsage />,
  'news-reader': <NewsReaderUsage />,
  'order-book': <OrderBookUsage />,
  'order-ticket': <OrderTicketUsage />,
  'panel-frame': <PanelFrameUsage />,
  'position-calculator': <PositionCalculatorUsage />,
  'panel-tabs': <PanelTabsUsage />,
  'component-catalog': <ComponentCatalogUsage />,
  'component-catalog-menu': <ComponentCatalogMenuUsage />,
  'strategy-launcher': <StrategyLauncherUsage />,
  'floating-window': <FloatingWindowUsage />,
  'regime-strip': <RegimeStripUsage />,
  'series-explorer': <SeriesExplorerUsage />,
  'small-multiples': <SmallMultiplesUsage />,
  'status-bar': <StatusBarUsage />,
  'strategy-report': <StrategyReportUsage />,
  'portfolio-run-grid': <PortfolioRunGridUsage />,
  'replay-transport': <ReplayTransportUsage />,
  'run-mode-badge': <RunModeBadgeUsage />,
  'swap-panel': <SwapPanelUsage />,
  'symbol-galaxy': <SymbolGalaxyUsage />,
  'system-monitor': <SystemMonitorUsage />,
  toolbar: <ToolbarUsage />,
  'trade-tape': <TradeTapeUsage />,
  'transmission-chain': <TransmissionChainUsage />,
  'uptime-bars': <UptimeBarsUsage />,
  'grid-summary-row': <GridSummaryRowUsage />,
  'use-undo-stack': <UseUndoStackUsage />,
  whiteboard: <WhiteboardUsage />,
  'workspace-tabs': <WorkspaceTabsUsage />,
}

const settle: Record<string, number> = { 'page-preloader': 1500, whiteboard: 600 }
/** 默认框宽 720；整页的表要更宽。 */
const widths: Record<string, number> = { 'data-grid-comfortable': 1480 }

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
        await page.viewport(Math.max(960, (widths[name] ?? 720) + 60), 1800)
        await mount(
          <div
            style={{
              width: widths[name] ?? 720,
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
        await settled()
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-blocks-${name}`)
      })
    }
  })
}
