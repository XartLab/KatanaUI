// SPDX-License-Identifier: MIT
// #1954 从 Arc 照搬的三件（SplitButton、TagInput、InlineEdit）的结构：服务端渲染成字符串，查角色、读屏名与状态属性。
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { InlineEdit } from './inline-edit.tsx'
import { SplitButton } from './split-button.tsx'
import { TagInput } from './tag-input.tsx'

describe('SplitButton', () => {
  const actions = [
    { key: 'market', label: '市价', onSelect: () => {} },
    { key: 'stop', label: '条件单', onSelect: () => {}, disabled: true },
  ]

  it('两只按钮：主按钮是孩子的字并带 Alt+↓ 提示，箭头那半有读屏名、是菜单触发器', () => {
    const html = renderToStaticMarkup(
      <SplitButton onClick={() => {}} actions={actions} labels={{ menu: '更多委托类型' }}>
        买入 · 限价
      </SplitButton>,
    )
    expect(html.match(/<button/g)).toHaveLength(2)
    expect(html).toContain('data-split-main=""')
    expect(html).toContain('aria-keyshortcuts="Alt+ArrowDown"')
    expect(html).toContain('>买入 · 限价</button>')
    expect(html).toContain('aria-label="更多委托类型"')
    expect(html).toContain('aria-haspopup="menu"')
    expect(html).toContain('aria-expanded="false"')
  })

  it('变体与尺寸写在根上，两半同一个变体；disabled 两半都灰', () => {
    const html = renderToStaticMarkup(
      <SplitButton variant="primary" size="sm" disabled onClick={() => {}} actions={actions} labels={{ menu: 'm' }}>
        平仓
      </SplitButton>,
    )
    expect(html).toContain('data-slot="split-button" data-variant="primary" data-size="sm"')
    expect(html.match(/data-variant="primary"/g)).toHaveLength(3)
    expect(html.match(/ disabled=""/g)).toHaveLength(2)
  })

  it('没有菜单项时箭头那半灰掉，主按钮也不带 Alt+↓', () => {
    const html = renderToStaticMarkup(
      <SplitButton onClick={() => {}} actions={[]} labels={{ menu: 'm' }}>
        保存
      </SplitButton>,
    )
    expect(html).not.toContain('aria-keyshortcuts')
    expect(html.match(/ disabled=""/g)).toHaveLength(1)
  })
})

describe('TagInput', () => {
  const labels = { remove: (tag: string) => `移除 ${tag}`, duplicate: (tag: string) => `${tag} 已经有了` }

  it('每个标签带移除钮（读屏名由 labels 给，不进 Tab 序列），输入框有读屏名；有标签时不显示占位', () => {
    const html = renderToStaticMarkup(
      <TagInput label="品种代码" defaultValue={['600519', '000001']} placeholder="输入代码" labels={labels} />,
    )
    expect(html.match(/class="k-tagin-tag"/g)).toHaveLength(2)
    expect(html).toContain('data-tag="600519"')
    expect(html).toContain('aria-label="移除 600519"')
    expect(html.match(/tabindex="-1"/g)).toHaveLength(2)
    expect(html).toContain('aria-label="品种代码"')
    expect(html).not.toContain('placeholder=')
    expect(html).toContain('aria-live="polite"')
  })

  it('没有标签时显示占位；受控的 value 说了算', () => {
    const empty = renderToStaticMarkup(<TagInput label="x" value={[]} placeholder="输入代码" labels={labels} />)
    expect(empty).toContain('placeholder="输入代码"')
    expect(empty).not.toContain('k-tagin-tag')
    const controlled = renderToStaticMarkup(
      <TagInput label="x" value={['AAPL']} defaultValue={['MSFT']} labels={labels} />,
    )
    expect(controlled).toContain('data-tag="AAPL"')
    expect(controlled).not.toContain('MSFT')
  })

  it('sm 与 disabled 写在根上，输入框与移除钮都禁用', () => {
    const html = renderToStaticMarkup(<TagInput label="x" value={['a']} size="sm" disabled labels={labels} />)
    expect(html).toContain('data-size="sm"')
    expect(html).toContain('data-disabled=""')
    expect(html.match(/ disabled=""/g)).toHaveLength(2)
  })
})

describe('InlineEdit', () => {
  const labels = {
    editHint: '点按编辑',
    save: '保存名称',
    cancel: '取消编辑',
    failed: (text: string) => `没存上「${text}」`,
    retry: '重试',
  }

  it('静止时是一个按钮：读屏名是「名字: 值」，描述指向编辑提示；外面的标签按 as 给', () => {
    const html = renderToStaticMarkup(
      <InlineEdit as="h3" value="A 股自选" label="自选分组名" onSave={() => {}} labels={labels} />,
    )
    expect(html).toContain('<h3 class="k-inedit-line">')
    expect(html).toContain('aria-label="自选分组名: A 股自选"')
    expect(html).toMatch(/aria-describedby="[^"]+-hint"/)
    expect(html).toContain('点按编辑')
    expect(html).toContain('data-phase="idle"')
    expect(html).toContain('role="status"')
    expect(html).not.toContain('<input')
  })

  it('值是空的：显示占位并标 data-empty，读屏名用占位', () => {
    const html = renderToStaticMarkup(
      <InlineEdit value="" placeholder="未命名" label="布局名" onSave={() => {}} labels={labels} />,
    )
    expect(html).toContain('data-empty=""')
    expect(html).toContain('>未命名</span>')
    expect(html).toContain('aria-label="布局名: 未命名"')
  })

  it('disabled：按钮禁用，不画铅笔', () => {
    const html = renderToStaticMarkup(
      <InlineEdit value="v" label="x" disabled onSave={() => {}} labels={labels} />,
    )
    expect(html).toContain('disabled=""')
    expect(html).not.toContain('k-inedit-pencil')
  })
})
