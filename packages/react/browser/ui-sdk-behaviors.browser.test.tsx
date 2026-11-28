// SPDX-License-Identifier: MIT
// 换成 UI SDK 的件（#263 PR 1：Calendar、DateTimeInput、DateRangePicker、TradingDatePicker、ListBox、TreeView、JsonViewer）的键盘、焦点、无障碍检查，不截图。
// 列表与树的键盘走法按 WAI-ARIA 模式用 @ui-sdk/core/testing 的 checkPattern 查（角色、名字、单一 Tab 停靠点、方向键、Home / End、打字跳转）；
// 日期类没有对应的模式，用真键盘与真点击在浏览器里走：方向键移日、回车选、半截日期不上报、弹层打开时焦点落在日格上、关了回到触发钮。
import { checkPattern } from '@ui-sdk/core/testing'
import { useState } from 'react'
import { afterEach, describe, expect, test } from 'vite-plus/test'
import { userEvent } from 'vite-plus/test/browser'
import { DateRangePicker, DateTimeInput, JsonViewer, ListBox, TreeView, type DateRange } from '../src/index.ts'
import { Calendar } from '../src/patterns/calendar.tsx'
import { TradingDatePicker } from '../src/cn/index.ts'
import { mount } from './render.tsx'

afterEach(() => document.body.replaceChildren())

const nav = { previousMonth: 'Previous month', nextMonth: 'Next month' }
const active = () => document.activeElement as HTMLElement | null
const frameQuery = (selector: string) => document.querySelector<HTMLElement>(selector)!
const settle = () => new Promise((resolve) => setTimeout(resolve, 150))

/**
 * 树的 WAI-ARIA 模式检查：只许有一处与 APG 不同——已展开的分支上按右方向键不进第一个子项（迁移前 react-aria 的手感，用户定「键盘手感跟迁移前」）。
 * 多一处不同或这一处不再不同（UI SDK 改了默认）都算失败。
 */
async function checkTree(root: Element) {
  try {
    await checkPattern(root, 'tree')
  } catch (error) {
    const problems = String((error as Error).message)
      .split('\n')
      .filter((line) => line.startsWith('- '))
    if (problems.length === 1 && problems[0]!.includes('ArrowRight on an open branch')) return
    throw error
  }
  throw new Error('树不再与 APG 有出入：去掉 TreeItem 上拦右方向键的那段，并删掉这个包装')
}

describe('Calendar', () => {
  test('方向键移日、回车选；休市的日子能聚焦但选不中；翻页钮到头停住', async () => {
    const picked: string[] = []
    await mount(
      <Calendar
        label="Go to date"
        locale="en-US"
        labels={nav}
        defaultValue="2024-03-15"
        min="2024-03-10"
        unavailable={(day) => day === '2024-03-16'}
        onValueChange={(day) => picked.push(day)}
      />,
    )
    // 一个 Tab 停靠点：选中的那天。
    expect(document.querySelectorAll('[role="gridcell"][tabindex="0"]')).toHaveLength(1)
    frameQuery('[data-value="2024-03-15"]').focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(active()?.dataset.value).toBe('2024-03-16')
    expect(active()?.getAttribute('aria-disabled')).toBe('true')
    await userEvent.keyboard('{Enter}')
    expect(picked).toEqual([])
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(picked).toEqual(['2024-03-17'])
    await userEvent.keyboard('{PageDown}')
    expect(active()?.dataset.value).toBe('2024-04-17')
    expect(frameQuery('[aria-label="Previous month"]').hasAttribute('data-disabled')).toBe(false)
  })

  test('Home / End 到当月第一天 / 最后一天（迁移前 react-aria 的手感，不是周首周尾）', async () => {
    await mount(
      <Calendar label="Go" locale="en-US" labels={nav} defaultValue="2024-03-14" min="2024-03-02" max="2024-03-28" />,
    )
    frameQuery('[data-value="2024-03-14"]').focus()
    await userEvent.keyboard('{End}')
    expect(active()?.dataset.value).toBe('2024-03-28')
    await userEvent.keyboard('{Home}')
    expect(active()?.dataset.value).toBe('2024-03-02')
  })

  test('受控的空值：value 为空串时没有选中的日', async () => {
    await mount(<Calendar label="Go" locale="en-US" labels={nav} value="" defaultFocusedValue="2024-03-01" />)
    expect(document.querySelectorAll('[role="gridcell"][aria-selected="true"]')).toHaveLength(0)
    expect(frameQuery('[data-slot="calendar-heading"]').textContent).toBe('March 2024')
  })
})

describe('DateTimeInput', () => {
  const labels = {
    date: (label: string) => `${label} date`,
    pickDate: (label: string) => `Pick ${label} date`,
    calendar: (label: string) => `${label} calendar`,
    time: (label: string) => `${label} time`,
    ...nav,
  }
  function Harness({ min, max, initialDate = '' }: { min?: string; max?: string; initialDate?: string }) {
    const [date, setDate] = useState(initialDate)
    const [time, setTime] = useState('')
    return (
      <>
        <DateTimeInput
          label="Start"
          labels={labels}
          locale="en-CA"
          date={date}
          onDate={setDate}
          time={time}
          onTime={setTime}
          min={min}
          max={max}
        />
        <output data-testid="out">{`${date}|${time}`}</output>
      </>
    )
  }
  const out = () => frameQuery('[data-testid="out"]').textContent

  test('逐段打字：半截日期不上报，打满才上报；时刻同理', async () => {
    await mount(<Harness />)
    await userEvent.click(frameQuery('[aria-label^="year"]'))
    await userEvent.keyboard('2026')
    expect(out()).toBe('|')
    await userEvent.keyboard('0105')
    expect(out()).toBe('2026-01-05|')
    await userEvent.click(frameQuery('[aria-label^="hour"]'))
    await userEvent.keyboard('0930')
    expect(out()).toBe('2026-01-05|09:30')
    // 方向键加减，Backspace 清空后回到半截（上报空串）。
    await userEvent.click(frameQuery('[aria-label^="minute"]'))
    await userEvent.keyboard('{ArrowUp}')
    expect(out()).toBe('2026-01-05|09:31')
  })

  test('范围外的日期当场标 data-invalid', async () => {
    await mount(<Harness initialDate="2026-01-05" min="2026-01-10" />)
    expect(frameQuery('[aria-label="Start date"]').hasAttribute('data-invalid')).toBe(true)
  })

  test('日历按钮：打开时焦点落在日格上，方向键加回车选日并关掉，焦点回到按钮', async () => {
    await mount(<Harness initialDate="2026-01-05" />)
    const trigger = frameQuery('[aria-label="Pick Start date"]')
    await userEvent.click(trigger)
    await settle()
    expect(active()?.getAttribute('role')).toBe('gridcell')
    expect(active()?.dataset.value).toBe('2026-01-05')
    await userEvent.keyboard('{ArrowRight}{Enter}')
    await settle()
    expect(out()).toBe('2026-01-06|')
    expect(document.querySelector('[role="grid"]')).toBeNull()
    expect(active()).toBe(trigger)
  })
})

describe('DateRangePicker', () => {
  const labels = {
    start: 'Start',
    end: 'End',
    pickRange: 'Pick range',
    calendar: 'Range calendar',
    ...nav,
    presets: 'Presets',
    preset: { today: 'Today', week: 'This week', month: 'This month', ytd: 'Year to date' },
    custom: 'Custom',
  }
  function Harness() {
    const [range, setRange] = useState<DateRange | null>(null)
    return (
      <>
        <DateRangePicker value={range} onValueChange={setRange} today="2026-11-14" labels={labels} locale="en-CA" />
        <output data-testid="out">{range ? `${range.start}~${range.end}` : ''}</output>
      </>
    )
  }
  const out = () => frameQuery('[data-testid="out"]').textContent

  test('两个框分别打字，凑成起点不晚于终点才上报', async () => {
    await mount(<Harness />)
    await userEvent.click(document.querySelectorAll<HTMLElement>('[aria-label^="year"]')[0]!)
    await userEvent.keyboard('20261101')
    expect(out()).toBe('')
    await userEvent.click(document.querySelectorAll<HTMLElement>('[aria-label^="year"]')[1]!)
    await userEvent.keyboard('20261110')
    expect(out()).toBe('2026-11-01~2026-11-10')
  })

  test('读屏名「年, Start」带所在输入的名字；日格同时带迁移前的属性名', async () => {
    await mount(<Harness />)
    const names = [...document.querySelectorAll('[role="spinbutton"]')].map((e) => e.getAttribute('aria-label'))
    expect(names).toContain('year, Start')
    expect(names).toContain('year, End')
    await userEvent.click(frameQuery('[aria-label="Pick range"]'))
    await settle()
    await userEvent.click(frameQuery('[data-value="2026-11-03"]'))
    await userEvent.click(frameQuery('[data-value="2026-11-05"]'))
    await settle()
    await userEvent.click(frameQuery('[aria-label="Pick range"]'))
    await settle()
    expect(frameQuery('[data-value="2026-11-03"]').hasAttribute('data-selection-start')).toBe(true)
    expect(frameQuery('[data-value="2026-11-05"]').hasAttribute('data-selection-end')).toBe(true)
    await userEvent.keyboard('{Escape}')
    await settle()
  })

  test('键盘选区间：回车定下起点后焦点自动前进一天，再回车定终点', async () => {
    await mount(<Harness />)
    await userEvent.click(frameQuery('[aria-label="Pick range"]'))
    await settle()
    frameQuery('[data-value="2026-11-10"]').focus()
    await userEvent.keyboard('{Enter}')
    expect(active()?.dataset.value).toBe('2026-11-11')
    await userEvent.keyboard('{ArrowRight}{Enter}')
    await settle()
    expect(out()).toBe('2026-11-10~2026-11-12')
  })

  test('双月日历：点两个日子选出区间并关掉；预设一键选', async () => {
    await mount(<Harness />)
    await userEvent.click(frameQuery('[aria-label="Pick range"]'))
    await settle()
    expect(document.querySelectorAll('[role="grid"]')).toHaveLength(2)
    await userEvent.click(frameQuery('[data-value="2026-11-03"]'))
    await userEvent.click(frameQuery('[data-value="2026-11-12"]'))
    await settle()
    expect(out()).toBe('2026-11-03~2026-11-12')
    await userEvent.click(frameQuery('[aria-label="Pick range"]'))
    await settle()
    await userEvent.click(
      [...document.querySelectorAll<HTMLElement>('.k-dr-preset')].find((b) => b.textContent === 'Today')!,
    )
    await settle()
    expect(out()).toBe('2026-11-14~2026-11-14')
  })
})

describe('TradingDatePicker', () => {
  const closedAtWeekend = (day: string) => ![0, 6].includes(new Date(`${day}T00:00:00Z`).getUTCDay())
  test('休市的日子能聚焦、选不中；选了交易日才回调并关掉', async () => {
    const picked: string[] = []
    await mount(
      <TradingDatePicker
        value="2026-11-20"
        onValueChange={(day) => picked.push(day)}
        calendar={closedAtWeekend}
        locale="en-CA"
        labels={{
          pick: 'Pick',
          calendar: 'Trading calendar',
          ...nav,
          previousDay: 'Previous day',
          nextDay: 'Next day',
          placeholder: 'Pick a day',
          closed: 'Closed',
        }}
      />,
    )
    await userEvent.click(frameQuery('[aria-label="Pick"]'))
    await settle()
    expect(active()?.dataset.value).toBe('2026-11-20')
    await userEvent.keyboard('{ArrowRight}{Enter}')
    expect(picked).toEqual([])
    expect(document.querySelector('[role="grid"]')).not.toBeNull()
    await userEvent.keyboard('{ArrowRight}{ArrowRight}{Enter}')
    await settle()
    expect(picked).toEqual(['2026-11-23'])
    expect(document.querySelector('[role="grid"]')).toBeNull()
  })
})

describe('ListBox', () => {
  const items = [
    { id: 'a', label: 'Account A', description: 'Cash', trailing: '182,400.00' },
    { id: 'b', label: 'Account B', description: 'Margin' },
    { id: 'c', label: 'Paper', disabled: true },
    { id: 'd', label: 'Demo' },
  ]
  test('单选：WAI-ARIA listbox 模式（角色、名字、单一 Tab 停靠点、方向键、Home / End、打字）', async () => {
    await mount(<ListBox label="Account" items={items} defaultValue={['a']} />)
    await checkPattern(frameQuery('[role="listbox"]'), 'listbox')
  })

  test('多选：WAI-ARIA listbox 模式；点一项切换，选中的项带对勾', async () => {
    const seen: string[][] = []
    await mount(<ListBox label="Layouts" items={items} selectionMode="multiple" onValueChange={(v) => seen.push(v)} />)
    await checkPattern(frameQuery('[role="listbox"]'), 'listbox')
    seen.length = 0
    await userEvent.click(frameQuery('#' + CSS.escape(document.querySelector('[role="option"]')!.id)))
    expect(seen.at(-1)).toEqual(['a'])
    await userEvent.click(document.querySelectorAll<HTMLElement>('[role="option"]')[1]!)
    expect(seen.at(-1)).toEqual(['a', 'b'])
  })

  test('方向键到头停住，不绕回另一头（迁移前的手感；UI SDK 默认绕回）', async () => {
    await mount(<ListBox label="Account" items={items} defaultValue={['a']} />)
    const options = [...document.querySelectorAll<HTMLElement>('[role="option"]')]
    options[0]!.focus()
    await userEvent.keyboard('{ArrowUp}')
    expect(active()).toBe(options[0])
    await userEvent.keyboard('{End}{ArrowDown}')
    expect(active()).toBe(options[3])
  })

  test('单选不许选空：点已选的那一项不取消；双击与回车走 onAction', async () => {
    const seen: string[][] = []
    const acted: string[] = []
    await mount(
      <ListBox
        label="Account"
        items={items}
        defaultValue={['a']}
        onValueChange={(v) => seen.push(v)}
        onAction={(id) => acted.push(id)}
      />,
    )
    const options = document.querySelectorAll<HTMLElement>('[role="option"]')
    await userEvent.click(options[0]!)
    expect(options[0]!.getAttribute('aria-selected')).toBe('true')
    await userEvent.dblClick(options[1]!)
    expect(acted).toEqual(['b'])
    expect(options[1]!.getAttribute('aria-selected')).toBe('true')
    await userEvent.keyboard('{Enter}')
    expect(acted).toEqual(['b', 'b'])
  })
})

describe('TreeView', () => {
  const nodes = [
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
  test('WAI-ARIA tree 模式（单选）', async () => {
    await mount(<TreeView label="品种分类" items={nodes} defaultExpandedKeys={['cn']} />)
    await checkTree(frameQuery('[role="tree"]'))
  })

  test('点行选中这一行、不展开；点箭头展开；方向键右展开、左收起', async () => {
    const seen: string[][] = []
    const expanded: string[][] = []
    await mount(
      <TreeView
        label="品种分类"
        items={nodes}
        onValueChange={(v) => seen.push(v)}
        onExpandedChange={(k) => expanded.push(k)}
      />,
    )
    const row = (label: string) =>
      [...document.querySelectorAll<HTMLElement>('[data-slot="tree-label"]')].find((r) =>
        r.textContent?.includes(label),
      )!
    await userEvent.click(row('A 股'))
    expect(seen.at(-1)).toEqual(['cn'])
    expect(document.body.textContent).not.toContain('沪市')
    await userEvent.click(row('A 股').querySelector<HTMLElement>('[data-slot="tree-indicator"]')!)
    expect(document.body.textContent).toContain('沪市')
    expect(expanded.at(-1)).toEqual(['cn'])
    await userEvent.keyboard('{ArrowLeft}')
    expect(document.body.textContent).not.toContain('沪市')
  })

  test('方向键右在已展开的分支上不动（迁移前不进第一个子项）；禁用的行聚焦不到', async () => {
    await mount(<TreeView label="品种分类" items={nodes} defaultExpandedKeys={['cn']} />)
    const rows = () => [...document.querySelectorAll<HTMLElement>('[role="treeitem"]')]
    rows()[0]!.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(active()).toBe(rows()[0])
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    // 沪市之后跳过禁用的深市，落在港股。
    expect(active()?.textContent).toContain('港股')
  })

  test('回车只走 onAction，不顺带改选中', async () => {
    const seen: string[][] = []
    const acted: string[] = []
    await mount(
      <TreeView
        label="品种分类"
        items={nodes}
        defaultValue={['misc']}
        onValueChange={(v) => seen.push(v)}
        onAction={(id) => acted.push(id)}
      />,
    )
    const rows = [...document.querySelectorAll<HTMLElement>('[role="treeitem"]')]
    rows[0]!.focus()
    await userEvent.keyboard('{Enter}')
    expect(acted).toEqual(['cn'])
    expect(seen).toEqual([])
  })

  test('双击与回车走 onAction（给了它，点行只选这一行）', async () => {
    const acted: string[] = []
    await mount(<TreeView label="品种分类" items={nodes} onAction={(id) => acted.push(id)} />)
    const misc = [...document.querySelectorAll<HTMLElement>('[data-slot="tree-label"]')].find(
      (r) => r.textContent === '未分类',
    )!
    await userEvent.click(misc)
    expect(acted).toEqual([])
    await userEvent.dblClick(misc)
    expect(acted).toEqual(['misc'])
    await userEvent.keyboard('{Enter}')
    expect(acted).toEqual(['misc', 'misc'])
  })
})

describe('JsonViewer', () => {
  const labels = {
    search: 'Search JSON',
    matches: (count: number) => (count === 0 ? 'No match' : `${count} matches`),
    more: (count: number) => `${count} more`,
  }
  const sample = { type: 'order.update', orders: [{ id: 'FILL-0231', price: 201.3 }], error: null }
  test('WAI-ARIA tree 模式；查找时命中的祖先自动展开，清空后回到自己展开的样子', async () => {
    await mount(<JsonViewer label="Message" value={sample} labels={labels} defaultExpandDepth={1} />)
    await checkTree(frameQuery('[role="tree"]'))
    expect(document.body.textContent).not.toContain('FILL-0231')
    await userEvent.click(frameQuery('input[type="search"]'))
    await userEvent.keyboard('FILL')
    expect(document.body.textContent).toContain('FILL-0231')
    expect(frameQuery('[role="status"]').textContent).toBe('1 matches')
    await userEvent.clear(frameQuery('input[type="search"]'))
    expect(document.body.textContent).not.toContain('FILL-0231')
  })

  test('方向键右在已展开的节点上不动（不进第一个子项）', async () => {
    await mount(<JsonViewer label="Message" value={sample} labels={labels} defaultExpandDepth={1} />)
    const rows = () => [...document.querySelectorAll<HTMLElement>('[role="treeitem"]')]
    rows()[0]!.focus()
    await userEvent.keyboard('{ArrowRight}')
    expect(active()).toBe(rows()[0])
  })
})
