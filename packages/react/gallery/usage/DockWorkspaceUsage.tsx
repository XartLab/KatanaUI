// SPDX-License-Identifier: MIT
import { useRef, useState } from 'react'
import { Button, ToggleGroup, ToggleGroupItem } from '../../src/index'
import {
  ComponentCatalog,
  DockWorkspace,
  catalogFromManifests,
  type ComponentManifest,
  type DockWorkspaceHandle,
} from '../../src/blocks'

const CATEGORIES = [
  { id: 'market', name: 'Market' },
  { id: 'orders', name: 'Orders' },
  { id: 'trade', name: 'Trading' },
]

// Demo manifests: what each component is, where it applies and what it needs.
const MANIFESTS: ComponentManifest[] = [
  { id: 'chart', name: 'Chart', category: 'market', kind: 'chart', minSize: { width: 240, height: 140 } },
  { id: 'book', name: 'Order book', category: 'market', kind: 'table', pairsWith: ['chart'], keywords: ['depth'] },
  { id: 'trades', name: 'Trades', category: 'market', kind: 'list', pairsWith: ['chart'] },
  { id: 'funding', name: 'Funding', category: 'market', kind: 'gauge', markets: ['crypto-perp'] },
  { id: 'company', name: 'Company', category: 'market', kind: 'text', markets: ['us-stock'] },
  { id: 'orders', name: 'Open orders', category: 'orders', kind: 'table' },
  { id: 'positions', name: 'Positions', category: 'orders', kind: 'table', needs: ['account'] },
  { id: 'ticket', name: 'Order ticket', category: 'trade', kind: 'form', singleton: true },
]

export function DockWorkspaceUsage() {
  const dock = useRef<DockWorkspaceHandle>(null)
  const [placed, setPlaced] = useState<readonly string[]>([])
  const [interval, setInterval] = useState('15m')
  const [target, setTarget] = useState<{ panelId?: string; kind?: string } | null>(null)
  const items = catalogFromManifests(
    MANIFESTS,
    { market: 'crypto-perp', capabilities: [], inUse: placed },
    { market: () => 'Stocks only', needs: (_, capability) => `Needs ${capability}` },
  )
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <div style={{ height: 380, border: '1px solid var(--k-separable-tertiary-borderColor)' }}>
        <DockWorkspace
          ref={dock}
          manifests={MANIFESTS}
          defaultPanels={[
            { component: 'chart' },
            { component: 'book', beside: 'chart', direction: 'right', size: 220 },
            { component: 'orders', beside: 'chart', direction: 'below', size: 130 },
          ]}
          render={(component) => (
            <div style={{ padding: 12, color: 'var(--k-content-secondary-foreground)' }}>
              {MANIFESTS.find((manifest) => manifest.id === component)?.name}
            </div>
          )}
          tools={(component) =>
            component === 'chart' ? (
              <ToggleGroup size="sm" aria-label="Interval" value={interval} onValueChange={setInterval}>
                {['15m', '1H', '1D'].map((value) => (
                  <ToggleGroupItem key={value} value={value}>
                    {value}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            ) : component === 'orders' || component === 'positions' ? (
              <Button size="sm">Columns</Button>
            ) : null
          }
          meta={(_, component) =>
            component === 'chart'
              ? { status: 'live', context: `BTCUSDT · ${interval}` }
              : component === 'orders'
                ? { badge: '3' }
                : undefined
          }
          onPlacedChange={setPlaced}
          onRequestAdd={(panelId, kind) => setTarget({ panelId, kind })}
          labels={{
            add: 'Add component',
            close: 'Close {name}',
            maximize: 'Maximise',
            restore: 'Restore',
            float: 'Float',
            tools: '{name} tools',
            status: { live: 'Live', stale: 'Not updating', error: 'Error' },
          }}
        />
      </div>
      {target ? (
        <div style={{ maxWidth: 420 }}>
          <ComponentCatalog
            items={items}
            categories={CATEGORIES}
            context={target.kind}
            onToggle={(id, add) => {
              if (add) dock.current?.add(id, target.panelId ? { groupOf: target.panelId } : undefined)
              else dock.current?.api?.panels.find((panel) => panel.params?.component === id)?.api.close()
            }}
            onReset={() => dock.current?.reset()}
            labels={{
              title: 'Add components',
              hint: target.kind
                ? `Adding next to: ${target.kind}`
                : 'Click to add or remove, or drag a card onto a panel.',
              reset: 'Reset layout',
              search: 'Search components',
              all: 'All',
              recommended: 'Recommended here',
              empty: 'No component matches.',
              inUse: 'in workspace',
            }}
          />
        </div>
      ) : null}
    </div>
  )
}
