// SPDX-License-Identifier: MIT
import { ParallaxLayers } from '../../src/index'

export function ParallaxLayersUsage() {
  return (
    <div style={{ height: 160, overflow: 'hidden' }}>
      <ParallaxLayers
        layers={[
          { id: 'far', depth: 0.2, content: <div style={{ padding: 16 }}>Far</div> },
          { id: 'near', depth: 1, content: <div style={{ padding: 16 }}>Near</div> },
        ]}
      />
    </div>
  )
}
