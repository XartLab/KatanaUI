// SPDX-License-Identifier: MIT
// 图的表格视图（dataviz.md §4：无障碍兜底，每张图必须有）：图右上的「表格视图」按钮打开它，同一份数据写成一张表，键盘可达（滚动区可聚焦）。
// 第一列是行头。表头与读屏名只从 props 来。复用 series.css 的 .k-sx-table 皮肤。
import type { ReactNode } from 'react'
import type { ChartActionsLabels } from './chart-actions'

/** 每张图都带的「表格视图 / 导出 / 全屏」这一组 props：表格视图总有；导出与全屏的回调不给就不画那个按钮。 */
export type ChartViewProps = {
  /** 图右上三个按钮的名字。 */
  actionLabels: ChartActionsLabels
  /** 表格视图的读屏名。 */
  tableLabel: string
  /** 表头（第一项是行头那一列）。 */
  tableHead: readonly string[]
  /** 来源一行：每个数字能回答从哪来、什么时候（§2.2）。 */
  source?: ReactNode
  onExport?: () => void
  onFullscreen?: () => void
}

export function ChartTable({
  label,
  head,
  rows,
  slot,
  numeric = [],
}: {
  label: string
  head: readonly string[]
  rows: readonly { key: string; cells: readonly ReactNode[] }[]
  slot: string
  numeric?: readonly number[]
}) {
  return (
    <div className="k-sx-table k-ck-table" tabIndex={0} role="region" aria-label={label} data-slot={slot}>
      <table>
        <thead>
          <tr>
            {head.map((text, i) => (
              <th key={i} scope="col" data-num={numeric.includes(i) ? 'true' : undefined}>
                {text}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              {row.cells.map((cell, i) =>
                i === 0 ? (
                  <th key={i} scope="row">
                    {cell}
                  </th>
                ) : (
                  <td key={i} data-num={numeric.includes(i) ? 'true' : undefined}>
                    {cell}
                  </td>
                ),
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
