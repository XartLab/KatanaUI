// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { NumberInput } from '../../src/index'

export function NumberInputUsage() {
  const [width, setWidth] = useState(14)
  return <NumberInput label="Line width" value={width} onValue={setWidth} min={1} max={40} unit="px" />
}
