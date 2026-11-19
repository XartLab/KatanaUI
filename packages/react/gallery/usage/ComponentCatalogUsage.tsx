// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ComponentCatalog, type CatalogItem } from '../../src/blocks'

const CATEGORIES = [
  { id: 'market', name: 'Market' },
  { id: 'orders', name: 'Orders & positions' },
  { id: 'trade', name: 'Trading' },
]

// Demo catalog, not a list of what the library ships.
const ITEMS: CatalogItem[] = [
  { id: 'chart', name: 'Chart', category: 'market', kind: 'chart', recommended: true },
  { id: 'book', name: 'Order book', category: 'market', kind: 'table', keywords: ['depth'], pairsWith: ['chart'] },
  { id: 'trades', name: 'Trades', category: 'market', kind: 'list', pairsWith: ['chart'] },
  { id: 'funding', name: 'Funding', category: 'market', kind: 'gauge', recommended: true },
  { id: 'company', name: 'Company', category: 'market', kind: 'text', unavailable: 'Stocks only' },
  { id: 'open-orders', name: 'Open orders', category: 'orders', kind: 'table' },
  { id: 'positions', name: 'Positions', category: 'orders', kind: 'table' },
  { id: 'assets', name: 'Assets', category: 'orders', kind: 'gauge' },
  { id: 'ticket', name: 'Order ticket', category: 'trade', kind: 'form' },
]

export function ComponentCatalogUsage() {
  const [used, setUsed] = useState<readonly string[]>(['chart', 'ticket', 'positions'])
  return (
    <div style={{ width: 380 }}>
      <ComponentCatalog
        items={ITEMS.map((item) => ({ ...item, inUse: used.includes(item.id) }))}
        categories={CATEGORIES}
        context="chart"
        onToggle={(id, add) => setUsed((list) => (add ? [...list, id] : list.filter((item) => item !== id)))}
        onReset={() => setUsed(['chart', 'ticket', 'positions'])}
        labels={{
          title: 'Add components',
          hint: 'Click to add or remove, or drag a card onto a panel.',
          reset: 'Reset layout',
          search: 'Search components',
          all: 'All',
          recommended: 'Next to the chart · BTC-USDT-SWAP',
          empty: 'No component matches.',
          inUse: 'in workspace',
        }}
      />
    </div>
  )
}
