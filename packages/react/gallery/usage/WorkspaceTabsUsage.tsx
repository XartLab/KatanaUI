// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { WorkspaceTabs, type WorkspaceTab } from '../../src/blocks'

const TABS: readonly WorkspaceTab[] = [
  { id: 'overview', name: 'Overview', hotkey: '⌘1' },
  { id: 'desk', name: 'Desk', hotkey: '⌘2' },
  { id: 'lab', name: 'Lab', hotkey: '⌘3' },
  { id: 'portfolio', name: 'Portfolio', hotkey: '⌘4' },
  { id: 'runs', name: 'Runs', hotkey: '⌘5' },
  { id: 'my-long-workspace-name', name: 'My very long workspace name' },
]

export function WorkspaceTabsUsage() {
  const [tabs, setTabs] = useState(TABS)
  const [active, setActive] = useState('desk')
  const [renamed, setRenamed] = useState<string | null>(null)
  return (
    <div className="gal-stack" style={{ width: '100%', maxWidth: 640 }}>
      <div style={{ width: 520 }} data-testid="tabs-demo">
        <WorkspaceTabs
          workspaces={tabs}
          activeId={active}
          label="Workspaces"
          createLabel="New workspace"
          moreLabel="More workspaces"
          onSelect={setActive}
          onRename={setRenamed}
          onCreate={() => setTabs((prev) => [...prev, { id: `ws${prev.length}`, name: `Workspace ${prev.length}` }])}
          onReorder={(id, target) =>
            setTabs((prev) => {
              const from = prev.findIndex((item) => item.id === id)
              const to = prev.findIndex((item) => item.id === target)
              if (from < 0 || to < 0) return prev
              const next = [...prev]
              next.splice(to, 0, ...next.splice(from, 1))
              return next
            })
          }
        />
      </div>
      <p className="gal-note" data-testid="tabs-rename">
        {renamed ? `Rename requested: ${renamed}` : 'No rename requested'}
      </p>
    </div>
  )
}
