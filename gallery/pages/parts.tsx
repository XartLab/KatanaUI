// SPDX-License-Identifier: AGPL-3.0-only
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
