// SPDX-License-Identifier: MIT
// src/blocks: one screenshot per public component, from the gallery usage demos (minimal data).
import { beforeAll, afterAll, describe, expect, test, vi } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { AttributionBarsUsage } from '../gallery/usage/AttributionBarsUsage.tsx'
import { ColumnSetTabsUsage } from '../gallery/usage/ColumnSetTabsUsage.tsx'
import { ComponentCatalogUsage } from '../gallery/usage/ComponentCatalogUsage.tsx'
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
import { AgentActivity, AgentDrawer, DataGrid, type SeriesExplorerColumn } from '../src/blocks/index.ts'
import { SeriesTable } from '../src/blocks/series-explorer/series-explorer-table.tsx'
import { ChartTable } from '../src/lib/chart/chart-kit/chart-table.tsx'
import { STOCKS, STOCK_COLUMNS, STOCK_LAYOUT } from '../gallery/pages/screener-data.tsx'
import { UseUndoStackUsage } from '../gallery/usage/UseUndoStackUsage.tsx'
import { mount } from './render.tsx'

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

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const WEEKDAYS_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
// Agent 档案抽屉的热力格（#225）：两周 14 天，覆盖 0 次与 5 档。
const ACTIVITY_DAYS = [0, 0, 2, 5, 9, 12, 0, 1, 3, 6, 8, 10, 4, 0].map((count, index) => ({
  date: new Date(Date.UTC(2026, 10, 2 + index)).toISOString().slice(0, 10),
  count,
}))
const agentActivity = (
  <div style={{ width: 360 }}>
    <AgentActivity
      days={ACTIVITY_DAYS}
      monthLabels={MONTHS_EN}
      weekdayLabels={WEEKDAYS_EN}
      label="Runs per day"
      describe={({ date, count }) => `${date.slice(5)} ran ${count} times`}
      legend={{ less: 'Less', more: 'More' }}
      idle="14 days"
    />
  </div>
)

const DRAWER_DAYS = Array.from({ length: 56 }, (_, index) => ({
  date: new Date(Date.UTC(2026, 8, 28 + index)).toISOString().slice(0, 10),
  count: index % 7 > 4 ? 0 : (index * 5) % 13,
}))
// 抽屉整件的截图用英文（沙箱的 CJK 字形问题 #202，截图文字不放中文）；固定的演示值，不读钟。
const agentDrawer = (
  <div style={{ width: 380, height: 900, border: '1px solid var(--k-separable-secondary-borderColor)' }}>
    <AgentDrawer
      name="Pre-open scan"
      description="Scans the watchlist before the open and writes a one-page brief."
      status="running"
      tags={['Quotes', 'Pre-open']}
      trigger={{ kind: 'schedule', detail: 'Trading days 08:30' }}
      owner={{ name: 'Sharon Kim' }}
      created="May 9, 2026"
      metrics={[
        { id: 'saved', label: 'Time saved', value: '155', unit: 'hours', delta: { text: '+8%', tone: 'ok' } },
        { id: 'cost', label: 'Cost this month', value: '$1,180', delta: { text: '+15%', tone: 'warn' } },
      ]}
      activity={{
        days: DRAWER_DAYS,
        monthLabels: MONTHS_EN,
        weekdayLabels: WEEKDAYS_EN,
        describe: ({ date, count }) => `${date.slice(5)} ran ${count} times`,
        idle: '8 weeks',
      }}
      runs={[
        { id: 'r3', actor: 'Trading days 08:30', trigger: 'schedule', result: 'running', startedAt: 3 },
        { id: 'r2', actor: 'Price breakout', trigger: 'event', result: 'failed', startedAt: 2, durationMs: 8000 },
        { id: 'r1', actor: 'Sharon Kim', trigger: 'manual', result: 'ok', startedAt: 1, durationMs: 41_000 },
      ]}
      onOpenRun={() => {}}
      formatTime={(at) => `${at}h ago`}
      formatDuration={(ms) => `${ms / 1000}s`}
      configure={<p>Configure</p>}
      history={<p>History</p>}
      labels={{
        properties: { status: 'Status', tags: 'Tags', trigger: 'Trigger', owner: 'Owner', created: 'Created' },
        statuses: { running: 'Running', paused: 'Paused', disabled: 'Disabled' },
        triggers: { schedule: 'Scheduled', event: 'On event', upload: 'On upload', manual: 'Manual' },
        results: { ok: 'Done', failed: 'Failed', running: 'Running', cancelled: 'Cancelled' },
        tabs: { list: 'Agent profile', usage: 'Usage', configure: 'Configure', history: 'History' },
        activity: 'Activity',
        activityGrid: 'Runs per day',
        legend: { less: 'Less', more: 'More' },
        recentRuns: 'Recent runs',
        noRuns: 'No runs yet',
        metrics: 'Usage metrics',
      }}
    />
  </div>
)

const items: Record<string, React.ReactNode> = {
  'agent-activity': agentActivity,
  'agent-drawer': agentDrawer,
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
  'news-reader': <NewsReaderUsage />,
  'order-book': <OrderBookUsage />,
  'order-ticket': <OrderTicketUsage />,
  'panel-frame': <PanelFrameUsage />,
  'position-calculator': <PositionCalculatorUsage />,
  'panel-tabs': <PanelTabsUsage />,
  'component-catalog': <ComponentCatalogUsage />,
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

const settle: Record<string, number> = { 'page-preloader': 1500, whiteboard: 600, 'agent-drawer': 1200 }
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
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-blocks-${name}`)
      })
    }
  })
}
