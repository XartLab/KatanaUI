// SPDX-License-Identifier: MIT
import { Sparkles } from 'lucide-react'
import { MorphSurface } from '../../src/index'

export function MorphSurfaceUsage() {
  return (
    <MorphSurface
      pill={
        <>
          <Sparkles size={14} /> Ask AI
        </>
      }
      openLabel="Ask AI"
      width={320}
      height={140}
    >
      <div style={{ padding: 12 }}>The open panel's content goes here.</div>
    </MorphSurface>
  )
}
