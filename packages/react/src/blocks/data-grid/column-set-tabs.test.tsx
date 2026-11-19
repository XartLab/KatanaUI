// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { ColumnSetTabs } from './column-set-tabs.tsx'
import type { GridColumnLayout } from './data-grid-props.ts'
import { activeColumnSet, applyColumnSet } from './layout-model.ts'

// 结构与纯函数（G6 补：这页原来没有单测）。点击与套用在浏览器里查（e2e/ui-gallery.spec.ts 的 column-set-tabs 页）。

const layout: GridColumnLayout[] = [
  { id: 'symbol', label: 'Symbol', width: 120, visible: true },
  { id: 'price', label: 'Price', width: 80, visible: true },
  { id: 'pe', label: 'P/E', width: 60, visible: false },
  { id: 'yield', label: 'Yield', width: 60, visible: false },
]
const sets = [
  { id: 'overview', label: 'Overview', columns: ['symbol', 'price'] },
  { id: 'valuation', label: 'Valuation', columns: ['symbol', 'pe'] },
]

describe('ColumnSetTabs', () => {
  it('是带读屏名的 tablist；看得见的列恰好等于哪一套，哪个页签 aria-selected', () => {
    const html = renderToStaticMarkup(
      <ColumnSetTabs layout={layout} onLayoutChange={() => {}} sets={sets} label="Column sets" />,
    )
    expect(html).toContain('role="tablist"')
    expect(html).toContain('aria-label="Column sets"')
    expect(html).toMatch(/aria-selected="true"[^>]*data-set="overview"/)
    expect(html).toMatch(/aria-selected="false"[^>]*data-set="valuation"/)
    expect(html).not.toContain('k-cset-extra')
  })

  it('手动改过列（不等于任何一套）就没有页签亮着；children 放进右侧按钮位', () => {
    const changed = layout.map((column) => (column.id === 'yield' ? { ...column, visible: true } : column))
    const html = renderToStaticMarkup(
      <ColumnSetTabs layout={changed} onLayoutChange={() => {}} sets={sets} label="Column sets">
        <button type="button">Refresh</button>
      </ColumnSetTabs>,
    )
    expect(html).not.toContain('aria-selected="true"')
    expect(html).toContain('<div class="k-cset-extra"><button type="button">Refresh</button></div>')
  })

  it('applyColumnSet 把这一套排到前面并显示，其余隐藏；activeColumnSet 不看次序', () => {
    const next = applyColumnSet(layout, ['pe', 'symbol', 'missing'])
    expect(next.map((column) => [column.id, column.visible])).toEqual([
      ['pe', true],
      ['symbol', true],
      ['price', false],
      ['yield', false],
    ])
    expect(activeColumnSet(next, sets)).toBe('valuation')
  })
})
