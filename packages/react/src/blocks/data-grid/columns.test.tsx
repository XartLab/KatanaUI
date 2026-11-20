// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { barRatio, defaultAlign, formatTimestamp, resolveCell, sortComparator, type GridColumn } from './columns.ts'
import { DataGrid } from './data-grid.tsx'
import { DataGridHostProvider } from './host.tsx'

// 列类型（#1869）：每种类型的格式化、对齐、着色、排序。

type Row = { v: unknown }
const col = (type: GridColumn<Row>['type'], format?: GridColumn<Row>['format']): GridColumn<Row> => ({
  id: 'c',
  type,
  value: (row) => row.v,
  format,
})
const cell = (column: GridColumn<Row>, v: unknown, env = {}) => resolveCell(column, { v }, env)

describe('列类型的格式化与方向', () => {
  it('price：按 tick 或精度定小数位，空写 —', () => {
    expect(cell(col('price', { tick: 0.01 }), 1688).text).toBe('1,688.00')
    expect(cell(col('price', { tick: 0.25 }), 4500.25).text).toBe('4,500.25')
    expect(cell(col('price', { precision: 4 }), '0.5').text).toBe('0.5000')
    expect(cell(col('price'), null).text).toBe('—')
    expect(cell(col('price', { tick: 0.01 }), 7).sort).toBe(7)
  })

  it('quantity：缩写与美元', () => {
    expect(cell(col('quantity'), 15000).text).toBe('15.0K')
    expect(cell(col('quantity', { units: 'usd' }), 1250).text).toBe('$1.3K')
    expect(cell(col('quantity', { size: { abbreviate: false, digits: 2 } }), 1.5).text).toBe('1.50')
  })

  it('pnl：带符号、千分位、单位；方向按显示位数舍入后定；零不着色', () => {
    const pnl = col('pnl', { suffix: 'USDT' })
    expect(cell(pnl, 12.5)).toMatchObject({ text: '+12.50 USDT', direction: 'up', tone: 'up' })
    expect(cell(pnl, -1234.5)).toMatchObject({ text: '-1,234.50 USDT', direction: 'down', tone: 'down' })
    expect(cell(pnl, 0.001)).toMatchObject({ text: '0.00 USDT', direction: 'flat', tone: undefined })
    expect(cell(pnl, '3.25').text).toBe('+3.25 USDT')
    expect(cell(pnl, null)).toMatchObject({ text: '—', direction: undefined })
  })

  it('change：+1.23% 写法与方向', () => {
    expect(cell(col('change'), 1.234)).toMatchObject({ text: '+1.23%', direction: 'up' })
    expect(cell(col('change'), -0.5)).toMatchObject({ text: '-0.50%', direction: 'down' })
    expect(cell(col('change'), 0).direction).toBe('flat')
  })

  it('side：买卖文字与方向，文案可换', () => {
    expect(cell(col('side'), 'buy')).toMatchObject({ text: 'Buy', direction: 'up' })
    expect(cell(col('side', { labels: { buy: '买', sell: '卖' } }), 'sell')).toMatchObject({
      text: '卖',
      direction: 'down',
    })
    expect(cell(col('side'), 'x').text).toBe('—')
  })

  it('time：按给的时区写，local 以外两种写法', () => {
    const at = Date.UTC(2026, 10, 14, 1, 2, 3)
    expect(cell(col('time'), at, { timeZone: 'utc' }).text).toBe('2026-11-14 01:02:03')
    expect(cell(col('time'), at, { timeZone: 'Asia/Shanghai' }).text).toBe('2026-11-14 09:02:03')
    expect(cell(col('time', { timeStyle: 'date' }), at, { timeZone: 'utc' }).text).toBe('2026-11-14')
    expect(formatTimestamp(at, 'utc', 'time')).toBe('01:02:03')
    expect(cell(col('time'), undefined).text).toBe('—')
  })

  it('symbol：代码与场所两段，复制的字是 代码.场所', () => {
    expect(cell(col('symbol'), { code: 'BTCUSDT', venue: 'BINANCE' })).toMatchObject({
      text: 'BTCUSDT.BINANCE',
      symbol: { code: 'BTCUSDT', venue: 'BINANCE' },
    })
    expect(cell(col('symbol'), 'ES').symbol).toEqual({ code: 'ES', venue: undefined })
    expect(cell(col('symbol'), undefined)).toMatchObject({ text: '—', symbol: undefined })
  })

  it('number 与 text；text 回调盖掉类型的写法，tone 回调盖掉类型的颜色', () => {
    expect(cell(col('number', { digits: 1 }), 3).text).toBe('3.0')
    expect(cell(col('number'), '12.50').text).toBe('12.50')
    expect(cell(col('text'), 'abc')).toMatchObject({ text: 'abc', sort: 'abc' })
    const custom: GridColumn<Row> = { ...col('pnl'), text: () => '***', tone: () => 'muted' }
    expect(cell(custom, 5)).toMatchObject({ text: '***', tone: 'muted' })
  })
})

describe('对齐与排序', () => {
  it('数字类靠右，别的靠左', () => {
    for (const type of ['number', 'price', 'quantity', 'pnl', 'change'] as const) expect(defaultAlign(type)).toBe('end')
    for (const type of ['text', 'side', 'time', 'symbol', undefined] as const) expect(defaultAlign(type)).toBe('start')
  })

  it('数字类按数、time 按毫秒、文字按自然序', () => {
    const num = sortComparator('price', undefined)
    expect([10, 9, 100].sort(num)).toEqual([9, 10, 100])
    expect(['10.5', '9.25'].sort(num)).toEqual(['9.25', '10.5'])
    const text = sortComparator('text', 'en')
    expect(['a10', 'a9', 'a2'].sort(text)).toEqual(['a2', 'a9', 'a10'])
  })
})

describe('表的渲染', () => {
  const columns: GridColumn<Row>[] = [col('pnl'), { id: 'd', type: 'symbol', value: () => 'ES' }]
  const layout = [
    { id: 'c', label: 'PnL', width: 100, visible: true },
    { id: 'd', label: 'Sym', width: 100, visible: true },
  ]
  const html = (props: Record<string, unknown> = {}) =>
    renderToStaticMarkup(
      <DataGrid
        columns={columns}
        layout={layout}
        rows={[{ v: 5 }, { v: -5 }]}
        rowId={(row) => String(row.v)}
        label="t"
        sort={null}
        onSortChange={() => {}}
        {...props}
      />,
    )

  it('没有 DataGridHost 也能渲染：有表头、行、盈亏的方向属性，数字列靠右', () => {
    const out = html()
    expect(out).toContain('role="grid"')
    expect(out).toContain('data-tone="up"')
    expect(out).toContain('data-tone="down"')
    expect(out).toContain('k-grid-cell is-end')
    expect(out).toContain('k-grid-name')
  })

  it('只读的展示表是 table 语义，不可聚焦', () => {
    const out = html({ interactive: false, hideHeader: true })
    expect(out).toContain('role="table"')
    expect(out).not.toContain('tabindex')
    expect(out).not.toContain('columnheader')
  })

  it('提供宿主文案后也能渲染', () => {
    const out = renderToStaticMarkup(
      <DataGridHostProvider value={{ texts: { gridLabel: (name) => `${name}!` } }}>
        <DataGrid
          columns={columns}
          layout={layout}
          rows={[{ v: 1 }]}
          rowId={() => '1'}
          label="t"
          sort={null}
          onSortChange={() => {}}
        />
      </DataGridHostProvider>,
    )
    expect(out).toContain('aria-label="t!"')
  })
})

describe('自定义列、行属性与子行', () => {
  type Item = { id: string; name: string; note?: string }
  const items: Item[] = [
    { id: 'a', name: 'Alpha', note: 'extra A' },
    { id: 'b', name: 'Beta' },
  ]
  const columns: GridColumn<Item>[] = [
    { id: 'name', type: 'custom', cell: (row) => <b data-testid="custom">{row.name}</b>, text: (row) => row.name },
  ]
  const layout = [{ id: 'name', label: 'Name', width: 100, visible: true }]
  const html = (props: Record<string, unknown> = {}) =>
    renderToStaticMarkup(
      <DataGrid columns={columns} layout={layout} rows={items} rowId={(row) => row.id} label="t" {...props} />,
    )

  it('custom 列：格子里画 cell(row) 的内容，复制与排序用 text', () => {
    expect(html()).toContain('<b data-testid="custom">Alpha</b>')
    expect(cell({ id: 'c', type: 'custom', text: () => 'copy me' }, null).text).toBe('copy me')
    expect(defaultAlign('custom')).toBe('start')
  })

  it('rowProps：类名并进行的类名，data-* 与 title 写到行上', () => {
    const out = html({ rowProps: (row: Item) => ({ className: `is-${row.id}`, 'data-item': row.id, title: row.name }) })
    expect(out).toContain('data-item="a"')
    expect(out).toContain('title="Beta"')
    expect(out).toMatch(/class="k-grid-row[^"]* is-a"/)
  })

  it('子行：有子行的行带 aria-expanded，展开了的行后面跟一条跨满整行的子行；表按 treegrid 读', () => {
    const out = html({
      renderSubRow: (row: Item) => row.note && <i>{row.note}</i>,
      defaultExpanded: (row: Item) => row.id === 'a',
    })
    expect(out).toContain('role="treegrid"')
    expect(out).toContain('aria-expanded="true"')
    expect(out).toContain('data-subrow="a"')
    expect(out).toContain('<i>extra A</i>')
    expect(out).toContain('aria-colspan="1"')
    // Beta 没有子行：没有 aria-expanded，也不能展开。
    expect(out.match(/aria-expanded/g)).toHaveLength(1)
  })

  it('子行收起时不画；受控的 expanded 说了算', () => {
    const renderSubRow = (row: Item) => <i>{row.name}</i>
    expect(html({ renderSubRow })).not.toContain('data-subrow')
    const out = html({ renderSubRow, expanded: new Set(['b']), defaultExpanded: () => true })
    expect(out).toContain('data-subrow="b"')
    expect(out).not.toContain('data-subrow="a"')
  })

  it('没给 onSortChange：表头是普通的字，不是按钮；selectable=false：行没有选中与悬停', () => {
    const out = html({ selectable: false })
    expect(out).not.toContain('<button')
    expect(out).not.toContain('is-interactive')
    expect(out).not.toContain('aria-selected')
  })
})

// #109：A 股看板的列类型（居中条、胶囊、进度）与强度底色。
describe('bar 列：以 0 为中线的居中条', () => {
  const columns: GridColumn<Row>[] = [{ ...col('bar', { digits: 1 }), id: 'net' }]
  const layout = [{ id: 'net', label: 'Net', width: 200, visible: true }]
  const html = (values: unknown[]) =>
    renderToStaticMarkup(
      <DataGrid
        columns={columns}
        layout={layout}
        rows={values.map((v) => ({ v }))}
        rowId={(row) => String(row.v)}
        label="t"
        sort={null}
        onSortChange={() => {}}
      />,
    )

  it('文字带符号；排序用数；空写 —', () => {
    expect(cell(col('bar', { digits: 1 }), 12.34)).toMatchObject({ text: '+12.3', bar: 12.34, sort: 12.34 })
    expect(cell(col('bar'), -3)).toMatchObject({ text: '-3.00', bar: -3 })
    expect(cell(col('bar'), null)).toMatchObject({ text: '—', bar: undefined })
  })

  it('条长按本列绝对值最大者归一：正在右、负在左，各占半边', () => {
    expect(barRatio(10, 10)).toBe(1)
    expect(barRatio(-5, 10)).toBe(-0.5)
    expect(barRatio(undefined, 10)).toBe(0)
    expect(barRatio(5, 0)).toBe(0)
    const out = html([10, -5, 0])
    expect(out.match(/class="k-grid-bar"/g)).toHaveLength(3)
    expect(out).toContain('data-dir="up"')
    expect(out).toContain('data-dir="down"')
    expect(out).toContain('data-dir="flat"')
    expect(out).toContain('width:50%;left:50%')
    expect(out).toContain('width:25%;right:50%')
    expect(out).toContain('+10.0')
  })
})

describe('pill 列：一格多枚标签', () => {
  const layout = [{ id: 'tags', label: 'Tags', width: 220, visible: true }]
  const html = (v: unknown, format?: { maxPills?: number }) =>
    renderToStaticMarkup(
      <DataGrid
        columns={[{ ...col('pill', format), id: 'tags' }]}
        layout={layout}
        rows={[{ v }]}
        rowId={() => 'r'}
        label="t"
        sort={null}
        onSortChange={() => {}}
      />,
    )

  it('值可以是一个或一串，每枚只认语义色调，没写色调是 muted', () => {
    expect(cell(col('pill'), ['a', { label: 'b', tone: 'up' }])).toMatchObject({
      text: 'a b',
      pills: [
        { label: 'a', tone: 'muted' },
        { label: 'b', tone: 'up' },
      ],
    })
    expect(cell(col('pill'), 'solo').pills).toEqual([{ label: 'solo', tone: 'muted' }])
    expect(cell(col('pill'), [])).toMatchObject({ text: '—', pills: undefined })
  })

  it('每枚渲染成 data-tone 的胶囊；超过 maxPills 的收成 +n，title 写全部', () => {
    const out = html(['甲', { label: '乙', tone: 'down' }, { label: '丙', tone: 'accent' }, '丁'], { maxPills: 2 })
    expect(out.match(/data-pill=""/g)).toHaveLength(4)
    expect(out.match(/ hidden=""/g)).toHaveLength(2)
    expect(out).toContain('data-tone="down"')
    expect(out).toContain('>+2</span>')
    expect(out).toContain('title="甲 · 乙 · 丙 · 丁"')
  })

  it('不超过就没有 +n', () => {
    expect(html(['甲', '乙'], { maxPills: 5 })).not.toContain('grid-pill-more')
  })
})

describe('progress 列：分子 / 分母加细条', () => {
  const html = (v: unknown) =>
    renderToStaticMarkup(
      <DataGrid
        columns={[{ ...col('progress'), id: 'p' }]}
        layout={[{ id: 'p', label: 'P', width: 160, visible: true }]}
        rows={[{ v }]}
        rowId={() => 'r'}
        label="t"
        sort={null}
        onSortChange={() => {}}
      />,
    )

  it('两种写法都认；比例是排序值；分母不是正数没有比例；坏值写 —', () => {
    expect(cell(col('progress'), { done: 3, total: 12 })).toMatchObject({
      text: '3/12',
      sort: 0.25,
      progress: { done: 3, total: 12, ratio: 0.25 },
    })
    expect(cell(col('progress'), [5, 4]).progress?.ratio).toBe(1)
    expect(cell(col('progress'), [0, 0])).toMatchObject({ text: '0/0', sort: undefined })
    expect(cell(col('progress'), 'x')).toMatchObject({ text: '—', progress: undefined })
    expect(defaultAlign('progress')).toBe('end')
  })

  it('渲染成「3/12」加一条宽度等于比例的细条', () => {
    const out = html([3, 12])
    expect(out).toContain('k-grid-progress-text')
    expect(out).toContain('3/12')
    expect(out).toContain('data-slot="grid-progress"')
    expect(out).toContain('width:25%')
    expect(html([0, 0])).not.toContain('<i ')
  })
})
