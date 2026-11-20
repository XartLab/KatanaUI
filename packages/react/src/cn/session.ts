// SPDX-License-Identifier: MIT
// 第 0 层（#110）：A 股的交易时段。纯函数。包里不带交易日历（哪天开市由调用方传），这里只认一天之内的时刻：
// 09:15–09:25 集合竞价、09:30–11:30 上午、13:00–15:00 下午；09:25–09:30 与午休（11:30–13:00）不占宽度。

export type CnSessionKey = 'auction' | 'morning' | 'afternoon'

/** 一天里的交易时段，时刻是自 0 点起的分钟数。次序就是时间轴上的次序。 */
export const CN_SESSIONS: readonly { key: CnSessionKey; from: number; to: number }[] = [
  { key: 'auction', from: 9 * 60 + 15, to: 9 * 60 + 25 },
  { key: 'morning', from: 9 * 60 + 30, to: 11 * 60 + 30 },
  { key: 'afternoon', from: 13 * 60, to: 15 * 60 },
]

/** 时间轴的总宽（分钟）：10 + 120 + 120。 */
export const CN_AXIS_MINUTES = CN_SESSIONS.reduce((sum, session) => sum + (session.to - session.from), 0)

/** 尾盘从几点开始（分钟）：14:30。 */
export const CN_LATE_FROM = 14 * 60 + 30

/** 着色用的四段：集合竞价、早盘、午盘、尾盘（尾盘是下午的最后半小时）。 */
export type CnPhase = 'auction' | 'morning' | 'afternoon' | 'late'

/** 「09:31」「09:31:05」→ 自 0 点起的分钟数（秒折成小数）；写法不对、越界返回 null。 */
export function parseClock(text: string | null | undefined): number | null {
  if (typeof text !== 'string') return null
  const hit = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(text.trim())
  if (!hit) return null
  const hour = Number(hit[1])
  const minute = Number(hit[2])
  const second = hit[3] === undefined ? 0 : Number(hit[3])
  if (hour > 23 || minute > 59 || second > 59) return null
  return hour * 60 + minute + second / 60
}

/** 分钟数 → 「HH:MM」（取整分钟，秒舍去）。 */
export function formatClock(minutes: number): string {
  const whole = Math.floor(minutes)
  return `${String(Math.floor(whole / 60)).padStart(2, '0')}:${String(whole % 60).padStart(2, '0')}`
}

/**
 * 时刻在时间轴上的位置，0 到 1：竞价、上午、下午三段首尾相接，09:25–09:30 与午休不占宽度（落在空档里的时刻贴到前一段的末尾）。
 * 早于 09:15 或晚于 15:00 返回 null，不硬凑。
 */
export function cnAxisPosition(minutes: number | null): number | null {
  if (minutes === null || !Number.isFinite(minutes)) return null
  const first = CN_SESSIONS[0]!
  const last = CN_SESSIONS[CN_SESSIONS.length - 1]!
  if (minutes < first.from || minutes > last.to) return null
  let before = 0
  for (const session of CN_SESSIONS) {
    if (minutes < session.from) return before / CN_AXIS_MINUTES
    if (minutes <= session.to) return (before + (minutes - session.from)) / CN_AXIS_MINUTES
    before += session.to - session.from
  }
  return 1
}

/** 两个时刻之间实际交易的分钟数（午休与 09:25–09:30 不算）；任一方不在交易时间内、或 to 早于 from 返回 null。 */
export function cnTradingMinutesBetween(from: number | null, to: number | null): number | null {
  const a = cnAxisPosition(from)
  const b = cnAxisPosition(to)
  if (a === null || b === null || b < a) return null
  return Math.round((b - a) * CN_AXIS_MINUTES * 1e6) / 1e6
}

/** 时刻属于哪一段：09:30 之前是集合竞价，09:30–11:30 早盘，11:30 之后到 14:30 午盘，14:30 起尾盘；早于 09:15 或晚于 15:00 返回 null。 */
export function cnPhaseOf(minutes: number | null): CnPhase | null {
  if (cnAxisPosition(minutes) === null || minutes === null) return null
  if (minutes < 9 * 60 + 30) return 'auction'
  if (minutes < 12 * 60) return 'morning'
  return minutes < CN_LATE_FROM ? 'afternoon' : 'late'
}
