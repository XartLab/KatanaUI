// SPDX-License-Identifier: MIT
/**
 * Activity grid: how many times an agent ran each day, one cell a day, a column a week, five shades by count.
 * 活动热力格（GitHub 贡献图式）：一格一天、一列一周、一行一个星期；0 次是空格（--k-heat-0），跑过的按次数占最大值的比例分 5 档（--k-heat-1…5，越多越亮）。
 * 颜色只表示多少，读数靠字：悬停或键盘落到一格，格下面的读数行写那一格的整句（「11-03 跑了 12 次」，写法由调用方的 describe 给）。
 * 语义：role=grid，一行一个星期（role=row）、一天一个 gridcell，每格 aria-label 是整句；只有一个 Tab 停点（roving tabindex），
 * 方向键在格间走。选 grid 而不选「一张 img 加说明」的理由：每一天都是一个可以逐个读到的数据点，读屏用户要能问「周三那天跑了几次」，
 * 一张图加长说明只能把全部数字念一遍；角色与键位照 WAI-ARIA APG 的 Grid（日历式格子，格子不可编辑）。
 * 到头的方向键不 preventDefault，页面照常滚（modern-web-guidance 的 spatial-navigation）。
 * 件不取时间；区间由调用方给（from / to），没给取数据里最早与最晚的一天。纯逻辑在 agent-drawer-model.ts。
 */
import { useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import {
  ACTIVITY_LEVELS,
  activityGrid,
  moveActivity,
  type ActivityCell,
  type AgentActivityDay,
} from './agent-drawer-model.ts'

export type AgentActivityProps = {
  /** Runs per day; days that are missing count as no runs. */
  days: readonly AgentActivityDay[]
  /** First day shown (YYYY-MM-DD); defaults to the earliest day in days. */
  from?: string
  /** Last day shown (YYYY-MM-DD); defaults to the latest day in days. */
  to?: string
  /** Which weekday a column starts on (0 Sunday, 1 Monday). Defaults to 1. */
  weekStart?: 0 | 1
  /** Count that fills the top shade; defaults to the largest day. Give a fixed value to compare agents. */
  max?: number
  /** Accessible name of the grid. */
  label: string
  /** The whole sentence for one day, read by screen readers and written in the readout line ("11-03 ran 12 times"). */
  describe: (cell: { date: string; count: number }) => string
  /** Legend ends; without it no legend is drawn. */
  legend?: { less: string; more: string }
  /** What the readout line says when no cell is hovered or focused (a total, say). */
  idle?: ReactNode
  /** Extra class name on the root. */
  className?: string
}

export function AgentActivity({
  days,
  from,
  to,
  weekStart = 1,
  max,
  label,
  describe,
  legend,
  idle,
  className,
}: AgentActivityProps) {
  const model = useMemo(() => activityGrid(days, { from, to, weekStart, max }), [days, from, to, weekStart, max])
  const { cells } = model
  const [hover, setHover] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  // 没有落过焦点时 Tab 停在最新的一天（右下角那一边）。
  const [stop, setStop] = useState<number | null>(null)
  const refs = useRef(new Map<number, HTMLDivElement>())
  const stopIndex = Math.min(stop ?? cells.length - 1, cells.length - 1)
  const shown = hover ?? focus
  const indexOf = new Map(cells.map((cell, index) => [cell.date, index]))

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const next = moveActivity(cells, stopIndex, event.key)
    if (next === null) return
    event.preventDefault()
    setStop(next)
    refs.current.get(next)?.focus()
  }

  const cellNode = (cell: ActivityCell) => {
    const index = indexOf.get(cell.date)!
    return (
      <div
        key={cell.date}
        ref={(node) => {
          if (node) refs.current.set(index, node)
          else refs.current.delete(index)
        }}
        role="gridcell"
        className="k-ad-cell"
        data-slot="agent-activity-cell"
        data-date={cell.date}
        data-count={cell.count}
        data-level={cell.level}
        aria-label={describe(cell)}
        tabIndex={index === stopIndex ? 0 : -1}
        style={{ gridColumn: cell.col + 1 } as CSSProperties}
        onMouseEnter={() => setHover(index)}
        onFocus={() => {
          setFocus(index)
          setStop(index)
        }}
        onBlur={() => setFocus(null)}
      />
    )
  }

  const shownCell = shown === null ? undefined : cells[shown]
  return (
    <div className={cn('k-ad-activity', className)} data-slot="agent-activity">
      {cells.length === 0 ? null : (
        <div
          role="grid"
          aria-label={label}
          className="k-ad-grid"
          style={{ '--k-ad-cols': model.cols } as CSSProperties}
          onKeyDown={onKeyDown}
          onMouseLeave={() => setHover(null)}
        >
          {model.rows.map((row, r) => (
            <div key={r} role="row" className="k-ad-row">
              {row.map(cellNode)}
            </div>
          ))}
        </div>
      )}
      <div className="k-ad-foot">
        {/* 读数行只是给眼睛的：读屏用户落到格子上已经读到整句（aria-label），这里再播一遍会重复。 */}
        <p className="k-ad-readout" data-slot="agent-activity-readout" aria-hidden="true">
          {shownCell ? describe(shownCell) : idle}
        </p>
        {legend ? (
          <div className="k-ad-legend" data-slot="agent-activity-legend" aria-hidden="true">
            <span>{legend.less}</span>
            {Array.from({ length: ACTIVITY_LEVELS + 1 }, (_, level) => (
              <i key={level} className="k-ad-swatch" data-level={level} />
            ))}
            <span>{legend.more}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}
