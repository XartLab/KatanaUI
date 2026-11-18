// SPDX-License-Identifier: MIT
/**
 * Lays an open overlay out in the document flow so a component screenshot can capture it.
 * 浮层「打开的样子」截图用：内容不进 Portal（InlineOverlays），定位外壳改回文档流；transform 让 fixed 的浮层（Dialog、Sheet）相对这个框定位。
 */
import type { CSSProperties, ReactNode } from 'react'
import { InlineOverlays } from '../src/lib/overlay.tsx'

const CSS = `
.shot-open{position:relative;display:flex;flex-direction:column;align-items:flex-start;gap:8px;transform:translateZ(0)}
.shot-open [data-radix-popper-content-wrapper]{position:static !important;transform:none !important}
`

export function OpenFrame({ children, width, height }: { children: ReactNode; width?: number; height?: number }) {
  const style: CSSProperties = { width, height, minWidth: 200, minHeight: 80 }
  return (
    <InlineOverlays>
      <style>{CSS}</style>
      <div className="shot-open" style={style}>
        {children}
      </div>
    </InlineOverlays>
  )
}
