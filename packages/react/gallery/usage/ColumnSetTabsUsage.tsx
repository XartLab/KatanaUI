// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ColumnSetTabs, type ColumnSet, type GridColumnLayout } from '../../src/blocks'

const LAYOUT: readonly GridColumnLayout[] = [
  { id: 'symbol', label: '代码', width: 160, visible: true },
  { id: 'price', label: '价格', width: 100, visible: true },
  { id: 'pe', label: '市盈率', width: 90, visible: true },
  { id: 'mcap', label: '市值', width: 120, visible: true },
]

const SETS: readonly ColumnSet[] = [
  { id: 'overview', label: '概览', columns: ['symbol', 'price', 'pe', 'mcap'] },
  { id: 'valuation', label: '估值', columns: ['symbol', 'pe', 'mcap'] },
]

export function ColumnSetTabsUsage() {
  const [layout, setLayout] = useState<GridColumnLayout[]>([...LAYOUT])
  return <ColumnSetTabs layout={layout} onLayoutChange={setLayout} sets={SETS} label="列集" />
}
