// SPDX-License-Identifier: MIT
// 周期收益表（#120，对照 MultiCharts 的 Strategy Performance Report 的 Period Analysis）：年 × 月的收益热力表，可切季、周，行尾是年度合计。
// 色阶是涨跌发散色（涨端 --div-pos-200、跌端 --div-neg-200，零附近落在中性灰，不用彩虹）；每格仍写数字，颜色只是辅助，周视图格子太窄才只留颜色，数在读数区与 title 里。
// 数据是细粒度的收益样本（日收益或逐笔），件按周期复利聚合（period-returns-model.ts），时区由调用方给。键盘：Tab 进表，方向键在格间走，Home / End 到行首尾。
import { useState, type KeyboardEvent } from 'react'
import { cn } from '../lib/cn.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import {
  aggregateReturns,
  padRows,
  periodLimit,
  type PeriodRow,
  type PeriodUnit,
  type ReturnSample,
} from './period-returns-model.ts'
import { DIVERGING_GRADIENT, divergingColor, divergingShare } from './research-color.ts'

export type PeriodReturnsLabels = {
  unitGroup: string
  month: string
  quarter: string
  week: string
  /** 行头那一列的表头，如「年」。 */
  year: string
  /** 行尾那一列的表头，如「全年」。 */
  total: string
  /** 月、季的列头（12 个、4 个），周的列头是第几周（从 1 起）。 */
  monthNames: readonly string[]
  quarterNames: readonly string[]
  weekName: (week: number) => string
  /** 没选格时读数区写什么。 */
  idle: string
  /** 没有样本时写什么。 */
  empty: string
}

export type PeriodReturnsTableProps = {
  samples: readonly ReturnSample[]
  /** 表的读屏名。 */
  label: string
  /** 周期；不给用内部状态（默认 month）。 */
  unit?: PeriodUnit
  onUnitChange?: (unit: PeriodUnit) => void
  /** 样本时刻所在时区相对 UTC 的分钟数（东八区 480）；默认 0。 */
  utcOffsetMinutes?: number
  /** 小数收益的写法（0.0123 → 「+1.23%」）；调用方定位数与符号。 */
  formatPercent: (value: number) => string
  /** 读数里一格的名字，如「2026 · 3 月」。 */
  formatPeriod: (year: number, unit: PeriodUnit, column: number) => string
  /** 着色的上限（绝对值，小数）；不给取表里最大的格。固定它可以让几张表用同一把尺。 */
  scaleLimit?: number
  labels: PeriodReturnsLabels
  source?: string
  className?: string
}

const toneOf = (value: number): 'up' | 'down' | 'flat' => (value > 0 ? 'up' : value < 0 ? 'down' : 'flat')

export function PeriodReturnsTable({
  samples,
  label,
  unit: unitProp,
  onUnitChange,
  utcOffsetMinutes = 0,
  formatPercent,
  formatPeriod,
  scaleLimit,
  labels,
  source,
  className,
}: PeriodReturnsTableProps) {
  const [unitState, setUnit] = useState<PeriodUnit>('month')
  const [picked, setPicked] = useState<{ row: number; column: number } | null>(null)
  const unit = unitProp ?? unitState
  const raw = aggregateReturns(samples, unit, utcOffsetMinutes)
  const width = unit === 'month' ? 12 : unit === 'quarter' ? 4 : Math.max(52, ...raw.map((row) => row.cells.length))
  const rows: PeriodRow[] = padRows(raw, width)
  const limit = scaleLimit ?? periodLimit(rows)
  const compact = unit === 'week'
  const heads =
    unit === 'month'
      ? labels.monthNames
      : unit === 'quarter'
        ? labels.quarterNames
        : Array.from({ length: width }, (_, i) => labels.weekName(i + 1))
  const cell = picked === null ? null : (rows[picked.row]?.cells[picked.column] ?? null)

  const move = (event: KeyboardEvent<HTMLTableElement>) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('[data-r]')
    if (!target) return
    const r = Number(target.dataset.r)
    const c = Number(target.dataset.c)
    const last = rows.length - 1
    const next =
      event.key === 'ArrowLeft'
        ? [r, Math.max(0, c - 1)]
        : event.key === 'ArrowRight'
          ? [r, Math.min(width - 1, c + 1)]
          : event.key === 'ArrowUp'
            ? [Math.max(0, r - 1), c]
            : event.key === 'ArrowDown'
              ? [Math.min(last, r + 1), c]
              : event.key === 'Home'
                ? [r, 0]
                : event.key === 'End'
                  ? [r, width - 1]
                  : null
    if (next === null) return
    event.preventDefault()
    event.currentTarget.querySelector<HTMLElement>(`[data-r="${next[0]}"][data-c="${next[1]}"]`)?.focus()
  }

  return (
    <figure className={cn('k-pr', className)} data-slot="period-returns-table" data-unit={unit}>
      <div className="k-pr-head">
        <ToggleGroup
          size="sm"
          aria-label={labels.unitGroup}
          value={unit}
          onValueChange={(next) => {
            if (next !== 'month' && next !== 'quarter' && next !== 'week') return
            setUnit(next)
            setPicked(null)
            onUnitChange?.(next)
          }}
        >
          <ToggleGroupItem value="month">{labels.month}</ToggleGroupItem>
          <ToggleGroupItem value="quarter">{labels.quarter}</ToggleGroupItem>
          <ToggleGroupItem value="week">{labels.week}</ToggleGroupItem>
        </ToggleGroup>
        {limit > 0 && (
          <span className="k-pr-scale" data-slot="period-returns-scale" aria-hidden="true">
            <span>{formatPercent(-limit)}</span>
            <i style={{ backgroundImage: DIVERGING_GRADIENT }} />
            <span>{formatPercent(limit)}</span>
          </span>
        )}
      </div>
      {rows.length === 0 ? (
        <p className="k-pr-empty" data-slot="period-returns-empty">
          {labels.empty}
        </p>
      ) : (
        <div className="k-pr-scroll" data-compact={compact ? '' : undefined}>
          <table className="k-pr-table" aria-label={label} onKeyDown={move}>
            <thead>
              <tr>
                <th scope="col">{labels.year}</th>
                {heads.map((head, column) => (
                  <th key={column} scope="col" data-slot="period-returns-colhead">
                    {head}
                  </th>
                ))}
                <th scope="col" className="k-pr-total-head">
                  {labels.total}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, r) => (
                <tr key={row.year} data-year={row.year}>
                  <th scope="row">{row.year}</th>
                  {row.cells.map((value, c) => {
                    const text = value === null ? '' : formatPercent(value.value)
                    const share = value === null ? 0 : divergingShare(value.value, limit)
                    return (
                      <td
                        key={c}
                        className="k-pr-cell"
                        data-slot="period-returns-cell"
                        data-r={r}
                        data-c={c}
                        data-tone={value === null ? 'none' : toneOf(value.value)}
                        data-picked={picked?.row === r && picked.column === c ? '' : undefined}
                        style={value === null ? undefined : { background: divergingColor(share) }}
                        tabIndex={
                          picked === null
                            ? r === 0 && c === 0
                              ? 0
                              : -1
                            : picked.row === r && picked.column === c
                              ? 0
                              : -1
                        }
                        title={value === null ? undefined : `${formatPeriod(row.year, unit, c)}  ${text}`}
                        onPointerEnter={() => setPicked({ row: r, column: c })}
                        onFocus={() => setPicked({ row: r, column: c })}
                      >
                        <span className={compact ? 'k-pr-sr' : undefined}>{text}</span>
                      </td>
                    )
                  })}
                  <td className="k-pr-total" data-slot="period-returns-total" data-tone={toneOf(row.total)}>
                    {formatPercent(row.total)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <output className="k-pr-readout" data-slot="period-returns-readout">
        {picked === null || cell === null ? (
          labels.idle
        ) : (
          <>
            <span>{formatPeriod(rows[picked.row]!.year, unit, picked.column)}</span>
            <b data-tone={toneOf(cell.value)}>{formatPercent(cell.value)}</b>
          </>
        )}
      </output>
      {source !== undefined && <p className="k-dist-source">{source}</p>}
    </figure>
  )
}
