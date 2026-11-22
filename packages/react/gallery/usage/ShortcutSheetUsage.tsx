// SPDX-License-Identifier: MIT
import { ShortcutSheet, useHotkeys } from '../../src/index'

export function ShortcutSheetUsage() {
  useHotkeys([
    { id: 'search', combo: 'Mod+K', label: 'Quick search', handler: () => {} },
    { id: 'next', combo: ['ArrowDown', 'Space'], label: 'Next symbol', scope: 'watchlist', handler: () => {} },
    { id: 'flag', combo: 'Alt+Enter', label: 'Flag / unflag symbol', scope: 'watchlist', handler: () => {} },
  ])
  return (
    <div style={{ width: 360 }}>
      <ShortcutSheet
        labels={{
          search: 'Find shortcut',
          empty: 'No shortcut matches',
          or: 'or',
          conflict: (others) => `Conflicts with ${others}`,
          scope: (scope) => ({ global: 'General', watchlist: 'Watchlist' })[scope] ?? scope,
        }}
        scopeOrder={['global', 'watchlist']}
      />
    </div>
  )
}
