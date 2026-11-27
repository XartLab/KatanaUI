// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import type { GridColumn } from './columns.ts'
import { FIT_MAX_WIDTH, fitColumnWidth, isFittable } from './fit-width.ts'

type Row = { note: string }
const fonts = {
  head: '600 12px sans-serif',
  sub: '400 10px sans-serif',
  cell: '500 12px sans-serif',
  tag: '500 11px sans-serif',
}
const text: GridColumn<Row> = { id: 'note', value: (row) => row.note }
const fit = (column: GridColumn<Row>, rows: Row[], label = 'Note') =>
  fitColumnWidth({ column, label, rows, env: {}, fonts, sortable: true, minWidth: 24 })

describe('fitColumnWidth', () => {
  it('更长的内容给更宽的列，且不超过上限', () => {
    const short = fit(text, [{ note: 'ab' }])!
    const long = fit(text, [{ note: 'ab' }, { note: 'a much longer note than the first' }])!
    expect(long).toBeGreaterThan(short)
    expect(fit(text, [{ note: 'x'.repeat(500) }])).toBe(FIT_MAX_WIDTH)
  })
  it('没有数据时也放得下列头，不小于最小列宽', () => {
    expect(fit(text, [], 'A very long column title')!).toBeGreaterThan(fit(text, [], 'A')!)
    expect(fit(text, [], '')!).toBeGreaterThanOrEqual(24)
  })
  it('只量前 1000 行', () => {
    const rows = Array.from({ length: 1001 }, (_, at) => ({ note: at === 1000 ? 'y'.repeat(60) : 'a' }))
    expect(fit(text, rows)).toBe(fit(text, rows.slice(0, 1000)))
  })
  it('custom 列与自画的列不改宽', () => {
    expect(isFittable({ id: 'c', type: 'custom' })).toBe(false)
    expect(fit({ id: 'c', cell: () => null }, [{ note: 'abc' }])).toBeUndefined()
    expect(fit({ id: 'r', render: () => null }, [{ note: 'abc' }])).toBeUndefined()
  })
})
