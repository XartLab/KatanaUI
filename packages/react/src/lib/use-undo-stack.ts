// SPDX-License-Identifier: MIT
import { useCallback, useEffect, useMemo, useState, type RefObject } from 'react'

// 撤销 / 重做栈（#77 第 4 条，#22 G10）：存的是整份快照（不是补丁），值由调用方定、件只当不透明。用于「拖错了」的恢复：列布局、行序、分组、白板。不进存档。
// 合并：push 带 kind（「拖列宽」「改名」），跟栈顶同一 kind 且在 mergeMs 之内，就只换当前值、不多压一步——连续拖一次滑块只算一步撤销。
// 上限：过去的步数超过 limit 就丢最旧的。新 push 会清掉重做的那一截。
// 快捷键（可选）：Mod+Z 撤销、Mod+Shift+Z 与 Ctrl+Y 重做（Mod 在 Mac 上是 ⌘、别处是 Ctrl；TradingView 同样是 Ctrl+Z / Ctrl+Y）。
//   焦点在输入框、文本域、contenteditable 里时不接，让浏览器自己的文字撤销生效。
//   库里录键的 patterns/shortcut-model 在右边的层，lib 引不到，这里只认这三个组合，自己判。用了 useHotkeys 注册表的面板不开这里的绑定，
//   改用 patterns/use-undo-hotkeys 的 useUndoHotkeys 把同一套组合登记进注册表（#87）。

/** 一步：值、产生它的操作种类、时刻；sealed 是撤销 / 重做回来的，不再跟下一次 push 合并。 */
export type UndoEntry<T> = { value: T; kind?: string; at: number; sealed?: boolean }

export type UndoState<T> = {
  past: readonly UndoEntry<T>[]
  present: UndoEntry<T>
  future: readonly UndoEntry<T>[]
}

export type UndoPushOptions = {
  /** 操作的种类：跟上一步同种且在 mergeMs 之内就合并成一步。不给不合并。 */
  kind?: string
  /** 时间戳（毫秒）；默认 Date.now()，单测里给。 */
  at?: number
}

export type UndoStackOptions = {
  /** 最多留几步可撤销；默认 100。 */
  limit?: number
  /** 同种操作隔多久以内算同一步（毫秒）；默认 800。给 Infinity 就只看 kind。 */
  mergeMs?: number
  /** 绑定 Mod+Z / Mod+Shift+Z / Ctrl+Y：true 绑在 document 上，给 ref 就只在那个元素（含子孙）有焦点时接。默认不绑。 */
  hotkeys?: boolean | RefObject<HTMLElement | null>
}

/** 新栈：只有当前值。 */
export const undoInit = <T>(value: T, at = 0): UndoState<T> => ({ past: [], present: { value, at }, future: [] })

/** 压一步：同 kind 且在 mergeMs 之内只换当前值；否则当前值进 past，清掉 future，past 超过 limit 丢最旧的。 */
export function undoPush<T>(
  state: UndoState<T>,
  value: T,
  { kind, at = Date.now() }: UndoPushOptions = {},
  { limit = 100, mergeMs = 800 }: Pick<UndoStackOptions, 'limit' | 'mergeMs'> = {},
): UndoState<T> {
  if (Object.is(value, state.present.value)) return state
  const entry: UndoEntry<T> = { value, kind, at }
  const merge =
    kind !== undefined &&
    state.present.kind === kind &&
    !state.present.sealed &&
    state.future.length === 0 &&
    at - state.present.at <= mergeMs
  if (merge) return { ...state, present: entry }
  const past = [...state.past, state.present]
  return { past: past.length > limit ? past.slice(past.length - limit) : past, present: entry, future: [] }
}

/** 撤销一步；没有可撤的原样返回。 */
export function undoBack<T>(state: UndoState<T>): UndoState<T> {
  const previous = state.past.at(-1)
  if (!previous) return state
  // 撤回来的那步封住（sealed），免得撤销后再拖一下把它吞了；kind 留着，给「撤销 拖列宽」的提示。
  return {
    past: state.past.slice(0, -1),
    present: { ...previous, sealed: true },
    future: [state.present, ...state.future],
  }
}

/** 重做一步；没有可重做的原样返回。 */
export function undoForward<T>(state: UndoState<T>): UndoState<T> {
  const [next, ...rest] = state.future
  if (!next) return state
  return { past: [...state.past, state.present], present: { ...next, sealed: true }, future: rest }
}

/** 一次按键是撤销、重做还是都不是。isMac 决定 Mod 是 ⌘ 还是 Ctrl。 */
export function undoKeyOf(
  event: Pick<KeyboardEvent, 'key' | 'code' | 'ctrlKey' | 'metaKey' | 'shiftKey' | 'altKey'>,
  isMac: boolean,
): 'undo' | 'redo' | null {
  if (event.altKey) return null
  const mod = isMac ? event.metaKey && !event.ctrlKey : event.ctrlKey && !event.metaKey
  if (!mod) return null
  const key = event.code === 'KeyZ' || event.key.toLowerCase() === 'z' ? 'z' : event.code === 'KeyY' ? 'y' : ''
  if (key === 'z') return event.shiftKey ? 'redo' : 'undo'
  if (key === 'y' && !isMac && !event.shiftKey) return 'redo'
  return null
}

const editable = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable ||
    target.matches('input, textarea, select, [contenteditable]:not([contenteditable=false])'))

const macLike = () =>
  typeof navigator !== 'undefined' &&
  /mac|iphone|ipad/i.test(
    (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ?? navigator.platform,
  )

export type UndoStack<T> = {
  value: T
  /** 记一步新值（同时就是当前值）。 */
  push: (value: T, options?: UndoPushOptions) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  /** 可撤 / 可重做的步数（给按钮的提示：「撤销（3）」）。 */
  undoCount: number
  redoCount: number
  /** 撤销会撤掉的那步、重做会重做的那步的 kind（给提示写「撤销 拖列宽」）。 */
  undoKind: string | undefined
  redoKind: string | undefined
  /** 换成新值并清空历史（载入存档、切换视图）。 */
  reset: (value: T) => void
}

/** 撤销 / 重做栈。值经 push 改；undo / redo 改回去。返回的函数引用稳定（push 随 limit、mergeMs 变）。 */
export function useUndoStack<T>(initial: T, options: UndoStackOptions = {}): UndoStack<T> {
  const { limit, mergeMs, hotkeys = false } = options
  const [state, setState] = useState(() => undoInit(initial))

  const push = useCallback(
    (value: T, pushOptions?: UndoPushOptions) => setState((s) => undoPush(s, value, pushOptions, { limit, mergeMs })),
    [limit, mergeMs],
  )
  const undo = useCallback(() => setState(undoBack), [])
  const redo = useCallback(() => setState(undoForward), [])
  const reset = useCallback((value: T) => setState(undoInit(value, Date.now())), [])

  useEffect(() => {
    if (!hotkeys || typeof document === 'undefined') return
    const scope = typeof hotkeys === 'object' ? hotkeys.current : null
    if (typeof hotkeys === 'object' && !scope) return
    const target: HTMLElement | Document = scope ?? document
    const isMac = macLike()
    const onKey = (event: Event) => {
      const key = event as KeyboardEvent
      if (key.defaultPrevented || key.isComposing || editable(key.target)) return
      const action = undoKeyOf(key, isMac)
      if (!action) return
      key.preventDefault()
      if (action === 'undo') undo()
      else redo()
    }
    target.addEventListener('keydown', onKey)
    return () => target.removeEventListener('keydown', onKey)
  }, [hotkeys, undo, redo])

  return useMemo(
    () => ({
      value: state.present.value,
      push,
      undo,
      redo,
      reset,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
      undoCount: state.past.length,
      redoCount: state.future.length,
      undoKind: state.past.length > 0 ? state.present.kind : undefined,
      redoKind: state.future[0]?.kind,
    }),
    [state, push, undo, redo, reset],
  )
}
