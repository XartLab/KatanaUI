// SPDX-License-Identifier: MIT
// SeriesExplorer 的表格视图：图换成明细表（最新的在最上面），扫读中的那一行高亮；盈亏列按正负着涨跌色。从 series-explorer.tsx 拆出（G5），行为不变。
import type { SeriesPoint } from './series-explorer-model.ts'
import type { SeriesExplorerColumn, SeriesExplorerLabels } from './series-explorer-types.ts'

const toneOf = (value: number | null) => (value === null || value === 0 ? 'flat' : value > 0 ? 'up' : 'down')

export type SeriesTableProps = {
  /** 已按新到旧排好的行；i 是这一点在窗口里的下标。 */
  rows: readonly { point: SeriesPoint; i: number }[]
  columns: readonly SeriesExplorerColumn[]
  labels: SeriesExplorerLabels
  formatAt: (at: number) => string
  /** 扫读中的下标。 */
  active: number | null
}

export function SeriesTable({ rows, columns, labels, formatAt, active }: SeriesTableProps) {
  return (
    <div className="k-sx-table" tabIndex={0} role="region" aria-label={labels.table} data-slot="series-table">
      <table>
        <thead>
          <tr>
            <th scope="col">{labels.time}</th>
            {columns.map((column) => (
              <th key={column.key} scope="col">
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ point, i }) => (
            <tr key={point.at} data-active={active === i ? 'true' : undefined}>
              <th scope="row">{formatAt(point.at)}</th>
              {columns.map((column) => (
                <td key={column.key} data-tone={column.tone ? toneOf(column.tone(point)) : undefined}>
                  {column.text(point)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
