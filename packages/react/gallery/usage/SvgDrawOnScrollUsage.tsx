// SPDX-License-Identifier: MIT
import { SvgDrawOnScroll } from '../../src/index'

export function SvgDrawOnScrollUsage() {
  return (
    <div tabIndex={0} role="region" aria-label="Scroll example" style={{ height: 160, overflowY: 'auto' }}>
      <div style={{ height: 120 }} />
      <SvgDrawOnScroll path="M4,86 C14,84 18,70 28,72 S44,56 52,58 S66,36 76,30 S90,12 96,8" stroke="var(--accent)" />
      <div style={{ height: 200 }} />
    </div>
  )
}
