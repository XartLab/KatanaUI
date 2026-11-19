// SPDX-License-Identifier: MIT
import { QuoteTable } from '../../src/quotes'

export function QuoteTableUsage() {
  return (
    <QuoteTable
      labels={{
        list: 'Watchlists',
        columns: { name: 'Name', trend: 'Trend', price: 'Last', change: 'Chg %' },
        empty: 'No symbols in this group',
      }}
      groups={[
        {
          id: 'main',
          label: 'Main',
          rows: [{ id: 'a', symbol: 'AAA', name: 'Alpha', last: 11.8, change: 1.8, changePct: 18 }],
        },
      ]}
    />
  )
}
