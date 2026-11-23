// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import type { GridColumn } from './columns.ts'
import { DataGrid } from './data-grid.tsx'

// layout 管哪些列画、按什么次序：columns 里声明了、layout 里没写的列不画（同一份列声明给整页表与面板密表共用时，面板只写它要的几列）。

describe('DataGrid 只画 layout 里写了的列', () => {
  type R = { id: string; a: number; b: number; c: number }
  const columns: GridColumn<R>[] = [
    { id: 'a', type: 'number', value: (r) => r.a },
    { id: 'b', type: 'number', value: (r) => r.b },
    { id: 'c', type: 'number', value: (r) => r.c },
  ]

  it('没写进 layout 的 b 不出表头也不出格子；写了但 visible: false 的照旧不画', () => {
    const html = renderToStaticMarkup(
      <DataGrid<R>
        columns={columns}
        layout={[
          { id: 'c', label: 'C', width: 80, visible: true },
          { id: 'a', label: 'A', width: 80, visible: false },
        ]}
        rows={[{ id: 'r1', a: 1, b: 2, c: 3 }]}
        rowId={(r) => r.id}
        label="t"
        collapseColumns={false}
      />,
    )
    expect(html).toContain('data-col="c"')
    expect(html).not.toContain('data-col="b"')
    expect(html).not.toContain('data-col="a"')
  })
})
