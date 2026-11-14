// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { defaultAlign, formatTimestamp, resolveCell, sortComparator, type GridColumn } from './columns'
import { DataGrid } from './data-grid'
import { DataGridHostProvider } from './host'

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
