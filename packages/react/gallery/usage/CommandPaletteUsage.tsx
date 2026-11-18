// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, CommandPalette, useHotkeys, type PaletteCommand } from '../../src/index'

const COMMANDS: readonly PaletteCommand[] = [
  { id: 'reset', label: 'Reset chart', group: 'Chart', onSelect: () => {} },
  { id: 'snapshot', label: 'Take snapshot', group: 'Chart', onSelect: () => {} },
  { id: 'theme', label: 'Switch theme', group: 'Settings', keywords: ['dark'], onSelect: () => {} },
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
