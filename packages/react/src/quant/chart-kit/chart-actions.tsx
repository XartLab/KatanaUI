// SPDX-License-Identifier: MIT
// 每张图右上角三个图标（dataviz.md §4）：表格视图（无障碍兜底，必须有）· 导出 CSV · 全屏。导出与全屏的回调由调用方给，不给就不画那个按钮；表格视图总有。
// 文字（读屏名、提示）只从 props 来。
import { DownloadIcon, ExpandIcon, TableIcon } from 'lucide-react'

export type ChartActionsLabels = { group: string; table: string; exportCsv: string; fullscreen: string }

export type ChartActionsProps = {
  labels: ChartActionsLabels
  /** 表格视图开着吗（受控）。 */
  tableView: boolean
  onTableView: (on: boolean) => void
  onExport?: () => void
  onFullscreen?: () => void
}

export function ChartActions({ labels, tableView, onTableView, onExport, onFullscreen }: ChartActionsProps) {
  return (
    <div className="k-ck-actions" data-slot="chart-actions" role="group" aria-label={labels.group}>
      <button
        type="button"
        className="k-ck-action"
        data-action="table"
        aria-pressed={tableView}
        aria-label={labels.table}
        title={labels.table}
        onClick={() => onTableView(!tableView)}
      >
        <TableIcon size={14} aria-hidden="true" />
      </button>
      {onExport === undefined ? null : (
        <button
          type="button"
          className="k-ck-action"
          data-action="export"
          aria-label={labels.exportCsv}
          title={labels.exportCsv}
          onClick={onExport}
        >
          <DownloadIcon size={14} aria-hidden="true" />
        </button>
      )}
      {onFullscreen === undefined ? null : (
        <button
          type="button"
          className="k-ck-action"
          data-action="fullscreen"
          aria-label={labels.fullscreen}
          title={labels.fullscreen}
          onClick={onFullscreen}
        >
          <ExpandIcon size={14} aria-hidden="true" />
        </button>
      )}
    </div>
  )
}
