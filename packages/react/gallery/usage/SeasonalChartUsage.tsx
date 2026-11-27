// SPDX-License-Identifier: MIT
import { SeasonalChart, seasonalSeries } from '../../src/quant'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// 每年三个价：年初、年中、年底（示例数据）。
const years = seasonalSeries(
  [2024, 2025].flatMap((year, index) => [
    { time: Date.UTC(year, 0, 2), value: 100 },
    { time: Date.UTC(year, 5, 28), value: 104 - index * 6 },
    { time: Date.UTC(year, 11, 30), value: 108 + index * 3 },
  ]),
)

export function SeasonalChartUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <SeasonalChart years={years} labels={{ chart: 'Seasonals', legend: 'Years', months: MONTHS, empty: 'No data' }} />
    </div>
  )
}
