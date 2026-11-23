// SPDX-License-Identifier: MIT
import { describe, expect, test, vi } from 'vite-plus/test'
import { createHotkeyRegistry } from './hotkeys.tsx'
import { comboKeys, findConflicts, normalizeCombo } from './hotkeys-model.ts'
import { pushRecent, recentCommands } from './command-palette.tsx'

// 快捷键注册表（#77 G9）：平台 Mod、规范串、冲突、分发的先后、输入框与组字。
const key = (init: Partial<KeyboardEvent> & { code: string; key: string }, target: unknown = null) => {
  const event = {
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    metaKey: false,
    isComposing: false,
    defaultPrevented: false,
    target,
    preventDefault() {
      event.defaultPrevented = true
    },
    ...init,
  }
  return event as unknown as KeyboardEvent
}
const fakeInput = { tagName: 'INPUT', type: 'text', isContentEditable: false, closest: () => null }
const noTarget = { addEventListener() {}, removeEventListener() {} } as unknown as EventTarget

describe('normalizeCombo', () => {
  test('Mod 按平台换，修饰键排成规范次序，别名认得', () => {
    expect(normalizeCombo('Mod+K', 'mac')).toBe('Meta+K')
    expect(normalizeCombo('Mod+K', 'other')).toBe('Ctrl+K')
    expect(normalizeCombo('shift+mod+/', 'other')).toBe('Ctrl+Shift+/')
    expect(normalizeCombo('alt+up', 'other')).toBe('Alt+ArrowUp')
    expect(normalizeCombo('Mod++', 'other')).toBe('Ctrl++')
    expect(normalizeCombo('esc', 'mac')).toBe('Escape')
  })
  test('按平台写成键帽上的字', () => {
    expect(comboKeys('Meta+Shift+K', 'mac')).toEqual(['⌘', '⇧', 'K'])
    expect(comboKeys('Ctrl+ArrowUp', 'other')).toEqual(['Ctrl', '↑'])
  })
})

test('findConflicts：同作用域或碰上 global 才算冲突，关掉的不算', () => {
  const entry = (id: string, combo: string, scope: string, enabled = true) => ({
    id,
    combos: [combo],
    label: id,
    scope,
    enabled,
  })
  expect(
    findConflicts([
      entry('a', 'Ctrl+K', 'global'),
      entry('b', 'Ctrl+K', 'chart'),
      entry('c', 'Alt+X', 'chart'),
      entry('d', 'Alt+X', 'watchlist'),
      entry('e', 'Alt+Y', 'chart'),
      entry('f', 'Alt+Y', 'chart', false),
    ]),
  ).toEqual([{ combo: 'Ctrl+K', ids: ['a', 'b'] }])
})

describe('createHotkeyRegistry', () => {
  test('分发：作用域的先于 global，后登记的先得；关掉作用域就落回 global', () => {
    const registry = createHotkeyRegistry({ platform: 'other', target: noTarget })
    const global = vi.fn()
    const chart = vi.fn()
    registry.register({ id: 'search', combo: 'Mod+K', label: 'Search', handler: global })
    registry.register({ id: 'chart-search', combo: 'Mod+K', label: 'Chart search', scope: 'chart', handler: chart })
    expect(registry.dispatch(key({ code: 'KeyK', key: 'k', ctrlKey: true }))).toBe(true)
    expect(chart).toHaveBeenCalledTimes(1)
    registry.setActiveScopes([])
    registry.dispatch(key({ code: 'KeyK', key: 'k', ctrlKey: true }))
    expect(global).toHaveBeenCalledTimes(1)
    expect(registry.entries().find((entry) => entry.id === 'chart-search')?.enabled).toBe(false)
  })
  test('输入框里不触发（除非 allowInInput），组字中不触发，注销后不触发', () => {
    const registry = createHotkeyRegistry({ platform: 'mac', target: noTarget })
    const plain = vi.fn()
    const escape = vi.fn()
    const off = registry.register({ id: 'next', combo: 'ArrowDown', label: 'Next', handler: plain })
    registry.register({ id: 'close', combo: 'Escape', label: 'Close', handler: escape, allowInInput: true })
    registry.dispatch(key({ code: 'ArrowDown', key: 'ArrowDown' }, fakeInput))
    expect(plain).not.toHaveBeenCalled()
    registry.dispatch(key({ code: 'Escape', key: 'Escape' }, fakeInput))
    expect(escape).toHaveBeenCalledTimes(1)
    registry.dispatch(key({ code: 'ArrowDown', key: 'ArrowDown', isComposing: true }))
    expect(plain).not.toHaveBeenCalled()
    registry.dispatch(key({ code: 'ArrowDown', key: 'ArrowDown' }))
    expect(plain).toHaveBeenCalledTimes(1)
    off()
    expect(registry.dispatch(key({ code: 'ArrowDown', key: 'ArrowDown' }))).toBe(false)
  })
})

test('最近：放最前、去重、截到上限；删掉的命令不显示', () => {
  expect(pushRecent(['a', 'b', 'c'], 'b', 3)).toEqual(['b', 'a', 'c'])
  expect(pushRecent(['a', 'b', 'c'], 'd', 3)).toEqual(['d', 'a', 'b'])
  const commands = [{ id: 'a', label: 'A', onSelect() {} }]
  expect(recentCommands(['x', 'a'], commands).map((command) => command.id)).toEqual(['a'])
})
