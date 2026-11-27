// SPDX-License-Identifier: MIT
import { ProgressiveBlur } from '../../src/index'

export function ProgressiveBlurUsage() {
  return (
    <div style={{ position: 'relative', height: 120, overflow: 'hidden' }}>
      <div style={{ padding: 16 }}>Headline one. Headline two. Headline three. Headline four. Headline five.</div>
      <ProgressiveBlur direction="bottom" blur={12} />
    </div>
  )
}
