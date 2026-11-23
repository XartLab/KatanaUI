// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import type { GridColumn } from './columns.ts'
import { DataGrid, type GridColumnLayout } from './data-grid.tsx'

// DataGrid 的分节（#87 第 1 条）：标题行不参与按列排序、可收起、写行数与组内汇总。示例数据，不是行情。

type Row = { id: string; name: string; chg: number; section?: string }
const ROWS: Row[] = [
  { id: 'sec-a', name: '', chg: 0, section: 'Crypto' },
  { id: 'btc', name: 'BTC', chg: -1 },
  { id: 'eth', name: 'ETH', chg: 3 },
  { id: 'sec-b', name: '', chg: 0, section: 'Stocks' },
  { id: 'nvda', name: 'NVDA', chg: 2 },
  { id: 'qqq', name: 'QQQ', chg: -4 },
]
const columns: GridColumn<Row>[] = [
  { id: 'name', type: 'text', value: (row) => row.name },
  { id: 'chg', type: 'change', value: (row) => row.chg },
]
const layout: GridColumnLayout[] = [
  { id: 'name', label: 'Symbol', width: 120, visible: true },
  { id: 'chg', label: 'Chg%', width: 80, visible: true },
]

const render = (extra: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    <DataGrid
      columns={columns}
      layout={layout}
      rows={ROWS}
      rowId={(row) => row.id}
      label="Watchlist"
      rowSection={(row) => row.section}
      {...extra}
    />,
  )
/** 画出来的行的 id，按 DOM 先后。 */
const rowIds = (html: string) => [...html.matchAll(/data-row="([^"]+)"/g)].map((match) => match[1])

describe('DataGrid 分节', () => {
  it('按列排序时标题行留在原处，行在各自节里排', () => {
    const html = render({ sort: { id: 'chg', desc: true }, onSortChange: () => {} })
    expect(rowIds(html)).toEqual(['sec-a', 'eth', 'btc', 'sec-b', 'nvda', 'qqq'])
  })

  it('标题行写这一节的行数，带收起钮（展开时 aria-expanded=true）', () => {
    const html = render()
    expect(html.match(/data-slot="grid-section-count">(\d+)</g)).toEqual([
      'data-slot="grid-section-count">2<',
      'data-slot="grid-section-count">2<',
    ])
    expect(html).toContain('aria-label="Collapse section"')
    expect(html).toMatch(/data-row="sec-a"[^>]*aria-expanded="true"/)
  })

  it('收起的节只留标题行，个数照写；受控的 collapsedSections 同样生效', () => {
    const own = render({ defaultCollapsedSections: ['sec-a'] })
    expect(rowIds(own)).toEqual(['sec-a', 'sec-b', 'nvda', 'qqq'])
    expect(own).toContain('aria-label="Expand section"')
    expect(own).toMatch(/data-row="sec-a"[^>]*aria-expanded="false"/)
    expect(own).toContain('data-slot="grid-section-count">2<')
    const controlled = render({ collapsedSections: new Set(['sec-b']) })
    expect(rowIds(controlled)).toEqual(['sec-a', 'btc', 'eth', 'sec-b'])
  })

  it('组内汇总拿到这一节的全部行（收起的也给全）', () => {
    const html = render({
      defaultCollapsedSections: ['sec-b'],
      sectionSummary: (rows: readonly Row[]) => `avg ${rows.reduce((sum, row) => sum + row.chg, 0) / rows.length}`,
    })
    expect(html.match(/data-slot="grid-section-summary">([^<]+)</g)).toEqual([
      'data-slot="grid-section-summary">avg 1<',
      'data-slot="grid-section-summary">avg -1<',
    ])
  })
})
