// SPDX-License-Identifier: MIT
import { LiquidMetal } from '../../src/index'

export function LiquidMetalUsage() {
  return (
    <div style={{ position: 'relative', height: 160, border: '1px solid var(--line-100)' }}>
      <LiquidMetal className="h-full w-full" variant="chrome">
        <div style={{ padding: 16 }}>Premium</div>
      </LiquidMetal>
    </div>
  )
}
