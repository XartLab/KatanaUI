// SPDX-License-Identifier: MIT
import type { SideNavGroup } from '../src/index'

// 页末的上一页 / 下一页（kubai Vibe Design Tips 008，2026-11-26 读，只取结构）：次序就是左栏的显示次序，跨分组接续。
// 第一页没有上一页，最后一页没有下一页，那一格留空，另一格仍在原位。

export function PageNav({ groups, current }: { groups: readonly SideNavGroup[]; current?: string }) {
  const flat = groups.flatMap((group) => group.items)
  const at = flat.findIndex((item) => item.id === current)
  if (at < 0) return null
  const prev = flat[at - 1]
  const next = flat[at + 1]
  if (!prev && !next) return null
  return (
    <nav className="gal-pager" aria-label="上一页与下一页">
      {prev ? (
        <a className="gal-pager-link" data-dir="prev" rel="prev" href={prev.href}>
          <span className="gal-pager-dir">上一页</span>
          <span className="gal-pager-title">{prev.label}</span>
        </a>
      ) : null}
      {next ? (
        <a className="gal-pager-link" data-dir="next" rel="next" href={next.href}>
          <span className="gal-pager-dir">下一页</span>
          <span className="gal-pager-title">{next.label}</span>
        </a>
      ) : null}
    </nav>
  )
}
