// SPDX-License-Identifier: MIT
// 录键（ShortcutRecorder）的规则：把一次按键变成规范的组合串（纯函数，组件与单测共用）。
// 规范串：修饰键按 Ctrl、Alt、Shift、Meta 的次序，再加主键，用 + 连：`Ctrl+Shift+K`、`Alt+ArrowUp`、`F5`。
// 主键取 event.code 而不是 event.key：Mac 上 Option+字母会得到 ˙ 之类的符号，code 才是物理键（KeyA → A、Digit1 → 1）。
// 平台怎么叫修饰键（Mac 的 ⌘、⌥）是应用的事，组件只给规范串，显示时由调用方的 partLabel 换字。

export type KeyEventLike = Pick<KeyboardEvent, 'code' | 'key' | 'ctrlKey' | 'altKey' | 'shiftKey' | 'metaKey'>

const MODIFIER_CODES = /^(Control|Alt|Shift|Meta|OS)(Left|Right)?$/

/** 这个键本身是不是修饰键（只按了修饰键还不成组合）。 */
export const isModifierCode = (code: string): boolean => MODIFIER_CODES.test(code)

function mainKey(event: KeyEventLike): string {
  const { code, key } = event
  if (/^Key[A-Z]$/.test(code)) return code.slice(3)
  if (/^Digit[0-9]$/.test(code)) return code.slice(5)
  if (key === ' ' || code === 'Space') return 'Space'
  // 单字符的键（标点）：Alt 按着时 key 是变形后的符号，退回用 code。
  if (key.length === 1) return event.altKey ? code : key.toUpperCase()
  return key
}

/** 此刻按着的修饰键（规范次序）。 */
export function heldModifiers(event: KeyEventLike): string[] {
  const held: string[] = []
  if (event.ctrlKey) held.push('Ctrl')
  if (event.altKey) held.push('Alt')
  if (event.shiftKey) held.push('Shift')
  if (event.metaKey) held.push('Meta')
  return held
}

/** 一次按键的规范组合串；只按了修饰键返回 null。 */
export function comboFromEvent(event: KeyEventLike): string | null {
  if (isModifierCode(event.code)) return null
  return [...heldModifiers(event), mainKey(event)].join('+')
}

/** 规范串拆成块（给 Kbd 画）。 */
export const comboParts = (combo: string): string[] => combo.split('+')

/** 组合里有没有修饰键。 */
export const hasModifier = (combo: string): boolean => comboParts(combo).length > 1
