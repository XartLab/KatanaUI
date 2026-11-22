// SPDX-License-Identifier: MIT
// KatanaUI 的 A2UI 目录：一个 surface 只用一个目录，所以智能体要用的排版件（Row、Column、Card…）也并进来；
// 并的是基础目录里没有外链与媒体的那几个，实现原样用，样子由 a2ui.css 把它的 --a2ui-* 变量接到我们的 token 上。
import { Catalog, type ComponentApi } from '@a2ui/web_core'
import { basicCatalog } from '@a2ui/web_core/catalogs/basic/v1'
import type { ReactCatalogComponent } from '@a2ui/react'
import { KatanaAiStatus } from './components/katana-ai-status.tsx'
import { KatanaAlert } from './components/katana-alert.tsx'
import { KatanaCheckbox } from './components/katana-checkbox.tsx'
import { KatanaToggleGroup } from './components/katana-toggle-group.tsx'
import { KatanaMultiSelect } from './components/katana-multi-select.tsx'
import { KatanaChipGroup } from './components/katana-chip-group.tsx'
import { KatanaNumberInput } from './components/katana-number-input.tsx'
import { KatanaDecimalField } from './components/katana-decimal-field.tsx'
import { KatanaDateRangePicker } from './components/katana-date-range-picker.tsx'
import { KatanaDurationPicker } from './components/katana-duration-picker.tsx'
import { KatanaCombobox } from './components/katana-combobox.tsx'
import { KatanaPasswordInput } from './components/katana-password-input.tsx'
import { KatanaToast } from './components/katana-toast.tsx'
import { KatanaCodeBlock } from './components/katana-code-block.tsx'
import { KatanaJsonViewer } from './components/katana-json-viewer.tsx'
import { KatanaSymbolMark } from './components/katana-symbol-mark.tsx'
import { KatanaCommand } from './components/katana-command.tsx'
import { KatanaButton } from './components/katana-button.tsx'
import { KatanaChangeText } from './components/katana-change-text.tsx'
import { KatanaDateTimeInput } from './components/katana-date-time-input.tsx'
import { KatanaDecisionQueue } from './components/katana-decision-queue.tsx'
import { KatanaHypothesisLedger } from './components/katana-hypothesis-ledger.tsx'
import { KatanaMetricCard } from './components/katana-metric-card.tsx'
import { KatanaPnlText } from './components/katana-pnl-text.tsx'
import { KatanaSelect } from './components/katana-select.tsx'
import { KatanaSlider } from './components/katana-slider.tsx'
import { KatanaSparkline } from './components/katana-sparkline.tsx'
import { KatanaSwitch } from './components/katana-switch.tsx'
import { KatanaTextField } from './components/katana-text-field.tsx'
import { KatanaWebSearch } from './components/katana-web-search.tsx'
import { KatanaDataGrid } from './components/katana-data-grid.tsx'
import { KatanaNewsFeed } from './components/katana-news-feed.tsx'
import { KatanaNewsReader } from './components/katana-news-reader.tsx'
import { KatanaEventTimeline } from './components/katana-event-timeline.tsx'
import { KatanaStatusBar } from './components/katana-status-bar.tsx'
import { KatanaSystemMonitor } from './components/katana-system-monitor.tsx'
import { KatanaEmptyState } from './components/katana-empty-state.tsx'
import { KatanaTaskList } from './components/katana-task-list.tsx'
import { KatanaStepPlayer } from './components/katana-step-player.tsx'
import { KatanaConsensusBlock } from './components/katana-consensus-block.tsx'
import { KatanaLimitLadder } from './components/katana-limit-ladder.tsx'
import { KatanaTechnicalRating } from './components/katana-technical-rating.tsx'
import { KatanaWatchlist } from './components/katana-watchlist.tsx'
import { KatanaQuoteTable } from './components/katana-quote-table.tsx'
import { KatanaAccordion } from './components/katana-accordion.tsx'
import { KatanaPanelFrame } from './components/katana-panel-frame.tsx'
import { KatanaSplitter } from './components/katana-splitter.tsx'
import { KatanaEquityCurve } from './components/katana-equity-curve.tsx'
import { KatanaSeriesExplorer } from './components/katana-series-explorer.tsx'
import { KatanaSmallMultiples } from './components/katana-small-multiples.tsx'
import { KatanaAttributionBars } from './components/katana-attribution-bars.tsx'
import { KatanaCalendarHeatmap } from './components/katana-calendar-heatmap.tsx'
import { KatanaHorizonChart } from './components/katana-horizon-chart.tsx'
import { KatanaBrushChart } from './components/katana-brush-chart.tsx'
import { KatanaTreemap } from './components/katana-treemap.tsx'
import { KatanaMarketHeatmap } from './components/katana-market-heatmap.tsx'
import { KatanaFlowSankey } from './components/katana-flow-sankey.tsx'
import { KatanaParamScatter } from './components/katana-param-scatter.tsx'
import { KatanaSlopeChart } from './components/katana-slope-chart.tsx'
import { KatanaRidgeline } from './components/katana-ridgeline.tsx'
import { KatanaQuantileLayers } from './components/katana-quantile-layers.tsx'
import { KatanaConnectedScatter } from './components/katana-connected-scatter.tsx'
import { KatanaVintageSeries } from './components/katana-vintage-series.tsx'
import { KatanaUptimeBars } from './components/katana-uptime-bars.tsx'
import { KatanaTransmissionChain } from './components/katana-transmission-chain.tsx'
import { KatanaBadgeGroup } from './components/katana-badge-group.tsx'
import { KatanaLed } from './components/katana-led.tsx'
import { KatanaLcd } from './components/katana-lcd.tsx'
import { KatanaRollingText } from './components/katana-rolling-text.tsx'
import { KatanaStatusIcon } from './components/katana-status-icon.tsx'
import { KatanaProgress } from './components/katana-progress.tsx'
import { KatanaMeter } from './components/katana-meter.tsx'
import { KatanaRatingText } from './components/katana-rating-text.tsx'
import { KatanaEstimateBadge } from './components/katana-estimate-badge.tsx'
import { KatanaPriceTag } from './components/katana-price-tag.tsx'
import { KatanaQuoteCard } from './components/katana-quote-card.tsx'
import { KatanaGaugeBar } from './components/katana-gauge-bar.tsx'
import { KatanaRatingGauge } from './components/katana-rating-gauge.tsx'
import { KatanaRangeBar } from './components/katana-range-bar.tsx'
import { KatanaSparkTile } from './components/katana-spark-tile.tsx'
import { KatanaKeyStats } from './components/katana-key-stats.tsx'
import { KatanaPerformanceStrip } from './components/katana-performance-strip.tsx'
import { KatanaPeerCards } from './components/katana-peer-cards.tsx'
import { KatanaFlowGauges } from './components/katana-flow-gauges.tsx'
import { KatanaRegimeStrip } from './components/katana-regime-strip.tsx'

/** 目录的 id：智能体在 createSurface 里写它，文档站把目录 JSON 发布在这个地址。 */
export const KATANA_CATALOG_ID = 'https://xartlab.github.io/KatanaUI/a2ui/katana/v1.json'

/**
 * 从基础目录并进来的排版与文字件。不并的：Image、Video、AudioPlayer（会加载外部地址）、Icon（要图标字体）、
 * Modal（弹层要有宿主的焦点管理），它们的位置由 Katana 件或以后的 Katana 版接手。
 */
export const BASIC_LAYOUT_NAMES = ['Row', 'Column', 'List', 'Card', 'Tabs', 'Divider', 'Text'] as const

/** 基础目录的函数里不要的：openUrl 会让智能体绕过宿主打开任意链接（安全规则：链接只能走 Action 由宿主决定）。 */
export const EXCLUDED_FUNCTIONS: readonly string[] = ['openUrl']

const basicLayout = BASIC_LAYOUT_NAMES.map((name) => {
  const component = basicCatalog.components.get(name)
  if (!component) throw new Error(`基础目录里没有 ${name}`)
  return component as ReactCatalogComponent
})

/** 我们登记的组件，按文档里的顺序。 */
export const KATANA_COMPONENTS: readonly ReactCatalogComponent[] = [
  KatanaButton,
  KatanaTextField,
  KatanaSelect,
  KatanaSwitch,
  KatanaSlider,
  KatanaDateTimeInput,
  KatanaPnlText,
  KatanaMetricCard,
  KatanaChangeText,
  KatanaSparkline,
  KatanaDecisionQueue,
  KatanaHypothesisLedger,
  KatanaAiStatus,
  KatanaWebSearch,
  KatanaDataGrid,
  KatanaNewsFeed,
  KatanaNewsReader,
  KatanaEventTimeline,
  KatanaStatusBar,
  KatanaSystemMonitor,
  KatanaEmptyState,
  KatanaTaskList,
  KatanaStepPlayer,
  KatanaConsensusBlock,
  KatanaLimitLadder,
  KatanaTechnicalRating,
  KatanaWatchlist,
  KatanaQuoteTable,
  KatanaAccordion,
  KatanaPanelFrame,
  KatanaSplitter,
  KatanaAlert,
  KatanaEquityCurve,
  KatanaSeriesExplorer,
  KatanaSmallMultiples,
  KatanaAttributionBars,
  KatanaCalendarHeatmap,
  KatanaHorizonChart,
  KatanaBrushChart,
  KatanaTreemap,
  KatanaMarketHeatmap,
  KatanaFlowSankey,
  KatanaParamScatter,
  KatanaSlopeChart,
  KatanaRidgeline,
  KatanaQuantileLayers,
  KatanaConnectedScatter,
  KatanaVintageSeries,
  KatanaUptimeBars,
  KatanaTransmissionChain,
  KatanaCheckbox,
  KatanaToggleGroup,
  KatanaMultiSelect,
  KatanaChipGroup,
  KatanaNumberInput,
  KatanaDecimalField,
  KatanaDateRangePicker,
  KatanaDurationPicker,
  KatanaCombobox,
  KatanaPasswordInput,
  KatanaToast,
  KatanaCodeBlock,
  KatanaJsonViewer,
  KatanaSymbolMark,
  KatanaCommand,
  KatanaBadgeGroup,
  KatanaLed,
  KatanaLcd,
  KatanaRollingText,
  KatanaStatusIcon,
  KatanaProgress,
  KatanaMeter,
  KatanaRatingText,
  KatanaEstimateBadge,
  KatanaPriceTag,
  KatanaQuoteCard,
  KatanaGaugeBar,
  KatanaRatingGauge,
  KatanaRangeBar,
  KatanaSparkTile,
  KatanaKeyStats,
  KatanaPerformanceStrip,
  KatanaPeerCards,
  KatanaFlowGauges,
  KatanaRegimeStrip,
]

const functions = [...basicCatalog.functions.values()].filter((fn) => !EXCLUDED_FUNCTIONS.includes(fn.name))

/** 给智能体的用法说明，写进目录文档的 instructions。 */
export const KATANA_INSTRUCTIONS = [
  'KatanaUI catalog for trading and quant workbenches. Lay out with Row, Column, List, Card and Tabs; show data with the Katana components.',
  '',
  '1. Every visible text is yours to write, in the language of the user. Components carry no wording of their own: every label, state word and screen-reader name is a required property.',
  '2. Components that show numbers (KatanaPnlText, KatanaChangeText, KatanaMetricCard) never calculate or format: send the final text and the raw number.',
  '3. Bind values that change to the data model with {"@path": "/x"}; form components write the user input back to the same path.',
  '4. Buttons and decision cards only dispatch Actions. Never encode an order, a transfer or any trade as anything but an Action: the host receives it and asks the user to confirm.',
  '5. Links are never opened by a component. Source links are https only and are handed to the host through `onOpenSource`.',
  '6. A component that has `weight` may only set it when it is a direct child of a Row or Column.',
].join('\n')

export const katanaCatalog = new Catalog<ReactCatalogComponent>(
  KATANA_CATALOG_ID,
  '1.0',
  [...basicLayout, ...KATANA_COMPONENTS],
  functions,
  {
    title: 'KatanaUI A2UI catalog',
    description:
      'KatanaUI components for trading and quant workbenches, plus the layout components of the basic catalog.',
    instructions: KATANA_INSTRUCTIONS,
    declaredProtocolVersion: '1.0',
    schemaUri: 'https://json-schema.org/draft/2020-12/schema',
    schemaId: KATANA_CATALOG_ID,
    commonTypesUri: 'common_types.json',
  },
)

/** 我们登记的组件的 API（名字加 schema），文档站与测试读它。 */
export const KATANA_APIS: readonly ComponentApi[] = KATANA_COMPONENTS
