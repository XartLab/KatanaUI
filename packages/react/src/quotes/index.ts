// SPDX-License-Identifier: MIT
// @katana-ui/react/quotes 的出口：行情套件（迷你图、报价卡与行情表、自选列表、读数卡、评级与涨跌文字）。
// 2026-11-18 G4 从 katana、quant、patterns 收拢到这里；根出口与 @katana-ui/react/quant 照旧再导出同样的名字（同一份声明）。
export {
  RowActionMenuItems,
  RowActions,
  RowContextMenu,
  symbolMenu,
  type RowAction,
  type RowActionsProps,
  type RowContextMenuProps,
  type SymbolMenuInput,
} from './row-actions.tsx'
export {
  QuoteTable,
  type LegacyQuoteRow,
  type QuoteGroup,
  type QuoteTableLabels,
  type QuoteTableProps,
  type QuoteTableRow,
} from './quote-table.tsx'
export { plainPrice, rowTone, type FormatPrice, type QuoteRow } from './quote-row.ts'
export { CodeChip, CodeName, CompactValue, UnitValue } from './cell-type.tsx'
export { SymbolMark, symbolMarkLetters, type SymbolMarkProps } from './symbol-mark.tsx'
export {
  Sparkline,
  sparkPoints,
  sparkTone,
  type SparkAxis,
  type SparklineProps,
  type SparklineVariant,
} from './sparkline.tsx'
export { MiniChart, type MiniChartProps } from './mini-chart.tsx'
export { GaugeBar, type GaugeBarClasses, type GaugeBarProps } from './gauge-bar.tsx'
export { Treemap, type TreemapClasses, type TreemapProps } from './treemap.tsx'
export {
  colorStep,
  layoutTreemap,
  TREEMAP_H,
  TREEMAP_W,
  type TreemapBlock,
  type TreemapCell,
  type TreemapItem,
  type TreemapLayoutOptions,
} from './treemap-model.ts'
export { PriceTag, type PriceTagProps } from './price-tag.tsx'
export {
  QuoteCard,
  QuoteStrip,
  type QuoteCardLabels,
  type QuoteCardProps,
  type QuoteStripProps,
} from './quote-card.tsx'
export {
  CompareBar,
  RangeBar,
  rangeShare,
  type CompareBarProps,
  type CompareBarSide,
  type RangeBarProps,
} from './range-bar.tsx'
export { RatingGauge, type RatingGaugeProps } from './rating-gauge.tsx'
export { ratingAngle, ratingZone } from './rating-gauge-model.ts'
export { quoteTone, type QuoteTone } from './quote-tone.ts'
export { ChangeText } from './change-text.tsx'
export { PnlText } from './pnl-text.tsx'
export { RatingText, type RatingLevel, type RatingTextProps } from './rating-text.tsx'
export {
  TechnicalRating,
  type PivotRow,
  type PivotTable,
  type RatingGroup,
  type RatingRow,
  type RatingVerdict,
  type TechnicalRatingLabels,
  type TechnicalRatingProps,
  type TechnicalRatingTimeframe,
} from './technical-rating.tsx'
export { SparkTile, type SparkTileProps, type SparkTileState } from './spark-tile.tsx'
export {
  MetricCard,
  MetricCardGrid,
  metricStageIndex,
  metricTrendTone,
  type MetricCardGridProps,
  type MetricCardProps,
  type MetricChange,
  type MetricRange,
  type MetricStage,
  type MetricTrendTone,
} from './metric-card.tsx'
export {
  PerformanceStrip,
  formatPerformance,
  type PerformanceItem,
  type PerformanceStripProps,
} from './performance-strip.tsx'
export {
  PeerCards,
  type LegacyPeerItem,
  type PeerCardsLabels,
  type PeerCardsProps,
  type PeerItem,
} from './peer-cards.tsx'
export { KeyStats, type KeyStatItem, type KeyStatsProps } from './key-stats.tsx'
export {
  Watchlist,
  type LegacyWatchlistRow,
  type WatchlistLabels,
  type WatchlistProps,
  type WatchlistRow,
} from './watchlist.tsx'
export { changedTail, nextSort, sortRows, type WatchlistSort, type WatchlistSortKey } from './watchlist-model.ts'
// 跑马灯（#77 第 5 条）。
export { TickerTape, type TickerItem, type TickerTapeLabels, type TickerTapeProps } from './ticker-tape.tsx'
// 对照 TradingView 小组件补缺的第二批（KatanaUI #147，KATANAview #1884）：品种报价头、多品种走势卡、交叉汇率矩阵、公司简介。
export { SymbolInfo, type SymbolInfoProps, type SymbolInfoRange, type SymbolInfoStatus } from './symbol-info.tsx'
export {
  SymbolOverview,
  type SymbolOverviewItem,
  type SymbolOverviewLabels,
  type SymbolOverviewProps,
  type SymbolOverviewRange,
} from './symbol-overview.tsx'
export { CrossRates, type CrossRatesLabels, type CrossRatesProps } from './cross-rates.tsx'
export type { CrossRateQuote } from './cross-rates-model.ts'
export {
  CompanyProfile,
  type CompanyProfileFact,
  type CompanyProfileLabels,
  type CompanyProfileProps,
} from './company-profile.tsx'
