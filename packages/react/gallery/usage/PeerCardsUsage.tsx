// SPDX-License-Identifier: MIT
import { PeerCards, type PeerItem } from '../../src/quant'

const PEERS: readonly PeerItem[] = [
  { key: 'AAA', code: 'AAA', name: 'Alpha Devices Incorporated', price: '212.40', unit: 'USD', change: 0.84 },
  { key: 'BRV', code: 'BRV', name: 'Bravo Semiconductor Holdings', price: '1,044.10', unit: 'USD', change: -2.31 },
  { key: 'CHL', code: 'CHL', name: 'Charlie Software', price: '418.77', unit: 'USD', change: 1.12 },
  { key: 'DLT', code: 'DLT', name: 'Delta Cloud Systems Ltd', price: '96.05', unit: 'USD', change: -0.2 },
]

export function PeerCardsUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <PeerCards
        items={PEERS}
        labels={{
          list: 'Peers',
          prev: 'Previous',
          next: 'Next',
          compare: 'Select to compare',
          add: (item) => `Add ${item.code} to compare`,
        }}
        onSelect={() => undefined}
        onAdd={() => undefined}
        onCompare={() => undefined}
      />
    </div>
  )
}
