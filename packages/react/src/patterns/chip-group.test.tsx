// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { ChipGroup } from './chip-group'

const items = [
  { value: 'a', label: 'A 股', count: 3 },
  { value: 'b', label: '港股' },
  { value: 'c', label: '美股', disabled: true },
]

describe('ChipGroup', () => {
  it('整组 role=group 带名字，每个芯片是 aria-pressed 的按钮，选中的为 true，命中数写在字后', () => {
    const html = renderToStaticMarkup(<ChipGroup label="市场" items={items} value={['a']} onValueChange={() => {}} />)
    expect(html).toContain('role="group"')
    expect(html).toContain('aria-label="市场"')
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(2)
    expect(html).toContain('<span class="k-chip-count">3</span>')
    expect(html).toContain('disabled')
  })
  it('清除钮：给了 clearLabel 且有选中项才出现', () => {
    const on = renderToStaticMarkup(
      <ChipGroup label="x" items={items} value={['a']} onValueChange={() => {}} clearLabel="清除" />,
    )
    const off = renderToStaticMarkup(
      <ChipGroup label="x" items={items} value={[]} onValueChange={() => {}} clearLabel="清除" />,
    )
    const none = renderToStaticMarkup(<ChipGroup label="x" items={items} value={['a']} onValueChange={() => {}} />)
    expect(on).toContain('k-chip-clear')
    expect(off).not.toContain('k-chip-clear')
    expect(none).not.toContain('k-chip-clear')
  })
})
