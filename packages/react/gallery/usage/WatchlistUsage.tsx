// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Watchlist, type WatchlistRow } from '../../src/quant'

const ROWS: readonly WatchlistRow[] = [
  { key: 'a', code: 'AAA', name: 'Alpha Devices', last: 212.4, change: 1.77, changePct: 0.84, flagged: true },
  { key: 'b', code: 'BRV', name: 'Bravo Semi', last: 1044.1, change: -24.7, changePct: -2.31 },
  { key: 'c', code: 'CHL', name: 'Charlie Software', last: 418.77, change: 4.64, changePct: 1.12 },
]

export function WatchlistUsage() {
  const [rows, setRows] = useState(ROWS)
  return (
    <div style={{ width: '100%', maxWidth: 440 }}>
      <Watchlist
        rows={rows}
        labels={{
          columns: { symbol: 'Symbol', last: 'Last', chg: 'Chg', chgPct: 'Chg%' },
          list: 'Watchlist',
          empty: 'No symbols',
          flag: (row) => `Flag ${row.code}`,
        }}
        onFlag={(row, flagged) => setRows((prev) => prev.map((r) => (r.key === row.key ? { ...r, flagged } : r)))}
      />
    </div>
  )
}
