// SPDX-License-Identifier: MIT
import type { ReactNode } from 'react'

// 文档页上摆状态用的两个小件：一行（带名字）与一格（带小标）。

export function Row({ name, children }: { name?: string; children: ReactNode }) {
  return (
    <div className="gal-row">
      {name ? <span className="gal-cap">{name}</span> : null}
      {children}
    </div>
  )
}

export function Cell({ name, children }: { name: string; children: ReactNode }) {
  return (
    <div className="gal-cell">
      {children}
      <small>{name}</small>
    </div>
  )
}

/** 示意图标：自绘的一个简单 SVG（圆底加一个字形），演示「有图」的样子；不是任何真实币种或公司的标志。 */
export const SAMPLE_MARK_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#E8A23A"/><path d="M12 8v16M12 9h6a3.5 3.5 0 0 1 0 7h-6M12 16h7a4 4 0 0 1 0 8h-7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
)}`
