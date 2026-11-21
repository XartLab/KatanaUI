// SPDX-License-Identifier: MIT
import { Switcher } from '../../src/index'

export function SwitcherUsage() {
  return (
    <Switcher threshold={480} gap="space-3">
      <div>甲</div>
      <div>乙</div>
      <div>丙</div>
    </Switcher>
  )
}
