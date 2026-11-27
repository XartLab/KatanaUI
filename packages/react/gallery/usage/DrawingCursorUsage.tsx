// SPDX-License-Identifier: MIT
import { DrawingCursor } from '../../src/index'

export function DrawingCursorUsage() {
  return (
    <DrawingCursor decay={800}>
      <div style={{ height: 160, display: 'grid', placeItems: 'center' }}>Draw on the chart</div>
    </DrawingCursor>
  )
}
