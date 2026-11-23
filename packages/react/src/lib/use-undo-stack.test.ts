// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { undoBack, undoForward, undoInit, undoKeyOf, undoPush } from './use-undo-stack.ts'

const key = (k: string, mods: Partial<Record<'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey', boolean>> = {}) => ({
  key: k,
  code: `Key${k.toUpperCase()}`,
  ctrlKey: false,
  metaKey: false,
  shiftKey: false,
  altKey: false,
  ...mods,
})

describe('undo stack model', () => {
  it('push、undo、redo 往返；新 push 清掉重做', () => {
    let s = undoInit(0)
    s = undoPush(s, 1, { at: 1000 })
    s = undoPush(s, 2, { at: 3000 })
    expect(s.present.value).toBe(2)
    s = undoBack(s)
    expect(s.present.value).toBe(1)
    expect(s.future.map((e) => e.value)).toEqual([2])
    s = undoForward(s)
    expect(s.present.value).toBe(2)
    s = undoBack(undoBack(s))
    expect(s.present.value).toBe(0)
    expect(undoBack(s)).toBe(s)
    s = undoPush(s, 9, { at: 5000 })
    expect(s.future).toEqual([])
    expect(undoForward(s)).toBe(s)
  })

  it('同 kind 且在 mergeMs 内合并成一步，换种类或超时就新开一步', () => {
    let s = undoInit(0)
    s = undoPush(s, 1, { kind: 'width', at: 1000 })
    s = undoPush(s, 2, { kind: 'width', at: 1200 })
    s = undoPush(s, 3, { kind: 'width', at: 1900 })
    expect(s.past.map((e) => e.value)).toEqual([0])
    s = undoPush(s, 4, { kind: 'width', at: 5000 })
    s = undoPush(s, 5, { kind: 'order', at: 5100 })
    expect(s.past.map((e) => e.value)).toEqual([0, 3, 4])
  })

  it('撤销回来的那步不再被合并，kind 留着给提示', () => {
    let s = undoInit(0)
    s = undoPush(s, 1, { kind: 'width', at: 1000 })
    s = undoPush(s, 2, { kind: 'order', at: 1100 })
    s = undoBack(s)
    expect(s.present.kind).toBe('width')
    s = undoPush(s, 7, { kind: 'width', at: 1200 })
    expect(s.past.map((e) => e.value)).toEqual([0, 1])
  })

  it('上限：只留最近 limit 步；同值不记', () => {
    let s = undoInit(0)
    for (let i = 1; i <= 5; i++) s = undoPush(s, i, { at: i * 10_000 }, { limit: 3 })
    expect(s.past.map((e) => e.value)).toEqual([2, 3, 4])
    expect(undoPush(s, 5)).toBe(s)
  })

  it('快捷键：Mod+Z 撤销，Mod+Shift+Z 重做，非 Mac 上 Ctrl+Y 也重做', () => {
    expect(undoKeyOf(key('z', { ctrlKey: true }), false)).toBe('undo')
    expect(undoKeyOf(key('z', { ctrlKey: true, shiftKey: true }), false)).toBe('redo')
    expect(undoKeyOf(key('y', { ctrlKey: true }), false)).toBe('redo')
    expect(undoKeyOf(key('z', { metaKey: true }), true)).toBe('undo')
    expect(undoKeyOf(key('z', { metaKey: true, shiftKey: true }), true)).toBe('redo')
    expect(undoKeyOf(key('z', { ctrlKey: true }), true)).toBeNull()
    expect(undoKeyOf(key('y', { metaKey: true }), true)).toBeNull()
    expect(undoKeyOf(key('z'), false)).toBeNull()
    expect(undoKeyOf(key('z', { ctrlKey: true, altKey: true }), false)).toBeNull()
  })
})
