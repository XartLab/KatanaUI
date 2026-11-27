// SPDX-License-Identifier: MIT
// @katana-ui/react/cn 的出口：A 股件包（#110）。只放中国市场才有的概念（连板、涨停状态、板块、万亿写法、交易时段），通用件（DataGrid、GaugeBar、DistributionBars…）照常用。
// 包里不带文案语言：文字由调用方传，`cnLabelsZh` 是随包的简体中文默认，可以整份换。不带数据源与交易日历数据。
export { formatCnAmount, type CnAmountSize, type CnAmountUnits } from './format.ts'
export {
  CN_AXIS_MINUTES,
  CN_LATE_FROM,
  CN_SESSIONS,
  cnAxisPosition,
  cnPhaseOf,
  cnTradingMinutesBetween,
  formatClock,
  parseClock,
  type CnPhase,
  type CnSessionKey,
} from './session.ts'
export { cnLabelsZh } from './labels.ts'
export type {
  BoardKind,
  BoardMarkLabels,
  CnLabels,
  LimitStatusKey,
  LimitStatusLabels,
  PulseLabels,
  SentimentLabels,
  SeatTableLabels,
  AuctionStepLabels,
  TradingDatePickerLabels,
  FlowRaceLabels,
  MiniKCardLabels,
  MoveFeedLabels,
  RangeScrubberLabels,
  AuctionBarLabels,
  ThresholdGapLabels,
  SessionLabels,
  StreakLabels,
  ThemeCardLabels,
  TimelineLabels,
} from './labels.ts'
export { readCnValue, type CnValue } from './value.ts'
export {
  BOARD_LIMIT_PERCENT,
  LIMIT_STATUS_ORDER,
  boardKindOf,
  limitStatusText,
  limitStatusTone,
  normalizeLimitStatus,
  normalizeStreak,
  streakLevel,
  streakSortKey,
  streakText,
  type LimitStatusValue,
  type StreakValue,
} from './badge-model.ts'
export { StreakBadge, type StreakBadgeProps } from './streak-badge.tsx'
export { LimitStatus, type LimitStatusProps } from './limit-status.tsx'
export { BoardMark, type BoardMarkProps } from './board-mark.tsx'
export {
  ThemeCard,
  ThemeCards,
  themeCardFigures,
  type ThemeCardData,
  type ThemeCardProps,
  type ThemeCardsProps,
  type ThemeCatalyst,
  type ThemeMember,
} from './theme-card.tsx'
export {
  MarketPulse,
  dialArc,
  pulseShare,
  type MarketPulseCounts,
  type MarketPulseProps,
  type MarketPulseReadings,
} from './market-pulse.tsx'
export { LimitUpTimeline, type LimitUpTimelineProps } from './limit-up-timeline.tsx'
export {
  filterByTheme,
  groupStations,
  phaseSummary,
  snakeRows,
  themeCounts,
  type SnakeRow,
  type TimelineItem,
  type TimelineOrder,
  type TimelineStation,
} from './timeline-model.ts'
export { SentimentGauge, sentimentLevel, type SentimentGaugeProps, type SentimentStats } from './sentiment-gauge.tsx'
export {
  AUCTION_CANCEL_CUTOFF,
  AUCTION_FROM,
  AUCTION_TO,
  auctionSteps,
  auctionSummary,
  auctionX,
  priceDomain,
  stepPath,
  volumeBars,
  type AuctionPoint,
  type AuctionStepPoint,
  type AuctionSummary,
  type VolumeBar,
} from './auction-model.ts'
export { AuctionStep, AuctionStepSpark, type AuctionStepProps, type AuctionStepSparkProps } from './auction-step.tsx'
export { amountTone, rankSeats, seatNet, seatTotal, type Seat, type SeatSide } from './seat-model.ts'
export { SeatTable, type SeatTableProps } from './seat-table.tsx'
export {
  latestTradingDayOnOrBefore,
  shiftTradingDay,
  tradingDayTest,
  type TradingCalendar,
  type TradingRange,
} from './trading-date-model.ts'
export { TradingDatePicker, type TradingDatePickerProps } from './trading-date-picker.tsx'
export {
  FLOW_MINUTES,
  FLOW_START,
  flowDomain,
  flowLines,
  flowPath,
  flowX,
  flowY,
  rankLines,
  spreadFlowLabels,
  type FlowLine,
  type FlowPoint,
  type FlowSeries,
} from './flow-race-model.ts'
export { FlowRace, type FlowRaceProps } from './flow-race.tsx'
export {
  candleDomain,
  candleShapes,
  candleTone,
  changeText,
  gridColumns,
  lastChange,
  validCandles,
  type Candle,
  type CandleShape,
} from './mini-k-model.ts'
export { MiniKCardGrid, type MiniKCardGridProps, type MiniKItem } from './mini-k-card-grid.tsx'
export {
  MOVE_TYPE_TONES,
  clockText,
  filterBySymbol,
  filterMoves,
  freshIds,
  moveTone,
  moveValue,
  sortFeed,
  toggleType,
  typeCounts,
  type MoveItem,
  type MoveTone,
  type MoveTypeDef,
} from './move-feed-model.ts'
export { MoveFeed, type MoveFeedProps } from './move-feed.tsx'
export {
  SCRUB_LUNCH,
  SCRUB_TICKS,
  presetRange,
  scrubBars,
  scrubClock,
  scrubIndex,
  scrubNow,
  scrubRange,
  scrubRangeOf,
  shiftRange,
  type ScrubBar,
  type ScrubPoint,
} from './range-scrubber-model.ts'
export { RangeScrubber, type RangeScrubberProps } from './range-scrubber.tsx'
export { auctionBarShares, auctionPending, auctionRatio, type AuctionBarShares } from './auction-bar-model.ts'
export { AuctionBarCell, type AuctionBarCellProps } from './auction-bar-cell.tsx'
export { thresholdGap, thresholdState, type ThresholdGapState } from './threshold-gap-model.ts'
export { ThresholdGap, type ThresholdGapProps } from './threshold-gap.tsx'
