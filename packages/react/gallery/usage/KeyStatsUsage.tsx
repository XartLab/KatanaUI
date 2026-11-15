// SPDX-License-Identifier: MIT
import { KeyStats } from '../../src/quant'

export function KeyStatsUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <KeyStats
        title="Key stats"
        onTitle={() => undefined}
        onItem={() => undefined}
        items={[
          { key: 'cap', label: 'Market cap', value: '3.41T', unit: 'USD', badge: 'Mega cap' },
          { key: 'pe', label: 'Price to earnings (P/E TTM)', value: '31.20' },
          { key: 'eps', label: 'Basic EPS (TTM)', value: '6.57', unit: 'USD' },
          { key: 'beta', label: 'Beta (1Y)', value: '—' },
        ]}
      />
    </div>
  )
}
