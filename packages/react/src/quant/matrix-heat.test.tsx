// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { MatrixHeat, type MatrixHeatColumn, type MatrixHeatRow } from './matrix-heat.tsx'
import {
  matrixExtent,
  matrixShade,
  nextMatrixSort,
  sequentialDomain,
  sortColumnsByRow,
  sortRowsByColumn,
} from './matrix-heat-model.ts'

// 矩阵热力（#260）：示例数据，不是行情。
const COLUMNS: MatrixHeatColumn[] = [
  { id: 'd1', label: '11-24' },
  { id: 'd2', label: '11-25' },
  { id: 'd3', label: '11-26' },
]
const ROWS: MatrixHeatRow[] = [
  { id: 'b2', label: '2 boards', cells: [{ value: 40 }, { value: 10, reason: 'Two stocks broke' }, null] },
  { id: 'b3', label: '3 boards', cells: [{ value: 5 }, { value: null, reason: 'Suspended' }, { value: 20 }] },
  { id: 'b4', label: '4 boards', cells: [{ value: 25 }, { value: 30 }, { value: 0 }] },
]
const cellsOf = (html: string, row: string) =>
  [...html.matchAll(new RegExp(`data-row="${row}"[\\s\\S]*?(?=data-slot="matrix-row"|k-mh-legend)`, 'g'))][0]![0]
const orderOf = (html: string) => [...html.matchAll(/data-slot="matrix-row" data-row="([^"]+)"/g)].map((m) => m[1])

describe('着色', () => {
  it('顺序：下界 0、上界取最大值，档位 ⌊t × 5⌋ 封顶 4；零与空不着色', () => {
    const domain = sequentialDomain(ROWS)!
    expect(domain).toEqual([0, 40])
    expect(matrixShade(40, 'sequential', domain)).toEqual({ level: 4, tone: 'seq' })
    expect(matrixShade(20, 'sequential', domain)).toEqual({ level: 2, tone: 'seq' })
    expect(matrixShade(5, 'sequential', domain)).toEqual({ level: 0, tone: 'seq' })
    expect(matrixShade(0, 'sequential', domain)).toBeNull()
    expect(matrixShade(null, 'sequential', domain)).toBeNull()
    expect(matrixShade(3, 'sequential', null)).toBeNull()
  })

  it('发散：按两端绝对值较大的一边对称，正数涨色、负数跌色，0 不着色', () => {
    const domain: [number, number] = [-10, 5]
    expect(matrixShade(-10, 'diverging', domain)).toEqual({ level: 4, tone: 'down' })
    expect(matrixShade(5, 'diverging', domain)).toEqual({ level: 2, tone: 'up' })
    expect(matrixShade(0, 'diverging', domain)).toBeNull()
    expect(matrixExtent(ROWS)).toEqual([0, 40])
    expect(matrixExtent([])).toBeNull()
  })
})

describe('排序', () => {
  it('行按某一列排序：降序大的在前、升序小的在前，空格永远最后；同值保持原次序', () => {
    expect(sortRowsByColumn(ROWS, 2, true).map((row) => row.id)).toEqual(['b3', 'b4', 'b2'])
    expect(sortRowsByColumn(ROWS, 2, false).map((row) => row.id)).toEqual(['b4', 'b3', 'b2'])
    expect(sortRowsByColumn(ROWS, 1, true).map((row) => row.id)).toEqual(['b4', 'b2', 'b3'])
  })

  it('列按某一行排序：返回原列序号的新次序，空格最后', () => {
    expect(sortColumnsByRow(ROWS[0]!, 3, true)).toEqual([0, 1, 2])
    expect(sortColumnsByRow(ROWS[2]!, 3, false)).toEqual([2, 0, 1])
    expect(sortColumnsByRow(ROWS[1]!, 3, true)).toEqual([2, 0, 1])
  })

  it('点同一个表头：降 → 升 → 取消；换表头从降序起', () => {
    const first = nextMatrixSort(null, 'rows', 'd1')
    expect(first).toEqual({ axis: 'rows', key: 'd1', desc: true })
    const second = nextMatrixSort(first, 'rows', 'd1')
    expect(second).toEqual({ axis: 'rows', key: 'd1', desc: false })
    expect(nextMatrixSort(second, 'rows', 'd1')).toBeNull()
    expect(nextMatrixSort(second, 'cols', 'd1')).toEqual({ axis: 'cols', key: 'd1', desc: true })
  })
})

describe('MatrixHeat', () => {
  const render = (extra: Record<string, unknown> = {}) =>
    renderToStaticMarkup(<MatrixHeat columns={COLUMNS} rows={ROWS} {...extra} />)

  it('格内写数；空格与 null 值写「—」不着色；档位写在 data-seq 上', () => {
    const html = render()
    const b2 = cellsOf(html, 'b2')
    expect(b2).toMatch(/data-seq="4"[^>]*><span aria-hidden="true">40<\/span>/)
    expect(b2).toMatch(/data-empty="true"[^>]*><span aria-hidden="true">—<\/span>/)
    expect(cellsOf(html, 'b3')).toMatch(/data-col-index="1"[^>]*data-empty="true"/)
    // 零不着色：4 boards 在 11-26 是 0，没有 data-seq。
    expect(cellsOf(html, 'b4')).not.toMatch(/data-col-index="2"[^>]*data-seq/)
    // 每格的读屏句子带原因。
    expect(html).toContain('aria-label="2 boards, 11-25: 10, Two stocks broke"')
    expect(html).toContain('aria-label="3 boards, 11-25: —, Suspended"')
  })

  it('给 defaultSort 就按它排；列头带 aria-sort 与箭头，表头是按钮', () => {
    const html = render({ defaultSort: { axis: 'rows', key: 'd3', desc: true } })
    expect(orderOf(html)).toEqual(['b3', 'b4', 'b2'])
    expect(html).toMatch(/data-col="d3" aria-sort="descending"/)
    expect(html).toContain('aria-label="Sort rows by 11-26"')
    expect(html).toContain('aria-label="Sort columns by 2 boards"')
    const cols = render({ defaultSort: { axis: 'cols', key: 'b4', desc: false } })
    expect([...cols.matchAll(/data-slot="matrix-colhead" data-col="([^"]+)"/g)].map((m) => m[1])).toEqual([
      'd3',
      'd1',
      'd2',
    ])
  })

  it('受控 sort 听调用方；sortable=false 表头是普通的字；发散色阶带涨跌色调', () => {
    expect(orderOf(render({ sort: null, defaultSort: { axis: 'rows', key: 'd3', desc: true } }))).toEqual([
      'b2',
      'b3',
      'b4',
    ])
    expect(render({ sortable: false })).not.toContain('k-mh-sort')
    const diverging = renderToStaticMarkup(
      <MatrixHeat
        columns={[{ id: 'a', label: 'A' }]}
        rows={[
          { id: 'x', label: 'X', cells: [{ value: 3 }] },
          { id: 'y', label: 'Y', cells: [{ value: -3 }] },
        ]}
        scale="diverging"
      />,
    )
    expect(diverging).toMatch(/data-seq="4" data-tone="up"/)
    expect(diverging).toMatch(/data-seq="4" data-tone="down"/)
  })

  it('没有行或没有列写空态', () => {
    const html = renderToStaticMarkup(<MatrixHeat columns={[]} rows={[]} labels={{ none: 'Nothing' }} />)
    expect(html).toContain('data-empty="true"')
    expect(html).toContain('Nothing')
  })
})

// 发散色阶的涨跌色只读 --pnl-up / --pnl-down，红涨还是绿涨由根上的 data-updown 换（tokens.css）：件里不写死绿 / 红。
describe('MatrixHeat 发散色阶跟 data-updown（#260）', () => {
  const css = readFileSync(new URL('../theme/matrix-heat.css', import.meta.url), 'utf8')
  const tokens = readFileSync(new URL('../../../tokens/src/tokens.css', import.meta.url), 'utf8')

  it('正数格标 data-tone="up"，样式把 up 接到 --pnl-up、down 接到 --pnl-down，没有写死的色值或 signal 色', () => {
    const html = renderToStaticMarkup(
      <MatrixHeat
        scale="diverging"
        columns={[{ id: 'a', label: 'A' }]}
        rows={[
          { id: 'x', label: 'X', cells: [{ value: 3 }] },
          { id: 'y', label: 'Y', cells: [{ value: -3 }] },
        ]}
      />,
    )
    expect(html).toMatch(/data-row-index="0"[^>]*data-tone="up"/)
    expect(html).toMatch(/data-row-index="1"[^>]*data-tone="down"/)
    const rules = css.split('}').filter((rule) => /data-tone='(up|down)'/.test(rule))
    expect(rules.length).toBeGreaterThan(0)
    for (const rule of rules) {
      const side = /data-tone='(up|down)'/.exec(rule)![1]
      expect(rule, `${side} 的规则`).toContain(`var(--pnl-${side})`)
      expect(rule).not.toMatch(/#[0-9a-f]{3,8}\b|\brgba?\(|signal-/i)
    }
  })

  it('tokens.css 在根上 data-updown="cn" 时把 --pnl-up 换成红、--pnl-down 换成绿；默认相反', () => {
    const cn = /:root\[data-updown='cn'\]\s*\{([^}]*)\}/.exec(tokens)![1]!
    expect(cn).toMatch(/--pnl-up:\s*var\(--signal-red\)/)
    expect(cn).toMatch(/--pnl-down:\s*var\(--signal-green\)/)
    expect(/:root\s*\{[^}]*--pnl-up:\s*var\(--signal-green\)/.test(tokens)).toBe(true)
  })
})
