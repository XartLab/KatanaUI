// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, CommandPalette, useHotkeys, type PaletteCommand } from '../../src/index'

const MARKETS = [
  { id: 'us', label: 'US', description: '312 symbols' },
  { id: 'hk', label: 'Hong Kong', description: '148 symbols' },
]
const FIELDS = [
  { id: 'ohlc', label: 'OHLC' },
  { id: 'volume', label: 'Volume' },
]

const COMMANDS: readonly PaletteCommand[] = [
  { id: 'reset', label: 'Reset chart', group: 'Chart', onSelect: () => {} },
  { id: 'snapshot', label: 'Take snapshot', group: 'Chart', onSelect: () => {} },
  { id: 'theme', label: 'Switch theme', group: 'Settings', keywords: ['dark'], onSelect: () => {} },
  {
    id: 'export',
    label: 'Bulk export',
    group: 'Data',
    description: 'By market',
    // Two steps: "2 steps" badge on the row; selecting it opens the step page, the palette stays open.
    steps: [
      { kind: 'checklist', id: 'market', joiner: 'from', heading: 'Select market', options: MARKETS },
      { kind: 'checklist', id: 'fields', joiner: 'with', heading: 'Select fields', options: FIELDS },
    ],
  },
]

export function CommandPaletteUsage() {
  const [open, setOpen] = useState(false)
  const [recent, setRecent] = useState<readonly string[]>(['snapshot'])
  useHotkeys([
    { id: 'palette', combo: 'Mod+K', label: 'Command palette', allowInInput: true, handler: () => setOpen(true) },
  ])
  return (
    <>
      <Button onClick={() => setOpen(true)}>Commands</Button>
      <CommandPalette
        open={open}
        onOpenChange={setOpen}
        commands={COMMANDS}
        recent={recent}
        onRecentChange={setRecent}
        onRun={(commandId, selections) => console.log(commandId, selections)}
        labels={{
          title: 'Command palette',
          description: 'Search commands',
          placeholder: 'Search…',
          empty: 'No command matches',
          recent: 'Recent',
        }}
      />
    </>
  )
}
