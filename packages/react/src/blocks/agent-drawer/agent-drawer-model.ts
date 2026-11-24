// SPDX-License-Identifier: MIT
// AgentDrawer 的纯逻辑：状态与运行结果的语气、活动热力格的档位与排布、格间键盘移动。件不取时间，日期都是调用方给的 YYYY-MM-DD。
// 信息结构与交互借自 Jamie Merrill 公开的 Agent 抽屉与 Agent tracker 表格截图（2026-11-24 读，只取「档案抽屉」的部件与交互，样子与实现原创，不用它的蓝色热力格）。
import type { Severity } from '../../lib/severity.ts'
import { quantileSorted } from '../../lib/chart/chart-scale.ts'
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
 * 固定上限的线性档位：0 是没跑，跑过的按次数占 max 的比例分 1 到 5 档（向上取整：只要跑过至少是 1 档，达到 max 是 5 档）。
 * 给固定的 max（如每日计划上限）时用它，几个 Agent 的格子才互相比得了；不给 max 时 activityGrid 改用分位数（activityCuts）。
 * 负数、非有限数当 0；max 不是正数时跑过的算 1 档。
 */
export function activityLevel(count: number, max: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0
  if (!Number.isFinite(max) || max <= 0) return 1
  return Math.min(ACTIVITY_LEVELS, Math.max(1, Math.ceil((count / max) * ACTIVITY_LEVELS)))
}

/**
 * 分位数档位的切点：只看跑过的日子（0 次不进分布），取 20 / 40 / 60 / 80 分位（线性插值，同 quant/calendar-model 用的 80 分位那把尺子），升序去重。
 * 一天一个离群值（重放跑了 300 次）不会把其余日子压成同一档；全是同一个次数时没有切点，全部落 1 档（每天都只跑 1 次不会比每天 12 次的更「热」）。
 */
export function activityCuts(counts: readonly number[]): number[] {
  const ran = counts.filter((count) => Number.isFinite(count) && count > 0).toSorted((a, b) => a - b)
  if (ran.length === 0) return []
  const cuts = [0.2, 0.4, 0.6, 0.8].map((p) => quantileSorted(ran, p))
  return cuts.filter((cut, index) => cuts.indexOf(cut) === index)
}

/** 按切点分档：0 次是 0 档，跑过的是 1 加上「严格大于的切点个数」（最多 5 档）。 */
export function activityLevelByCuts(count: number, cuts: readonly number[]): number {
  if (!Number.isFinite(count) || count <= 0) return 0
  return 1 + cuts.filter((cut) => count > cut).length
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
  /** 每个月第一天所在的列（含区间起点那一列），月份从 0 起（一月是 0）。 */
  months: readonly { col: number; month: number }[]
  /** 区间里单日最大的次数（固定上限时是那个上限）。 */
  max: number
  /** 分位数模式的切点；给了固定 max 走线性档位时是空数组。 */
  cuts: readonly number[]
}

/**
 * 把每日次数排成「一列一周、一行一个星期」的格子。区间取 from 到 to（含），不给就取 days 里最早与最晚的一天；
 * days 里没有的日子算没跑（0 次），区间外的数据不画。重复的日期次数相加。
 * 档位：默认按区间里「跑过的日子」的次数分位数分（activityCuts）；给了 max 就是固定上限的线性档位（activityLevel）。
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
  const fixed = options.max !== undefined
  const max = options.max ?? inRange.reduce((m, count) => Math.max(m, count), 0)
  const cuts = fixed ? [] : activityCuts(inRange)
  const cells: ActivityCell[] = grid.cells.map((cell, index) => ({
    date: cell.date,
    count: inRange[index]!,
    level: fixed ? activityLevel(inRange[index]!, max) : activityLevelByCuts(inRange[index]!, cuts),
    col: cell.col,
    row: cell.row,
  }))
  const rows: ActivityCell[][] = Array.from({ length: 7 }, () => [])
  for (const cell of cells) rows[cell.row]!.push(cell)
  return { cols: grid.cols, rows, cells, months: grid.months, max, cuts }
}

/** 末日往前数 weeks 周（整 7 × weeks 天）的起点，给「最近 N 周」用：返回 to 往前 weeks×7−1 天的日期。 */
export const recentFrom = (to: string, weeks: number): string => addDays(to, -(Math.max(1, weeks) * 7 - 1))

/** 一列里离 row 最近的格子（同距离取靠上的）；这一列没有格子返回 -1。 */
function nearestInColumn(cells: readonly ActivityCell[], col: number, row: number): number {
  let best = -1
  for (const [index, cell] of cells.entries()) {
    if (cell.col !== col) continue
    if (best < 0 || Math.abs(cell.row - row) < Math.abs(cells[best]!.row - row)) best = index
  }
  return best
}

/** 周跳的步长：PageUp / PageDown 跳 4 周。 */
export const ACTIVITY_PAGE_WEEKS = 4

/**
 * 格间键盘（返回新格在 cells 里的下标；这个方向没有格子或不是该处理的键返回 null，调用方此时不 preventDefault，让页面照常滚）：
 * ← → 前后一周，目标那一周（首列、末列是残列）没有同一个星期几的格子就取那一列里离得最近的一行；
 * ↑ ↓ 前一天后一天，到列头列尾不动（接到上一周会让人迷路）；
 * PageUp / PageDown 前后 4 周（同一规则取最近的行），不够 4 周就夹到第一周或最后一周；
 * Home / End 当前行（星期几）的第一周与最后一周，Ctrl+Home / Ctrl+End 整张图的第一天与最后一天。
 */
export function moveActivity(cells: readonly ActivityCell[], index: number, key: string, ctrl = false): number | null {
  const current = cells[index]
  if (!current || cells.length === 0) return null
  const firstCol = cells[0]!.col
  const lastCol = cells[cells.length - 1]!.col
  const byWeeks = (weeks: number) => {
    const col = Math.min(lastCol, Math.max(firstCol, current.col + weeks))
    return nearestInColumn(cells, col, current.row)
  }
  let next: number
  if (ctrl) {
    if (key === 'Home') next = 0
    else if (key === 'End') next = cells.length - 1
    else return null
  } else {
    switch (key) {
      case 'ArrowLeft':
        next = current.col > firstCol ? byWeeks(-1) : -1
        break
      case 'ArrowRight':
        next = current.col < lastCol ? byWeeks(1) : -1
        break
      case 'PageUp':
        next = byWeeks(-ACTIVITY_PAGE_WEEKS)
        break
      case 'PageDown':
        next = byWeeks(ACTIVITY_PAGE_WEEKS)
        break
      case 'ArrowUp':
        next = cells.findIndex((cell) => cell.col === current.col && cell.row === current.row - 1)
        break
      case 'ArrowDown':
        next = cells.findIndex((cell) => cell.col === current.col && cell.row === current.row + 1)
        break
      case 'Home':
      case 'End': {
        const inRow = cells.map((cell, i) => [cell, i] as const).filter(([cell]) => cell.row === current.row)
        next = (key === 'Home' ? inRow[0] : inRow[inRow.length - 1])?.[1] ?? -1
        break
      }
      default:
        return null
    }
  }
  return next < 0 || next === index ? null : next
}
