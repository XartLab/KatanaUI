// SPDX-License-Identifier: MIT
import { MiniChart } from '../../src/index'

export function MiniChartUsage() {
  return (
    <MiniChart
      symbol="AAA"
      name="Alpha"
      badge="D"
      price={11.8}
      unit="USD"
      change={1.8}
      values={[10, 10.4, 10.2, 11, 11.8]}
      labels={{ card: 'Alpha, up 1.8%', chart: 'Alpha price trend, up' }}
    />
  )
}
