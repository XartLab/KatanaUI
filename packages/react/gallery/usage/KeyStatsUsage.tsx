// SPDX-License-Identifier: MIT
import { KeyStats } from '../../src/quotes'

export function KeyStatsUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <KeyStats
        title="Key stats"
        onTitle={() => undefined}
        onSelect={() => undefined}
        items={[
          { id: 'cap', label: 'Market cap', value: '3.41T', unit: 'USD', badge: 'Mega cap' },
          { id: 'pe', label: 'Price to earnings (P/E TTM)', value: '31.20' },
          { id: 'eps', label: 'Basic EPS (TTM)', value: '6.57', unit: 'USD' },
          { id: 'beta', label: 'Beta (1Y)', value: '—' },
        ]}
      />
    </div>
  )
}
