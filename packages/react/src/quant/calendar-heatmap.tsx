// SPDX-License-Identifier: MIT
// 日历（组件卡 Calendar，2026-11-14 读 design/katana-console/project/components/Calendar）：月历格，底色是收益（或换手）的低饱和发散热力，
// 格内日期左上、数值右下，左下点阵事件点（≤ 3 个，更多写 +n）；休市日 bg-100 加「休」；今天强调色描边；周标 W40；格 34px。
// 收益色：div-pos / div-neg 的 -100 档是大多数，-200 档只给 |收益| 超月内 80 分位的格，全饱和不出现（涨跌色不上面积）。
// 视图：pnl（收益，发散）/ turnover（换手，序数 seq 单色）/ events（格子不着色，事件按类别列出）。mode="year" 是整年的格子（一周一列、一天一格，格只有色没有字）。
// 功能参照 Arc 的 Activity heatmap（uiarc.dev/components/charts，2026-11-14 读，只取功能）；样子与内容照 Calendar 卡，实现原创。
// 交互：指针悬停或键盘选中一天，LCD tooltip 列这一天的数值与事件；点或 Enter 触发 onSelect（写联动 range）。键盘：←→ 前后一天、↑↓ 前后一周、Home / End、Esc。
// 并入 SmoothUI contribution-graph（2026-11-17 读，MIT，© 2024 Eduardo Calvo；https://github.com/educlopez/smoothui ）里更好的几处，都是 CSS 与可选 prop，现有 API 与外观不变：
// ① 悬停的 tooltip 不是凭空出现，而是从 0.8 倍弹到 1（原件的 scale 0.8 到 1）；② 悬停的格有颜色与描边的过渡（原件 hover:ring），切换视图时格色也平滑换；
// ③ reveal：整张图进场时格子按顺序（年视图一列一列、月历一天一天）淡入，原件没有进场动效，这是照它的 tooltip 弹出同一手感补的，默认关。
// 原件的 53 周 GitHub 版式、月份表头、5 档品牌色我们不要：我们的年视图是 svg、色是发散 / 序数色，且已有周标、休市、事件点。
// 右上角三件：表格视图（总有）、导出与全屏（回调由调用方给）。文字（休、周标、月份、数值）都从 props 来。
import { useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { calendarGrid, calendarKey, calendarTone, monthGrid, type CalendarTone } from './calendar-model.ts'
import { ChartActions, type ChartActionsLabels } from './chart-kit/chart-actions.tsx'
import { LcdTooltip } from './chart-kit/lcd-tooltip.tsx'
import { divHotThreshold } from './chart-kit/series-colors.ts'

export type CalendarEvent = {
  label: string
  /** normal 灰点；holding（持仓相关）与 high（高影响）琥珀点。 */
  tone?: 'normal' | 'holding' | 'high'
  /** 事件类别（events 视图按它分组写字）；由调用方给文字。 */
  kind?: string
}

export type CalendarDay = {
  date: string
  /** 收益或换手；没有数据传 null（与 0 持平分开）。 */
  value: number | null
  /** 休市日（来自 Profile.calendar）；不给当开市。 */
  open?: boolean
  events?: readonly CalendarEvent[]
}

/** 年视图格边长与间隔（viewBox 单位）：12 加 3，一年 53 列约 800 宽。 */
const CELL = 12
const GAP = 3
const LEFT = 26
const TOP = 16
/** 一格最多画几个事件点，更多写 +n（Calendar 卡）。 */
const MAX_DOTS = 3

/** 进场时相邻两列（年视图）与两天（月历）之间的间隔，毫秒：年视图 53 列约 0.5 秒播完，月历一个月约 0.4 秒。 */
const REVEAL_COL_MS = 10
const REVEAL_DAY_MS = 12
const revealStyle = (delay: number): CSSProperties => ({ '--k-reveal-delay': `${delay}ms` }) as CSSProperties

export type CalendarHeatmapProps = {
  days: readonly CalendarDay[]
  /** month：月历（默认）；year：整年的格子。 */
  mode?: 'month' | 'year'
  /** 月历显示哪个月（YYYY-MM）；不给取 days 里最晚那天所在的月。 */
  month?: string
  /** 年视图的起止日（含）；不给取 days 里最早与最晚的一天。 */
  from?: string
  to?: string
  view?: 'pnl' | 'turnover' | 'events'
  /** 今天（YYYY-MM-DD）：强调色描边；晚于今天的日子不着色、只有事件点。 */
  today?: string
  weekStart?: 0 | 1
  /** 长 7，按 JS 的星期下标（0 是周日）写；调用方按界面语言写。 */
  weekdayLabels: readonly string[]
  /** 长 12，一月到十二月（年视图的月份标）。 */
  monthLabels: readonly string[]
  /** 周标：第几周写成什么（例 W40）。 */
  weekLabel: (week: number) => string
  /** 休市日格里写什么（例「休」）。 */
  closedLabel: string
  /** 格里的数值写成什么字（月历）。 */
  formatValue: (value: number) => string
  /** 选中的一天读成一句（读数行）：没数据的日子 value 是 null。 */
  describe: (date: string, value: number | null) => string
  /** 整张图的读屏名。 */
  label: string
  /** 色例两端的字（跌的一端、涨的一端）；不给就不画色例。 */
  legend?: { down: string; up: string }
  /** 顶行右侧的合计（例：月合计），数字按正负用涨跌色。 */
  total?: { text: string; value: number }
  /** 顶行左边的位置：视图切换、月份与账户集合等，由调用方放。 */
  toolbar?: ReactNode
  actionLabels: ChartActionsLabels
  tableHeads: { date: string; value: string }
  onExport?: () => void
  onFullscreen?: () => void
  /** 点击一天（写联动 range）。 */
  onSelect?: (date: string) => void
  /** Fades the cells in one after another when the chart first appears (and when the month or range changes). Off by default. */
  reveal?: boolean
  className?: string
}

export function CalendarHeatmap({
  days,
  mode = 'month',
  month,
  from,
  to,
  view = 'pnl',
  today,
  weekStart = 1,
  weekdayLabels,
  monthLabels,
  weekLabel,
  closedLabel,
  formatValue,
  describe,
  label,
  legend,
  total,
  toolbar,
  actionLabels,
  tableHeads,
  onExport,
  onFullscreen,
  onSelect,
  reveal = false,
  className,
}: CalendarHeatmapProps) {
  const dates = days.map((day) => day.date).sort()
  const byDate = new Map(days.map((day) => [day.date, day]))
  const shownMonth = month ?? (dates[dates.length - 1] ?? '').slice(0, 7)
  const start = mode === 'month' ? `${shownMonth}-01` : (from ?? dates[0] ?? '')
  const end =
    mode === 'month'
      ? (monthGrid(shownMonth, weekStart).at(-1)?.days.at(-1)?.date ?? '')
      : (to ?? dates[dates.length - 1] ?? '')
  const inRange = (date: string) => (mode === 'month' ? date.startsWith(shownMonth) : date >= start && date <= end)
  const range = days.filter((day) => inRange(day.date))
  // 月内（年视图是区间内）|值| 的 80 分位：超过它的格才用 -200 档。
  const hot = divHotThreshold(range.map((day) => day.value).filter((v): v is number => v !== null))
  const turnoverMax = range.reduce((m, day) => Math.max(m, Math.abs(day.value ?? 0)), 0)
  const [active, setActive] = useState<string | null>(null)
  const [table, setTable] = useState(false)
  const shown = active !== null && inRange(active) ? active : null
  const futureOf = (date: string) => today !== undefined && date > today

  const toneOf = (day: CalendarDay | undefined): CalendarTone => {
    if (view === 'events' || !day || day.open === false || futureOf(day.date)) return 'none'
    return calendarTone(day.value, hot)
  }
  const seqOf = (day: CalendarDay | undefined): number | undefined => {
    if (view !== 'turnover' || !day || day.value === null || !(turnoverMax > 0) || day.open === false) return undefined
    return Math.min(4, Math.floor((Math.abs(day.value) / turnoverMax) * 5))
  }

  const onKeyDown = (event: KeyboardEvent<Element>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return
    if (event.key === 'Enter' && shown !== null) {
      onSelect?.(shown)
      event.preventDefault()
      return
    }
    const first = mode === 'month' ? `${shownMonth}-01` : start
    const last =
      mode === 'month'
        ? `${shownMonth}-${String(new Date(Date.UTC(Number(shownMonth.slice(0, 4)), Number(shownMonth.slice(5)), 0)).getUTCDate()).padStart(2, '0')}`
        : end
    const next = calendarKey(shown, event.key, first, last)
    if (next === undefined) return
    event.preventDefault()
    setActive(next)
  }

  const tip = (date: string, x: string) => {
    const day = byDate.get(date)
    return (
      <LcdTooltip
        className="k-heat-tip"
        style={{ left: x, top: 0 }}
        title={date}
        rows={[
          { key: 'v', label: label, value: day?.value == null ? '—' : formatValue(day.value) },
          ...(day?.events ?? []).map((event, i) => ({ key: `e${i}`, label: event.kind ?? '', value: event.label })),
        ]}
      />
    )
  }

  const body = (() => {
    if (mode === 'year') {
      const grid = calendarGrid(start, end, weekStart)
      const width = LEFT + grid.cols * (CELL + GAP)
      const height = TOP + 7 * (CELL + GAP)
      const x = (col: number) => LEFT + col * (CELL + GAP)
      const y = (row: number) => TOP + row * (CELL + GAP)
      return (
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
          {grid.months.map(({ col, month: m }) => (
            <text key={`${col}-${m}`} className="k-heat-text" x={x(col)} y={TOP - 5}>
              {monthLabels[m]}
            </text>
          ))}
          {[0, 2, 4, 6].map((row) => (
            <text key={row} className="k-heat-text" x={0} y={y(row) + CELL - 2}>
              {weekdayLabels[(row + weekStart) % 7]}
            </text>
          ))}
          {grid.cells.map((cell) => (
            <rect
              style={reveal ? revealStyle(cell.col * REVEAL_COL_MS) : undefined}
              key={cell.date}
              className="k-heat-cell"
              data-slot="calendar-cell"
              data-date={cell.date}
              data-tone={toneOf(byDate.get(cell.date))}
              data-seq={seqOf(byDate.get(cell.date))}
              data-closed={byDate.get(cell.date)?.open === false ? 'true' : undefined}
              data-active={shown === cell.date ? 'true' : undefined}
              x={x(cell.col)}
              y={y(cell.row)}
              width={CELL}
              height={CELL}
              rx={2}
              onPointerEnter={() => setActive(cell.date)}
              onClick={onSelect ? () => onSelect(cell.date) : undefined}
            />
          ))}
        </svg>
      )
    }
    const weeks = monthGrid(shownMonth, weekStart)
    const order = Array.from({ length: 7 }, (_, i) => (i + weekStart) % 7)
    return (
      <div
        className="k-heat-month"
        data-slot="calendar-month"
        role="grid"
        aria-label={label}
        tabIndex={0}
        onKeyDown={onKeyDown}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
      >
        <div className="k-heat-week" role="row">
          <span className="k-heat-corner" role="presentation" />
          {order.map((weekday) => (
            <span key={weekday} className="k-heat-head" role="columnheader">
              {weekdayLabels[weekday]}
            </span>
          ))}
        </div>
        {weeks.map((week, weekIndex) => (
          <div key={week.days[0]!.date} className="k-heat-week" role="row">
            <span className="k-heat-wk">{weekLabel(week.week)}</span>
            {week.days.map(({ date, inMonth }, dayIndex) => {
              if (!inMonth) return <span key={date} className="k-heat-cell k-heat-out" aria-hidden="true" />
              const day = byDate.get(date)
              const closed = day?.open === false
              const events = day?.events ?? []
              const dots = events.slice(0, MAX_DOTS)
              const future = futureOf(date)
              const dayNum = Number(date.slice(8))
              return (
                <button
                  key={date}
                  type="button"
                  role="gridcell"
                  tabIndex={-1}
                  className="k-heat-cell"
                  style={reveal ? revealStyle((weekIndex * 7 + dayIndex) * REVEAL_DAY_MS) : undefined}
                  data-slot="calendar-cell"
                  data-date={date}
                  data-tone={toneOf(day)}
                  data-seq={seqOf(day)}
                  data-closed={closed ? 'true' : undefined}
                  data-today={date === today ? 'true' : undefined}
                  data-active={shown === date ? 'true' : undefined}
                  aria-label={describe(date, day?.value ?? null)}
                  onPointerEnter={() => setActive(date)}
                  onClick={onSelect ? () => onSelect(date) : undefined}
                >
                  <span className="k-heat-date">{dayNum}</span>
                  <span className="k-heat-num">
                    {closed
                      ? closedLabel
                      : future || day?.value == null
                        ? '·'
                        : view === 'events'
                          ? ''
                          : formatValue(day.value)}
                  </span>
                  {view === 'events' ? (
                    <span className="k-heat-evtext">
                      {events
                        .slice(0, 2)
                        .map((e) => e.label)
                        .join(' ')}
                    </span>
                  ) : (
                    events.length > 0 && (
                      <span className="k-heat-dots" data-slot="calendar-dots">
                        {dots.map((event, i) => (
                          <i key={i} data-tone={event.tone ?? 'normal'} />
                        ))}
                        {events.length > MAX_DOTS && <b>+{events.length - MAX_DOTS}</b>}
                      </span>
                    )
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    )
  })()

  return (
    <figure
      className={cn('k-heat', className)}
      data-slot="calendar-heatmap"
      data-mode={mode}
      data-view={view}
      data-reveal={reveal ? '' : undefined}
    >
      <div className="k-heat-top">
        {toolbar}
        {total && (
          <span
            className="k-heat-total"
            data-slot="calendar-total"
            data-tone={total.value > 0 ? 'up' : total.value < 0 ? 'down' : 'flat'}
          >
            {total.text}
          </span>
        )}
        <ChartActions
          labels={actionLabels}
          tableView={table}
          onTableView={setTable}
          onExport={onExport}
          onFullscreen={onFullscreen}
        />
      </div>
      {table ? (
        <table className="k-heat-table" data-slot="calendar-table">
          <thead>
            <tr>
              <th>{tableHeads.date}</th>
              <th>{tableHeads.value}</th>
            </tr>
          </thead>
          <tbody>
            {range
              .slice()
              .sort((a, b) => a.date.localeCompare(b.date))
              .map((day) => (
                <tr key={day.date}>
                  <td>{day.date}</td>
                  <td>{day.value === null ? '—' : formatValue(day.value)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      ) : (
        <div className="k-heat-stage">
          {body}
          {shown !== null && tip(shown, mode === 'month' ? '50%' : '50%')}
        </div>
      )}
      <div className="k-plot-readout" data-slot="calendar-readout" aria-live="polite">
        {shown !== null ? describe(shown, byDate.get(shown)?.value ?? null) : null}
      </div>
      {legend && (
        <div className="k-heat-legend" aria-hidden="true">
          <span>{legend.down}</span>
          {(['neg2', 'neg1', 'flat', 'pos1', 'pos2'] as const).map((tone) => (
            <i key={tone} data-tone={tone} />
          ))}
          <span>{legend.up}</span>
        </div>
      )}
    </figure>
  )
}
