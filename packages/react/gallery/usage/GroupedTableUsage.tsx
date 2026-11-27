// SPDX-License-Identifier: MIT
import { GroupedTable, countPassed, type GridColumn, type GridColumnLayout } from '../../src/blocks'

// Example data: made up stocks on a limit-up ladder, not market data. Rows without a board count fall into the trailing "Other" group.
type Row = { id: string; name: string; boards: number | null; change: number; amount: number; promoted: boolean }
const ROWS: Row[] = [
  { id: 'a', name: 'Alpha Tech', boards: 4, change: 10.0, amount: 3.2e8, promoted: true },
  { id: 'b', name: 'Beta Robotics', boards: 3, change: 10.0, amount: 5.6e8, promoted: true },
  { id: 'c', name: 'Gamma Power', boards: 3, change: 9.98, amount: 1.9e8, promoted: false },
  { id: 'd', name: 'Delta Chips', boards: 2, change: 10.01, amount: 8.4e8, promoted: true },
  { id: 'e', name: 'Epsilon Drive', boards: 2, change: 9.99, amount: 2.7e8, promoted: false },
  { id: 'f', name: 'Zeta Bio', boards: 2, change: 8.2, amount: 4.1e8, promoted: false },
  { id: 'g', name: 'Eta Retail', boards: 1, change: 10.0, amount: 1.2e8, promoted: true },
  { id: 'h', name: 'Theta Media', boards: 1, change: 10.0, amount: 0.9e8, promoted: false },
  { id: 'i', name: 'Iota Mining', boards: null, change: 3.4, amount: 6.3e8, promoted: false },
]
const COLUMNS: GridColumn<Row>[] = [
  { id: 'name', type: 'text', value: (row) => row.name },
  { id: 'change', type: 'change', value: (row) => row.change },
  { id: 'amount', type: 'cnAmount', value: (row) => row.amount },
]
const LAYOUT: GridColumnLayout[] = [
  { id: 'name', label: 'Name', width: 170, visible: true },
  { id: 'change', label: 'Change', width: 90, visible: true },
  { id: 'amount', label: 'Turnover', width: 110, visible: true },
]

export function GroupedTableUsage() {
  return (
    <div style={{ width: 460 }}>
      <GroupedTable
        label="Limit-up ladder (example data)"
        columns={COLUMNS}
        layout={LAYOUT}
        rows={ROWS}
        rowId={(row) => row.id}
        groupBy={(row) => (row.boards === null ? null : String(row.boards))}
        groupHeading={(group) => `${group.key} boards`}
        groupMetric={(group) => Number(group.key)}
        groupSummary={(group) => {
          const { k, n } = countPassed(group.rows, (row) => row.promoted)
          return `${k}/${n} promoted`
        }}
        groupAggregates={{ amount: 'sum' }}
        otherLabel="Other"
        fit
      />
    </div>
  )
}
