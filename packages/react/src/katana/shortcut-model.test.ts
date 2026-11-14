// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import {
  comboFromEvent,
  comboParts,
  hasModifier,
  heldModifiers,
  isModifierCode,
  type KeyEventLike,
} from './shortcut-model'

const ev = (over: Partial<KeyEventLike>): KeyEventLike => ({
  code: 'KeyA',
  key: 'a',
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  metaKey: false,
  ...over,
})

describe('comboFromEvent', () => {
  it('修饰键按固定次序，主键取物理键（Mac 的 Option 变形不影响）', () => {
    expect(comboFromEvent(ev({ code: 'KeyK', key: 'K', shiftKey: true, ctrlKey: true }))).toBe('Ctrl+Shift+K')
    expect(comboFromEvent(ev({ code: 'KeyH', key: '˙', altKey: true }))).toBe('Alt+H')
    expect(comboFromEvent(ev({ code: 'Digit1', key: '!', shiftKey: true }))).toBe('Shift+1')
  })
  it('特殊键、空格、标点', () => {
    expect(comboFromEvent(ev({ code: 'ArrowUp', key: 'ArrowUp', altKey: true }))).toBe('Alt+ArrowUp')
    expect(comboFromEvent(ev({ code: 'F5', key: 'F5' }))).toBe('F5')
    expect(comboFromEvent(ev({ code: 'Space', key: ' ', ctrlKey: true }))).toBe('Ctrl+Space')
    expect(comboFromEvent(ev({ code: 'BracketLeft', key: '[', metaKey: true }))).toBe('Meta+[')
    expect(comboFromEvent(ev({ code: 'Minus', key: '–', altKey: true }))).toBe('Alt+Minus')
  })
  it('只按修饰键不成组合', () => {
    expect(comboFromEvent(ev({ code: 'ShiftLeft', key: 'Shift', shiftKey: true }))).toBeNull()
    expect(comboFromEvent(ev({ code: 'MetaRight', key: 'Meta', metaKey: true }))).toBeNull()
    expect(isModifierCode('ControlLeft')).toBe(true)
    expect(isModifierCode('KeyA')).toBe(false)
  })
})

describe('辅助', () => {
  it('heldModifiers、comboParts、hasModifier', () => {
    expect(heldModifiers(ev({ metaKey: true, ctrlKey: true }))).toEqual(['Ctrl', 'Meta'])
    expect(comboParts('Ctrl+Shift+K')).toEqual(['Ctrl', 'Shift', 'K'])
    expect(hasModifier('F5')).toBe(false)
    expect(hasModifier('Alt+F5')).toBe(true)
  })
})
