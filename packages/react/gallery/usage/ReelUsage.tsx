// SPDX-License-Identifier: MIT
import { Reel } from '../../src/index'

export function ReelUsage() {
  return (
    <Reel aria-label="题材卡" gap="space-2">
      <div style={{ width: 120 }}>锂电</div>
      <div style={{ width: 120 }}>光伏</div>
      <div style={{ width: 120 }}>算力</div>
    </Reel>
  )
}
