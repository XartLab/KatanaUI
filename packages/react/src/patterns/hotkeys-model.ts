// SPDX-License-Identifier: MIT
/**
 * Pure rules of the hotkey registry: platform Mod mapping, combo normalizing, event matching, editable targets, conflicts.
 * 快捷键注册表的纯函数（#77 G9）：平台 Mod 映射、组合串规范化、按键匹配、输入框判断、冲突检测。
 * 组合串沿用 shortcut-model 的规范写法（修饰键 Ctrl、Alt、Shift、Meta 的次序加主键，`Ctrl+Shift+K`），所以 ShortcutRecorder 录出来的串能直接用。
 * 声明时可写 `Mod`：Mac 上是 Meta（⌘），别处是 Ctrl。
 */
import { comboFromEvent, comboParts, type KeyEventLike } from './shortcut-model.ts'

/** 平台：mac 把 Mod 当 ⌘，other 当 Ctrl。 */
export type HotkeyPlatform = 'mac' | 'other'

/** 运行环境的平台（没有 navigator 时当 other）。 */
export function detectPlatform(): HotkeyPlatform {
  if (typeof navigator === 'undefined') return 'other'
  const nav = navigator as Navigator & { userAgentData?: { platform?: string } }
  const name = nav.userAgentData?.platform ?? nav.platform ?? ''
  return /mac|iphone|ipad|ipod/i.test(name) ? 'mac' : 'other'
}

const ORDER = ['Ctrl', 'Alt', 'Shift', 'Meta'] as const
const ALIASES: Readonly<Record<string, string>> = {
  control: 'Ctrl',
  ctrl: 'Ctrl',
  alt: 'Alt',
  option: 'Alt',
  shift: 'Shift',
  meta: 'Meta',
  cmd: 'Meta',
  command: 'Meta',
  esc: 'Escape',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  space: 'Space',
}

/** 把声明的组合串写成规范串：认 Mod 与常见别名（cmd、option、esc），修饰键排成规范次序，单个字母大写。 */
export function normalizeCombo(spec: string, platform: HotkeyPlatform): string {
  // 主键本身可以是 +（写成 Mod++ 或 Shift+Plus 都行），先按最后一个 + 拆。
  const raw = spec.endsWith('++') ? [...spec.slice(0, -2).split('+'), '+'] : spec.split('+')
  const mods = new Set<string>()
  let main = ''
  for (const piece of raw.map((part) => part.trim()).filter(Boolean)) {
    const lower = piece.toLowerCase()
    const name = lower === 'mod' ? (platform === 'mac' ? 'Meta' : 'Ctrl') : (ALIASES[lower] ?? piece)
    if ((ORDER as readonly string[]).includes(name)) mods.add(name)
    else main = name.length === 1 ? name.toUpperCase() : name
  }
  return [...ORDER.filter((mod) => mods.has(mod)), main].filter(Boolean).join('+')
}

/** 这次按键的规范串（输入法组字中、只按修饰键返回 null）。 */
export function comboOfEvent(event: KeyEventLike & { isComposing?: boolean; keyCode?: number }): string | null {
  if (event.isComposing || event.keyCode === 229) return null
  return comboFromEvent(event)
}

/** 事件落在可打字的地方：文本输入框、textarea、select、contenteditable（复选框、按钮这类 input 不算）。 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof (target as Element).closest !== 'function') return false
  const element = target as HTMLElement
  if (element.isContentEditable) return true
  const tag = element.tagName
  if (tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (tag !== 'INPUT') return false
  const type = (element as HTMLInputElement).type
  return !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file', 'image'].includes(type)
}

/** 注册表里一条快捷键（不含处理函数的部分，给总览表与冲突检测用）。 */
export type HotkeyEntry = {
  id: string
  /** 规范串（已按平台换掉 Mod）；多个是「或」。 */
  combos: readonly string[]
  label: string
  scope: string
  enabled: boolean
}

/** 冲突：同一个组合在同一作用域里、或一边是 global 的两条以上都开着。 */
export type HotkeyConflict = { combo: string; ids: readonly string[] }

/** global 作用域：任何时候都在；别的作用域开着时，它们的同组合优先于 global。 */
export const GLOBAL_SCOPE = 'global'

export function findConflicts(entries: readonly HotkeyEntry[]): HotkeyConflict[] {
  const byCombo = new Map<string, HotkeyEntry[]>()
  for (const entry of entries)
    if (entry.enabled) for (const combo of entry.combos) byCombo.set(combo, [...(byCombo.get(combo) ?? []), entry])
  const out: HotkeyConflict[] = []
  for (const [combo, list] of byCombo) {
    if (list.length < 2) continue
    const ids = list
      .filter((entry) =>
        list.some(
          (other) =>
            other !== entry &&
            (other.scope === entry.scope || other.scope === GLOBAL_SCOPE || entry.scope === GLOBAL_SCOPE),
        ),
      )
      .map((entry) => entry.id)
    if (ids.length > 1) out.push({ combo, ids })
  }
  return out
}

const MAC_PART: Readonly<Record<string, string>> = { Meta: '⌘', Alt: '⌥', Shift: '⇧', Ctrl: '⌃' }
const ARROWS: Readonly<Record<string, string>> = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→' }

/** 规范串里的一块在这个平台上怎么写：Mac 的 ⌘ ⌥ ⇧ ⌃，方向键写箭头，Escape 写 Esc；别的平台 Meta 写 Win。 */
export function partLabelFor(platform: HotkeyPlatform): (part: string) => string {
  return (part) =>
    ARROWS[part] ??
    (part === 'Escape' ? 'Esc' : platform === 'mac' ? (MAC_PART[part] ?? part) : part === 'Meta' ? 'Win' : part)
}

/** 一个组合拆成给 Kbd 画的块。 */
export const comboKeys = (combo: string, platform: HotkeyPlatform): string[] =>
  comboParts(combo).map(partLabelFor(platform))
