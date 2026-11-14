// SPDX-License-Identifier: MIT
import { QuoteTable } from '../../src/index'

export function QuoteTableUsage() {
  return (
    <QuoteTable
      label="Watchlists"
      columns={{ name: 'Name', trend: 'Trend', price: 'Last', change: 'Chg %' }}
      empty="No symbols in this group"
      groups={[
        {
          id: 'main',
          label: 'Main',
          rows: [{ id: 'a', name: 'Alpha', symbol: 'AAA', price: '11.80', percent: '+18.00%', tone: 'up' }],
        },
      ]}
    />
  )
}
