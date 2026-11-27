// SPDX-License-Identifier: MIT
import { ValuationBand, type ValuationPoint } from '../../src/quant'

// Example data: 260 weekly points made up with a closed formula, not an index's real PE. Week i is labelled by its date.
const START = Date.UTC(2021, 10, 29)
const POINTS: ValuationPoint[] = Array.from({ length: 260 }, (_, i) => ({
  time: new Date(START + i * 7 * 86_400_000).toISOString().slice(0, 10),
  value: Math.round((12 + 3 * Math.sin(i / 23) + 1.6 * Math.sin(i / 7.5) + (i / 260) * 2.4) * 100) / 100,
}))

export function ValuationBandUsage() {
  return (
    <ValuationBand
      label="Example index PE, 5 years (example data)"
      points={POINTS}
      formatValue={(value) => `${value.toFixed(1)}x`}
    />
  )
}
