// SPDX-License-Identifier: MIT
import { CrossRates } from '../../src/quotes'

export function CrossRatesUsage() {
  return (
    <CrossRates
      currencies={['USD', 'EUR', 'JPY']}
      quotes={[
        { base: 'USD', quote: 'EUR', rate: 0.9234, changePct: -0.18 },
        { base: 'USD', quote: 'JPY', rate: 155.2, changePct: 0.42 },
        { base: 'EUR', quote: 'USD', rate: 1.083, changePct: 0.18 },
        { base: 'EUR', quote: 'JPY', rate: 168.08, changePct: 0.6 },
        { base: 'JPY', quote: 'USD', rate: 0.00644, changePct: -0.42 },
        { base: 'JPY', quote: 'EUR', rate: 0.00595, changePct: -0.6 },
      ]}
      mode="heatmap"
      onSelect={() => undefined}
      labels={{ table: 'Currency heatmap', empty: 'Not connected' }}
    />
  )
}
