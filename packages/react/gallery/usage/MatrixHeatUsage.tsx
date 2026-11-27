// SPDX-License-Identifier: MIT
import { MatrixHeat, type MatrixHeatColumn, type MatrixHeatRow } from '../../src/quant'

// Example data: made up (promotion rate by board level and day), not market data. The empty cell says why it is empty.
const COLUMNS: MatrixHeatColumn[] = ['11-20', '11-21', '11-24', '11-25', '11-26'].map((day) => ({
  id: day,
  label: day,
}))
const RATES: readonly (readonly (readonly [number, number] | null)[])[] = [
  [
    [18, 40],
    [22, 45],
    [9, 38],
    [26, 50],
    [14, 41],
  ],
  [
    [8, 12],
    [5, 14],
    [4, 9],
    [3, 11],
    [7, 10],
  ],
  [[2, 5], [3, 4], [0, 3], [1, 4], null],
  [[1, 2], null, [0, 2], [1, 1], [0, 1]],
]
const ROWS: MatrixHeatRow[] = ['First board', '2 boards', '3 boards', '4+ boards'].map((label, r) => ({
  id: `b${r}`,
  label,
  cells: RATES[r]!.map((hit) =>
    hit === null
      ? { value: null, reason: 'No stock at this level' }
      : { value: Math.round((hit[0] / hit[1]) * 100), reason: `${hit[0]} of ${hit[1]} promoted` },
  ),
}))

export function MatrixHeatUsage() {
  return (
    <MatrixHeat
      columns={COLUMNS}
      rows={ROWS}
      formatValue={(value) => `${value}%`}
      labels={{
        grid: 'Promotion rate by board level and day (example data)',
        corner: 'Level',
        legend: { low: 'Low', high: 'High' },
      }}
    />
  )
}
