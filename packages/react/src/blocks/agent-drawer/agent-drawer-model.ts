// SPDX-License-Identifier: MIT
// AgentDrawer 的纯逻辑：状态与运行结果的语气、活动热力格的档位与排布、格间键盘移动。件不取时间，日期都是调用方给的 YYYY-MM-DD。
// 信息结构与交互借自 Jamie Merrill 公开的 Agent 抽屉与 Agent tracker 表格截图（2026-11-24 读，只取「档案抽屉」的部件与交互，样子与实现原创，不用它的蓝色热力格）。
import type { Severity } from '../../lib/severity.ts'
import { addDays, calendarGrid } from '../../quant/calendar-model.ts'

/** Whether an agent is running, paused or disabled. */
export type AgentStatus = 'running' | 'paused' | 'disabled'

/** How an agent starts: on a schedule, on an event, on an upload, or by hand. */
export type AgentTrigger = 'schedule' | 'event' | 'upload' | 'manual'

/** How one run ended (or that it is still going). */
export type AgentRunResult = 'ok' | 'failed' | 'running' | 'cancelled'

/**
 * 语气：Severity 四档加「进行中」。进行中用中性亮色（--k-content-primary-foreground），不用 accent：
 * Graphite 下 accent 是橙，跟失败红在色弱下几乎分不出（#211）；「在动」靠转圈图标与状态词表达。
 */
export type AgentTone = Severity | 'progress'

/** 状态 → 语气：在跑是进行中，暂停是 warn（有人停了它，要留意），停用是 neutral（不再期待它动）。 */
export const agentStatusTone = (status: AgentStatus): AgentTone =>
  status === 'running' ? 'progress' : status === 'paused' ? 'warn' : 'neutral'

/** 运行结果 → 语气：成功 ok、失败 danger、在跑进行中、取消 neutral。 */
export const runResultTone = (result: AgentRunResult): AgentTone =>
  result === 'ok' ? 'ok' : result === 'failed' ? 'danger' : result === 'running' ? 'progress' : 'neutral'

/** One day of activity: the date (YYYY-MM-DD) and how many times the agent ran. */
export type AgentActivityDay = { date: string; count: number }

/** 热力格最高一档的编号；0 档（没跑）另算，不在 5 档里。 */
export const ACTIVITY_LEVELS = 5

/**
 * 档位：0 是没跑，跑过的按次数占 max 的比例分 1 到 5 档（向上取整：只要跑过至少是 1 档，等于 max 是 5 档）。
 * max 不给时取这批数据里的最大值；给固定的 max（如每日计划上限）可以让几个 Agent 的格子互相比得了。负数、非有限数当 0。
 */
export function activityLevel(count: number, max: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0
  if (!Number.isFinite(max) || max <= 0) return 1
  return Math.min(ACTIVITY_LEVELS, Math.max(1, Math.ceil((count / max) * ACTIVITY_LEVELS)))
}

/** 这批数据里单日最大的次数（没有数据是 0）。 */
export const activityMax = (days: readonly AgentActivityDay[]): number =>
  days.reduce((max, day) => (Number.isFinite(day.count) && day.count > max ? day.count : max), 0)

/** 总次数（负数与非有限数不计）。 */
export const activityTotal = (days: readonly AgentActivityDay[]): number =>
  days.reduce((sum, day) => (Number.isFinite(day.count) && day.count > 0 ? sum + day.count : sum), 0)

export type ActivityCell = {
  date: string
  count: number
  level: number
  /** 在第几周（列）、星期几（行），都从 0 起。 */
  col: number
  row: number
}

export type ActivityGridModel = {
  /** 几周（列）。 */
  cols: number
  /** 先按行（星期）再按列（周）排好，跟 role=grid 的读序一致。 */
  rows: readonly (readonly ActivityCell[])[]
  /** 按日期从旧到新。 */
  cells: readonly ActivityCell[]
  max: number
}

/**
 * 把每日次数排成「一列一周、一行一个星期」的格子。区间取 from 到 to（含），不给就取 days 里最早与最晚的一天；
 * days 里没有的日子算没跑（0 次），区间外的数据不画。重复的日期次数相加。
 */
export function activityGrid(
  days: readonly AgentActivityDay[],
  options: {
    /** First day (YYYY-MM-DD); defaults to the earliest day in days. */
    from?: string
    /** Last day (YYYY-MM-DD); defaults to the latest day in days. */
    to?: string
    /** Which weekday a column starts on (0 Sunday, 1 Monday). Defaults to 1. */
    weekStart?: 0 | 1
    /** Count that fills the top shade; defaults to the largest day in range. */
    max?: number
  } = {},
): ActivityGridModel {
  const dates = days.map((day) => day.date).sort()
  const from = options.from ?? dates[0] ?? ''
  const to = options.to ?? dates[dates.length - 1] ?? ''
  const grid = calendarGrid(from, to, options.weekStart ?? 1)
  const counts = new Map<string, number>()
  for (const day of days) {
    const count = Number.isFinite(day.count) && day.count > 0 ? day.count : 0
    counts.set(day.date, (counts.get(day.date) ?? 0) + count)
  }
  const inRange = grid.cells.map((cell) => counts.get(cell.date) ?? 0)
  const max = options.max ?? inRange.reduce((m, count) => Math.max(m, count), 0)
  const cells: ActivityCell[] = grid.cells.map((cell, index) => ({
    date: cell.date,
    count: inRange[index]!,
    level: activityLevel(inRange[index]!, max),
    col: cell.col,
    row: cell.row,
  }))
  const rows: ActivityCell[][] = Array.from({ length: 7 }, () => [])
  for (const cell of cells) rows[cell.row]!.push(cell)
  return { cols: grid.cols, rows, cells, max }
}

/** 末日往前数 weeks 周（整 7 × weeks 天）的起点，给「最近 N 周」用：返回 to 往前 weeks×7−1 天的日期。 */
export const recentFrom = (to: string, weeks: number): string => addDays(to, -(Math.max(1, weeks) * 7 - 1))

/**
 * 格间键盘：← → 前后一周（同一个星期几），↑ ↓ 前一天后一天（一列里上下，到列头列尾接到上一周的末尾 / 下一周的开头会让人迷路，所以到头不动），
 * Home / End 第一天与最后一天。返回新格在 cells 里的下标；这个方向没有格子或不是方向键返回 null（调用方此时不 preventDefault，让页面照常滚）。
 */
export function moveActivity(cells: readonly ActivityCell[], index: number, key: string): number | null {
  const current = cells[index]
  if (!current || cells.length === 0) return null
  const find = (col: number, row: number) => cells.findIndex((cell) => cell.col === col && cell.row === row)
  let next: number
  switch (key) {
    case 'ArrowLeft':
      next = find(current.col - 1, current.row)
      break
    case 'ArrowRight':
      next = find(current.col + 1, current.row)
      break
    case 'ArrowUp':
      next = find(current.col, current.row - 1)
      break
    case 'ArrowDown':
      next = find(current.col, current.row + 1)
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = cells.length - 1
      break
    default:
      return null
  }
  return next < 0 || next === index ? null : next
}
