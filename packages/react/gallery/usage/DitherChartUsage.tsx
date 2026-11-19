// SPDX-License-Identifier: MIT
import { DitherChart } from '../../src/index'

export function DitherChartUsage() {
  return (
    <DitherChart
      variant="line"
      description="Equity curve rising from 3 to 14"
      data={[{ points: [3, 5, 4, 7, 9, 8, 12, 14].map((value) => ({ value })) }]}
    />
  )
}
