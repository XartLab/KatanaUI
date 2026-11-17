// SPDX-License-Identifier: MIT
import { EmbossSurface } from '../../src/index'

export function EmbossSurfaceUsage() {
  return (
    <EmbossSurface variant="emboss" depth={3}>
      <div style={{ padding: '16px 24px' }}>NVDA</div>
    </EmbossSurface>
  )
}
