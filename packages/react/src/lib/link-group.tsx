// SPDX-License-Identifier: MIT
/**
 * Link groups: widgets in the same group share the symbol, interval, crosshair time and visible range.
 * 联动组（#22 G8）：同一组的件共用品种、周期、十字线时刻、可见区间。照 TradingView：多图布局同步品种、周期、十字线、时间与日期区间
 * （对齐表 L802–L808），自选点一行、联动的图换品种（L843）；对齐表的行号见 #22，TradingView 帮助中心没有逐项写，待核对。
 * 组 id 一般是 Led 的 LinkGroup（面板头上的色点 A–D）；null 是不联动，件自己记自己的。
 * 各件只订阅要的字段：十字线随指针一直在变，只订阅品种的件不跟着重画。纯 context，不带宿主、不存盘；没有 LinkGroupProvider 时用模块里的默认联动表。
 */
import { createContext, useCallback, useContext, useState, useSyncExternalStore, type ReactNode } from 'react'

/** 一组共用的状态；没设过的字段是 undefined。 */
export type LinkGroupState = {
  symbol?: string
  /** 周期（调用方的写法：1、5、60、1D……）。 */
  interval?: string
  /** 十字线所在的时刻（毫秒）；null 是指针不在任何一张图上。 */
  crosshairTime?: number | null
  /** 可见的时间区间（毫秒）。 */
  range?: { from: number; to: number } | null
}

export type LinkField = keyof LinkGroupState

/** 全部字段（订阅的默认值）。 */
export const LINK_FIELDS: readonly LinkField[] = ['symbol', 'interval', 'crosshairTime', 'range']

const sameValue = (field: LinkField, a: LinkGroupState[LinkField], b: LinkGroupState[LinkField]): boolean => {
  if (field !== 'range' || !a || !b || typeof a !== 'object' || typeof b !== 'object') return Object.is(a, b)
  return a.from === b.from && a.to === b.to
}

export type LinkHub = {
  /** 一组现在的状态（没人设过是空对象）。 */
  get: (group: string) => LinkGroupState
  /** 改一组的几个字段；值没变的字段不算改，什么都没变不通知。 */
  set: (group: string, patch: Partial<LinkGroupState>) => void
  /** 只取几个字段：这几个字段没变时返回同一个对象（给 useSyncExternalStore）。 */
  select: (group: string, fields: readonly LinkField[]) => LinkGroupState
  /** 订阅一组；回调拿到这次改了哪些字段。 */
  subscribe: (group: string, listener: (changed: readonly LinkField[]) => void) => () => void
}

/** 建一张联动表（测试、多窗口、要隔开两套联动时用）。 */
export function createLinkHub(initial: Readonly<Record<string, LinkGroupState>> = {}): LinkHub {
  const states = new Map<string, LinkGroupState>(Object.entries(initial))
  const listeners = new Map<string, Set<(changed: readonly LinkField[]) => void>>()
  const picks = new Map<string, LinkGroupState>()
  const EMPTY: LinkGroupState = {}
  return {
    get: (group) => states.get(group) ?? EMPTY,
    set: (group, patch) => {
      const current = states.get(group) ?? EMPTY
      const changed = (Object.keys(patch) as LinkField[]).filter(
        (field) => LINK_FIELDS.includes(field) && !sameValue(field, current[field], patch[field]),
      )
      if (changed.length === 0) return
      states.set(group, { ...current, ...Object.fromEntries(changed.map((field) => [field, patch[field]])) })
      // 边走边删 Map 的键是安全的（删掉的不会再走到）。
      for (const key of picks.keys())
        if (
          key.startsWith(`${group}\u0000`) &&
          changed.some((field) => key.split('\u0000')[1]!.split(',').includes(field))
        )
          picks.delete(key)
      for (const listener of listeners.get(group) ?? []) listener(changed)
    },
    select: (group, fields) => {
      const key = `${group}\u0000${fields.join(',')}`
      let picked = picks.get(key)
      if (!picked) {
        const state = states.get(group) ?? EMPTY
        picked = Object.fromEntries(fields.filter((field) => field in state).map((field) => [field, state[field]]))
        picks.set(key, picked)
      }
      return picked
    },
    subscribe: (group, listener) => {
      const set = listeners.get(group) ?? new Set()
      set.add(listener)
      listeners.set(group, set)
      return () => {
        set.delete(listener)
      }
    },
  }
}

let fallback: LinkHub | null = null
const defaultHub = () => (fallback ??= createLinkHub())

const Context = createContext<LinkHub | null>(null)

/** 给子树一张联动表；不包也行，用默认的（整个应用一张）。 */
export function LinkGroupProvider({ hub, children }: { hub: LinkHub; children?: ReactNode }) {
  return <Context.Provider value={hub}>{children}</Context.Provider>
}

/** 当前的联动表（没有 Provider 时是默认的那张）。 */
export const useLinkHub = (): LinkHub => useContext(Context) ?? defaultHub()

/**
 * 读写一个联动组：返回 [状态, 改]。group 为 null 时不联动，状态只在这个件里（initial 起头）。
 * 联动时组里没设过的字段取 initial（件自己的默认品种、周期）；fields 只订阅这几个字段，别的字段变了不重画。
 */
export function useLinkGroup(
  group: string | null,
  { fields = LINK_FIELDS, initial = {} }: { fields?: readonly LinkField[]; initial?: LinkGroupState } = {},
): [LinkGroupState, (patch: Partial<LinkGroupState>) => void] {
  const hub = useLinkHub()
  const [own, setOwn] = useState<LinkGroupState>(initial)
  const key = fields.join(',')
  const watch = useCallback(
    (notify: () => void) =>
      group === null
        ? () => {}
        : hub.subscribe(group, (changed) => {
            if (changed.some((field) => key.split(',').includes(field))) notify()
          }),
    [hub, group, key],
  )
  const shared = useSyncExternalStore(
    watch,
    () => (group === null ? null : hub.select(group, fields)),
    () => (group === null ? null : hub.select(group, fields)),
  )
  if (group === null || shared === null) return [own, (patch) => setOwn((state) => ({ ...state, ...patch }))]
  const merged: LinkGroupState = { ...initial, ...shared }
  return [merged, (patch) => hub.set(group, patch)]
}
