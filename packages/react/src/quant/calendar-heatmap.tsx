// SPDX-License-Identifier: MIT
// 日历热力图：一年的每日盈亏，一周一列、一天一格，涨跌两套发散色（--pnl-up / --pnl-down，跟涨跌配色走），颜色深浅按 |值| 占最大 |值| 的比例分档。
// 补设计稿 Calendar 卡缺的「发散热力底色」。功能参照 Arc 的 Activity heatmap（uiarc.dev/components/charts，2026-11-14 读，只取功能；它是单色的活跃度，这里改成涨跌发散），实现原创。
// 交互：指针悬停或键盘选中一天，下面一行读出这一天；点或 Enter 触发 onSelect。键盘：←→ 前后一周、↑↓ 前后一天、Home / End 头尾、Esc 清掉。
import { useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn'
import { calendarGrid, calendarKey, calendarLevel, CALENDAR_LEVELS } from './calendar-model'

export type CalendarDay = { date: string; value: number }

/** 格边长与间隔（viewBox 单位）：12 加 3，一年 53 列约 800 宽。 */
const CELL = 12
const GAP = 3
const LEFT = 26
const TOP = 16

export type CalendarHeatmapProps = {
  days: readonly CalendarDay[]
  /** 起止日（含）；不给取 days 里最早与最晚的一天。 */
  from?: string
  to?: string
  /** 一周从哪天起：0 周日，1 周一。 */
  weekStart?: 0 | 1
  /** 长 7，按 JS 的星期下标（0 是周日）写；给一周里隔行写的那几个字。由调用方按界面语言写。 */
  weekdayLabels: readonly string[]
  /** 长 12，一月到十二月。 */
  monthLabels: readonly string[]
  /** 选中的一天读成一句：没数据的日子 value 是 null。 */
  describe: (date: string, value: number | null) => string
  /** 整张图的读屏名。 */
  label: string
  /** 色例两端的字（跌的一端、涨的一端）；不给就不画色例。 */
  legend?: { down: string; up: string }
  /** 整张图 |值| 的最大值；不给取 days 里的。几张图要共用一把色阶时传。 */
  max?: number
  onSelect?: (date: string) => void
  className?: string
}

export function CalendarHeatmap({
  days,
  from,
  to,
  weekStart = 1,
  weekdayLabels,
  monthLabels,
  describe,
  label,
  legend,
  max,
  onSelect,
  className,
}: CalendarHeatmapProps) {
  const dates = days.map((day) => day.date).sort()
  const start = from ?? dates[0] ?? ''
  const end = to ?? dates[dates.length - 1] ?? ''
  const grid = calendarGrid(start, end, weekStart)
  const values = new Map(days.map((day) => [day.date, day.value]))
  const top = max ?? days.reduce((m, day) => Math.max(m, Number.isFinite(day.value) ? Math.abs(day.value) : 0), 0)
  const [active, setActive] = useState<string | null>(null)
  const shown = active !== null && grid.cells.some((cell) => cell.date === active) ? active : null
  const width = LEFT + grid.cols * (CELL + GAP)
  const height = TOP + 7 * (CELL + GAP)
  const x = (col: number) => LEFT + col * (CELL + GAP)
  const y = (row: number) => TOP + row * (CELL + GAP)
  const valueOf = (date: string) => values.get(date) ?? null

  const onKeyDown = (event: KeyboardEvent<Element>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'Enter' && shown !== null) {
      onSelect?.(shown)
      event.preventDefault()
      return
    }
    const next = calendarKey(shown, event.key, start, end)
    if (next === undefined) return
    event.preventDefault()
    setActive(next)
  }

  return (
    <figure className={cn('k-heat', className)} data-slot="calendar-heatmap">
      <svg
        className="k-heat-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="group"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
      >
        {grid.months.map(({ col, month }) => (
          <text key={`${col}-${month}`} className="k-heat-text" x={x(col)} y={TOP - 5}>
            {monthLabels[month]}
          </text>
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((row) => {
          const weekday = (row + weekStart) % 7
          return row % 2 === 0 ? (
            <text key={row} className="k-heat-text" x={0} y={y(row) + CELL - 2}>
              {weekdayLabels[weekday]}
            </text>
          ) : null
        })}
        {grid.cells.map((cell) => {
          const value = valueOf(cell.date)
          const level = value === null ? null : calendarLevel(value, top)
          return (
            <rect
              key={cell.date}
              className="k-heat-cell"
              data-slot="calendar-cell"
              data-date={cell.date}
              data-level={level === null ? 'none' : level}
              data-active={shown === cell.date ? 'true' : undefined}
              x={x(cell.col)}
              y={y(cell.row)}
              width={CELL}
              height={CELL}
              rx={2}
              onPointerEnter={() => setActive(cell.date)}
              onClick={onSelect ? () => onSelect(cell.date) : undefined}
            />
          )
        })}
      </svg>
      <div className="k-plot-readout" data-slot="calendar-readout" aria-live="polite">
        {shown !== null ? describe(shown, valueOf(shown)) : null}
      </div>
      {legend && (
        <div className="k-heat-legend" aria-hidden="true">
          <span>{legend.down}</span>
          {Array.from({ length: CALENDAR_LEVELS * 2 + 1 }, (_, i) => (
            <i key={i} data-level={i - CALENDAR_LEVELS} />
          ))}
          <span>{legend.up}</span>
        </div>
      )}
    </figure>
  )
}
