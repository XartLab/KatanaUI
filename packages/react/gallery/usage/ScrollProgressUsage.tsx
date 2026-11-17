// SPDX-License-Identifier: MIT
import { useRef } from 'react'
import { ScrollProgress } from '../../src/index'

export function ScrollProgressUsage() {
  const box = useRef<HTMLDivElement>(null)
  return (
    <div tabIndex={0} role="region" aria-label="Scroll example" ref={box} style={{ height: 120, overflow: 'auto' }}>
      <ScrollProgress label="Reading progress" container={box} />
      <div style={{ height: 600 }}>Long report body</div>
    </div>
  )
}
