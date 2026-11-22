// SPDX-License-Identifier: MIT
// 每张图右上角三个图标（dataviz.md §4）：表格视图（无障碍兜底，必须有）· 导出 CSV · 全屏。导出与全屏的回调由调用方给，不给就不画那个按钮；表格视图总有。
// 文字（读屏名、提示）只从 props 来。
// 复制图（#77 第 4 条，#22 G11）：给了 onCopyImage 就在导出与全屏之间多一个相机钮，点了把图的根（最近的 figure）交给回调，
//   回调里调 lib/copy-image 的 copyImage(根) 拍 PNG 写剪贴板，结果交给 katana/copy-toast 提示。这一组自己带 data-copy-image="skip"，不进截图。
import { CameraIcon, DownloadIcon, ExpandIcon, TableIcon } from 'lucide-react'

export type ChartActionsLabels = {
  group: string
  table: string
  exportCsv: string
  fullscreen: string
  /** 复制图的读屏名与提示；没给（或没给 onCopyImage）就不画这个钮，包里不带兜底文案。 */
  copyImage?: string
}

export type ChartActionsProps = {
  labels: ChartActionsLabels
  /** 表格视图开着吗（受控）。 */
  tableView: boolean
  onTableView: (on: boolean) => void
  onExport?: () => void
  onFullscreen?: () => void
  /** 复制图：参数是图的根（最近的 figure，没有就是这一组的父元素）。要在回调里直接调 copyImage，别先 await 别的，浏览器才认点击手势。 */
  onCopyImage?: (chart: HTMLElement) => void
}

export function ChartActions({
  labels,
  tableView,
  onTableView,
  onExport,
  onFullscreen,
  onCopyImage,
}: ChartActionsProps) {
  return (
    <div
      className="k-ck-actions"
      data-slot="chart-actions"
      data-copy-image="skip"
      role="group"
      aria-label={labels.group}
    >
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
      {onCopyImage === undefined || labels.copyImage === undefined ? null : (
        <button
          type="button"
          className="k-ck-action"
          data-action="copy-image"
          aria-label={labels.copyImage}
          title={labels.copyImage}
          onClick={(event) => {
            const group = event.currentTarget.parentElement
            const chart = event.currentTarget.closest('figure') ?? group?.parentElement ?? group
            if (chart) onCopyImage(chart)
          }}
        >
          <CameraIcon size={14} aria-hidden="true" />
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
