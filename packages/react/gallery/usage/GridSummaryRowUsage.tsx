// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { DataGrid, type GridColumn, type GridColumnLayout, type GridSummary, type SortSpec } from '../../src/blocks'

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
// 合计：市值与盈亏求和、品种计数；均值：涨跌幅取均值、中位数另起一行。行名由调用方按界面语言给。
const SUMMARY: readonly GridSummary<Row>[] = [
  { id: 'total', label: '合计', columns: { value: 'sum', pnl: 'sum' } },
  { id: 'mean', label: '均值', columns: { value: 'avg', pnl: 'avg', change: 'avg' } },
  { id: 'median', label: '中位数', columns: { change: 'median' } },
]

export function GridSummaryRowUsage() {
  const [sort, setSort] = useState<SortSpec | null>(null)
  return (
    <div style={{ width: 520 }} data-gallery-summary>
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
