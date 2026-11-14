// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { ToggleGroup, ToggleGroupItem } from '../../src/index'

export function ToggleGroupUsage() {
  const [frame, setFrame] = useState('d')
  return (
    <ToggleGroup aria-label="Timeframe" value={frame} onValueChange={setFrame}>
      <ToggleGroupItem value="d">Day</ToggleGroupItem>
      <ToggleGroupItem value="w">Week</ToggleGroupItem>
      <ToggleGroupItem value="m">Month</ToggleGroupItem>
    </ToggleGroup>
  )
}
