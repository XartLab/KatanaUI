// SPDX-License-Identifier: MIT
// src/blocks: one screenshot per public component, from the gallery usage demos (minimal data).
import { beforeAll, afterAll, describe, expect, test, vi } from 'vite-plus/test'
import { page } from 'vite-plus/test/browser'
import { AttributionBarsUsage } from '../gallery/usage/AttributionBarsUsage.tsx'
import { ColumnSetTabsUsage } from '../gallery/usage/ColumnSetTabsUsage.tsx'
import { ConsensusBlockUsage } from '../gallery/usage/ConsensusBlockUsage.tsx'
import { DataGridUsage } from '../gallery/usage/DataGridUsage.tsx'
import { DecisionQueueUsage } from '../gallery/usage/DecisionQueueUsage.tsx'
import { EmptyStateUsage } from '../gallery/usage/EmptyStateUsage.tsx'
import { EstimateBadgeUsage } from '../gallery/usage/EstimateBadgeUsage.tsx'
import { EventTimelineUsage } from '../gallery/usage/EventTimelineUsage.tsx'
import { FlowGaugesUsage } from '../gallery/usage/FlowGaugesUsage.tsx'
import { HypothesisLedgerUsage } from '../gallery/usage/HypothesisLedgerUsage.tsx'
import { MeterUsage } from '../gallery/usage/MeterUsage.tsx'
import { NewsFeedUsage } from '../gallery/usage/NewsFeedUsage.tsx'
import { NewsReaderUsage } from '../gallery/usage/NewsReaderUsage.tsx'
import { PanelFrameUsage } from '../gallery/usage/PanelFrameUsage.tsx'
import { RegimeStripUsage } from '../gallery/usage/RegimeStripUsage.tsx'
import { SeriesExplorerUsage } from '../gallery/usage/SeriesExplorerUsage.tsx'
import { SmallMultiplesUsage } from '../gallery/usage/SmallMultiplesUsage.tsx'
import { StatusBarUsage } from '../gallery/usage/StatusBarUsage.tsx'
import { StrategyReportUsage } from '../gallery/usage/StrategyReportUsage.tsx'
import { SwapPanelUsage } from '../gallery/usage/SwapPanelUsage.tsx'
import { SymbolGalaxyUsage } from '../gallery/usage/SymbolGalaxyUsage.tsx'
import { SystemMonitorUsage } from '../gallery/usage/SystemMonitorUsage.tsx'
import { ToolbarUsage } from '../gallery/usage/ToolbarUsage.tsx'
import { TransmissionChainUsage } from '../gallery/usage/TransmissionChainUsage.tsx'
import { UptimeBarsUsage } from '../gallery/usage/UptimeBarsUsage.tsx'
import { WhiteboardUsage } from '../gallery/usage/WhiteboardUsage.tsx'
import { WorkspaceTabsUsage } from '../gallery/usage/WorkspaceTabsUsage.tsx'
import { mount } from './render.tsx'

const items: Record<string, React.ReactNode> = {
  'attribution-bars': <AttributionBarsUsage />,
  'column-set-tabs': <ColumnSetTabsUsage />,
  'consensus-block': <ConsensusBlockUsage />,
  'data-grid': <DataGridUsage />,
  'decision-queue': <DecisionQueueUsage />,
  'empty-state': <EmptyStateUsage />,
  'estimate-badge': <EstimateBadgeUsage />,
  'event-timeline': <EventTimelineUsage />,
  'flow-gauges': <FlowGaugesUsage />,
  'hypothesis-ledger': <HypothesisLedgerUsage />,
  meter: <MeterUsage />,
  'news-feed': <NewsFeedUsage />,
  'news-reader': <NewsReaderUsage />,
  'panel-frame': <PanelFrameUsage />,
  'regime-strip': <RegimeStripUsage />,
  'series-explorer': <SeriesExplorerUsage />,
  'small-multiples': <SmallMultiplesUsage />,
  'status-bar': <StatusBarUsage />,
  'strategy-report': <StrategyReportUsage />,
  'swap-panel': <SwapPanelUsage />,
  'symbol-galaxy': <SymbolGalaxyUsage />,
  'system-monitor': <SystemMonitorUsage />,
  toolbar: <ToolbarUsage />,
  'transmission-chain': <TransmissionChainUsage />,
  'uptime-bars': <UptimeBarsUsage />,
  whiteboard: <WhiteboardUsage />,
  'workspace-tabs': <WorkspaceTabsUsage />,
}

const settle: Record<string, number> = { 'page-preloader': 1500, whiteboard: 600 }

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
        await expect(page.getByTestId('frame')).toMatchScreenshot(`${theme}-blocks-${name}`)
      })
    }
  })
}
