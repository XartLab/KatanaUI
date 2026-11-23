// SPDX-License-Identifier: MIT
import { PixelFlowField } from '../../src/index'

export function PixelFlowFieldUsage() {
  return (
    <div style={{ position: 'relative', height: 160, border: '1px solid var(--line-100)' }}>
      <PixelFlowField className="h-full w-full" text="LINK">
        <span />
      </PixelFlowField>
    </div>
  )
}
