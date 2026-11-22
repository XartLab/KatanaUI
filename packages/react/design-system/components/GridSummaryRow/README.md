# GridSummaryRow

DataGrid 的 summary 属性：表尾一到几行合计 / 均值 / 中位数，按列配聚合（sum、avg、min、max、median、count 或自己的函数），对全部行算；跟表同一份列宽与固定列，横向滚动跟着走、纵向粘在底边。字照列类型写，跟上面的行对得齐。

## Provide

`*` marks a required prop.

### DataGrid summary: GridSummary[]

每行 { id, label, columns: { 列 id: 聚合 | { aggregate, text? } } }；label（合计、均值）写在第一个没配聚合的列，都配了就挂在行的读屏名上。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `id` * | `string` | — | Stable id of this summary row. |
| `label` * | `string` | — | Row name (Total, Average), in the UI language. |
| `columns` * | `Readonly<Partial<Record<string, SummaryColumn<Row>>>>` | — | Aggregate per column id; columns left out stay empty. |

### aggregateValues(aggregate, values, rows?)

一组数的聚合：空的是 null（count 是 0）；median 取中间两个的平均。

### summaryCells(columns, rows, summary, env?)

一行汇总各列的值与字（纯函数）：数值类照原类型写（价格按精度、盈亏带符号与方向），count 与非数值列按整数写；精度随行变的列取第一行的。

### GridSummaryRow

DataGrid 内部画汇总行的件（列模板、固定列、aria-rowindex 由表给）；一般经 DataGrid 的 summary 用，不单摆。

| 属性 | 类型 | 默认 | 说明 |
| --- | --- | --- | --- |
| `summary` * | `GridSummary<Row>` | — | The summary row to draw. |
| `columns` * | `readonly GridColumn<Row>[]` | — | The grid's visible columns, in display order. |
| `rows` * | `readonly Row[]` | — | All rows (not only the rendered ones). |
| `env` * | `CellEnv` | — | Cell environment (time zone). |
| `template` * | `string` | — | The grid's column template (same as the body rows). |
| `height` * | `number` | — | Row height in pixels. |
| `cellRole` * | `string` | — | gridcell in an interactive grid, cell otherwise. |
| `ariaRowIndex` * | `number` | — | aria-rowindex of this row. |
| `alignOf` * | `(columnId: string) => 'start' \| 'end'` | — | Alignment of a column. |
| `stickClass` * | `(columnId: string) => string` | — | Class names of a pinned column cell. |
| `stickStyle` * | `(columnId: string) => CSSProperties \| undefined` | — | Inline style (left offset) of a pinned column cell. |
| `className` | `string` | — | Extra class name on the row. |

## Usage

```tsx
// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { DataGrid, type GridColumn, type GridColumnLayout, type GridSummary, type SortSpec } from '@katana-ui/react/blocks'

type Row = { id: string; symbol: string; qty: number; last: number; value: number; pnl: number; change: number }

const SYMBOLS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'DOGEUSDT',
  'ADAUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'DOTUSDT',
]
// 演示数据（固定，不是行情）。
const ROWS: readonly Row[] = SYMBOLS.map((symbol, i) => {
  const qty = [0.5, 4, 120, 6, 2400, 18000, 3000, 75, 210, 330][i]!
  const last = [96500, 3400, 182.3, 640.2, 2.31, 0.142, 0.71, 38.6, 17.9, 7.25][i]!
  const change = [1.2, -0.8, 3.4, 0.3, -2.1, 5.6, -1.4, 0.9, -0.2, 1.7][i]!
  return { id: symbol, symbol, qty, last, value: qty * last, pnl: Math.round(qty * last * change) / 100, change }
})
const COLUMNS: readonly GridColumn<Row>[] = [
  { id: 'symbol', type: 'symbol', value: (row) => row.symbol },
  { id: 'qty', type: 'quantity', value: (row) => row.qty },
  { id: 'last', type: 'price', value: (row) => row.last },
  { id: 'value', type: 'number', value: (row) => row.value, format: { digits: 2 } },
  { id: 'pnl', type: 'pnl', value: (row) => row.pnl, format: { suffix: 'USDT' } },
  { id: 'change', type: 'change', value: (row) => row.change },
]
const LAYOUT: readonly GridColumnLayout[] = [
  { id: 'symbol', label: '品种', width: 110, visible: true, fixed: true },
  { id: 'qty', label: '数量', width: 90, visible: true },
  { id: 'last', label: '最新价', width: 100, visible: true },
  { id: 'value', label: '市值', width: 120, visible: true },
  { id: 'pnl', label: '浮动盈亏', width: 140, visible: true },
  { id: 'change', label: '涨跌幅', width: 90, visible: true },
]
// 合计：市值与盈亏求和；均值、中位数：市值、盈亏、涨跌幅各取均值与中位数。行名由调用方按界面语言给。
const SUMMARY: readonly GridSummary<Row>[] = [
  { id: 'total', label: '合计', columns: { value: 'sum', pnl: 'sum' } },
  { id: 'mean', label: '均值', columns: { value: 'avg', pnl: 'avg', change: 'avg' } },
  { id: 'median', label: '中位数', columns: { value: 'median', pnl: 'median', change: 'median' } },
]

export function GridSummaryRowUsage() {
  const [sort, setSort] = useState<SortSpec | null>(null)
  return (
    <div style={{ width: 660 }} data-gallery-summary>
      <DataGrid
        columns={COLUMNS}
        layout={LAYOUT}
        rows={ROWS}
        rowId={(row) => row.id}
        label="持仓"
        sort={sort}
        onSortChange={setSort}
        summary={SUMMARY}
        fit
        maxHeight={220}
      />
    </div>
  )
}
```

## States

- 有汇总：表尾一组 rowgroup，上面一道分隔线、底色 surface-raised、600 字重；行名次要文字色。
- 固定列：汇总行的固定格同样粘在左边。
- 没有有效值：sum / avg 这类写 —，count 写 0。
- 看得见的列都没配聚合的汇总行不画。

## Don't

- 不要对涨跌幅、价格求和：用 avg 或 median。
- 不要只汇总看得见的行：汇总对全部行算（虚拟滚动只画几十行）。

## Composition

```
DataGrid
  表头
  行
  GridSummaryRow × n（rowgroup，粘在底边）
    行名格 · 聚合格（ToneText 或字）
```
