// SPDX-License-Identifier: MIT
// SeriesExplorer 的顶行（Toolbar）：标题、窗口起止，右边区间切换与图右上三件（表格视图、导出、全屏）。从 series-explorer.tsx 拆出（G5），行为不变。
import { DownloadIcon, ExpandIcon, TableIcon } from 'lucide-react'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import { Toolbar, ToolbarGroup, ToolButton } from '../toolbar/toolbar.tsx'
import type { RangeDef } from './series-explorer-model.ts'
import type { SeriesExplorerLabels } from './series-explorer-types.ts'

export type SeriesHeadProps = {
  labels: SeriesExplorerLabels
  ranges: readonly RangeDef[]
  /** 亮着的区间；拖过刷选条后是 null（没有区间按钮亮）。 */
  rangeKey: string | null
  onRange: (key: string) => void
  /** 窗口起止的文字（「2026-01 – 2026-09」）。 */
  span: string
  table: boolean
  onTable: () => void
  onExport?: () => void
  onFullscreen?: () => void
}

export function SeriesHead({
  labels,
  ranges,
  rangeKey,
  onRange,
  span,
  table,
  onTable,
  onExport,
  onFullscreen,
}: SeriesHeadProps) {
  return (
    <div className="k-sx-head" data-slot="series-head">
      <Toolbar label={labels.actions.group}>
        <ToolbarGroup side="left">
          <h4 className="k-sx-title" data-slot="series-title">
            {labels.chart}
          </h4>
          <span className="k-sx-span" data-slot="series-span">
            {span}
          </span>
        </ToolbarGroup>
        <ToolbarGroup side="right">
          <ToggleGroup variant="sm" aria-label={labels.ranges} value={rangeKey} onValueChange={onRange}>
            {ranges.map((item) => (
              <ToggleGroupItem key={item.key} value={item.key}>
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <ToolButton label={labels.actions.table} pressed={table} onClick={onTable}>
            <TableIcon size={16} aria-hidden="true" />
          </ToolButton>
          {onExport === undefined ? null : (
            <ToolButton label={labels.actions.exportCsv} onClick={onExport}>
              <DownloadIcon size={16} aria-hidden="true" />
            </ToolButton>
          )}
          {onFullscreen === undefined ? null : (
            <ToolButton label={labels.actions.fullscreen} onClick={onFullscreen}>
              <ExpandIcon size={16} aria-hidden="true" />
            </ToolButton>
          )}
        </ToolbarGroup>
      </Toolbar>
    </div>
  )
}
