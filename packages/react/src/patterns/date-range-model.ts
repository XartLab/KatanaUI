// SPDX-License-Identifier: MIT
// 日期区间选择（DateRangePicker）的预设规则（纯函数，组件与单测共用）。
// 口径（主会话定的，没有出处）：预设都是「截至今天」——本周是周起始日到今天，本月是 1 号到今天，年初至今是 1 月 1 日到今天，今天就是今天一天。
// 同类的 TradingView 图表底部区间按钮（1D、1M、YTD）也是截至今天的口径（出处待核对）。回放、台账、报告都是看已发生的，没有「还没到的日子」。
// 一周从哪天起：A 股与国际交易所都是周一，默认周一，调用方可传周日。
// 「今天」由调用方传（按应用的显示时区算好的 YYYY-MM-DD）：件里不读时钟，所以两个时区的人拿到的预设各自对得上他们的日历。
import { parseDate, startOfMonth, startOfWeek, startOfYear, type CalendarDate } from '@internationalized/date'

export type DateRange = { start: string; end: string }
export type RangePreset = 'today' | 'week' | 'month' | 'ytd'
export const RANGE_PRESETS: readonly RangePreset[] = ['today', 'week', 'month', 'ytd']
export type WeekStart = 'mon' | 'sun'

/** YYYY-MM-DD → CalendarDate；不合法是 null。 */
export function toDay(value: string): CalendarDate | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  try {
    return parseDate(value)
  } catch {
    return null
  }
}

/** 某个预设在 today 这一天对应的区间；today 不合法返回 null。 */
export function presetRange(preset: RangePreset, today: string, weekStart: WeekStart = 'mon'): DateRange | null {
  const day = toDay(today)
  if (!day) return null
  const start =
    preset === 'today'
      ? day
      : preset === 'week'
        ? startOfWeek(day, 'en-US', weekStart)
        : preset === 'month'
          ? startOfMonth(day)
          : startOfYear(day)
  return { start: start.toString(), end: day.toString() }
}

/** 这个区间正好是哪个预设；都不是返回 null（界面上叫「自定义」）。按 RANGE_PRESETS 的次序，今天优先（1 号的「本月」也是今天一天）。 */
export function matchPreset(range: DateRange | null, today: string, weekStart: WeekStart = 'mon'): RangePreset | null {
  if (!range) return null
  return (
    RANGE_PRESETS.find((preset) => {
      const want = presetRange(preset, today, weekStart)
      return want?.start === range.start && want.end === range.end
    }) ?? null
  )
}

/** 区间含首尾共几天（YYYY-MM-DD 一对，起不晚于止）；不合法是 0。按日历日算，与时区无关。 */
export function rangeDays(range: DateRange | null): number {
  if (!range) return 0
  const start = toDay(range.start)
  const end = toDay(range.end)
  if (!start || !end) return 0
  const span = Date.UTC(end.year, end.month - 1, end.day) - Date.UTC(start.year, start.month - 1, start.day)
  return span < 0 ? 0 : Math.round(span / 86_400_000) + 1
}

/** 日历里正在挑的状态：anchor 是点下的起点（还没点终点时有值），preview 是起点到悬停 / 焦点那天的区间。 */
export type RangePick = { anchor: string | null; preview: DateRange | null }
export const NO_PICK: RangePick = { anchor: null, preview: null }

/** 脚上状态字对应的状态：还没点（first），或「已选 days 天」（含首尾；只点了起点时是 1，悬停时是到悬停那天）。 */
export type RangeStatus = { kind: 'first' } | { kind: 'days'; days: number }

/** 草稿加挑选状态 → 状态字。正在挑（有 anchor）以挑选为准，旧草稿不算；没在挑看草稿。 */
export function rangeStatus(draft: DateRange | null, pick: RangePick): RangeStatus {
  if (pick.anchor) return { kind: 'days', days: Math.max(1, rangeDays(pick.preview)) }
  const days = rangeDays(draft)
  return days > 0 ? { kind: 'days', days } : { kind: 'first' }
}

/** 「应用」能不能点：草稿是完整区间（起不晚于止），而且没在半途挑新的。 */
export function canApplyRange(draft: DateRange | null, pick: RangePick): boolean {
  return !pick.anchor && rangeDays(draft) > 0
}

/** 状态字的写法：字符串里的 {days} 换成天数；函数形式把天数交给调用方（要处理复数就用它）。 */
export function formatDays(text: string | ((days: number) => string), days: number): string {
  return typeof text === 'function' ? text(days) : text.replaceAll('{days}', String(days))
}
