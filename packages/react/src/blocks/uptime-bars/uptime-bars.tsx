// SPDX-License-Identifier: MIT
// 逐格可用条：一格一天或一小时，颜色加高度一起表达状态（绿满格可用、琥珀半高降级、红满格中断、虚线底无数据），
// 悬停或聚焦一格，条下面的读数行写那一格的整句；左右键在格间走。
// 实时刷新：新进来的格子高亮一阵（共用层 useEnterMarks，1200ms），按格子的 id 认新旧。
// 功能参照 Arc Uptime status（uiarc.dev/llms.txt 目录，2026-11-14 读，页面只写了「逐日可用条」），实现原创；
// 用在数据源 / 连接健康（对 DataSources、SystemHealth 的缺口）。文字全由 props 传。
import { useRef, useState, type ReactNode } from 'react'
import { cn } from '../../lib/cn.ts'
import { useEnterMarks } from '../../lib/live.ts'
import { ChartActions } from '../../lib/chart/chart-kit/chart-actions.tsx'
import { ChartValue, type ChartValueText } from '../../lib/chart/chart-kit/chart-value.tsx'
import { ChartTable, type ChartViewProps } from '../../lib/chart/chart-kit/chart-table.tsx'
import { countStatuses, moveCell, type UptimeCell, type UptimeStatus } from './uptime-bars-model.ts'

export type UptimeBarsProps = ChartViewProps & {
  /** 从旧到新，一格一项。 */
  cells: readonly UptimeCell[]
  /** 这一条的读屏名（整句），如「行情源 A 近 30 天」。 */
  label: string
  /** 没有悬停也没有聚焦时读数行写什么（常是可用率）。 */
  idle?: ReactNode
  /** 四种状态各一个词（灯加词，状态永不单靠颜色，precision-instrument §2.2、§2.5）；给了就在条上面画一行「灯 词 格数」。 */
  statusLabels?: Readonly<Record<UptimeStatus, string>>
  /** 条上面一行右边的可用率读数（LCD 数字，口径由调用方写好，如「99.1 %」）。 */
  availability?: ChartValueText
  /** 条两端的时间（ISO 次序，precision-instrument §2.2），如 ['2026-10-16', '2026-11-14']。 */
  range?: readonly [string, string]
  /** 点一格（给了才可点，格子上 cursor 变手形）。 */
  onSelect?: (cell: UptimeCell) => void
  className?: string
}

export function UptimeBars({
  cells,
  label,
  statusLabels,
  availability,
  actionLabels,
  tableLabel,
  tableHead,
  onExport,
  onFullscreen,
  source,
  range,
  idle,
  onSelect,
  className,
}: UptimeBarsProps) {
  const [hover, setHover] = useState<number | null>(null)
  const [focus, setFocus] = useState<number | null>(null)
  const [tab, setTab] = useState(cells.length - 1)
  const [tableView, setTableView] = useState(false)
  const refs = useRef<(HTMLSpanElement | null)[]>([])
  const stop = Math.min(Math.max(tab, 0), cells.length - 1)
  const shown = hover ?? focus
  const counts = countStatuses(cells)
  const entering = useEnterMarks(cells.map((cell) => cell.id))
  return (
    <div className={`k-uptime${className ? ` ${className}` : ''}`} data-slot="uptime-bars">
      {(statusLabels || availability !== undefined) && (
        <div className="k-uptime-head">
          {statusLabels && (
            <ul className="k-uptime-legend" aria-hidden="true">
              {(['up', 'degraded', 'down', 'none'] as const).map((status) => (
                <li key={status} data-legend={status}>
                  <i className="k-uptime-lamp" />
                  {statusLabels[status]} <span className="k-uptime-count">{counts[status]}</span>
                </li>
              ))}
            </ul>
          )}
          {availability === undefined ? null : (
            <span className="k-uptime-avail">
              <ChartValue text={availability} />
            </span>
          )}
        </div>
      )}
      <div className="k-dist-bar">
        <ChartActions
          labels={actionLabels}
          tableView={tableView}
          onTableView={setTableView}
          onExport={onExport}
          onFullscreen={onFullscreen}
        />
      </div>
      {tableView && (
        <ChartTable
          slot="uptime-table"
          label={tableLabel}
          head={tableHead}
          rows={cells.map((cell) => ({
            key: cell.id,
            cells: [cell.label, statusLabels?.[cell.status] ?? cell.status],
          }))}
        />
      )}
      <div
        hidden={tableView}
        className="k-uptime-bars"
        role="group"
        aria-label={label}
        onMouseLeave={() => setHover(null)}
        onKeyDown={(event) => {
          const next = moveCell(stop, event.key, cells.length)
          if (next === null) return
          event.preventDefault()
          setTab(next)
          refs.current[next]?.focus()
        }}
      >
        {cells.map((cell, index) => (
          <span
            key={cell.id}
            ref={(node) => {
              refs.current[index] = node
            }}
            className={cn('k-uptime-cell', onSelect && 'is-link', entering.has(cell.id) && 'k-live-enter')}
            data-status={cell.status}
            role="img"
            aria-label={cell.label}
            tabIndex={index === stop ? 0 : -1}
            onMouseEnter={() => setHover(index)}
            onFocus={() => {
              setFocus(index)
              setTab(index)
            }}
            onBlur={() => setFocus(null)}
            onClick={onSelect ? () => onSelect(cell) : undefined}
            onKeyDown={
              onSelect
                ? (event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      onSelect(cell)
                    }
                  }
                : undefined
            }
          />
        ))}
      </div>
      {range && !tableView && (
        <div className="k-uptime-range" aria-hidden="true">
          <span>{range[0]}</span>
          <span>{range[1]}</span>
        </div>
      )}
      <output className="k-uptime-readout" hidden={tableView}>
        {shown === null ? idle : cells[shown]?.label}
      </output>
      {source === undefined ? null : <p className="k-dist-source">{source}</p>}
    </div>
  )
}
