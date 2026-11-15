// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { Switch } from '../../src/index'

export function SwitchUsage() {
  const [on, setOn] = useState(true)
  return <Switch aria-label="Show grid" checked={on} onCheckedChange={setOn} />
}
