// SPDX-License-Identifier: MIT
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../src/index'
import { useState } from 'react'

export function SelectUsage() {
  const [kind, setKind] = useState('line')
  return (
    <Select value={kind} onValueChange={setKind}>
      <SelectTrigger aria-label="Chart type">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="line">Line</SelectItem>
        <SelectItem value="candles">Candles</SelectItem>
      </SelectContent>
    </Select>
  )
}
