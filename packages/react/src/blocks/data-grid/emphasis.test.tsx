// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { EmphasisProvider, type Emphasis } from '../../layout/emphasis.tsx'
import type { GridColumn } from './columns.ts'
import { DataGrid, type GridColumnLayout } from './data-grid.tsx'
import { DataGridHostProvider } from './host.tsx'

// DataGrid 认分量（#115）：compact 不出表头、只留排好序之后的前几行；hero 字上一档；standard 是完整的表。密度（行高）不受分量影响。
// compact 的列（#117）：一行只剩名字和一个主数；标了 compact: true 的列才留，一列都没标就留前两个可见列。

type Row = { id: string; name: string; price: number }
const columns: GridColumn<Row>[] = [
  { id: 'name', type: 'text', value: (row) => row.name },
  { id: 'price', type: 'price', value: (row) => row.price, format: { precision: 2 } },
]
const layout: GridColumnLayout[] = [
  { id: 'name', label: '名称', width: 120, visible: true },
  { id: 'price', label: '价格', width: 80, visible: true },
]
const rows: Row[] = Array.from({ length: 12 }, (_, index) => ({
  id: `r${index}`,
  name: `品种${String(index).padStart(2, '0')}`,
  price: index + 1,
}))
const dataGridCss = readFileSync(new URL('../../theme/data-grid.css', import.meta.url), 'utf8')

const render = (emphasis: Emphasis | null, extra: Record<string, unknown> = {}) => {
  const grid = (
    <DataGrid columns={columns} layout={layout} rows={rows} rowId={(row) => row.id} label="自选" {...extra} />
  )
  return renderToStaticMarkup(emphasis ? <EmphasisProvider value={emphasis}>{grid}</EmphasisProvider> : grid)
}
const shown = (html: string) => (html.match(/>品种\d\d</g) ?? []).length

describe('DataGrid 的分量', () => {
  it('standard（默认）：有表头、行都在（虚拟滚动给的初始窗口以内）', () => {
    const html = render(null)
    expect(html).toContain('data-emphasis="standard"')
    expect(html).toContain('role="columnheader"')
    expect(html).toContain('名称')
    expect(shown(html)).toBe(12)
  })

  it('compact：不出表头，只留前 5 行', () => {
    const html = render('compact')
    expect(html).toContain('data-emphasis="compact"')
    expect(html).not.toContain('role="columnheader"')
    expect(html).not.toContain('k-grid-head')
    expect(shown(html)).toBe(5)
    expect(html).toContain('品种00')
    expect(html).toContain('品种04')
    expect(html).not.toContain('品种05')
  })

  it('compact 截掉行时，表下面写「另有 N 行」（宿主给文案，不给用英文默认）；没截就不出这一行', () => {
    const hostTexts = { moreRows: (n: number) => `另有 ${n} 行` }
    const withHost = (rowsIn: Row[]) =>
      renderToStaticMarkup(
        <EmphasisProvider value="compact">
          <DataGridHostProvider value={{ texts: hostTexts }}>
            <DataGrid columns={columns} layout={layout} rows={rowsIn} rowId={(row) => row.id} label="自选" />
          </DataGridHostProvider>
        </EmphasisProvider>,
      )
    const cut = withHost(rows)
    expect(shown(cut)).toBe(5)
    expect(cut).toContain('class="k-grid-more"')
    expect(cut).toContain('另有 7 行')
    expect(render('compact')).toContain('7 more rows')
    const whole = withHost(rows.slice(0, 5))
    expect(whole).not.toContain('k-grid-more')
    expect(whole).not.toContain('另有')
    // 别的分量不截，也就没有这一行
    expect(render(null)).not.toContain('k-grid-more')
    expect(render('hero')).not.toContain('k-grid-more')
  })

  it('compact 的「前几行」是排好序之后的前几行', () => {
    const html = render('compact', { sort: { id: 'price', desc: true } })
    expect(html).toContain('品种11')
    expect(html).toContain('品种07')
    expect(html).not.toContain('品种06')
    expect(html).not.toContain('品种00')
  })

  it('compact 的行序号不给表头留位置（表头没画）', () => {
    const firstRow = (html: string) => /data-row="r0" role="row" aria-rowindex="(\d+)"/.exec(html)?.[1]
    expect(firstRow(render('compact'))).toBe('1')
    expect(firstRow(render(null))).toBe('2')
  })

  it('hero：表照旧完整，字上一档在样式里；行高仍由 density 给，分量不动它', () => {
    const html = render('hero')
    expect(html).toContain('data-emphasis="hero"')
    expect(html).toContain('role="columnheader"')
    expect(shown(html)).toBe(12)
    expect(dataGridCss).toMatch(
      /\.k-grid\[data-emphasis='hero'\] \.k-grid-cell \{\s*font-size: var\(--text-body-size\);\s*\}/,
    )
    expect(html).toContain('data-density="default"')
    expect(render('hero', { density: 'compact' })).toContain('data-density="compact"')
  })

  describe('compact 的列（#117）', () => {
    type Wide = { id: string; name: string; a: number; b: number; c: number; d: number; e: number; f: number }
    const names = ['name', 'a', 'b', 'c', 'd', 'e', 'f'] as const
    const wideRows: Wide[] = Array.from({ length: 3 }, (_, index) => ({
      id: `w${index}`,
      name: `品种${String(index).padStart(2, '0')}`,
      a: 1,
      b: 2,
      c: 3,
      d: 4,
      e: 5,
      f: 6,
    }))
    // 七列：名称加六个数，8 列里去掉一列隐藏的（第 8 列 hidden 不算数）
    const wideColumns = (marked: readonly string[] = []): GridColumn<Wide>[] => [
      ...names.map((key): GridColumn<Wide> => ({
        id: key,
        type: key === 'name' ? 'text' : 'number',
        value: (row) => row[key],
        ...(marked.includes(key) ? { compact: true } : {}),
      })),
      { id: 'hidden', type: 'number', value: () => 9 },
    ]
    const wideLayout: GridColumnLayout[] = [
      ...names.map((key) => ({ id: key, label: `列${key}`, width: key === 'name' ? 120 : 70, visible: true })),
      { id: 'hidden', label: '列hidden', width: 70, visible: false },
    ]
    const renderWide = (emphasis: Emphasis | null, marked?: readonly string[], layoutIn = wideLayout) => {
      const grid = (
        <DataGrid
          columns={wideColumns(marked)}
          layout={layoutIn}
          rows={wideRows}
          rowId={(row) => row.id}
          label="宽表"
        />
      )
      return renderToStaticMarkup(emphasis ? <EmphasisProvider value={emphasis}>{grid}</EmphasisProvider> : grid)
    }
    const cols = (html: string) => [...new Set([...html.matchAll(/data-col="([^"]+)"/g)].map((match) => match[1]))]

    it('没标 compact 的列：留前两个可见列（名称加第一个数）', () => {
      expect(cols(renderWide('compact'))).toEqual(['name', 'a'])
    })

    it('前两个看的是可见列：layout 里隐藏的列不占名额', () => {
      const hiddenFirst = wideLayout.map((entry) => (entry.id === 'name' ? { ...entry, visible: false } : entry))
      expect(cols(renderWide('compact', [], hiddenFirst))).toEqual(['a', 'b'])
    })

    it('标了 compact: true 的列：只出那几列，次序仍按 layout', () => {
      expect(cols(renderWide('compact', ['f', 'name']))).toEqual(['name', 'f'])
    })

    it('标了 compact 但 layout 里隐藏的列仍然不画', () => {
      expect(cols(renderWide('compact', ['name', 'hidden']))).toEqual(['name'])
    })

    it('standard 与 hero 不受影响：列一个不少，不看 compact 标记', () => {
      for (const level of [null, 'standard', 'hero'] as const) {
        expect(cols(renderWide(level, ['name', 'a']))).toEqual([...names])
      }
    })

    it('compact 的格子宽度：名称列吃剩下的，数值列按自己的宽度，不出横向滚动', () => {
      const html = renderWide('compact', ['name', 'f'])
      expect(html).toContain('grid-template-columns:minmax(0, 1fr) 70px')
      expect(html).toContain('width:100%')
      // standard 仍是全部列的定宽
      expect(renderWide(null)).toContain('grid-template-columns:120px 70px 70px 70px 70px 70px 70px')
    })

    it('compact 的名称列超长省略号截断、悬停看全；数值列不带', () => {
      const html = renderWide('compact', ['name', 'a'])
      expect(html).toContain('<span class="k-grid-name">品种00</span>')
      expect(html).toContain('title="品种00"')
      expect(html).not.toContain('title="1"')
      expect(renderWide(null)).not.toContain('k-grid-name')
    })

    it('compact 下数值列靠右', () => {
      const html = renderWide('compact', ['name', 'a'])
      const numberCell = /<div[^>]*data-col="a"[^>]*class="([^"]*)"/.exec(html)?.[1] ?? ''
      expect(numberCell).toContain('is-end')
    })
  })
})
