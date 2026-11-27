// SPDX-License-Identifier: MIT
import { GravityStars } from '../../src/index'

export function GravityStarsUsage() {
  return (
    <div style={{ position: 'relative', height: 160, border: '1px solid var(--line-100)' }}>
      <GravityStars className="h-full w-full" count={120}>
        <div style={{ padding: 16 }}>Not connected</div>
      </GravityStars>
    </div>
  )
}
