// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { SymbolOverview } from '../../src/quotes'

const DAY = 86_400_000
const times = [0, 1, 2, 3, 4, 5].map((index) => Date.UTC(2026, 0, 5) + index * DAY)

export function SymbolOverviewUsage() {
  const [range, setRange] = useState('1m')
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <SymbolOverview
        items={[
          {
            id: 'a',
            symbol: 'AAA',
            last: 104.2,
            changePct: 4.2,
            values: [100, 101.5, 101, 102.8, 103.9, 104.2],
            times,
          },
          { id: 'b', symbol: 'BBB', last: 48.6, changePct: -2.8, values: [50, 49.8, 49.1, 49.4, 48.9, 48.6], times },
        ]}
        scale="percent"
        ranges={[
          { id: '1d', label: '1D' },
          { id: '1m', label: '1M' },
          { id: '12m', label: '1Y' },
        ]}
        range={range}
        onRangeChange={setRange}
        formatTime={(time) => new Date(time).toISOString().slice(5, 10)}
        labels={{ tabs: 'Symbols', ranges: 'Date range', chart: 'Comparison chart', empty: 'No data' }}
      />
    </div>
  )
}
