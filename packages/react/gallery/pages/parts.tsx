// SPDX-License-Identifier: MIT
import type { ReactNode } from 'react'
import { symbolMenu, type RowAction } from '../../src'

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

/** 示意图标：自绘的一个简单 SVG（中性灰圆底加白色字形，不用信号橙），演示「有图」的样子；不是任何真实币种或公司的标志。 */
export const SAMPLE_MARK_SRC = `data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#2a2a2a"/><path d="M12 8v16M12 9h6a3.5 3.5 0 0 1 0 7h-6M12 16h7a4 4 0 0 1 0 8h-7" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
)}`

/** 行快捷操作演示用的标准品种菜单：四项都传，点了把「动作 · 代码」交给 log，页上一行字显示最后一次（动作不真的去开图、加自选）。 */
export function demoSymbolActions(code: string, log: (text: string) => void): RowAction[] {
  const run = (name: string) => () => log(`${name} · ${code}`)
  return symbolMenu({
    openChart: { label: 'Open chart', onSelect: run('Open chart') },
    addToWatchlist: { label: 'Add to watchlist', shortcut: 'Alt+W', onSelect: run('Add to watchlist') },
    newAlert: { label: 'New alert', shortcut: 'Alt+A', onSelect: run('New alert') },
    copyCode: { label: 'Copy code', onSelect: run('Copy code') },
  })
}

/** 演示页上「最后一次动作」那一行。 */
export function ActionLog({ text }: { text: string }) {
  return (
    <p className="gal-note" data-testid="row-action-log">
      {text ? `Last action: ${text}` : 'Last action: none yet'}
    </p>
  )
}
