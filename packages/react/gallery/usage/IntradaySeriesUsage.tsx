// SPDX-License-Identifier: MIT
import { IntradaySeries } from '../../src/cn'
import { minuteSeries, tradingClocks } from './intraday-demo-data.ts'

// Example data: made up with a closed formula, not market data. 10:12–10:14 are missing minutes: the line leaves a gap there.
const clocks = tradingClocks()
const MISSING = ['10:12', '10:13', '10:14']

export function IntradaySeriesUsage() {
  return (
    <IntradaySeries
      label="Limit-ups and break rate through the day (example data)"
      series={[
        {
          key: 'up',
          name: 'Limit-ups',
          points: minuteSeries(clocks, { base: 30, drift: 55, swing: 6, seed: 1, missing: MISSING }),
          previous: minuteSeries(clocks, { base: 24, drift: 40, swing: 5, seed: 4 }),
          format: (value) => `${value}`,
        },
        {
          key: 'rate',
          name: 'Break rate',
          axis: 'right',
          points: minuteSeries(clocks, { base: 14, drift: 8, swing: 3, seed: 2, round: 1 }),
          format: (value) => `${value.toFixed(1)}%`,
        },
      ]}
    />
  )
}
