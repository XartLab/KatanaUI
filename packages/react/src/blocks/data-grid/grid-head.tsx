// SPDX-License-Identifier: MIT
/**
 * Header row of DataGrid: sort buttons, drag to reorder, resize handles.
 * DataGrid 的表头（体检 §7 从 data-grid.tsx 拆出）：排序按钮、拖列头重排、拖宽把手、列头附加内容与右端内容。
 */
import { useState, type CSSProperties, type PointerEvent, type ReactNode, type RefObject } from 'react'
import { cn } from '../../lib/cn.ts'
import type { GridColumnLayout } from './data-grid-props.ts'
import type { ResolvedGridLabels } from './host.tsx'
import { reorderColumn } from './layout-model.ts'

/** 表头上的一列：宽度与排序状态来自表的行为层。 */
export type HeadColumn = {
  id: string
  size: number
  sorted: false | 'asc' | 'desc'
  toggleSorting: () => void
}

type GridHeadProps = {
  columns: readonly HeadColumn[]
  layout: readonly GridColumnLayout[]
  layoutOf: ReadonlyMap<string, GridColumnLayout>
  labels: ResolvedGridLabels
  template: string
  height: number
  interactive: boolean
  sortable: boolean
  alignOf: (columnId: string) => 'start' | 'end'
  stickClass: (columnId: string) => string
  stickStyle: (columnId: string) => CSSProperties | undefined
  /** 拖宽进行中不许起拖。 */
  resizing: RefObject<boolean>
  headExtra?: (columnId: string) => ReactNode
  headEnd?: ReactNode
  onLayoutChange?: (next: GridColumnLayout[]) => void
  onResize?: (id: string, width: number) => void
  startResize: (event: PointerEvent<HTMLElement>, columnId: string, width: number) => void
  fitColumns: (ids: readonly string[]) => void
  className?: string
  colClassName?: string
}

function HeadName({ name, sub }: { name: string; sub?: string }) {
  return (
    <span className="k-grid-head-name">
      <span>{name}</span>
      {sub ? <small className="k-grid-head-sub">{sub}</small> : null}
    </span>
  )
}

export function GridHead({
  columns,
  layout,
  layoutOf,
  labels,
  template,
  height,
  interactive,
  sortable,
  alignOf,
  stickClass,
  stickStyle,
  resizing,
  headExtra,
  headEnd,
  onLayoutChange,
  onResize,
  startResize,
  fitColumns,
  className,
  colClassName,
}: GridHeadProps) {
  // 拖列头重排：dragFrom 是被拖的列，dropOn 是正悬在哪一列上。
  const [dragFrom, setDragFrom] = useState<string | null>(null)
  const [dropOn, setDropOn] = useState<string | null>(null)
  const end = () => {
    setDragFrom(null)
    setDropOn(null)
  }
  return (
    <div
      role="row"
      aria-rowindex={1}
      className={cn('k-grid-head', className)}
      style={{ gridTemplateColumns: template, height }}
    >
      {columns.map((column) => {
        const state = column.sorted
        const name = layoutOf.get(column.id)?.label ?? column.id
        const sub = layoutOf.get(column.id)?.sub
        return (
          <div
            key={column.id}
            role="columnheader"
            data-col={column.id}
            draggable={interactive && onLayoutChange ? true : undefined}
            onDragStart={(event) => {
              if (resizing.current) return event.preventDefault()
              event.dataTransfer.effectAllowed = 'move'
              event.dataTransfer.setData('text/plain', column.id)
              setDragFrom(column.id)
            }}
            onDragOver={(event) => {
              if (dragFrom === null) return
              event.preventDefault()
              if (dropOn !== column.id) setDropOn(column.id)
            }}
            onDrop={(event) => {
              event.preventDefault()
              if (dragFrom !== null && dragFrom !== column.id)
                onLayoutChange?.(reorderColumn(layout, dragFrom, column.id))
              end()
            }}
            onDragEnd={end}
            aria-sort={sortable ? (state ? (state === 'desc' ? 'descending' : 'ascending') : 'none') : undefined}
            className={cn(
              'k-grid-col',
              alignOf(column.id) === 'end' && 'is-end',
              dragFrom === column.id && 'is-dragging',
              dropOn === column.id && dragFrom !== null && dragFrom !== column.id && 'is-drop',
              stickClass(column.id),
              colClassName,
            )}
            style={stickStyle(column.id)}
          >
            {interactive && sortable ? (
              <button
                type="button"
                className={state ? 'is-sorted' : undefined}
                title={labels.sortTitle({ id: column.id, label: name })}
                onClick={column.toggleSorting}
              >
                {state && (
                  <span className="k-grid-sort" aria-hidden="true">
                    {state === 'desc' ? '▼' : '▲'}
                  </span>
                )}
                <HeadName name={name} sub={sub} />
              </button>
            ) : (
              <span className="k-grid-head-text">
                <HeadName name={name} sub={sub} />
              </span>
            )}
            {headExtra?.(column.id)}
            {onResize && (
              <span
                className="k-grid-resize"
                role="separator"
                aria-orientation="vertical"
                aria-label={labels.resizeLabel({ id: column.id, label: name })}
                onPointerDown={(event) => startResize(event, column.id, column.size)}
                onDoubleClick={() => fitColumns([column.id])}
              />
            )}
          </div>
        )
      })}
      {headEnd ? (
        <div className="k-grid-head-end" role="columnheader" data-slot="grid-head-end">
          {headEnd}
        </div>
      ) : null}
    </div>
  )
}
