// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { DataGrid, type GridColumn, type GridColumnLayout, type SortSpec } from '../../src/blocks'

type Row = { id: string; symbol: string; pnl: number }

const ROWS: readonly Row[] = [
  { id: 'a', symbol: 'BTCUSDT', pnl: 125.4 },
  { id: 'b', symbol: 'ETHUSDT', pnl: -31.75 },
]
const COLUMNS: readonly GridColumn<Row>[] = [
  { id: 'symbol', type: 'text', value: (row) => row.symbol },
  { id: 'pnl', type: 'pnl', value: (row) => row.pnl },
]
const LAYOUT: readonly GridColumnLayout[] = [
  { id: 'symbol', label: 'Symbol', width: 120, visible: true },
  { id: 'pnl', label: 'PnL', width: 100, visible: true },
]

export function DataGridUsage() {
  const [sort, setSort] = useState<SortSpec | null>(null)
  return (
    <DataGrid
      columns={COLUMNS}
      layout={LAYOUT}
      rows={ROWS}
      rowId={(row) => row.id}
      label="Positions"
      sort={sort}
      onSortChange={setSort}
    />
  )
}
