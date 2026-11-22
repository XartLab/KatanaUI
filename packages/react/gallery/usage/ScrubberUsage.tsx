// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Scrubber } from '../../src/index'

export function ScrubberUsage() {
  const [qty, setQty] = useState(200)
  return (
    <Scrubber
      label="Quantity"
      min={0}
      max={1000}
      step={10}
      value={qty}
      onValueChange={setQty}
      format={(v) => `${v} sh`}
    />
  )
}
