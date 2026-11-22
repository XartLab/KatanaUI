// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { TreeView, type TreeNode } from './tree-view.tsx'

// 结构（服务端渲染）：角色、读屏名、展开后画出子项、数量、禁用、选中的映射。键盘与点击在浏览器里查（e2e/ui-gallery.spec.ts 的 tree-view 页）。

const ITEMS: readonly TreeNode[] = [
  {
    id: 'cn',
    label: 'A 股',
    count: 2,
    children: [
      { id: 'cn-sh', label: '沪市' },
      { id: 'cn-sz', label: '深市', disabled: true },
    ],
  },
  { id: 'hk', label: '港股', children: [{ id: 'hk-main', label: '主板' }] },
  { id: 'misc', label: '未分类' },
]

const html = (props: Partial<Parameters<typeof TreeView>[0]> = {}) =>
  renderToStaticMarkup(<TreeView label="品种分类" items={ITEMS} {...props} />)

const rowOf = (markup: string, label: string) => {
  const at = markup.indexOf(`>${label}<`)
  const start = markup.lastIndexOf('role="row"', at)
  return markup.slice(markup.lastIndexOf('<', start), at)
}

describe('TreeView', () => {
  it('是带读屏名的 treegrid；收起时只画顶层，有子项的行带展开按钮', () => {
    const markup = html()
    expect(markup).toContain('role="treegrid"')
    expect(markup).toContain('aria-label="品种分类"')
    expect(markup).toContain('A 股')
    expect(markup).toContain('未分类')
    expect(markup).not.toContain('沪市')
    expect(rowOf(markup, 'A 股')).toContain('aria-expanded="false"')
    // 没有子项的行没有 aria-expanded。
    expect(rowOf(markup, '未分类')).not.toContain('aria-expanded')
    expect(markup.match(/slot="chevron"/g)?.length).toBe(2)
  })

  it('defaultExpandedKeys 展开后画出子项，层级写进 --k-tree-level 与 aria-level', () => {
    const markup = html({ defaultExpandedKeys: ['cn'] })
    expect(markup).toContain('沪市')
    expect(rowOf(markup, 'A 股')).toContain('aria-expanded="true"')
    expect(rowOf(markup, '沪市')).toContain('aria-level="2"')
    expect(markup).toContain('--k-tree-level:1')
  })

  it('数量画在字后面；禁用的项带 aria-disabled', () => {
    const markup = html({ defaultExpandedKeys: ['cn'] })
    expect(markup).toContain('<span class="k-tree-count">2</span>')
    expect(rowOf(markup, '深市')).toContain('aria-disabled="true"')
  })

  it('value 映射成 aria-selected；旧名 selectedKeys 照样生效', () => {
    const picked = html({ defaultExpandedKeys: ['cn'], value: ['cn-sh'] })
    expect(rowOf(picked, '沪市')).toContain('aria-selected="true"')
    expect(rowOf(picked, '港股')).toContain('aria-selected="false"')
    const legacy = html({ defaultExpandedKeys: ['cn'], selectedKeys: ['hk'] })
    expect(rowOf(legacy, '港股')).toContain('aria-selected="true"')
  })

  it('defaultValue 是不受控的初值；selectionMode="none" 不出 aria-selected', () => {
    expect(rowOf(html({ defaultValue: ['misc'] }), '未分类')).toContain('aria-selected="true"')
    expect(html({ selectionMode: 'none' })).not.toContain('aria-selected')
  })
})
