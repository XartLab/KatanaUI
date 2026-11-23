// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { createHotkeyRegistry } from './hotkeys.tsx'
import { undoHotkeyBindings } from './use-undo-hotkeys.ts'

// 撤销 / 重做走注册表（#87 补充第 5 条）：组合跟 useUndoStack 自带的一样，Mac 上没有 Ctrl+Y。

const key = (init: Partial<KeyboardEvent> & { code: string; key: string }) =>
  ({
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    target: null,
    preventDefault() {},
    ...init,
  }) as KeyboardEvent

const setup = (platform: 'mac' | 'other') => {
  const calls: string[] = []
  const registry = createHotkeyRegistry({ platform })
  const stack = { undo: () => calls.push('undo'), redo: () => calls.push('redo') }
  for (const binding of undoHotkeyBindings(stack, { labels: { undo: 'Undo', redo: 'Redo' } }, platform))
    registry.register(binding)
  return { calls, registry }
}

describe('undoHotkeyBindings', () => {
  it('别处：Ctrl+Z 撤销，Ctrl+Shift+Z 与 Ctrl+Y 重做', () => {
    const { calls, registry } = setup('other')
    registry.dispatch(key({ code: 'KeyZ', key: 'z', ctrlKey: true }))
    registry.dispatch(key({ code: 'KeyZ', key: 'Z', ctrlKey: true, shiftKey: true }))
    registry.dispatch(key({ code: 'KeyY', key: 'y', ctrlKey: true }))
    expect(calls).toEqual(['undo', 'redo', 'redo'])
    expect(registry.entries().map((entry) => entry.combos)).toEqual([['Ctrl+Z'], ['Ctrl+Shift+Z', 'Ctrl+Y']])
  })

  it('Mac：⌘Z 撤销、⇧⌘Z 重做，Ctrl+Y 不算', () => {
    const { calls, registry } = setup('mac')
    registry.dispatch(key({ code: 'KeyZ', key: 'z', metaKey: true }))
    registry.dispatch(key({ code: 'KeyZ', key: 'z', metaKey: true, shiftKey: true }))
    expect(registry.dispatch(key({ code: 'KeyY', key: 'y', ctrlKey: true }))).toBe(false)
    expect(calls).toEqual(['undo', 'redo'])
  })
})
