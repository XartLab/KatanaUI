// SPDX-License-Identifier: MIT
// #104 对照 Salt 补的两件（Calendar、ListBox）：服务端渲染查 react-aria 给出的角色与状态，以及我们这层接上的参数（日期字符串、不可选的日子、分组、空态）。
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { Calendar } from './calendar.tsx'
import { ListBox, type ListBoxGroup, type ListBoxOption } from './list-box.tsx'

const labels = { previousMonth: 'Previous month', nextMonth: 'Next month' }

/** 日格的 div：按读屏名（「Thursday, November 26, 2026」）取出那一格的整个开标签。 */
const cell = (html: string, name: string) => new RegExp(`<div[^>]*aria-label="[^"]*${name}[^"]*"[^>]*>`).exec(html)?.[0]

describe('Calendar', () => {
  // 固定一个离今天远的月份：断言里不出现「今天」那一格。
  const render = (extra: Partial<Parameters<typeof Calendar>[0]> = {}) =>
    renderToStaticMarkup(<Calendar label="Go to date" locale="en-US" labels={labels} value="2024-03-15" {...extra} />)

  it('打开选中那天所在的月：读屏名带月份，选中那一格 data-selected，翻页钮的读屏名来自 labels', () => {
    const html = render()
    expect(html).toContain('aria-label="Go to date, March 2024"')
    expect(html).toContain('role="grid"')
    expect(cell(html, 'March 15, 2024')).toContain('data-selected="true"')
    expect(html).toContain('aria-label="Previous month"')
    expect(html).toContain('aria-label="Next month"')
  })

  it('unavailable 返回 true 的日子标成不可选，别的日子不受影响', () => {
    const html = render({ unavailable: (day) => day === '2024-03-20' })
    expect(cell(html, 'March 20, 2024')).toContain('data-unavailable="true"')
    expect(cell(html, 'March 19, 2024')).not.toContain('data-unavailable')
  })

  it('min 之前的日子禁用，上一月的钮到头也禁用', () => {
    const html = render({ min: '2024-03-05' })
    expect(cell(html, 'March 4, 2024')).toContain('data-disabled="true"')
    expect(cell(html, 'March 5, 2024')).not.toContain('data-disabled')
    expect(/<button[^>]*disabled=""[^>]*aria-label="Previous month"/.test(html)).toBe(true)
  })

  it('weekStart：mon 时第一列是周一，sun 时是周日', () => {
    const firstHead = (html: string) => /<th[^>]*>([^<]+)<\/th>/.exec(html)?.[1]
    expect(firstHead(render())).toBe('M')
    expect(firstHead(render({ weekStart: 'sun' }))).toBe('S')
  })

  it('外层带 k-cal-card（卡片外框），disabled 时整张标 data-disabled', () => {
    expect(render()).toMatch(/^<div class="k-cal k-cal-card"/)
    expect(render({ disabled: true })).toMatch(/^<div class="k-cal k-cal-card"[^>]*data-disabled="true"/)
  })
})

const ACCOUNTS: readonly (ListBoxOption | ListBoxGroup)[] = [
  {
    id: 'live',
    title: 'Live',
    options: [
      { id: 'a', label: 'Account A', description: 'Cash', trailing: '182,400.00' },
      { id: 'b', label: 'Account B', disabled: true },
    ],
  },
  { id: 'sim', label: 'Paper' },
]

describe('ListBox', () => {
  it('listbox 带读屏名，项是 option，选中的 aria-selected，禁用的 aria-disabled', () => {
    const html = renderToStaticMarkup(<ListBox label="Account" items={ACCOUNTS} value={['a']} />)
    expect(html).toContain('role="listbox"')
    expect(html).toContain('aria-label="Account"')
    expect(html.match(/role="option"/g)).toHaveLength(3)
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1)
    expect(html).toMatch(/data-key="b"[^>]*data-disabled="true"|aria-disabled="true"[^>]*data-key="b"/)
  })

  it('分组是 role=group，用组名作读屏名；说明进 aria-describedby，右端数值原样画', () => {
    const html = renderToStaticMarkup(<ListBox label="Account" items={ACCOUNTS} />)
    const group = /<section[^>]*role="group"[^>]*aria-labelledby="([^"]+)"/.exec(html)
    expect(group).not.toBeNull()
    expect(html).toContain(`<header class="k-lb-header" id="${group![1]}" role="presentation">Live</header>`)
    expect(html).toContain('slot="description">Cash</span>')
    expect(html).toContain('<span class="k-lb-trailing">182,400.00</span>')
  })

  it('selectionMode=multiple 写到每一项上；bordered 与 maxHeight 落到列表上', () => {
    const html = renderToStaticMarkup(
      <ListBox label="Layouts" items={ACCOUNTS} selectionMode="multiple" bordered maxHeight={120} />,
    )
    expect(html).toContain('data-selection-mode="multiple"')
    expect(html).toContain('aria-multiselectable="true"')
    expect(html).toContain('data-bordered="true"')
    expect(html).toContain('max-height:120px')
  })

  it('没有项时显示 emptyLabel', () => {
    const html = renderToStaticMarkup(<ListBox label="Groups" items={[]} emptyLabel="No groups yet" />)
    expect(html).toContain('<div class="k-lb-empty">No groups yet</div>')
  })
})
