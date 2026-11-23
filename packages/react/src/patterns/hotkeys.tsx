// SPDX-License-Identifier: MIT
/**
 * Hotkey registry: components declare shortcuts with useHotkeys; one window listener dispatches them; ShortcutSheet lists them.
 * 快捷键注册表（#77 G9）：组件里用 useHotkeys 声明快捷键，注册表一个 window 监听分发，ShortcutSheet 按作用域列出。
 * 规则：输入框里（文本框、textarea、select、contenteditable）不触发，除非这条写了 allowInInput；输入法组字中不触发；
 * 同一个组合多条都开着时，非 global 作用域的、后注册的先得；作用域可整组关掉（setActiveScopes），关掉的在总览表里也灰着。
 * 没有 HotkeysProvider 时用模块里的默认注册表，件照常能用。
 * 出处：TradingView 的快捷键面板（Ctrl+/，主会话 2026-11-18 实看：按 Chart / Watchlist / Screener 等分组、可搜索、一个动作可有几种按法「或」）。
 */
import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react'
import {
  GLOBAL_SCOPE,
  comboOfEvent,
  detectPlatform,
  findConflicts,
  isEditableTarget,
  normalizeCombo,
  type HotkeyConflict,
  type HotkeyEntry,
  type HotkeyPlatform,
} from './hotkeys-model.ts'

/** 组件里声明的一条快捷键。 */
export type HotkeyBinding = {
  /** 稳定的 id（改键、冲突提示认它）。 */
  id: string
  /** 组合串，可写 Mod（Mac 是 ⌘，别处 Ctrl）；数组是几种按法「或」。 */
  combo: string | readonly string[]
  /** 总览表里的名字（调用方按界面语言写）。 */
  label: string
  /** 作用域（总览表按它分组）；省略是 global。 */
  scope?: string
  handler: (event: KeyboardEvent) => void
  /** false 时不触发、总览表里灰着；默认 true。 */
  enabled?: boolean
  /** 在输入框里也触发（Esc、Mod+K 这类）；默认 false。 */
  allowInInput?: boolean
  /** 触发后 preventDefault；默认 true。 */
  preventDefault?: boolean
}

type Stored = HotkeyBinding & { combos: string[]; order: number }

export type HotkeyRegistry = {
  readonly platform: HotkeyPlatform
  /** 登记一条，返回注销函数。 */
  register: (binding: HotkeyBinding) => () => void
  /** 现在登记着的（按登记先后）。 */
  entries: () => readonly HotkeyEntry[]
  conflicts: () => readonly HotkeyConflict[]
  /** 只让这些作用域生效（global 总在）；null 是全开。 */
  setActiveScopes: (scopes: readonly string[] | null) => void
  activeScopes: () => readonly string[] | null
  /** 把一次按键交给注册表；触发了返回 true（测试与宿主自己的监听用）。 */
  dispatch: (event: KeyboardEvent) => boolean
  subscribe: (listener: () => void) => () => void
}

/** 建一个注册表；target 是挂监听的地方（默认 window），有登记时才挂上。 */
export function createHotkeyRegistry({
  platform = detectPlatform(),
  target,
}: { platform?: HotkeyPlatform; target?: EventTarget } = {}): HotkeyRegistry {
  const bindings = new Map<string, Stored>()
  const listeners = new Set<() => void>()
  let scopes: readonly string[] | null = null
  let counter = 0
  let snapshot: readonly HotkeyEntry[] = []
  let conflictSnapshot: readonly HotkeyConflict[] = []
  let attached: EventTarget | null = null

  const isActive = (binding: Stored) =>
    binding.enabled !== false &&
    (scopes === null || (binding.scope ?? GLOBAL_SCOPE) === GLOBAL_SCOPE || scopes.includes(binding.scope!))
  const refresh = () => {
    snapshot = [...bindings.values()].map((binding) => ({
      id: binding.id,
      combos: binding.combos,
      label: binding.label,
      scope: binding.scope ?? GLOBAL_SCOPE,
      enabled: isActive(binding),
    }))
    conflictSnapshot = findConflicts(snapshot)
    for (const listener of listeners) listener()
  }
  const onKey = (event: Event) => {
    registry.dispatch(event as KeyboardEvent)
  }
  const sync = () => {
    const where = target ?? (typeof window === 'undefined' ? null : window)
    if (bindings.size > 0 && !attached && where) {
      where.addEventListener('keydown', onKey)
      attached = where
    } else if (bindings.size === 0 && attached) {
      attached.removeEventListener('keydown', onKey)
      attached = null
    }
  }

  const registry: HotkeyRegistry = {
    platform,
    register: (binding) => {
      const combos = (typeof binding.combo === 'string' ? [binding.combo] : [...binding.combo]).map((spec) =>
        normalizeCombo(spec, platform),
      )
      const stored: Stored = { ...binding, combos, order: counter++ }
      bindings.set(binding.id, stored)
      sync()
      refresh()
      return () => {
        if (bindings.get(binding.id) !== stored) return
        bindings.delete(binding.id)
        sync()
        refresh()
      }
    },
    entries: () => snapshot,
    conflicts: () => conflictSnapshot,
    setActiveScopes: (next) => {
      scopes = next
      refresh()
    },
    activeScopes: () => scopes,
    dispatch: (event) => {
      if (event.defaultPrevented) return false
      const combo = comboOfEvent(event)
      if (combo === null) return false
      const inInput = isEditableTarget(event.target)
      const hit = [...bindings.values()]
        .filter((binding) => isActive(binding) && binding.combos.includes(combo) && (!inInput || binding.allowInInput))
        // 非 global 的先得，同类里后登记的先得（打开的面板盖过底下的）。
        .toSorted(
          (a, b) =>
            Number((a.scope ?? GLOBAL_SCOPE) === GLOBAL_SCOPE) - Number((b.scope ?? GLOBAL_SCOPE) === GLOBAL_SCOPE) ||
            b.order - a.order,
        )[0]
      if (!hit) return false
      if (hit.preventDefault !== false) event.preventDefault()
      hit.handler(event)
      return true
    },
    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
  return registry
}

let fallback: HotkeyRegistry | null = null
const defaultRegistry = () => (fallback ??= createHotkeyRegistry())

const Context = createContext<HotkeyRegistry | null>(null)

/** 给子树一个注册表（测试、多窗口、要自己定平台时用）；不包也行，用默认的。 */
export function HotkeysProvider({ registry, children }: { registry: HotkeyRegistry; children?: ReactNode }) {
  return <Context.Provider value={registry}>{children}</Context.Provider>
}

/** 当前的注册表（没有 Provider 时是默认的那个）。 */
export const useHotkeyRegistry = (): HotkeyRegistry => useContext(Context) ?? defaultRegistry()

/**
 * 在组件里声明快捷键：挂上时登记，卸下时注销；handler 总是读最新的（不用 useCallback）。
 * 组合、名字、作用域、开关变了会重新登记。
 */
export function useHotkeys(bindings: readonly HotkeyBinding[]): void {
  const registry = useHotkeyRegistry()
  const latest = useRef(bindings)
  useEffect(() => {
    latest.current = bindings
  })
  const signature = JSON.stringify(
    bindings.map(({ id, combo, label, scope, enabled, allowInInput, preventDefault }) => [
      id,
      combo,
      label,
      scope,
      enabled,
      allowInInput,
      preventDefault,
    ]),
  )
  useEffect(() => {
    const offs = latest.current.map((binding) =>
      registry.register({
        ...binding,
        handler: (event) => latest.current.find((entry) => entry.id === binding.id)?.handler(event),
      }),
    )
    return () => {
      for (const off of offs) off()
    }
  }, [registry, signature])
}

/** 读注册表里现在的快捷键与冲突（变了会重画）。 */
export function useHotkeyEntries(registry?: HotkeyRegistry): {
  entries: readonly HotkeyEntry[]
  conflicts: readonly HotkeyConflict[]
  platform: HotkeyPlatform
} {
  const own = useHotkeyRegistry()
  const r = registry ?? own
  const entries = useSyncExternalStore(r.subscribe, r.entries, r.entries)
  const conflicts = useSyncExternalStore(r.subscribe, r.conflicts, r.conflicts)
  return { entries, conflicts, platform: r.platform }
}
