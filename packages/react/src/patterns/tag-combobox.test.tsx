// SPDX-License-Identifier: MIT
// TagCombobox 的结构：服务端渲染成字符串，查角色、读屏名与状态属性（交互在 e2e/tag-combobox.spec.ts 里用真浏览器走）。
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { TagCombobox, type TagComboboxOption } from './tag-combobox.tsx'

const OPTIONS: TagComboboxOption[] = [
  { id: 'a', label: 'Aisha Khan', description: 'Design lead', prefix: <i>AK</i> },
  { id: 'b', label: 'Ben Carter', description: 'Engineer' },
]
const LABELS = { remove: (name: string) => `Remove ${name}`, empty: 'No match', toggle: 'Show options' }

describe('TagCombobox', () => {
  it('关着：输入框是 combobox，aria-expanded=false，没有 aria-controls 与列表', () => {
    const html = renderToStaticMarkup(<TagCombobox label="Reviewers" options={OPTIONS} labels={LABELS} />)
    expect(html).toContain('role="combobox"')
    expect(html).toContain('aria-label="Reviewers"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).not.toContain('aria-controls')
    expect(html).not.toContain('role="listbox"')
  })

  it('已选项以标签排在框里：前缀对读屏隐藏，× 有读屏名；value 里没有的 id 不画', () => {
    const html = renderToStaticMarkup(
      <TagCombobox label="Reviewers" options={OPTIONS} value={['a', 'ghost']} labels={LABELS} />,
    )
    expect(html.match(/class="k-tagcb-tag"/g)).toHaveLength(1)
    expect(html).toContain('aria-label="Remove Aisha Khan"')
    expect(html).toContain('<span aria-hidden="true" class="k-tagcb-tag-prefix"><i>AK</i></span>')
    expect(html).toContain('aria-label="Show options"')
  })

  it('没传 labels.toggle 就不画箭头按钮；有标签时不显示占位', () => {
    const html = renderToStaticMarkup(
      <TagCombobox
        label="Reviewers"
        options={OPTIONS}
        defaultValue={['b']}
        placeholder="Add people"
        labels={{ remove: LABELS.remove, empty: LABELS.empty }}
      />,
    )
    expect(html).not.toContain('k-tagcb-toggle')
    expect(html).not.toContain('placeholder')
  })
})
