// SPDX-License-Identifier: MIT
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { EmphasisProvider, type Emphasis } from '../../layout/emphasis.tsx'
import type { GridColumn } from './columns.ts'
import { DataGrid, type GridColumnLayout } from './data-grid.tsx'
import { DataGridHostProvider } from './host.tsx'
import { COLUMNS_TOGGLE_RESERVE, fitPriorityColumns, MIN_KEPT_COLUMNS, priorityOf } from './priority-columns.ts'

// 列优先级（#122）：放不下时按优先级收列，表头右端出「+N 列」；收起只影响显示，复制与导出不看它。
// 点开胶囊、窄容器真实量宽在浏览器里，见 e2e/data-grid-columns.spec.ts。

describe('fitPriorityColumns', () => {
  const cols = (count: number, width = 70) =>
    Array.from({ length: count }, (_, index) => ({ id: `c${index}`, width, priority: index + 1 }))

  it('放得下就全留，不出胶囊', () => {
    expect(fitPriorityColumns(cols(8), 560, COLUMNS_TOGGLE_RESERVE)).toEqual({
      kept: new Set(cols(8).map((column) => column.id)),
      hidden: 0,
    })
  })

  it('没量到宽度（0）当放得下', () => {
    expect(fitPriorityColumns(cols(8), 0, COLUMNS_TOGGLE_RESERVE).hidden).toBe(0)
  })

  it('放不下：先给胶囊让出 reserve，再从优先级最低的收起', () => {
    const fit = fitPriorityColumns(cols(8), 4 * 70 + 20, 20)
    expect([...fit.kept]).toEqual(['c0', 'c1', 'c2', 'c3'])
    expect(fit.hidden).toBe(4)
    // 少 1px 就少留一列
    expect(fitPriorityColumns(cols(8), 4 * 70 + 19, 20).hidden).toBe(5)
  })

  it('按 priority 收，不按显示次序；同级的先收显示次序靠后的', () => {
    const list = cols(6).map((column) => (column.id === 'c5' ? { ...column, priority: 1 } : column))
    // c0 与 c5 都是 1：留 3 列时留 c0、c1 与 c5 里谁？c5 是 1，c1 是 2，c2 是 3 → 留 c0、c5、c1
    expect([...fitPriorityColumns(list, 3 * 70, 0).kept].sort()).toEqual(['c0', 'c1', 'c5'])
    const tie = cols(4).map((column) => ({ ...column, priority: 1 }))
    expect([...fitPriorityColumns(tie, 2 * 70, 0).kept]).toEqual(['c0', 'c1'])
  })

  it('至少留 MIN_KEPT_COLUMNS 列，再窄也不再收', () => {
    const fit = fitPriorityColumns(cols(8), 10, COLUMNS_TOGGLE_RESERVE)
    expect(fit.kept.size).toBe(MIN_KEPT_COLUMNS)
    expect([...fit.kept]).toEqual(['c0', 'c1'])
    expect(fit.hidden).toBe(6)
  })

  it('固定在左边的列不收', () => {
    const list = cols(6).map((column) => (column.id === 'c5' ? { ...column, priority: 99, fixed: true } : column))
    expect(fitPriorityColumns(list, 3 * 70, 0).kept.has('c5')).toBe(true)
  })

  it('没写优先级按声明顺序：第一列 1、第二列 2', () => {
    expect([0, 1, 7].map((index) => priorityOf(undefined, index))).toEqual([1, 2, 8])
    expect(priorityOf(1, 5)).toBe(1)
  })
})

type Row = { id: string } & Record<`c${number}`, string>
const ids = Array.from({ length: 8 }, (_, index) => `c${index}`)
const rows: Row[] = Array.from({ length: 3 }, (_, index) => ({
  id: `r${index}`,
  ...Object.fromEntries(ids.map((id) => [id, `${id}-${index}`])),
})) as Row[]
const specs = (priorities: Record<string, number> = {}): GridColumn<Row>[] =>
  ids.map((id) => ({
    id,
    type: 'text',
    value: (row: Row) => row[id as `c${number}`],
    ...(priorities[id] === undefined ? {} : { priority: priorities[id] }),
  }))
const layout: GridColumnLayout[] = ids.map((id) => ({ id, label: id.toUpperCase(), width: 70, visible: true }))
/** 刚好放下 4 列加胶囊的容器宽度。 */
const FOUR = 4 * 70 + COLUMNS_TOGGLE_RESERVE

const render = (
  extra: Record<string, unknown> = {},
  emphasis: Emphasis | null = null,
  priorities: Record<string, number> = {},
) => {
  const grid = (
    <DataGrid columns={specs(priorities)} layout={layout} rows={rows} rowId={(row) => row.id} label="宽表" {...extra} />
  )
  return renderToStaticMarkup(emphasis ? <EmphasisProvider value={emphasis}>{grid}</EmphasisProvider> : grid)
}
const heads = (html: string) => [...html.matchAll(/role="columnheader" data-col="([^"]+)"/g)].map((match) => match[1])
const cells = (html: string) => [...new Set([...html.matchAll(/role="gridcell" data-col="([^"]+)"/g)].map((m) => m[1]))]

describe('DataGrid 的列优先级', () => {
  it('8 列、容器只够 4 列：出 4 列加「+4 cols」，表上记着收了几列', () => {
    const html = render({ containerWidth: FOUR })
    expect(heads(html)).toEqual(['c0', 'c1', 'c2', 'c3'])
    expect(cells(html)).toEqual(['c0', 'c1', 'c2', 'c3'])
    expect(html).toContain('class="k-grid-cols-toggle"')
    expect(html).toContain('+4 cols')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('data-columns-hidden="4"')
  })

  it('容器够宽：8 列都在，没有胶囊', () => {
    const html = render({ containerWidth: 8 * 70 })
    expect(heads(html)).toHaveLength(8)
    expect(html).not.toContain('k-grid-cols-toggle')
    expect(html).not.toContain('data-columns-hidden')
  })

  it('没量到宽度（服务端渲染、第一帧）：不收', () => {
    expect(heads(render())).toHaveLength(8)
  })

  it('写了 priority 的照它收：c7 写 1，窄了留下它，收起的是 c3', () => {
    const html = render({ containerWidth: FOUR }, null, { c7: 1 })
    expect(heads(html)).toEqual(['c0', 'c1', 'c2', 'c7'])
    expect(html).toContain('+4 cols')
  })

  it('宿主给文案就用宿主的（中文「+4 列」）', () => {
    const html = renderToStaticMarkup(
      <DataGridHostProvider value={{ texts: { moreColumns: (n) => `+${n} 列` } }}>
        <DataGrid
          columns={specs()}
          layout={layout}
          rows={rows}
          rowId={(row) => row.id}
          label="宽表"
          containerWidth={FOUR}
        />
      </DataGridHostProvider>,
    )
    expect(html).toContain('+4 列')
  })

  it('hero 同样收；compact 不走这一套（它自己只留两列、没有表头与胶囊）', () => {
    expect(heads(render({ containerWidth: FOUR }, 'hero'))).toHaveLength(4)
    const compact = render({ containerWidth: FOUR }, 'compact')
    expect(compact).not.toContain('k-grid-cols-toggle')
    expect(cells(compact)).toEqual(['c0', 'c1'])
  })

  it('不画表头（hideHeader）、collapseColumns={false}：不收，胶囊没有地方放', () => {
    expect(heads(render({ containerWidth: FOUR, collapseColumns: false }))).toHaveLength(8)
    const noHead = render({ containerWidth: FOUR, hideHeader: true })
    expect(cells(noHead)).toHaveLength(8)
    expect(noHead).not.toContain('k-grid-cols-toggle')
  })

  it('layout 里隐藏的列不占名额，也不算收起的列数', () => {
    const hidden = layout.map((column) => (column.id === 'c1' ? { ...column, visible: false } : column))
    const html = renderToStaticMarkup(
      <DataGrid
        columns={specs()}
        layout={hidden}
        rows={rows}
        rowId={(row) => row.id}
        label="宽表"
        containerWidth={FOUR}
      />,
    )
    expect(heads(html)).toEqual(['c0', 'c2', 'c3', 'c4'])
    expect(html).toContain('+3 cols')
  })

  it('有 headEnd 时胶囊旁边带着它，不叠在最后一列的表头上', () => {
    const html = render({ containerWidth: FOUR, headEnd: <button type="button">加列</button> })
    expect(html.match(/加列/g)).toHaveLength(1)
    expect(html).not.toContain('k-grid-head-end')
    expect(html.indexOf('k-grid-cols-toggle')).toBeLessThan(html.indexOf('加列'))
    // 不收的时候 headEnd 照旧在表头右端
    expect(render({ containerWidth: 8 * 70, headEnd: <button type="button">加列</button> })).toContain(
      'k-grid-head-end',
    )
  })

  // 胶囊让位（#128）：stretch 时保留的列被撑满容器，胶囊不透明、贴在右端，不让位就盖住最后一列的表头。
  // 静态渲染量不了像素，所以从行的 grid-template-columns 与内层宽度算最后一个保留列的右缘；真实盒子的位置在 e2e/data-grid-columns.spec.ts。
  describe('胶囊让位（stretch）', () => {
    const tracks = (html: string) =>
      html
        .match(/role="row"[^>]*style="[^"]*grid-template-columns:([^;"]+)/)![1]
        .trim()
        .split(/\s+(?![^(]*\))/)
    const innerWidth = (html: string) => Number(html.match(/class="k-grid-inner"[^>]*style="[^"]*width:(\d+)px/)![1])
    /** 最后一个保留列的右缘：内层宽度（不小于容器）减去尾部让位的那一格。 */
    const lastKeptRight = (html: string, container: number) => {
      const list = tracks(html)
      const reserve = Number(list.at(-1)!.replace('px', ''))
      return Math.max(innerWidth(html), container) - reserve
    }

    it('stretch 加窄容器：最后一个保留列的右缘不越过胶囊的左缘', () => {
      const html = render({ containerWidth: FOUR, stretch: true })
      expect(heads(html)).toEqual(['c0', 'c1', 'c2', 'c3'])
      const list = tracks(html)
      // 四个保留列的比例轨道，后面跟一格胶囊宽度的定宽轨道
      expect(list).toHaveLength(5)
      expect(list.slice(0, 4).every((track) => track.startsWith('minmax('))).toBe(true)
      expect(list[4]).toBe(`${COLUMNS_TOGGLE_RESERVE}px`)
      // 胶囊的右缘贴容器右端、宽 COLUMNS_TOGGLE_RESERVE，所以它的左缘是 FOUR - COLUMNS_TOGGLE_RESERVE
      expect(lastKeptRight(html, FOUR)).toBeLessThanOrEqual(FOUR - COLUMNS_TOGGLE_RESERVE)
      // 数据行与表头用同一份轨道，数据格也让位
      expect(
        html
          .match(/grid-template-columns:[^;"]+/g)!
          .every((text) => text === html.match(/grid-template-columns:[^;"]+/)![0]),
      ).toBe(true)
    })

    it('没写 stretch 的表也让位：内层宽度含让位的一格，展开后横向滚到头最后一列也不被盖', () => {
      const html = render({ containerWidth: FOUR })
      expect(innerWidth(html)).toBe(4 * 70 + COLUMNS_TOGGLE_RESERVE)
      expect(tracks(html).at(-1)).toBe(`${COLUMNS_TOGGLE_RESERVE}px`)
    })

    it('不出胶囊：列照旧撑满，没有让位的轨道', () => {
      const html = render({ containerWidth: 8 * 70, stretch: true })
      const list = tracks(html)
      expect(list).toHaveLength(8)
      expect(list.every((track) => track.startsWith('minmax('))).toBe(true)
      expect(innerWidth(html)).toBe(8 * 70)
    })
  })

  it('收起只影响显示：复制与导出取的列不看优先级（用源码钉住，别回到 visibleColumns）', () => {
    const source = readFileSync(new URL('./data-grid.tsx', import.meta.url), 'utf8')
    const line = source.split('\n').find((text) => text.includes('const dataColumnIds = layout.filter'))
    expect(line).toBeDefined()
    expect(line).not.toMatch(/collapsed|priorityFit|kept/)
    expect(source).toMatch(/exportTable\(\s*byId,\s*dataColumnIds,\s*labelOf,\s*sortedRows\.map/)
  })
})
