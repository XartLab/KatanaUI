// SPDX-License-Identifier: MIT
import { formatPrice } from '../../src/quant'
import { PeerCards, type PeerItem } from '../../src/quotes'

const PEERS: readonly PeerItem[] = [
  { id: 'AAA', symbol: 'AAA', name: 'Alpha Devices Incorporated', last: 212.4, unit: 'USD', changePct: 0.84 },
  { id: 'BRV', symbol: 'BRV', name: 'Bravo Semiconductor Holdings', last: 1044.1, unit: 'USD', changePct: -2.31 },
  { id: 'CHL', symbol: 'CHL', name: 'Charlie Software', last: 418.77, unit: 'USD', changePct: 1.12 },
  { id: 'DLT', symbol: 'DLT', name: 'Delta Cloud Systems Ltd', last: 96.05, unit: 'USD', changePct: -0.2 },
]

export function PeerCardsUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <PeerCards
        items={PEERS}
        formatPrice={(value) => formatPrice(value, { precision: 2 })}
        labels={{
          list: 'Peers',
          prev: 'Previous',
          next: 'Next',
          compare: 'Select to compare',
          add: (item) => `Add ${item.symbol} to compare`,
        }}
        onSelect={() => undefined}
        onAdd={() => undefined}
        onCompare={() => undefined}
      />
    </div>
  )
}
