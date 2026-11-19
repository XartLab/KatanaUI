// SPDX-License-Identifier: MIT
import { Maximize2, SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { Button } from '../../src/index'
import { PanelTabs, type PanelTab } from '../../src/blocks'

const ALL: Record<string, string> = {
  chart: 'Chart',
  info: 'Info',
  data: 'Trading data',
  feed: 'Feed',
  funding: 'Funding',
}

export function PanelTabsUsage() {
  const [ids, setIds] = useState<readonly string[]>(['chart', 'info', 'data', 'feed'])
  const [active, setActive] = useState('data')
  const tabs: PanelTab[] = ids.map((id) => ({ id, name: ALL[id]!, closable: id !== 'chart' }))
  const rest = Object.keys(ALL).filter((id) => !ids.includes(id))
  return (
    <div className="k-text-body" style={{ width: 460, border: '1px solid var(--k-separable-tertiary-borderColor)' }}>
      <PanelTabs
        label="Panel components"
        labels={{ close: 'Remove {name}', add: 'Add component', more: 'More tabs' }}
        tabs={tabs}
        activeId={active}
        onSelect={setActive}
        onClose={(id) => {
          setIds((list) => list.filter((item) => item !== id))
          if (id === active) setActive('chart')
        }}
        onAdd={
          rest.length > 0
            ? () => {
                setIds((list) => [...list, rest[0]!])
                setActive(rest[0]!)
              }
            : undefined
        }
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
        {ALL[active]}
      </div>
    </div>
  )
}
