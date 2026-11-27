// SPDX-License-Identifier: MIT
/**
 * Column width dragging and fit-to-content for DataGrid.
 * DataGrid 的列宽（体检 §7 从 data-grid.tsx 拆出）：拖列宽（拖动中的宽度只在表里记，松手才交给调用方）与「适应内容」。
 */
import { useRef, useState, type PointerEvent, type RefObject } from 'react'
import { fontFor } from '../../lib/text-measure.ts'
import type { CellEnv, GridColumn } from './columns.ts'
import { MIN_WIDTH, type GridColumnLayout } from './data-grid-props.ts'
import { FIT_MAX_ROWS, fitColumnWidth, type FitFonts } from './fit-width.ts'

type Options<Row> = {
  scroller: RefObject<HTMLDivElement | null>
  layout: readonly GridColumnLayout[]
  byId: ReadonlyMap<string, GridColumn<Row>>
  layoutOf: ReadonlyMap<string, GridColumnLayout>
  env: CellEnv
  sortable: boolean
  onResize?: (id: string, width: number) => void
  onLayoutChange?: (next: GridColumnLayout[]) => void
}

/** 适应内容要读字体：字号字重取自画出来的格子 / 列头的 computed style（读样式不是量尺寸），family 走 --font-sans 变量。 */
function fitFonts(root: HTMLElement | null): FitFonts {
  const look = (
    selector: string,
    fallbackWeight: number,
    fallbackSize: number,
    family = '--font-sans',
    weight?: number,
  ) => {
    const node = root?.querySelector<HTMLElement>(selector) ?? undefined
    const style = node ? getComputedStyle(node) : undefined
    const size = Number.parseFloat(style?.fontSize ?? '') || fallbackSize
    return fontFor(
      weight ?? (Number.parseFloat(style?.fontWeight ?? '') || fallbackWeight),
      size,
      family,
      node ?? root ?? undefined,
    )
  }
  return {
    // 列头按排序态的 600 量，排序后字变粗也放得下；小字固定 400 10px（见 .k-grid-head-sub）。
    head: look('.k-grid-col button, .k-grid-head-text', 600, 12, '--font-sans', 600),
    sub: fontFor(400, 10, '--font-sans', root ?? undefined),
    cell: look('.k-grid-cell', 500, 12),
    tag: look('.k-grid-tag', 500, 11, '--font-sans-small'),
  }
}

/** 拖列宽与适应内容；drag 是拖动中那一列的临时宽度。 */
export function useColumnSizing<Row>({
  scroller,
  layout,
  byId,
  layoutOf,
  env,
  sortable,
  onResize,
  onLayoutChange,
}: Options<Row>) {
  const [drag, setDrag] = useState<{ id: string; width: number } | null>(null)
  const resizing = useRef(false)
  const canFit = onResize !== undefined || onLayoutChange !== undefined

  /** 这几列设成列头与数据（排好序的前 FIT_MAX_ROWS 行）里最宽的字。 */
  const fitRows = (ids: readonly string[], rows: readonly Row[]) => {
    const fonts = fitFonts(scroller.current)
    const rowsToFit = rows.slice(0, FIT_MAX_ROWS)
    const next = new Map<string, number>()
    for (const columnId of ids) {
      const spec = byId.get(columnId)
      const at = layoutOf.get(columnId)
      if (!spec || !at) continue
      const width = fitColumnWidth({
        column: spec,
        label: at.label,
        sub: at.sub,
        rows: rowsToFit,
        env,
        fonts,
        sortable,
        minWidth: MIN_WIDTH,
      })
      if (width !== undefined && width !== at.width) next.set(columnId, width)
    }
    if (next.size === 0) return
    // 多列一次写：用 onLayoutChange 整体换，逐列调 onResize 会让调用方用旧 layout 互相覆盖。单列优先走 onResize（跟拖宽同一条路）。
    if (onLayoutChange && (next.size > 1 || !onResize))
      onLayoutChange(
        layout.map((column) => (next.has(column.id) ? { ...column, width: next.get(column.id)! } : column)),
      )
    else for (const [columnId, width] of next) onResize?.(columnId, width)
  }

  const startResize = (event: PointerEvent<HTMLElement>, columnId: string, width: number) => {
    event.preventDefault()
    event.stopPropagation()
    resizing.current = true
    const startX = event.clientX
    const target = event.currentTarget
    target.setPointerCapture(event.pointerId)
    let latest = width
    const move = (next: globalThis.PointerEvent) => {
      latest = Math.max(MIN_WIDTH, Math.round(width + next.clientX - startX))
      setDrag({ id: columnId, width: latest })
    }
    const finish = () => {
      target.removeEventListener('pointermove', move)
      target.removeEventListener('pointerup', finish)
      target.removeEventListener('pointercancel', finish)
      setDrag(null)
      resizing.current = false
      if (latest !== width) onResize?.(columnId, latest)
    }
    target.addEventListener('pointermove', move)
    target.addEventListener('pointerup', finish)
    target.addEventListener('pointercancel', finish)
  }

  return { drag, resizing, canFit, fitRows, startResize }
}
