// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { ComponentCatalog } from './component-catalog.tsx'
import type { CatalogItem } from './component-catalog-model.ts'

const categories = [
  { id: 'market', name: '市场信息' },
  { id: 'orders', name: '订单与仓位' },
]
const items: CatalogItem[] = [
  { id: 'chart', name: '图表', category: 'market', inUse: true },
  { id: 'book', name: '订单簿', category: 'market', pairsWith: ['chart'] },
  { id: 'company', name: '公司', category: 'market', unavailable: '组件不适用于当前市场' },
  { id: 'positions', name: '当前仓位', category: 'orders' },
]
const labels = {
  title: '添加组件',
  search: '搜索组件',
  all: '全部',
  recommended: '推荐',
  empty: '没有可添加的组件',
  inUse: '已添加此组件',
}
const render = (variant?: 'drawer' | 'menu') =>
  renderToStaticMarkup(
    <ComponentCatalog
      variant={variant}
      items={items}
      categories={categories}
      context="chart"
      onToggle={() => {}}
      labels={labels}
    />,
  )

describe('ComponentCatalog variant', () => {
  it('默认还是抽屉样式：搜索框、类别页签、卡片', () => {
    const html = render()
    expect(html).not.toContain('data-variant="menu"')
    expect(html).toContain('type="search"')
    expect(html).toContain('role="tablist"')
    expect(html).toContain('aria-pressed="true"') // 已添加的卡
  })

  it('menu：没有搜索与页签；先「推荐」再按类别，每组一个带 aria-expanded 的标题按钮', () => {
    const html = render('menu')
    expect(html).toContain('data-variant="menu"')
    expect(html).toMatch(/role="group"[^>]*aria-label="添加组件"/)
    expect(html).not.toContain('type="search"')
    expect(html).not.toContain('role="tablist"')
    const groups = [...html.matchAll(/data-group="([^"]+)"/g)].map((m) => m[1])
    expect(groups).toEqual(['recommended', 'market', 'orders']) // 推荐的订单簿不在 market 里重复
    expect(html.match(/data-slot="catalog-group-toggle"[^>]*aria-expanded="true"/g)).toHaveLength(3)
  })

  it('menu：已添加与不可用的行 aria-disabled，读屏名带原因；能加的行没有', () => {
    const html = render('menu')
    expect(html).toMatch(/aria-disabled="true"[^>]*aria-label="图表 · 已添加此组件"/)
    expect(html).toMatch(/aria-disabled="true"[^>]*aria-label="公司 · 组件不适用于当前市场"/)
    const book = html.match(/<button[^>]*data-id="book"[^>]*>/)![0]
    expect(book).not.toContain('aria-disabled')
    expect(book).toContain('draggable="true"')
    expect(html.match(/data-id="chart"[^>]*draggable="false"/)).not.toBeNull()
  })

  it('menu：没有任何条目时写 empty', () => {
    const html = renderToStaticMarkup(
      <ComponentCatalog variant="menu" items={[]} categories={categories} onToggle={() => {}} labels={labels} />,
    )
    expect(html).toContain('没有可添加的组件')
  })
})
