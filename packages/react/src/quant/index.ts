// SPDX-License-Identifier: MIT
// @katana-ui/react/quant 的出口：量化领域的展示件与格式化函数（#1862）。只依赖包里下层（lib、primitives、patterns），不依赖行情、图表包与应用；
// 品种、价格精度、小数位、单位由调用方传最小的普通类型。纯函数另有 `@katana-ui/react/quant/format` 出口（不带 React，画布与 Worker 里用）。
export { ChangeText } from './change-text.tsx'
export { DecimalField, type DecimalFieldProps } from './decimal-field.tsx'
export { PnlText } from './pnl-text.tsx'
export { EventCalendar, type EventCalendarLabels, type EventCalendarProps } from './event-calendar.tsx'
export type { EconomicEvent, EconomicImportance, EconomicRangeKey, EconomicTone } from './event-calendar-model.ts'
export {
  LimitLadder,
  type LadderItem,
  type LadderLevel,
  type LadderStatus,
  type LimitLadderLabels,
  type LimitLadderProps,
} from './limit-ladder.tsx'
export {
  MarketHeatmap,
  type HeatmapColorBy,
  type HeatmapItem,
  type HeatmapScheme,
  type HeatmapSizeBy,
  type MarketHeatmapLabels,
  type MarketHeatmapProps,
} from './market-heatmap.tsx'
export {
  TechnicalRating,
  type RatingGroup,
  type RatingRow,
  type RatingVerdict,
  type TechnicalRatingLabels,
  type TechnicalRatingProps,
  type TechnicalRatingTimeframe,
} from './technical-rating.tsx'
export * from './format/index.ts'

// 时间序列与盈亏的件（#1917）。功能参照 Arc（uiarc.dev，2026-11-14 读），只取功能，实现原创。
export { BrushChart, BrushStrip, type BrushChartProps, type BrushLabels, type BrushStripProps } from './brush-chart.tsx'
export type { BrushWindow } from './brush-model.ts'
export { EquityCurve, type EquityCurveLabels, type EquityCurvePoint, type EquityCurveProps } from './equity-curve.tsx'
export {
  CalendarHeatmap,
  type CalendarDay,
  type CalendarEvent,
  type CalendarHeatmapProps,
} from './calendar-heatmap.tsx'
export { HorizonChart, type HorizonChartProps, type HorizonRow } from './horizon-chart.tsx'

// 分布与关系类的图（#1918）：功能参照 Arc（uiarc.dev，2026-11-14 读），实现原创。
export { Ridgeline, type RidgelineProps } from './ridgeline.tsx'
export {
  gaussianKde,
  ridgelines,
  ridgeStats,
  silvermanBandwidth,
  type RidgeGroup,
  type RidgeStats,
} from './ridgeline-model.ts'
export { SlopeChart, type SlopeChartProps } from './slope-chart.tsx'
export { ranks, slopeLayout, spreadLabels, type SlopeItem, type SlopeMode, type SlopeRow } from './slope-model.ts'
export { ConnectedScatter, type ConnectedScatterProps } from './connected-scatter.tsx'
export { scatterLayout, type ScatterPoint, type ScatterSeries } from './scatter-model.ts'
export {
  QuantileLayers,
  type QuantileLayersLabels,
  type QuantileLayersProps,
  type QuantileStat,
} from './quantile-layers.tsx'
export { isMonotonic, lastFinite, layerLevel, quantileRange, sortLayers, type QuantileLayer } from './quantile-model.ts'
// 第二批（#1929）：KPI 瓦片、仪表、订单流仪表行、状态带、必要条件块。
export { SparkTile, type SparkTileProps, type SparkTileState } from './spark-tile.tsx'
export { Meter, type MeterDisplay, type MeterProps, type MeterTone } from './meter.tsx'
export {
  FlowGauges,
  type FlowCellState,
  type FlowDivergenceGauge,
  type FlowDomGauge,
  type FlowGaugeData,
  type FlowGaugesProps,
  type FlowSignedGauge,
} from './flow-gauges.tsx'
export {
  RegimeBand,
  RegimeStrip,
  type RegimeBandProps,
  type RegimeColor,
  type RegimeSegment,
  type RegimeState,
  type RegimeStripProps,
} from './regime-strip.tsx'
export {
  ConsensusBlock,
  countConsensus,
  type ConsensusBlockProps,
  type ConsensusParty,
  type ConsensusState,
  type ConsensusVerdict,
} from './consensus-block.tsx'
