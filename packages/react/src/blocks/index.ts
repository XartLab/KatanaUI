// SPDX-License-Identifier: MIT
// @katana-ui/react/blocks 的出口：拼面板用的积木（#1869）。包里最上一层，可以用下面所有层（lib、primitives、katana、patterns、quant），
// 不依赖应用：应用才有的能力（快捷键表、文案、右键菜单怎么画、问 Agent）经 DataGridHost 这类 context 或 props 传进来，没提供时件照常能用。
export { DataGrid } from './data-grid/data-grid.tsx'
export type { DataGridProps, GridColumnLayout, GridDensity, GridRowProps, GridSlot } from './data-grid/data-grid.tsx'
export type { ColumnFormat, ColumnType, GridColumn, GridSide, GridTone, SymbolValue } from './data-grid/columns.ts'
export {
  DataGridHostProvider,
  type DataGridHost,
  type DataGridLabels,
  type DataGridTexts,
  type GridAction,
  type GridMenuEntry,
} from './data-grid/host.tsx'
export { tableCsv, type SortSpec } from './data-grid/model.ts'
export {
  ColumnPicker,
  type ColumnPickerLabels,
  type ColumnPickerProps,
  type ColumnSet,
} from './data-grid/column-picker.tsx'
export { ColumnSetTabs, type ColumnSetTabsProps } from './data-grid/column-set-tabs.tsx'
export {
  activeColumnSet,
  applyColumnSet,
  moveColumn,
  reorderColumn,
  setColumnFixed,
  setColumnVisible,
} from './data-grid/layout-model.ts'
export { EmptyState, type EmptyStateSlot } from './empty-state.tsx'
export { EstimateBadge } from './estimate-badge.tsx'
export { EventTimeline, type EventTimelineLabels, type EventTimelineProps } from './event-timeline/event-timeline.tsx'
export type { EventKind, SessionMinutes, TimelineEvent } from './event-timeline/event-timeline-model.ts'
export { DecisionQueue, type DecisionQueueLabels, type DecisionQueueProps } from './decision-queue/decision-queue.tsx'
export type {
  DecisionFilter,
  DecisionItem,
  DecisionSource,
  DecisionStatus,
} from './decision-queue/decision-queue-model.ts'
export {
  HypothesisLedger,
  type HypothesisLedgerLabels,
  type HypothesisLedgerProps,
} from './hypothesis-ledger/hypothesis-ledger.tsx'
export type {
  EvidenceKind,
  Hypothesis,
  HypothesisAsset,
  HypothesisEvidence,
  HypothesisLayer,
  HypothesisStatus,
  WatchRow,
} from './hypothesis-ledger/hypothesis-ledger-model.ts'
export { NewsFeed, type NewsFeedLabels, type NewsFeedProps } from './news-feed/news-feed.tsx'
export type { NewsFacet, NewsItem, NewsSymbol } from './news-feed/news-feed-model.ts'
export {
  NewsReader,
  NewsSymbolChip,
  type NewsReaderLabels,
  type NewsReaderProps,
  type NewsReaderSymbol,
} from './news-feed/news-reader.tsx'
export {
  SystemMonitor,
  type SystemMonitorLabels,
  type SystemMonitorMetric,
  type SystemMonitorProps,
} from './system-monitor/system-monitor.tsx'
export type {
  EventSeverity,
  LinkState,
  MonitorEvent,
  MonitorLink,
  MonitorStrategy,
  StrategyAction,
  StrategyStatus,
} from './system-monitor/system-monitor-model.ts'
export {
  TransmissionChain,
  type ChainSelection,
  type TransmissionChainLabels,
  type TransmissionChainProps,
} from './transmission-chain/transmission-chain.tsx'
export type {
  ChainDirection,
  ChainEdge,
  ChainNode,
  ChainStatus,
} from './transmission-chain/transmission-chain-model.ts'
export { Toolbar, ToolbarGroup, ToolButton, ToolSlot } from './toolbar/toolbar.tsx'
export { useRovingToolbar } from './toolbar/use-roving-toolbar.ts'

// 时间序列与盈亏的积木（#1917）。功能参照 Arc（uiarc.dev，2026-11-14 读），只取功能，实现原创。
export { SmallMultiples, type SmallMultiple, type SmallMultiplesProps } from './small-multiples.tsx'
export {
  SeriesExplorer,
  type SeriesExplorerColumn,
  type SeriesExplorerLabels,
  type SeriesExplorerProps,
} from './series-explorer/series-explorer.tsx'
export type { KpiDef, RangeDef, SeriesDef, SeriesPoint } from './series-explorer/series-explorer-model.ts'

// 盈亏归因（#1917，#1931 从 quant 挪到这里：顶行用了 blocks 的 Toolbar）。
export {
  AttributionBars,
  type AttributionBarsLabels,
  type AttributionBarsProps,
  type AttributionChoice,
  type AttributionSwitch,
} from './attribution-bars/attribution-bars.tsx'
export type { AttributionItem } from './attribution-bars/attribution-model.ts'

// 分布与关系类的件（#1918）：功能参照 Arc Customer galaxy（uiarc.dev，2026-11-14 读），实现原创。
export { SymbolGalaxy, type GalaxyGrouping, type SymbolGalaxyProps } from './symbol-galaxy/symbol-galaxy.tsx'
export {
  hitNode,
  layoutGalaxy,
  stepNode,
  type GalaxyGroup,
  type GalaxyLayout,
  type GalaxyNode,
  type GalaxyPlace,
} from './symbol-galaxy/galaxy-model.ts'
export {
  PanelFrame,
  PanelFrameBody,
  PanelFrameHeader,
  type PanelFrameBodyLabels,
  type PanelFrameBodyProps,
  type PanelFrameHeaderLabels,
  type PanelFrameHeaderProps,
  type PanelFrameProps,
  type PanelFrameSlot,
  type PanelFrameState,
} from './panel-frame/panel-frame.tsx'
export { StatusBar, type StatusBarLabels, type StatusBarProps, type StatusItem } from './status-bar/status-bar.tsx'
export { collapsedItems, type FitItem } from './status-bar/status-bar-model.ts'
export {
  WorkspaceTabs,
  type WorkspaceTab,
  type WorkspaceTabsLabels,
  type WorkspaceTabsProps,
} from './workspace-tabs/workspace-tabs.tsx'
export {
  StrategyReport,
  type MetricKey,
  type StrategyReportFormat,
  type StrategyReportLabels,
  type StrategyReportProps,
  type StrategyReportProperty,
  type StrategyReportPropertyGroup,
  type StrategyReportTab,
} from './strategy-report/strategy-report.tsx'
export {
  computeReport,
  filterTrades,
  histogram,
  type Histogram,
  type ReportOptions,
  type ReportSide,
  type ReportStats,
  type ReportTrade,
  type SideFilter,
} from './strategy-report/strategy-report-model.ts'

// 不是量化专有的读数件（G6 从 src/quant 挪来，体检 §2）：仪表、订单流仪表行、状态带、必要条件块、逐格可用条。
export { Meter, type MeterDisplay, type MeterProps, type MeterTone } from './meter/meter.tsx'
export {
  FlowGauges,
  type FlowCellState,
  type FlowDivergenceGauge,
  type FlowDomGauge,
  type FlowGaugeData,
  type FlowGaugesLabels,
  type FlowGaugesProps,
  type FlowSignedGauge,
} from './flow-gauges/flow-gauges.tsx'
export {
  RegimeBand,
  RegimeStrip,
  type RegimeBandProps,
  type RegimeColor,
  type RegimeSegment,
  type RegimeState,
  type RegimeStripLabels,
  type RegimeStripProps,
} from './regime-strip/regime-strip.tsx'
export {
  ConsensusBlock,
  countConsensus,
  type ConsensusBlockProps,
  type ConsensusParty,
  type ConsensusState,
  type ConsensusVerdict,
} from './consensus-block/consensus-block.tsx'
export { UptimeBars, type UptimeBarsProps } from './uptime-bars/uptime-bars.tsx'
export { uptimeShare, type UptimeCell, type UptimeStatus } from './uptime-bars/uptime-bars-model.ts'

// 兑换面板（改自 SmoothUI swap-panel，MIT）。
export { SwapPanel, type SwapAsset, type SwapPanelLabels, type SwapQuote, type SwapStatus } from './swap-panel.tsx'
