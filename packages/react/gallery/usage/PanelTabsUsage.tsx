// SPDX-License-Identifier: MIT
import { Download, Maximize2, PencilLine, SlidersHorizontal } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Button, ToggleGroup, ToggleGroupItem } from '../../src/index'
import { PanelTabs, type PanelTab } from '../../src/blocks'

// Each component brings its own tools: a chart needs symbol, interval, indicators and drawing; a table needs filter, columns and export.
function ChartTools({ interval, onInterval }: { interval: string; onInterval: (value: string) => void }) {
  return (
    <>
      <Button size="sm">BTCUSDT</Button>
      <ToggleGroup size="sm" aria-label="Interval" value={interval} onValueChange={onInterval}>
        {['15m', '1H', '1D'].map((value) => (
          <ToggleGroupItem key={value} value={value}>
            {value}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Button size="sm">Indicators</Button>
      <Button size="icon" variant="icon" aria-label="Draw">
        <PencilLine aria-hidden="true" />
      </Button>
    </>
  )
}

const TableTools = (
  <>
    <Button size="sm">All symbols</Button>
    <Button size="sm">Columns</Button>
    <Button size="icon" variant="icon" aria-label="Export">
      <Download aria-hidden="true" />
    </Button>
  </>
)

type Entry = Omit<PanelTab, 'id' | 'tools' | 'context'> & { tools?: 'chart' | 'table' }
const ALL: Record<string, Entry> = {
  chart: { name: 'Chart', kind: 'chart', status: 'live', closable: false, tools: 'chart' },
  orders: { name: 'Open orders', kind: 'table', badge: '3', tools: 'table' },
  info: { name: 'Info', kind: 'text' },
  feed: { name: 'Feed', kind: 'list', status: 'stale' },
  funding: { name: 'Funding', kind: 'gauge' },
}

export function PanelTabsUsage() {
  const [ids, setIds] = useState<readonly string[]>(['chart', 'orders', 'info'])
  const [active, setActive] = useState('chart')
  const [interval, setInterval] = useState('15m')
  const [asked, setAsked] = useState<string>()
  const toolsOf: Record<string, ReactNode> = {
    chart: <ChartTools interval={interval} onInterval={setInterval} />,
    table: TableTools,
  }
  const tabs: PanelTab[] = ids.map((id) => {
    const { tools, ...entry } = ALL[id]!
    return {
      id,
      ...entry,
      tools: tools ? toolsOf[tools] : undefined,
      context: id === 'chart' ? `BTCUSDT · ${interval}` : undefined,
    }
  })
  const rest = Object.keys(ALL).filter((id) => !ids.includes(id))
  return (
    <div
      className="k-text-body"
      style={{ width: '100%', maxWidth: 720, border: '1px solid var(--k-separable-tertiary-borderColor)' }}
    >
      <PanelTabs
        label="Panel components"
        labels={{
          close: 'Remove {name}',
          add: 'Add component',
          more: 'More tabs',
          tools: '{name} tools',
          status: { live: 'Live', stale: 'Not updating', error: 'Error' },
        }}
        tabs={tabs}
        activeId={active}
        onSelect={setActive}
        onClose={(id) => {
          setIds((list) => list.filter((item) => item !== id))
          if (id === active) setActive('chart')
        }}
        onAdd={(kind) => {
          setAsked(kind)
          if (!rest[0]) return
          setIds((list) => [...list, rest[0]!])
          setActive(rest[0]!)
        }}
        onReorder={(id, targetId) =>
          setIds((list) => {
            const next = list.filter((item) => item !== id)
            next.splice(list.indexOf(targetId), 0, id)
            return next
          })
        }
        actions={
          <>
            <Button size="icon" variant="icon" aria-label="Panel settings">
              <SlidersHorizontal aria-hidden="true" />
            </Button>
            <Button size="icon" variant="icon" aria-label="Open in a floating window">
              <Maximize2 aria-hidden="true" />
            </Button>
          </>
        }
      />
      <div role="tabpanel" style={{ padding: 12, minHeight: 72, color: 'var(--k-content-secondary-foreground)' }}>
        {ALL[active]!.name}
        {asked ? <output style={{ marginLeft: 8 }}>catalog asked next to: {asked}</output> : null}
      </div>
    </div>
  )
}
