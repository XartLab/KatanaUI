// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { createHotkeyRegistry } from './hotkeys.tsx'
import { ShortcutSheet, type ShortcutSheetLabels } from './shortcut-sheet.tsx'

// 快捷键总览的分节（#87 第 3 条）：照 TradingView 默认收起，节名是展开钮；defaultOpenScopes 一开始就展开。

const LABELS: ShortcutSheetLabels = { search: 'Find shortcut', empty: 'No shortcuts', or: 'or', conflict: (o) => o }

const registry = () => {
  const r = createHotkeyRegistry({ platform: 'other' })
  r.register({ id: 'reset', combo: 'Alt+R', label: 'Reset chart', scope: 'chart', handler: () => {} })
  r.register({ id: 'next', combo: 'ArrowDown', label: 'Next symbol', scope: 'watchlist', handler: () => {} })
  return r
}

describe('ShortcutSheet 分节', () => {
  it('默认每节收起：只有节名钮（aria-expanded=false），没有行', () => {
    const html = renderToStaticMarkup(<ShortcutSheet labels={LABELS} registry={registry()} />)
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(2)
    expect(html).toContain('>chart</button>')
    expect(html).not.toContain('data-shortcut=')
  })

  it('defaultOpenScopes 里的节一开始就展开，别的仍收起', () => {
    const html = renderToStaticMarkup(
      <ShortcutSheet labels={LABELS} registry={registry()} defaultOpenScopes={['chart']} />,
    )
    expect(html).toContain('data-shortcut="reset"')
    expect(html).not.toContain('data-shortcut="next"')
    expect(html).toMatch(/data-scope="chart" data-open=""/)
  })
})
