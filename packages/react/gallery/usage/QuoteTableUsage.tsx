// SPDX-License-Identifier: MIT
import { QuoteTable } from '../../src/quotes'

export function QuoteTableUsage() {
  return (
    <QuoteTable
      labels={{
        list: 'Watchlists',
        columns: { name: 'Name', trend: 'Trend', price: 'Last', change: 'Chg %', volume: 'Volume' },
        empty: 'No symbols in this group',
      }}
      volumeUnit="USD"
      groups={[
        {
          id: 'main',
          label: 'Main',
          rows: [
            { id: 'a', symbol: 'AAA', name: 'Alpha', last: 11.8, change: 1.8, changePct: 18, volume: 42_800_000 },
            { id: 'b', symbol: 'BRV', name: 'Bravo Semi', last: 10.2, change: -1.8, changePct: -15, volume: 835_490 },
          ],
        },
      ]}
    />
  )
}
