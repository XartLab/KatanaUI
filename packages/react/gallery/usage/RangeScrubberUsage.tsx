// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { RangeScrubber } from '../../src/cn'

export function RangeScrubberUsage() {
  const [range, setRange] = useState<[string, string]>(['09:30', '10:42'])
  const [metric, setMetric] = useState('change')
  return (
    <RangeScrubber
      now="10:42"
      value={range}
      onValueChange={setRange}
      presets={[5, 15, 30]}
      metrics={['change', 'net']}
      metric={metric}
      onMetricChange={setMetric}
    />
  )
}
