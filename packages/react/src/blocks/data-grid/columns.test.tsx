// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { defaultAlign, formatTimestamp, resolveCell, sortComparator, type GridColumn } from './columns.ts'
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

describe('#90 新列类型与单位', () => {
  it('单位另起一段：main 是数字、unit 是单位，text 连起来（复制与导出用）', () => {
    expect(cell(col('pnl', { suffix: 'USDT' }), 12.5)).toMatchObject({ main: '+12.50', unit: 'USDT' })
    expect(cell(col('price', { tick: 0.01, unit: 'USD' }), 3)).toMatchObject({ text: '3.00 USD', unit: 'USD' })
    expect(cell(col('price', { unit: 'USD' }), null)).toMatchObject({ text: '—', unit: undefined })
  })

  it('compact：K/M/B/T 缩写，locale 换成 万/亿，单位小字', () => {
    expect(cell(col('compact', { unit: 'USD' }), 4.53e12)).toMatchObject({
      main: '4.53 T',
      unit: 'USD',
      text: '4.53 T USD',
      sort: 4.53e12,
    })
    expect(cell(col('compact'), 123_456_789, { locale: 'zh-CN' }).text).toBe('1.23 亿')
    expect(cell(col('compact', { locale: 'en-US' }), 123_456_789, { locale: 'zh-CN' }).text).toBe('123.46 M')
    expect(defaultAlign('compact')).toBe('end')
  })

  it('percent：不带符号、不着色', () => {
    expect(cell(col('percent'), 2.456)).toMatchObject({ text: '2.46%', direction: undefined, sort: 2.456 })
    expect(cell(col('percent', { digits: 1 }), 0.4).text).toBe('0.4%')
  })

  it('rating：档名或 −1…1 的分数（technical-rating 的分档），文案可换，方向按档', () => {
    expect(cell(col('rating'), 'strong-buy')).toMatchObject({
      text: 'Strong buy',
      direction: 'up',
      visual: { kind: 'rating', level: 'strong-buy' },
      sort: 4,
    })
    expect(cell(col('rating'), -0.3)).toMatchObject({ visual: { level: 'sell' }, direction: 'down', sort: -0.3 })
    expect(cell(col('rating'), 0)).toMatchObject({ text: 'Neutral', direction: 'flat' })
    const labels = { 'strong-sell': '强卖', sell: '卖', neutral: '中性', buy: '买', 'strong-buy': '强买' }
    expect(cell(col('rating', { ratingLabels: labels }), 0.7).text).toBe('强买')
    expect(cell(col('rating'), 'x').text).toBe('—')
  })

  it('bar：数字加 0…1 的横条比例（max 满格），越界贴边', () => {
    expect(cell(col('bar', { max: 3 }), 1.5)).toMatchObject({ text: '1.50', visual: { kind: 'bar', share: 0.5 } })
    expect(cell(col('bar', { max: 3 }), 9).visual).toEqual({ kind: 'bar', share: 1 })
    expect(cell(col('bar'), null)).toMatchObject({ text: '—', visual: undefined })
  })

  it('spark：最后一个值作字，排序按头尾涨跌；不到两个点不画', () => {
    const spark = cell(col('spark', { label: 'trend' }), [10, 11, 12.5])
    expect(spark).toMatchObject({ text: '12.50', visual: { kind: 'spark', label: 'trend' } })
    expect(spark.sort).toBeCloseTo(0.25)
    expect(cell(col('spark'), [3]).visual).toBeUndefined()
  })

  it('tag：字与语气；range：两端写成字，排序按区间里的位置', () => {
    expect(cell(col('tag'), { text: 'Tech', tone: 'ok' })).toMatchObject({
      text: 'Tech',
      visual: { kind: 'tag', tone: 'ok' },
    })
    expect(cell(col('tag', { tagTone: 'warn' }), 'Energy').visual).toEqual({ kind: 'tag', tone: 'warn' })
    expect(cell(col('range'), { low: 10, high: 20, value: 15 })).toMatchObject({
      text: '10.00 – 20.00',
      sort: 0.5,
      visual: { kind: 'range', low: 10, high: 20, value: 15 },
    })
  })

  it('date：只写日期，按毫秒排', () => {
    const at = Date.UTC(2026, 10, 14, 23, 0, 0)
    expect(cell(col('date'), at, { timeZone: 'utc' })).toMatchObject({ text: '2026-11-14', sort: at })
    expect(sortComparator('date', undefined)(1, 2)).toBeLessThan(0)
  })

  it('symbol：symbolParts 定画哪几段；省略照旧（有 icon 才有 logo）', () => {
    expect(cell(col('symbol'), { code: 'A', icon: {} }).symbol?.parts).toEqual(['logo', 'code', 'venue'])
    expect(cell(col('symbol'), { code: 'A' }).symbol?.parts).toEqual(['code', 'venue'])
    expect(cell(col('symbol', { symbolParts: ['logo', 'chip', 'name'] }), 'A').symbol?.parts).toEqual([
      'logo',
      'chip',
      'name',
    ])
  })

  it('渲染：芯片、全称、单位小字、评级、标签、横条、comfortable 档与默认横线', () => {
    type S = { code: string; name: string; cap: number; rating: string; sector: string; rvol: number }
    const html = renderToStaticMarkup(
      <DataGrid<S>
        columns={[
          {
            id: 's',
            type: 'symbol',
            value: (r) => ({ code: r.code, name: r.name, icon: {} }),
            format: { symbolParts: ['logo', 'chip', 'name'] },
          },
          { id: 'cap', type: 'compact', value: (r) => r.cap, format: { unit: 'USD' } },
          { id: 'r', type: 'rating', value: (r) => r.rating },
          { id: 'sec', type: 'tag', value: (r) => r.sector },
          { id: 'rv', type: 'bar', value: (r) => r.rvol, format: { max: 3 } },
        ]}
        layout={['s', 'cap', 'r', 'sec', 'rv'].map((id) => ({ id, label: id, width: 120, visible: true }))}
        rows={[{ code: 'ALFA', name: 'Alpha Inc', cap: 4.53e12, rating: 'buy', sector: 'Tech', rvol: 1.5 }]}
        rowId={(r) => r.code}
        label="t"
        density="comfortable"
      />,
    )
    expect(html).toContain('data-density="comfortable"')
    expect(html).toContain('is-ruled')
    expect(html).toContain('<span class="k-code-chip">ALFA</span>')
    expect(html).toContain('<span class="k-code-name">Alpha Inc</span>')
    expect(html).toContain('4.53 T <span class="k-num-unit">USD</span>')
    expect(html).toContain('data-slot="rating-text"')
    expect(html).toContain('data-slot="tag"')
    expect(html).toContain('inline-size:50%')
    expect(html).toMatch(/height:40px/)
    expect(html).toMatch(/height:48px/)
  })
})

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
    expect(cell(col('symbol'), 'ES').symbol).toMatchObject({ code: 'ES', venue: undefined })
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
      <DataGridHostProvider value={{ labels: { gridLabel: (name) => `${name}!` } }}>
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
