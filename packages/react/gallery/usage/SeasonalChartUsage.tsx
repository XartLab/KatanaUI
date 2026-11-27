// SPDX-License-Identifier: MIT
import { SeasonalChart, seasonalSeries } from '../../src/quant'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
// 每年三个收盘：年初、年中、年底；今年（2026）只走到 6 月 28 日（示例数据）。涨跌幅相对上一年最后一个收盘。
const DATES = [
  [0, 2],
  [5, 28],
  [11, 30],
] as const
const CLOSES: Record<number, readonly number[]> = { 2024: [100, 104, 108], 2025: [109, 103, 115], 2026: [116, 121] }
const years = seasonalSeries(
  Object.entries(CLOSES).flatMap(([year, closes]) =>
    closes.map((value, index) => ({ time: Date.UTC(Number(year), DATES[index]![0], DATES[index]![1]), value })),
  ),
)

export function SeasonalChartUsage() {
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <SeasonalChart
        years={years}
        labels={{ chart: 'Seasonals', legend: 'Years', months: MONTHS, empty: 'No data', month: 'Month' }}
        actionLabels={{
          group: 'Chart actions',
          table: 'Table view',
          exportCsv: 'Export CSV',
          fullscreen: 'Fullscreen',
        }}
        tableLabel="Month-end change by year"
      />
    </div>
  )
}
