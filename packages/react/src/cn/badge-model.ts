// SPDX-License-Identifier: MIT
// 第 1 层的纯函数（#110）：连板、涨停状态、板块的判断与写法。StreakBadge、LimitStatus、BoardMark 与 DataGrid 的 streak / limitStatus 列共用。
import { formatCnAmount } from './format.ts'
import type { BoardKind, BoardMarkLabels, LimitStatusKey, LimitStatusLabels, StreakLabels } from './labels.ts'
import { DASH } from './value.ts'

/** 连板：几板（null 是取不到），可带几天几板的天数、昨天的板数（晋级口径）、取不到的原因。 */
export type StreakValue = {
  /** Boards in a row; null means unavailable. */
  boards: number | null
  /** Days since the run started (writes N days M boards when larger than boards). */
  days?: number
  /** Boards yesterday, for the promotion form. */
  promotedFrom?: number
  /** Why the number is unavailable (shown on hover). */
  reason?: string
}

/** 数字当作板数；对象照用；空是取不到。 */
export function normalizeStreak(input: number | StreakValue | null | undefined): StreakValue {
  if (input === null || input === undefined) return { boards: null }
  if (typeof input === 'number') return { boards: Number.isFinite(input) && input >= 1 ? Math.floor(input) : null }
  const boards =
    typeof input.boards === 'number' && Number.isFinite(input.boards) && input.boards >= 1
      ? Math.floor(input.boards)
      : null
  return { ...input, boards }
}

/** 醒目程度：0 取不到，1 首板，2 二板，3 三板，4 四板及以上。件按它升色调（只用 tone，不传色值）。 */
export function streakLevel(boards: number | null): 0 | 1 | 2 | 3 | 4 {
  if (boards === null) return 0
  return boards >= 4 ? 4 : (Math.max(1, boards) as 1 | 2 | 3)
}

/** 写法：首板；2板；天数多于板数写「5天3板」；form 为 promotion 且有昨天的板数写「一进二」。取不到写「—」。 */
export function streakText(
  input: number | StreakValue | null | undefined,
  labels: StreakLabels,
  form: 'boards' | 'promotion' = 'boards',
): string {
  const { boards, days, promotedFrom } = normalizeStreak(input)
  if (boards === null) return DASH
  if (form === 'promotion' && promotedFrom !== undefined && Number.isFinite(promotedFrom) && promotedFrom >= 1) {
    return labels.promotion(promotedFrom, boards)
  }
  if (boards === 1) return labels.first
  return days !== undefined && days > boards ? labels.daysBoards(days, boards) : labels.boards(boards)
}

/** 排序值：板数为主，天数（没写就当等于板数）为次；取不到是 undefined（排在最后）。 */
export function streakSortKey(input: number | StreakValue | null | undefined): number | undefined {
  const { boards, days } = normalizeStreak(input)
  return boards === null ? undefined : boards * 1000 + Math.min(999, days ?? boards)
}

/** 涨停状态：只写状态，或带封单额（元）与取不到的原因。status 为 null 是取不到。 */
export type LimitStatusValue =
  | LimitStatusKey
  | { status: LimitStatusKey | null; sealAmount?: number | null; reason?: string }

/** 状态的次序（排序用）：竞价涨停、一字、封板、回封、炸板、跌停。 */
export const LIMIT_STATUS_ORDER: readonly LimitStatusKey[] = [
  'auctionLimit',
  'oneWord',
  'sealed',
  'resealed',
  'broken',
  'limitDown',
]

/** 色调：涨停一族用涨色，炸板用警示色，跌停用跌色。 */
export const limitStatusTone = (status: LimitStatusKey): 'up' | 'warn' | 'down' =>
  status === 'broken' ? 'warn' : status === 'limitDown' ? 'down' : 'up'

export function normalizeLimitStatus(input: LimitStatusValue | null | undefined): {
  status: LimitStatusKey | null
  sealAmount: number | null
  reason: string | undefined
} {
  if (input === null || input === undefined) return { status: null, sealAmount: null, reason: undefined }
  const object = typeof input === 'string' ? { status: input } : input
  const status = object.status !== null && LIMIT_STATUS_ORDER.includes(object.status) ? object.status : null
  const amount = 'sealAmount' in object ? object.sealAmount : undefined
  const reason = 'reason' in object ? object.reason : undefined
  // 炸板、跌停时封单额没有意义（已经不封着了或封的是跌停板），只有涨停一族带封单额。
  const sealAmount =
    status !== null && status !== 'broken' && typeof amount === 'number' && Number.isFinite(amount) ? amount : null
  return { status, sealAmount, reason }
}

/** 屏幕上的字：「封板」或「封板 3.20亿」；取不到写「—」。 */
export function limitStatusText(input: LimitStatusValue | null | undefined, labels: LimitStatusLabels): string {
  const { status, sealAmount } = normalizeLimitStatus(input)
  if (status === null) return DASH
  return sealAmount === null ? labels.status[status] : `${labels.status[status]} ${formatCnAmount(sealAmount)}`
}

/** 各板块的涨跌幅限制（%）：主板 10，ST 5，创业板与科创板 20，北交所 30。 */
export const BOARD_LIMIT_PERCENT: Readonly<Record<BoardKind, number>> = { main: 10, st: 5, gem: 20, star: 20, bj: 30 }

/** 从代码（与名称）判断板块：ST（名称以 ST 或 *ST 开头）优先；300 / 301 / 302 创业板，688 / 689 科创板，4 / 8 开头与 920 北交所，其余当主板。认不出（不是六位数字）返回 null。 */
export function boardKindOf(code: string | null | undefined, name?: string | null): BoardKind | null {
  if (typeof code !== 'string') return null
  const digits = /(\d{6})/.exec(code)?.[1]
  if (digits === undefined) return null
  if (typeof name === 'string' && /^\s*\*?ST/i.test(name)) return 'st'
  if (/^30[012]/.test(digits)) return 'gem'
  if (/^68[89]/.test(digits)) return 'star'
  if (/^(920|[48])/.test(digits)) return 'bj'
  return 'main'
}

/** 板块的值：板块名（BoardKind）照用，六位代码或 { code, name } 用 boardKindOf 判断；认不出、空是 null。DataGrid 的 board 列用。 */
export type BoardInput = string | { code: string; name?: string | null } | null | undefined

export function toBoardKind(input: BoardInput): BoardKind | null {
  if (input === null || input === undefined) return null
  if (typeof input === 'string') return input in BOARD_LIMIT_PERCENT ? (input as BoardKind) : boardKindOf(input)
  return boardKindOf(input.code, input.name)
}

/**
 * BoardMark 上的字：cm 写涨跌幅限制（主板是空字），name 写板块名，both 都写；ST 总写「ST」。取不到写「—」。
 * BoardMark 与 DataGrid 的 board 列共用，复制、导出的字跟屏幕上一致。
 */
export function boardText(
  kind: BoardKind | null | undefined,
  labels: BoardMarkLabels,
  display: 'cm' | 'name' | 'both' = 'cm',
): string {
  if (kind === null || kind === undefined || !(kind in BOARD_LIMIT_PERCENT)) return DASH
  if (kind === 'st') return labels.kind.st
  const limit = labels.limit(BOARD_LIMIT_PERCENT[kind])
  if (display === 'name') return labels.kind[kind]
  if (display === 'both') return `${labels.kind[kind]} ${limit}`
  return BOARD_LIMIT_PERCENT[kind] > 10 ? limit : ''
}

const BOARD_ORDER: readonly BoardKind[] = ['main', 'st', 'gem', 'star', 'bj']

/** 排序值：按涨跌幅限制（ST 5、主板 10、创业板与科创板 20、北交所 30），同档按 BOARD_ORDER；取不到是 undefined（排在最后）。 */
export function boardSortKey(kind: BoardKind | null): number | undefined {
  return kind === null ? undefined : BOARD_LIMIT_PERCENT[kind] * 10 + BOARD_ORDER.indexOf(kind)
}
