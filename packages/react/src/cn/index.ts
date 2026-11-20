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
