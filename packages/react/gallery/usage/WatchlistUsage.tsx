// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Watchlist, type WatchlistRow } from '../../src/quotes'

const ROWS: readonly WatchlistRow[] = [
  {
    id: 'a',
    symbol: 'AAA',
    name: 'Alpha Devices',
    last: 212.4,
    change: 1.77,
    changePct: 0.84,
    flagged: true,
    volume: 42_800_000,
  },
  { id: 'b', symbol: 'BRV', name: 'Bravo Semi', last: 1044.1, change: -24.7, changePct: -2.31, volume: 2_950_000 },
  { id: 'c', symbol: 'CHL', name: 'Charlie Software', last: 418.77, change: 4.64, changePct: 1.12, volume: 835_490 },
]

export function WatchlistUsage() {
  const [rows, setRows] = useState(ROWS)
  return (
    <div style={{ width: '100%', maxWidth: 520 }}>
      <Watchlist
        rows={rows}
        labels={{
          columns: { symbol: 'Symbol', last: 'Last', chg: 'Chg', chgPct: 'Chg%', vol: 'Vol' },
          list: 'Watchlist',
          empty: 'No symbols',
          flag: (row) => `Flag ${row.symbol}`,
        }}
        onFlag={(row, flagged) => setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, flagged } : r)))}
      />
    </div>
  )
}
