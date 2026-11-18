// SPDX-License-Identifier: MIT
import { useState } from 'react'
import { useHotkeys } from '../../src/index'

export function HotkeysUsage() {
  const [count, setCount] = useState(0)
  useHotkeys([
    { id: 'chart-reset', combo: 'Alt+R', label: 'Reset chart', scope: 'chart', handler: () => setCount((n) => n + 1) },
    { id: 'chart-clear', combo: 'Mod+Alt+R', label: 'Clear count', scope: 'chart', handler: () => setCount(0) },
  ])
  return <p>Alt+R pressed {count} times (Mod+Alt+R clears)</p>
}
