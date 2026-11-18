// SPDX-License-Identifier: MIT
/**
 * Board strength ranking: a DataGrid of boards ranked by the caller's strength, with rank moves and an inline strength line.
 * 板块强度排名（#11，开盘啦「板块强度」对照）：DataGrid 一行一个板块，按调用方给的强度从高到低：名次、名次变化（▲ 升 / ▼ 降 / 新上榜）、
 * 板块名、强度数值与一根行内强度线（Sparkline，line 画法，不交互，颜色按头尾涨跌）、涨停只数、板块涨跌幅。
 * 强度的口径（权重表现、涨停数怎么合成）不在件里，调用方算好传；件只排名次、画。文字、数字写法也由调用方传。
 * 表格手感照 TradingView 的列表；名次变化不只靠颜色：文字带 ▲ / ▼ 与步数，涨跌色走 --k-tone-*（跟 data-updown）。
 */
import { cn } from '../../lib/cn.ts'
import { formatPercentChange } from '../../lib/chart/format/index.ts'
import { ChangeText } from '../../quotes/change-text.tsx'
import { Sparkline } from '../../quotes/sparkline.tsx'
import { DataGrid } from '../data-grid/data-grid.tsx'
import type { GridColumn } from '../data-grid/columns.ts'
import type { GridColumnLayout } from '../data-grid/data-grid-props.ts'
import { rankBoards, type BoardStrength, type RankedBoard } from './board-strength-model.ts'

export type { BoardStrength, RankedBoard } from './board-strength-model.ts'

/** Texts of BoardStrengthRank (the package ships no text). */
export type BoardStrengthRankLabels = {
  /** Accessible name of the table. 表的读屏名。 */
  list: string
  /** Column headers. 列头。 */
  columns: { rank: string; name: string; strength: string; trend: string; limitUps: string; change: string }
  /** Rank move text: climbed n (「▲2」), fell n, or new. 名次变化的字。 */
  move: { up: (n: number) => string; down: (n: number) => string; same: string; new: string }
  /** Accessible sentence of a strength line (「机器人 强度走势」). 强度线的读屏名。 */
  trend: (board: RankedBoard) => string
  /** Text when there are no boards. 没有板块时的字。 */
  empty: string
}

export type BoardStrengthRankProps = {
  /** Boards in any order; ranked by strength here. 板块，次序随意，件按强度排。 */
  boards: readonly BoardStrength[]
  /** Texts. */
  labels: BoardStrengthRankLabels
  /** How a strength value is written; defaults to one decimal. 强度的写法，默认一位小数。 */
  formatStrength?: (value: number) => string
  /** Show only the top n; all when omitted. 只显示前几名。 */
  limit?: number
  /** Open a board (click or Enter). 点一行。 */
  onSelect?: (board: RankedBoard) => void
  /** The board currently open (accent stripe on its left). 正开着的板块 id。 */
  selected?: string | null
  /** Extra class name on the root. */
  className?: string
}

/** 一行，连同调用方写法算好的字（列定义是模块级常量，字从行上读）。 */
type Line = RankedBoard & { strengthText: string; moveText: string; trendLabel: string }

const DASH = '—'

const COLUMNS: readonly GridColumn<Line>[] = [
  {
    id: 'rank',
    type: 'custom',
    text: (line) => `${line.rank} ${line.moveText}`,
    cell: (line) => (
      <span className="k-bsr-rank">
        <span className="k-bsr-no">{line.rank}</span>
        <span
          className="k-bsr-move"
          data-slot="board-move"
          data-tone={line.move === null ? 'new' : line.move > 0 ? 'up' : line.move < 0 ? 'down' : 'flat'}
        >
          {line.moveText}
        </span>
      </span>
    ),
  },
  { id: 'name', type: 'text', rowHeader: true, value: (line) => line.name },
  { id: 'strength', type: 'custom', text: (line) => line.strengthText, cell: (line) => line.strengthText },
  {
    id: 'trend',
    type: 'custom',
    text: () => '',
    cell: (line) =>
      line.series && line.series.length > 1 ? (
        <Sparkline
          className="k-bsr-spark"
          values={line.series}
          label={line.trendLabel}
          variant="line"
          showLast={false}
          width={96}
          height={20}
        />
      ) : (
        DASH
      ),
  },
  {
    id: 'limitUps',
    type: 'custom',
    text: (line) => (line.limitUps === undefined ? DASH : String(line.limitUps)),
    cell: (line) => (line.limitUps === undefined ? DASH : line.limitUps),
  },
  {
    id: 'change',
    type: 'custom',
    text: (line) => (line.change === undefined ? DASH : formatPercentChange(line.change)),
    cell: (line) => (line.change === undefined ? DASH : <ChangeText value={line.change} />),
  },
]

export function BoardStrengthRank({
  boards,
  labels,
  formatStrength = (value) => value.toFixed(1),
  limit,
  onSelect,
  selected = null,
  className,
}: BoardStrengthRankProps) {
  const ranked = rankBoards(boards).slice(0, limit)
  const lines: Line[] = ranked.map((board) => ({
    ...board,
    strengthText: Number.isFinite(board.strength) ? formatStrength(board.strength) : DASH,
    moveText:
      board.move === null
        ? labels.move.new
        : board.move > 0
          ? labels.move.up(board.move)
          : board.move < 0
            ? labels.move.down(-board.move)
            : labels.move.same,
    trendLabel: labels.trend(board),
  }))
  const layout: GridColumnLayout[] = [
    { id: 'rank', label: labels.columns.rank, width: 64, visible: true },
    { id: 'name', label: labels.columns.name, width: 120, visible: true },
    { id: 'strength', label: labels.columns.strength, width: 64, visible: true, align: 'end' },
    { id: 'trend', label: labels.columns.trend, width: 110, visible: true },
    { id: 'limitUps', label: labels.columns.limitUps, width: 56, visible: true, align: 'end' },
    { id: 'change', label: labels.columns.change, width: 72, visible: true, align: 'end' },
  ]
  if (lines.length === 0)
    return (
      <div className={cn('k-bsr', className)} data-slot="board-strength-rank">
        <p className="k-bsr-empty" role="status">
          {labels.empty}
        </p>
      </div>
    )
  return (
    <div className={cn('k-bsr', className)} data-slot="board-strength-rank">
      <DataGrid
        classNames={{ root: 'k-bsr-grid' }}
        columns={COLUMNS}
        layout={layout}
        rows={lines}
        rowId={(line) => line.id}
        label={labels.list}
        presorted
        rowProps={(line) => ({ 'data-board': line.id, 'data-rank': line.rank })}
        isOpened={(line) => line.id === selected}
        onOpen={(line) => onSelect?.(line)}
        density="relaxed"
        stretch
        fit
        maxHeight={560}
      />
    </div>
  )
}
