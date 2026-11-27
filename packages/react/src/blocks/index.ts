// SPDX-License-Identifier: MIT
// @katana-ui/react/blocks 的出口：拼面板用的积木（#1869）。包里最上一层，可以用下面所有层（lib、primitives、katana、patterns、quant），
// 不依赖应用：应用才有的能力（快捷键表、文案、右键菜单怎么画、问 Agent）经 DataGridHost 这类 context 或 props 传进来，没提供时件照常能用。
export { DataGrid } from './data-grid/data-grid.tsx'
export type { DataGridProps, GridColumnLayout, GridDensity, GridRowProps, GridSlot } from './data-grid/data-grid.tsx'
export type {
  ColumnFormat,
  ColumnType,
  GridColumn,
  GridHeat,
  GridPillTone,
  GridSide,
  GridTone,
  PillValue,
  ProgressValue,
  RangeValue,
  SymbolPart,
  SymbolValue,
} from './data-grid/columns.ts'
export {
  DataGridHostProvider,
  type DataGridHost,
  type DataGridLabels,
  type DataGridTexts,
  type GridAction,
  type GridMenuEntry,
} from './data-grid/host.tsx'
export { tableCsv, type SortSpec } from './data-grid/model.ts'
// 表尾合计 / 均值行（#77 第 5 条）：DataGrid 的 summary 属性；纯函数可单用。
export {
  GridSummaryRow,
  aggregateValues,
  summaryCells,
  type GridSummary,
  type GridSummaryRowProps,
  type SummaryAggregate,
  type SummaryColumn,
} from './data-grid/grid-summary-row.tsx'
export {
  ColumnPicker,
  type ColumnPickerLabels,
  type ColumnPickerProps,
  type ColumnSet,
} from './data-grid/column-picker.tsx'
export { ColumnSetTabs, type ColumnSetTabsProps } from './data-grid/column-set-tabs.tsx'
export { useRowOrder, type RowOrder, type UseRowOrderOptions } from './data-grid/use-row-order.ts'
export {
  applyRowOrder,
  expandMoving,
  mergeVisibleOrder,
  moveRows,
  moveRowsBy,
  normalizeOrder,
  type IsSection,
} from './data-grid/row-order-model.ts'
export type { RowMoveTo } from './data-grid/grid-menu.tsx'
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

// 前向测试与回放的件（#121）：组合运行表、回放控制条、运行模式徽标。功能参照 MultiCharts（2026-11-21 读官方页面），实现原创。
export {
  PortfolioRunGrid,
  type PortfolioRunFormat,
  type PortfolioRunGridProps,
  type PortfolioRunLabels,
  type PortfolioRunSummary,
} from './portfolio-run-grid/portfolio-run-grid.tsx'
export { type PortfolioRunRow, type RunStatus } from './portfolio-run-grid/portfolio-run-model.ts'
export {
  ReplayTransport,
  type ReplayTransportLabels,
  type ReplayTransportProps,
} from './replay-transport/replay-transport.tsx'
export { RunModeBadge, type RunMode, type RunModeBadgeProps } from './run-mode-badge/run-mode-badge.tsx'

// 白板（#51）：底座 React Flow（@xyflow/react，MIT）。
export { Whiteboard, type WhiteboardLabels, type WhiteboardProps } from './whiteboard/whiteboard.tsx'
export {
  copySelection,
  getDownstream,
  layoutWhiteboard,
  pasteClip,
  removeItems,
  snapToGuides,
  type WhiteboardCardNode,
  type WhiteboardDirection,
  type WhiteboardDoc,
  type WhiteboardEdge,
  type WhiteboardGroupNode,
  type WhiteboardHypothesisNode,
  type WhiteboardMetricNode,
  type WhiteboardNode,
  type WhiteboardNodeType,
  type WhiteboardNoteNode,
} from './whiteboard/whiteboard-model.ts'

// 兑换面板（改自 SmoothUI swap-panel，MIT）。
export { SwapPanel, type SwapAsset, type SwapPanelLabels, type SwapQuote, type SwapStatus } from './swap-panel.tsx'

// 品种搜索（#77 第 1 条，参照 TradingView）：Command 底座、市场分段、最近搜索、匹配高亮；数据与搜索由调用方传。
export {
  SymbolSearch,
  SymbolSearchDialog,
  type SymbolSearchDialogProps,
  type SymbolSearchLabels,
  type SymbolSearchProps,
  type SymbolSearchQuery,
} from './symbol-search/symbol-search.tsx'
export type { SymbolSearchItem, SymbolSearchSegment } from './symbol-search/symbol-search-model.ts'
// 下单面板、仓位计算器与仓位计算的纯函数（#96）。
export {
  OrderTicket,
  type ExitTemplate,
  type MarginMode,
  type OrderAction,
  type OrderDraft,
  type OrderTicketAccount,
  type OrderTicketInstrument,
  type OrderTicketLabels,
  type OrderTicketMarket,
  type OrderType,
  type StopCustody,
} from './order-ticket.tsx'
export {
  PositionCalculator,
  PositionCalculatorPanel,
  type PositionCalculatorLabels,
  type PositionCalculatorProps,
} from './position-calculator.tsx'
export {
  breakevenPrice,
  computeSizing,
  contractsForCost,
  contractsForRisk,
  exitPnl,
  floorToStep,
  liquidationPrice,
  type ExitEstimate,
  type FeeRates,
  type HeldPosition,
  type InstrumentSpec,
  type OrderSide,
  type SizingInput,
  type SizingIssue,
  type SizingMode,
  type SizingResult,
} from './sizing-model.ts'
// 面板页签组与添加组件的目录（照 OKX 面板的页签栏做法，2026-11-19）。
export {
  PANEL_TAB_MIME,
  PanelTabs,
  type PanelTab,
  type PanelTabsLabels,
  type PanelTabsProps,
} from './panel-tabs/panel-tabs.tsx'
export {
  FloatingWindow,
  isFloatingWindowSupported,
  useFloatingWindow,
  type FloatingWindowLabels,
  type FloatingWindowMode,
  type FloatingWindowProps,
} from './floating-window/floating-window.tsx'
export {
  StrategyLauncher,
  type StrategyEntry,
  type StrategyLauncherLabels,
  type StrategyLauncherProps,
} from './strategy-launcher/strategy-launcher.tsx'
export {
  CATALOG_ITEM_MIME,
  ComponentCatalog,
  type ComponentCatalogLabels,
} from './component-catalog/component-catalog.tsx'
export {
  groupCatalog,
  type CatalogCategory,
  type CatalogGroup,
  type CatalogItem,
  type CatalogKind,
} from './component-catalog/component-catalog-model.ts'
// A 股面板（#11，开盘啦对照）：口径（情绪分、强度、阶段）由调用方传，件只画；涨跌色走 --k-tone-*（data-updown="cn" 红涨绿跌）。
export {
  SentimentCycle,
  type SentimentDay,
  type SentimentCycleLabels,
  type SentimentCycleProps,
  type SentimentMetric,
  type SentimentStage,
} from './sentiment-cycle/sentiment-cycle.tsx'
export {
  ReasonGroupList,
  type ReasonGroup,
  type ReasonGroupListLabels,
  type ReasonGroupListProps,
  type ReasonStock,
} from './reason-group-list/reason-group-list.tsx'
export {
  BoardStrengthRank,
  type BoardStrength,
  type BoardStrengthRankLabels,
  type BoardStrengthRankProps,
  type RankedBoard,
} from './board-strength-rank/board-strength-rank.tsx'
export {
  NetBuyBar,
  type DragonSeat,
  type DragonTigerItem,
  type NetBuyBarLabels,
  type NetBuyBarProps,
} from './net-buy-bar/net-buy-bar.tsx'

// #104 账户四件：持仓表、委托表（共页签外壳）、账户权益概览、资金费率、期权 T 型报价。
export {
  PositionsTable,
  type LiquidationRisk,
  type Position,
  type PositionSide,
  type PositionTotals,
  type PositionsTableLabels,
  type PositionsTableProps,
} from './positions-table/positions-table.tsx'
export {
  liquidationDistance,
  liquidationFill,
  liquidationRisk,
  positionTotals,
  unrealizedPercent,
} from './positions-table/positions-model.ts'
export {
  PositionsOrdersTabs,
  type PositionsOrdersTab,
  type PositionsOrdersTabsLabels,
  type PositionsOrdersTabsProps,
} from './positions-table/positions-orders-tabs.tsx'
export {
  OrdersTable,
  type Order,
  type OrderSide as OpenOrderSide,
  type OrderStatus,
  type OrderType as OpenOrderType,
  type OrdersTableLabels,
  type OrdersTableProps,
} from './orders-table/orders-table.tsx'
export {
  amendDecision,
  canAmend,
  canCancel,
  cancellable,
  fillRatio,
  parseAmendPrice,
} from './orders-table/orders-model.ts'
export {
  AccountEquity,
  type AccountEquityLabels,
  type AccountEquityProps,
  type MarginLevel,
  type MarginThresholds,
} from './account-equity/account-equity.tsx'
export { marginLevel, marginRatioOf, riskBands, riskPosition } from './account-equity/account-equity-model.ts'
export {
  FundingRate,
  type FundingBar,
  type FundingPoint,
  type FundingRateLabels,
  type FundingRateProps,
} from './funding-rate/funding-rate.tsx'
export { countdownTo, formatCountdown, formatRate, fundingBars, rateTone } from './funding-rate/funding-model.ts'
export { DerivativesBoard, type DerivativesBoardProps } from './derivatives/derivatives-board.tsx'
export {
  DerivativesCard,
  type DerivativesCardCommon,
  type DerivativesCardProps,
} from './derivatives/derivatives-card.tsx'
export type { DerivativesLabels } from './derivatives/derivatives-labels.ts'
export {
  DEFAULT_PERIODS,
  DERIVATIVES_KINDS,
  alignedAxes,
  basisOf,
  hasData,
  longShare,
  longShortRatioOf,
  signedBars,
  symmetricAxis,
  type AxisSpec,
  type BasisPoint,
  type DerivativesData,
  type DerivativesKind,
  type FundingRatePoint,
  type LongShortPoint,
  type OpenInterestVolumePoint,
  type TakerVolumePoint,
} from './derivatives/derivatives-model.ts'
export {
  OptionsChain,
  type OptionExpiry,
  type OptionField,
  type OptionQuote,
  type OptionRow,
  type OptionSide,
  type OptionsChainLabels,
  type OptionsChainProps,
} from './options-chain/options-chain.tsx'
export { atmStrike, isItm, sortedRows, wingFields } from './options-chain/options-model.ts'
export {
  OrderBook,
  type BookLevel,
  type BookRow,
  type BookSide,
  type OrderBookLabels,
  type OrderBookMode,
  type OrderBookProps,
} from './order-book/order-book.tsx'
export { DepthChart, type DepthChartLabels, type DepthChartProps } from './depth-chart/depth-chart.tsx'
export {
  TradeTape,
  type Trade,
  type TradeSide,
  type TradeTapeLabels,
  type TradeTapeProps,
} from './trade-tape/trade-tape.tsx'
// 参照 affectUI 补的数据处理件（KATANAview #1908）：排查树、链路瀑布、回落链、限额排程。
export {
  RootCauseTree,
  type RootCauseAction,
  type RootCauseTreeLabels,
  type RootCauseTreeProps,
} from './root-cause-tree/root-cause-tree.tsx'
export {
  flattenCauses,
  isRootCause,
  litPath,
  moveCause,
  type Cause,
  type CauseEvidence,
  type CauseFailure,
  type CauseGate,
  type CauseRow,
  type CauseStatus,
} from './root-cause-tree/root-cause-model.ts'
export {
  TraceWaterfall,
  type TraceWaterfallLabels,
  type TraceWaterfallProps,
} from './trace-waterfall/trace-waterfall.tsx'
export {
  moveSpan,
  slowestSpan,
  spanEnd,
  traceAxis,
  traceExtent,
  traceStatus,
  visibleSpans,
  type SpanMove,
  type SpanRow,
  type SpanStatus,
  type TraceSpan,
} from './trace-waterfall/trace-model.ts'
export { FallbackChain, type FallbackChainLabels, type FallbackChainProps } from './fallback-chain/fallback-chain.tsx'
export {
  answeredLevel,
  chainOutcome,
  type FallbackAttempt,
  type FallbackOutcome,
  type FallbackStatus,
} from './fallback-chain/fallback-model.ts'
export {
  RateLimitPlanner,
  type RateLimitPlannerLabels,
  type RateLimitPlannerProps,
} from './rate-limit-planner/rate-limit-planner.tsx'
export {
  clampStart,
  keyMove,
  loadCurve,
  peakOf,
  planStatus,
  spreadRuns,
  type PlanStatus,
  type PlannedRun,
} from './rate-limit-planner/rate-limit-model.ts'
// 参照 affectUI 补的第二批（KATANAview #1908）：定时运行、任务队列、花费瀑布。
export {
  ScheduledRuns,
  type ScheduleMove,
  type ScheduledRunsLabels,
  type ScheduledRunsProps,
} from './scheduled-runs/scheduled-runs.tsx'
export {
  buildSchedule,
  canDrop,
  moveSlot,
  type PieceKind,
  type SchedulePiece,
  type SchedulePin,
  type ScheduledTask,
  type Slot as ScheduleSlot,
} from './scheduled-runs/schedule-model.ts'
export { AgentQueue, type AgentQueueLabels, type AgentQueueProps } from './agent-queue/agent-queue.tsx'
export {
  depthSummary,
  queueDepth,
  queueOrder,
  workerSlots,
  type QueueJob,
  type QueueJobStatus,
} from './agent-queue/queue-model.ts'
export { CostWaterfall, type CostWaterfallLabels, type CostWaterfallProps } from './cost-waterfall/cost-waterfall.tsx'
export {
  costRows,
  priciestStep,
  stepTotals,
  type CostMode,
  type CostRow,
  type CostStep,
  type CostStepKind,
  type CostStepStatus,
  type CostTotals,
} from './cost-waterfall/cost-model.ts'
// 参照 affectUI 补的第三批（KATANAview #1908）：流程编排、Agent 树、Agent 总览、多角色小组。
export { FlowBuilder, type FlowBuilderLabels, type FlowBuilderProps } from './flow-builder/flow-builder.tsx'
export {
  flowElapsed,
  flowOrder,
  insertStep,
  moveStep,
  removeStep,
  type FlowPath,
  type FlowRun,
  type FlowSlot,
  type FlowStep,
  type FlowStepKind,
  type FlowStepStatus,
  type FlowTemplate,
} from './flow-builder/flow-model.ts'
export {
  AgentTree,
  type AgentBarLabels,
  type AgentRunLabels,
  type AgentTreeLabels,
  type AgentTreeProps,
} from './agent-tree/agent-tree.tsx'
export {
  agentElapsed,
  agentTotals,
  branchCost,
  visibleAgents,
  type AgentResolution,
  type AgentRow,
  type AgentRunStatus,
  type AgentRunStep,
  type AgentTotals,
  type RunAgent,
} from './agent-tree/agent-tree-model.ts'
export { AgentFleet, type AgentFleetLabels, type AgentFleetProps } from './agent-fleet/agent-fleet.tsx'
export { AgentCrew, type AgentCrewLabels, type AgentCrewProps } from './agent-crew/agent-crew.tsx'
export {
  crewContextLevel,
  steerActions,
  type CrewAgent,
  type CrewHandoff,
  type CrewProject,
  type CrewStatus,
  type CrewSteer,
} from './agent-crew/crew-model.ts'
// KatanaUI #223：规则构建器（WHEN 条件树 + THEN 两段动作，整份是可序列化 JSON）。
export { RuleBuilder, type RuleBuilderLabels, type RuleBuilderProps } from './rule-builder/rule-builder.tsx'
export {
  ruleToText,
  validateRule,
  type Rule,
  type RuleAction,
  type RuleActionDef,
  type RuleActionParam,
  type RuleCondition,
  type RuleField,
  type RuleFieldType,
  type RuleGroup,
  type RuleInput,
  type RuleIssue,
  type RuleIssueCode,
  type RuleIssuePart,
  type RuleMode,
  type RuleNode,
  type RuleOperator,
  type RuleOption,
  type RuleSchema,
  type RuleTextTemplates,
  type RuleValue,
} from './rule-builder/rule-model.ts'
