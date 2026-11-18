// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import type { GridColumn } from './columns.ts'
import { DataGrid } from './data-grid.tsx'
import { aggregateValues, summaryCells, type GridSummary } from './grid-summary-row.tsx'

type Row = { sym: string; qty: number; pnl: number; px: string }
const rows: Row[] = [
  { sym: 'AAA', qty: 100, pnl: 12.5, px: '10.10' },
  { sym: 'BBB', qty: 300, pnl: -40, px: '20.30' },
  { sym: 'CCC', qty: 200, pnl: 7.5, px: '' },
]
const columns: GridColumn<Row>[] = [
  { id: 'sym', type: 'symbol', value: (r) => r.sym },
  { id: 'qty', type: 'quantity', value: (r) => r.qty },
  { id: 'pnl', type: 'pnl', value: (r) => r.pnl },
  { id: 'px', type: 'price', value: (r) => r.px, format: { precision: 2 } },
]

describe('aggregateValues', () => {
  it('五种聚合加计数；空的是 null（计数是 0）', () => {
    const v = [3, 1, 2, 10]
    expect(aggregateValues('sum', v)).toBe(16)
    expect(aggregateValues('avg', v)).toBe(4)
    expect(aggregateValues('min', v)).toBe(1)
    expect(aggregateValues('max', v)).toBe(10)
    expect(aggregateValues('median', v)).toBe(2.5)
    expect(aggregateValues('median', [5, 1, 3])).toBe(3)
    expect(aggregateValues('count', v)).toBe(4)
    expect(aggregateValues('sum', [])).toBeNull()
    expect(aggregateValues('count', [])).toBe(0)
    expect(aggregateValues((values) => values.length * 2, v)).toBe(8)
  })
})

describe('summaryCells', () => {
  it('照列类型写字：盈亏带符号与方向，价格按精度，空格跳过；计数是整数', () => {
    const summary: GridSummary<Row> = {
      id: 'total',
      label: '合计',
      columns: { qty: 'sum', pnl: 'sum', px: 'avg', sym: 'count' },
    }
    const cells = summaryCells(columns, rows, summary)
    expect(cells.get('pnl')!.cell.text).toBe('-20.00')
    expect(cells.get('pnl')!.cell.direction).toBe('down')
    expect(cells.get('px')!.value).toBeCloseTo(15.2)
    expect(cells.get('px')!.cell.text).toBe('15.20')
    expect(cells.get('sym')!.cell.text).toBe('0') // 品种不是数：一个有效值也没有
    expect(cells.get('qty')!.value).toBe(600)
  })

  it('自己写字的盖掉类型的写法', () => {
    const cells = summaryCells(columns, rows, {
      id: 'x',
      label: 'x',
      columns: { qty: { aggregate: 'max', text: (v) => `max ${v}` } },
    })
    expect(cells.get('qty')!.cell.text).toBe('max 300')
    expect(cells.has('pnl')).toBe(false)
  })
})

describe('DataGrid summary', () => {
  it('表尾一组 rowgroup：第一个没配聚合的列写行名，行数算进 aria-rowcount', () => {
    const html = renderToStaticMarkup(
      <DataGrid
        columns={columns}
        layout={columns.map((c) => ({ id: c.id, label: c.id, width: 80, visible: true }))}
        rows={rows}
        rowId={(r) => r.sym}
        label="持仓"
        summary={[
          { id: 'sum', label: '合计', columns: { qty: 'sum', pnl: 'sum' } },
          { id: 'avg', label: '均值', columns: { pnl: 'avg' } },
          { id: 'hidden', label: '空', columns: { nope: 'sum' } },
        ]}
      />,
    )
    expect(html).toContain('data-slot="grid-summary"')
    expect(html).toContain('data-summary="sum"')
    expect(html).toContain('aria-rowcount="6"')
    expect(html).toMatch(/role="rowheader"[^>]*>合计</)
    expect(html).toContain('-20.00')
    expect(html).not.toContain('data-summary="hidden"') // 看得见的列都没配聚合：不画
  })
})
