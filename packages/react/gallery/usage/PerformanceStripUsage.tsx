// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { PerformanceStrip } from '../../src/quant'

const ITEMS = [
  { key: '1d', label: '1 day', change: 0.62 },
  { key: '1m', label: '1 month', change: 3.18 },
  { key: '6m', label: '6 months', change: -4.07 },
  { key: '1y', label: '1 year', change: 27.5 },
  { key: '5y', label: '5 years', change: 312.9 },
]

export function PerformanceStripUsage() {
  const [picked, setPicked] = useState('1y')
  return (
    <div style={{ width: '100%', maxWidth: 560 }}>
      <PerformanceStrip items={ITEMS} label="Performance" value={picked} onValueChange={setPicked} />
    </div>
  )
}
