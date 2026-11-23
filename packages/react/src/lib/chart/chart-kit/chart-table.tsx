// SPDX-License-Identifier: MIT
// 图的表格视图（dataviz.md §4：无障碍兜底，每张图必须有）：图右上的「表格视图」按钮打开它，同一份数据写成一张表，键盘可达（滚动区可聚焦）。
// 第一列是行头。行多时（>= VIRTUAL_FROM）用 @tanstack/react-virtual 只画看得见的那一段（照 DataGrid 的写法：固定行高、上下各一行占位撑出滚动高度）；行少时照旧全画。
// 表头与读屏名只从 props 来。复用 series-explorer.css 的 .k-sx-table 皮肤。
import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, type ReactNode } from 'react'
import type { ChartActionsLabels } from './chart-actions.tsx'

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
  /** Copy-image handler (camera button; also give actionLabels.copyImage); receives this chart's figure for copyImage. */
  onCopyImage?: (chart: HTMLElement) => void
}

/** 行高（px）：.k-ck-table 在虚拟滚动时把行固定成这个高（单元格 4px 上下内边距加一行 16px 的字，再加 1px 底线，取整到 28 留余量）。 */
const ROW_H = 28
/** 达到它才虚拟滚动：表的可视高是 240px（约 8 行），这里取 50 行（约 6 屏）——再少全画，DOM 也就几十行；视觉取值，待定。 */
const VIRTUAL_FROM = 50
const VIEW_H = 240

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
  const scroller = useRef<HTMLDivElement>(null)
  const virtual = rows.length >= VIRTUAL_FROM
  // 返回的函数不能被 React Compiler 记忆化（编译器会跳过这个组件，是预期的）；只在这个组件里用，不传给别的记忆化组件。
  // oxlint-disable-next-line react/incompatible-library
  const virtualizer = useVirtualizer({
    count: virtual ? rows.length : 0,
    getScrollElement: () => scroller.current,
    estimateSize: () => ROW_H,
    overscan: 8,
    initialRect: { width: 0, height: VIEW_H },
    getItemKey: (index) => rows[index]!.key,
  })
  const items = virtual ? virtualizer.getVirtualItems() : []
  const shown = virtual ? items.map((item) => rows[item.index]!) : rows
  const padTop = items.length > 0 ? items[0]!.start : 0
  const padBottom = items.length > 0 ? virtualizer.getTotalSize() - items[items.length - 1]!.end : 0
  return (
    <div
      ref={scroller}
      className="k-sx-table k-ck-table"
      data-virtual={virtual ? 'true' : undefined}
      data-rows={rows.length}
      tabIndex={0}
      role="region"
      aria-label={label}
      data-slot={slot}
    >
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
          {padTop > 0 && (
            <tr aria-hidden="true" style={{ height: padTop }}>
              <td colSpan={head.length} style={{ padding: 0, border: 0 }} />
            </tr>
          )}
          {shown.map((row) => (
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
          {padBottom > 0 && (
            <tr aria-hidden="true" style={{ height: padBottom }}>
              <td colSpan={head.length} style={{ padding: 0, border: 0 }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
