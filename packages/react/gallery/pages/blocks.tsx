// SPDX-License-Identifier: MIT
import { Bell, Camera, Settings } from 'lucide-react'
import { useState } from 'react'
import {
  DataGrid,
  DataGridHostProvider,
  EmptyState,
  EstimateBadge,
  ToolButton,
  Toolbar,
  ToolbarGroup,
  ToolSlot,
  type DataGridHost,
  type GridColumn,
  type GridColumnLayout,
  type SortSpec,
} from '../../src/blocks'
import { Button } from '../../src'
import { Row } from './parts'

// 积木层（@katana-ui/react/blocks，#1869）的演示。表里的数据都是写死的示例数据，不是行情。

type Example = {
  id: string
  symbol: { code: string; venue: string }
  side: 'buy' | 'sell'
  price: number
  qty: number
  pnl: number
  change: number
  at: number
  note: string
  fills: string
}

const EXAMPLES: readonly Example[] = [
  {
    id: 'a',
    symbol: { code: 'BTCUSDT', venue: 'BINANCE' },
    side: 'buy',
    price: 64250.5,
    qty: 0.25,
    pnl: 125.4,
    change: 1.234,
    at: Date.UTC(2026, 10, 14, 1, 2, 3),
    note: 'swing',
    fills: '3',
  },
  {
    id: 'b',
    symbol: { code: '600519', venue: 'SSE' },
    side: 'sell',
    price: 1688,
    qty: 1200,
    pnl: -310.75,
    change: -0.5,
    at: Date.UTC(2026, 10, 14, 2, 30, 0),
    note: 'scalp',
    fills: '12',
  },
  {
    id: 'c',
    symbol: { code: 'ES', venue: 'CME' },
    side: 'buy',
    price: 4500.25,
    qty: 15000,
    pnl: 0,
    change: 0,
    at: Date.UTC(2026, 10, 14, 9, 15, 45),
    note: 'hedge',
    fills: '1',
  },
]

const COLUMNS: readonly GridColumn<Example>[] = [
  { id: 'symbol', type: 'symbol', value: (row) => row.symbol },
  { id: 'side', type: 'side', value: (row) => row.side },
  {
    id: 'price',
    type: 'price',
    value: (row) => row.price,
    format: (row) => ({ tick: row.symbol.code === 'ES' ? 0.25 : 0.01 }),
  },
  { id: 'qty', type: 'quantity', value: (row) => row.qty },
  { id: 'pnl', type: 'pnl', value: (row) => row.pnl, format: { suffix: 'USDT' } },
  { id: 'change', type: 'change', value: (row) => row.change },
  { id: 'at', type: 'time', value: (row) => row.at },
  { id: 'fills', type: 'number', value: (row) => row.fills },
  { id: 'note', type: 'text', value: (row) => row.note },
]

const LAYOUT: readonly GridColumnLayout[] = [
  { id: 'symbol', label: 'Symbol', width: 130, visible: true },
  { id: 'side', label: 'Side', width: 60, visible: true },
  { id: 'price', label: 'Price', width: 100, visible: true },
  { id: 'qty', label: 'Qty', width: 80, visible: true },
  { id: 'pnl', label: 'PnL', width: 110, visible: true },
  { id: 'change', label: 'Chg %', width: 80, visible: true },
  { id: 'at', label: 'Time (UTC)', width: 160, visible: true },
  { id: 'fills', label: 'Fills', width: 60, visible: true },
  { id: 'note', label: 'Note', width: 80, visible: true },
]

const HOST: DataGridHost = {
  texts: { copy: 'Copy', save: 'Export CSV…', resetColumns: 'Reset columns' },
}

export function DataGridDemo() {
  const [sort, setSort] = useState<SortSpec | null>(null)
  return (
    <>
      <p className="gal-note">示例数据：每种列类型一列；点表头排序，右键看菜单。</p>
      <div data-testid="grid-demo" style={{ display: 'flex', height: 190, width: '100%', maxWidth: 780 }}>
        <DataGridHostProvider value={HOST}>
          <DataGrid
            columns={COLUMNS}
            layout={LAYOUT}
            rows={EXAMPLES}
            rowId={(row) => row.id}
            label="Example rows"
            sort={sort}
            onSortChange={setSort}
            onResetColumns={() => setSort(null)}
            onExport={() => {}}
            exportName="example"
            timeZone="utc"
          />
        </DataGridHostProvider>
      </div>
      <p className="gal-note">无表头、只读、紧凑行高的变体：</p>
      <div style={{ width: 300 }}>
        <DataGrid
          columns={COLUMNS.filter((column) => column.id === 'symbol' || column.id === 'pnl')}
          layout={LAYOUT.filter((column) => column.id === 'symbol' || column.id === 'pnl')}
          rows={EXAMPLES}
          rowId={(row) => row.id}
          label="Compact example"
          sort={null}
          onSortChange={() => {}}
          density="compact"
          hideHeader
          interactive={false}
          fit
        />
      </div>
    </>
  )
}

export function EmptyStateDemo() {
  return (
    <EmptyState tag="NO DATA" title="Nothing selected" actions={<Button variant="primary">Pick a symbol</Button>}>
      <p>Connect a data source first. No sample data is drawn.</p>
    </EmptyState>
  )
}

export function ToolbarDemo() {
  const [on, setOn] = useState(false)
  return (
    <div style={{ height: 36, width: '100%', maxWidth: 480, display: 'flex' }}>
      <Toolbar label="Example toolbar">
        <ToolbarGroup side="left">
          <ToolSlot tool="bell">
            <ToolButton label="Alerts" onClick={() => {}}>
              <Bell />
            </ToolButton>
          </ToolSlot>
          <ToolSlot tool="draw" separator>
            <ToolButton label="Draw" pressed={on} onClick={() => setOn(!on)}>
              <Settings />
            </ToolButton>
          </ToolSlot>
        </ToolbarGroup>
        <ToolbarGroup side="right">
          <ToolSlot tool="shot">
            <ToolButton label="Screenshot" title="Take a screenshot" disabled onClick={() => {}}>
              <Camera />
            </ToolButton>
          </ToolSlot>
        </ToolbarGroup>
      </Toolbar>
    </div>
  )
}

export function EstimateBadgeDemo() {
  return (
    <Row name="估算">
      <EstimateBadge label="Estimated from bars" title="Fills are estimated from closed 1-minute bars." />
    </Row>
  )
}
