// SPDX-License-Identifier: MIT
import { SymbolInfo } from '../../src/quotes'

export function SymbolInfoUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 480 }}>
      <SymbolInfo
        symbol="AAA"
        name="Alpha Devices"
        exchange="NASDAQ"
        last={212.4}
        change={-1.62}
        changePct={-0.76}
        unit="USD"
        status={{ tone: 'ok', label: 'Market open' }}
        ranges={[
          { id: 'day', title: "Day's range", low: 209.8, high: 215.35 },
          { id: '52w', title: '52 week range', low: 151.2, high: 238.9 },
        ]}
        label="Alpha Devices quote"
      />
    </div>
  )
}
