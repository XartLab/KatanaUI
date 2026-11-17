// SPDX-License-Identifier: MIT
import { AuroraCurtain } from '../../src/index'

export function AuroraCurtainUsage() {
  return (
    <div style={{ position: 'relative', height: 160, border: '1px solid var(--line-100)' }}>
      <AuroraCurtain className="h-full w-full">
        <div style={{ padding: 16 }}>No strategy open</div>
      </AuroraCurtain>
    </div>
  )
}
