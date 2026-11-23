// SPDX-License-Identifier: MIT
// 打字即搜（#77 第 1 条，#22「品种搜索」）：焦点在容器里（图表、行情表这类不是输入框的地方）直接敲字，就打开搜索并把这个字带进去。
// 做法照 TradingView 图表（2026-11-18 在图上实测：焦点在图上敲 aa，品种搜索弹出，框里已是 AA）。实现原创。
// 只认「会打出一个字的键」：event.key 是一个字符（按码点算，中文输入法组字中的不算），不是空格，没按 Ctrl / ⌘ / Alt（那些是快捷键）；
// 事件来自输入框、文本域、下拉、contenteditable 的不管（用户本来就在打字）；别人已 preventDefault 的不管（快捷键表先占了）。
// 认下的键会 preventDefault，免得这个字再落到别处；接着调 onOpen(字)，搜索框怎么开、开在哪由调用方定。
import { useEffect, useEffectEvent, type RefObject } from 'react'

export type TypeToSearchOptions = {
  /** Called with the typed character; open the search and put the character in its input. */
  onOpen: (initial: string) => void
  /** Turn the listener off (for example while the search is already open). Defaults to true. */
  enabled?: boolean
  /** Extra filter after the built-in checks: return false to leave a key alone (digits that open an interval box, say). */
  accept?: (key: string, event: KeyboardEvent) => boolean
}

/** 事件是不是从可编辑的地方来的（输入框、文本域、下拉、contenteditable）。 */
export function isEditableTarget(target: EventTarget | null): boolean {
  if (typeof Element === 'undefined' || !(target instanceof Element)) return false
  if (target.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]')) return true
  return target instanceof HTMLElement && target.isContentEditable
}

/** 这个按键该不该打开搜索：该就返回打出的字，不该返回 null（纯函数，单测用）。 */
export function typeToSearchKey(
  event: Pick<
    KeyboardEvent,
    'key' | 'ctrlKey' | 'metaKey' | 'altKey' | 'isComposing' | 'defaultPrevented' | 'target' | 'repeat'
  > & { keyCode?: number },
): string | null {
  // keyCode 229：Safari 上屏那一下 isComposing 已是 false，但仍是 229。
  if (event.defaultPrevented || event.isComposing || event.keyCode === 229 || event.repeat) return null
  if (event.ctrlKey || event.metaKey || event.altKey) return null
  // 按码点数：一个汉字、一个带重音的字母都是一个字；'Enter'、'ArrowUp'、'Dead'、'Process'（输入法）这类名字不是。
  if (Array.from(event.key).length !== 1) return null
  if (event.key.trim() === '') return null
  if (isEditableTarget(event.target)) return null
  return event.key
}

/** 在 ref 指的容器上听键盘：容器要能拿焦点（tabIndex={0}，或里面有可聚焦的东西）。 */
export function useTypeToSearch(ref: RefObject<HTMLElement | null>, options: TypeToSearchOptions): void {
  const enabled = options.enabled ?? true
  const onKeyDown = useEffectEvent((event: KeyboardEvent) => {
    const key = typeToSearchKey(event)
    if (key === null) return
    if (options.accept && !options.accept(key, event)) return
    event.preventDefault()
    options.onOpen(key)
  })
  useEffect(() => {
    const node = ref.current
    if (!node || !enabled) return
    node.addEventListener('keydown', onKeyDown)
    return () => node.removeEventListener('keydown', onKeyDown)
  }, [ref, enabled])
}
