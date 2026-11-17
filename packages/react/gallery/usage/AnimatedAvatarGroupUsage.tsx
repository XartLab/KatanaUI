// SPDX-License-Identifier: MIT
import { AnimatedAvatarGroup } from '../../src/index'

export function AnimatedAvatarGroupUsage() {
  return (
    <AnimatedAvatarGroup
      label="Top holdings"
      maxVisible={3}
      items={[
        { code: 'NVDA', name: 'NVIDIA' },
        { code: 'AAPL', name: 'Apple' },
        { code: 'MSFT', name: 'Microsoft' },
        { code: 'TSLA', name: 'Tesla' },
      ]}
    />
  )
}
