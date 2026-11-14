// SPDX-License-Identifier: MIT
// @katana-ui/react/blocks 的出口：拼面板用的积木（#1869）。包里最上一层，可以用下面所有层（lib、primitives、katana、patterns、quant），
// 不依赖应用：应用才有的能力（快捷键表、文案、右键菜单怎么画、问 Agent）经 DataGridHost 这类 context 或 props 传进来，没提供时件照常能用。
export { DataGrid } from './data-grid/data-grid.tsx'
export type { DataGridProps, GridColumnLayout, GridDensity, GridSlot } from './data-grid/data-grid.tsx'
export type { ColumnFormat, ColumnType, GridColumn, GridSide, GridTone, SymbolValue } from './data-grid/columns.ts'
export {
  DataGridHostProvider,
  type DataGridHost,
  type DataGridTexts,
  type GridAction,
  type GridMenuEntry,
} from './data-grid/host.tsx'
export { tableCsv, type SortSpec } from './data-grid/model.ts'
export { EmptyState, type EmptyStateSlot } from './empty-state.tsx'
export { EstimateBadge } from './estimate-badge.tsx'
export { Toolbar, ToolbarGroup, ToolButton, ToolSlot } from './toolbar/toolbar.tsx'
export { useRovingToolbar } from './toolbar/use-roving-toolbar.ts'
