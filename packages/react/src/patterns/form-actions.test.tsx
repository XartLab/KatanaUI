// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { DeleteButton, DurationPicker, HoldToConfirm, PasswordInput, TaskList, ThemeSelector } from '../index.ts'
import { fieldText, parseField } from './duration-picker-model.ts'
import { eyePath } from './password-input-model.ts'
import { orderTasks } from './task-list-model.ts'
import { nextThemeIndex } from './theme-selector-model.ts'

// 表单与动作件（G2 从 katana/ 搬来）的纯逻辑与结构；动效、焦点、键盘在 e2e 里用真浏览器验。

describe('PasswordInput', () => {
  it('默认是遮住的 password 输入框，眼睛按钮名字由调用方给、aria-pressed 表达状态', () => {
    const html = renderToStaticMarkup(<PasswordInput labels={{ toggle: '显示密钥' }} defaultValue="abc" />)
    expect(html).toContain('type="password"')
    expect(html).toContain('aria-label="显示密钥"')
    expect(html).toContain('aria-pressed="false"')
    expect(html).toContain('autoComplete="off"')
  })

  it('defaultVisible 一开始就是明文', () => {
    const html = renderToStaticMarkup(<PasswordInput labels={{ toggle: 'x' }} defaultVisible />)
    expect(html).toContain('type="text"')
    expect(html).toContain('aria-pressed="true"')
  })

  it('眼睛的轮廓：闭合是压平的线，睁开是杏仁，越界的值被夹住', () => {
    expect(eyePath(0)).toBe('M2 12C6 12 18 12 22 12C18 12 6 12 2 12Z')
    expect(eyePath(1)).toBe('M2 12C6 4 18 4 22 12C18 20 6 20 2 12Z')
    expect(eyePath(2)).toBe(eyePath(1))
    expect(eyePath(-1)).toBe(eyePath(0))
  })
  it('旧名 toggleLabel 仍然生效（@deprecated，留一个版本）', () => {
    expect(renderToStaticMarkup(<PasswordInput toggleLabel="旧名" />)).toContain('aria-label="旧名"')
  })

  it('size：sm 是 26 高，md 与旧名 default 都是 30 高的默认档', () => {
    const md = renderToStaticMarkup(<PasswordInput labels={{ toggle: 'x' }} size="md" />)
    expect(md).toBe(renderToStaticMarkup(<PasswordInput labels={{ toggle: 'x' }} size="default" />))
    expect(md).toBe(renderToStaticMarkup(<PasswordInput labels={{ toggle: 'x' }} />))
    expect(renderToStaticMarkup(<PasswordInput labels={{ toggle: 'x' }} size="sm" />)).not.toBe(md)
  })
})

describe('DeleteButton', () => {
  it('待命时只有一个按钮，不展开、不带确认钮', () => {
    const html = renderToStaticMarkup(<DeleteButton label="删除" labels={{ confirm: '确认', cancel: '取消' }} />)
    expect(html).toContain('aria-label="删除"')
    expect(html).toContain('aria-expanded="false"')
    expect(html).toContain('data-phase="idle"')
    expect(html).not.toContain('aria-label="确认"')
  })
  it('旧名 confirmLabel / cancelLabel 仍能用（@deprecated），渲染与 labels 相同', () => {
    expect(renderToStaticMarkup(<DeleteButton label="删除" confirmLabel="确认" cancelLabel="取消" />)).toBe(
      renderToStaticMarkup(<DeleteButton label="删除" labels={{ confirm: '确认', cancel: '取消' }} />),
    )
  })
})

describe('HoldToConfirm', () => {
  it('labels.hint 进读屏描述与 title；tone 默认 danger，旧名 default 映射成 neutral', () => {
    const html = renderToStaticMarkup(
      <HoldToConfirm labels={{ hint: '按住 2 秒' }} onConfirm={() => {}}>
        平仓
      </HoldToConfirm>,
    )
    expect(html).toContain('title="按住 2 秒"')
    expect(html).toContain('data-tone="danger"')
    const legacy = renderToStaticMarkup(
      <HoldToConfirm tone="default" hint="按住 2 秒" onConfirm={() => {}}>
        平仓
      </HoldToConfirm>,
    )
    expect(legacy).toContain('data-tone="neutral"')
    expect(legacy).toContain('title="按住 2 秒"')
  })
})

describe('ThemeSelector', () => {
  it('方向键与 Home / End：移动并循环，别的键不处理', () => {
    expect(nextThemeIndex('ArrowRight', 1, 3)).toBe(2)
    expect(nextThemeIndex('ArrowRight', 2, 3)).toBe(0)
    expect(nextThemeIndex('ArrowLeft', 0, 3)).toBe(2)
    expect(nextThemeIndex('Home', 2, 3)).toBe(0)
    expect(nextThemeIndex('End', 0, 3)).toBe(2)
    expect(nextThemeIndex('a', 0, 3)).toBeNull()
    expect(nextThemeIndex('ArrowRight', 0, 0)).toBeNull()
  })

  it('没选中时 tab 停在第一张，选中时只停在选中那张', () => {
    const colors = { rail: '#111', panel: '#222', line: '#333', strong: '#fff', muted: '#555', tile: '#444' }
    const themes = [
      { value: 'a', label: 'A', colors },
      { value: 'b', label: 'B', colors },
    ]
    const none = renderToStaticMarkup(<ThemeSelector themes={themes} label="主题" value={null} />)
    expect(none.match(/tabindex="0"/gi)).toHaveLength(1)
    expect(none).toContain('aria-checked="false"')
    const picked = renderToStaticMarkup(<ThemeSelector themes={themes} label="主题" defaultValue="b" />)
    expect(picked).toContain('role="radiogroup"')
    expect(picked).toMatch(/aria-checked="true"[^>]*aria-label="B"/)
  })
})

describe('TaskList', () => {
  const tasks = [
    { id: 'a', label: 'A', done: true },
    { id: 'b', label: 'B' },
    { id: 'c', label: 'C', done: true },
    { id: 'd', label: 'D' },
  ]

  it('划完（沉底）的行排到后面，没沉的保持原位，包括勾上但线没划完的', () => {
    expect(orderTasks(tasks, ['c']).map((task) => task.id)).toEqual(['a', 'b', 'd', 'c'])
    expect(orderTasks(tasks, ['a', 'c']).map((task) => task.id)).toEqual(['b', 'd', 'a', 'c'])
    expect(orderTasks(tasks, []).map((task) => task.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('沉了的行如果现在不是完成的、或已经不存在，当作没沉', () => {
    expect(orderTasks(tasks, ['b', 'zzz']).map((task) => task.id)).toEqual(['a', 'b', 'c', 'd'])
  })

  it('结构：每行是 checkbox，起始就完成的在底部，屏外有播报区', () => {
    const html = renderToStaticMarkup(
      <TaskList defaultValue={tasks} labels={{ completed: (l) => l, reopened: (l) => l }} />,
    )
    expect(html.match(/role="checkbox"/g)).toHaveLength(4)
    expect(html.match(/aria-checked="true"/g)).toHaveLength(2)
    expect(html.indexOf('>B<')).toBeLessThan(html.indexOf('>A<'))
    expect(html).toContain('role="status"')
  })
  it('受控 value 与旧名 tasks（@deprecated）渲染相同', () => {
    const labels = { completed: (l: string) => l, reopened: (l: string) => l }
    expect(renderToStaticMarkup(<TaskList value={tasks} labels={labels} />)).toBe(
      renderToStaticMarkup(<TaskList tasks={tasks} labels={labels} />),
    )
  })
})

describe('DurationPicker', () => {
  it('输入框的字：只认数字，空当 0，超出夹到上限并标记', () => {
    expect(parseField('', 24)).toEqual({ value: 0, overflow: false })
    expect(parseField('12', 24)).toEqual({ value: 12, overflow: false })
    expect(parseField('99', 24)).toEqual({ value: 24, overflow: true })
    expect(parseField('a3b', 24)).toEqual({ value: 3, overflow: false })
    expect(fieldText(0)).toBe('')
    expect(fieldText(7)).toBe('7')
  })

  it('结构：不编辑时两个数字只读、笔钮名字由调用方给；0 写成 0', () => {
    const labels = { hours: '时', minutes: '分', edit: '编辑', save: '确认', hoursInput: '小时', minutesInput: '分钟' }
    const html = renderToStaticMarkup(<DurationPicker defaultValue={{ hours: 2, minutes: 0 }} labels={labels} />)
    expect(html).toContain('aria-label="编辑"')
    expect(html).toContain('value="2"')
    expect(html).toContain('value="0"')
    expect(html.match(/readOnly=""/g)).toHaveLength(2)
    const editing = renderToStaticMarkup(<DurationPicker defaultEditing labels={labels} />)
    expect(editing).toContain('aria-label="确认"')
    expect(editing).not.toContain('readOnly')
  })
})
