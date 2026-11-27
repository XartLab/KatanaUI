// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Button, DynamicIsland } from '../../src/index'

export function DynamicIslandUsage() {
  const [filled, setFilled] = useState(false)
  return (
    <>
      <Button onClick={() => setFilled((value) => !value)}>Toggle</Button>
      <DynamicIsland view={filled ? 'fill' : 'idle'} label="Trade notifications">
        {filled ? <p>Filled BTCUSDT buy 0.50 @ 106,977.4</p> : <p>Connected</p>}
      </DynamicIsland>
    </>
  )
}
