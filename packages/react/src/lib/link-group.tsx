// SPDX-License-Identifier: MIT
/**
 * Link groups (TradingView symbol linking): panels in the same color group share one value, so changing it in one moves the rest.
 * 联动组（#150 G8）：几张件按颜色分组，同组里换一个品种，组里其余件跟着换；「不联动」（null）的件只管自己。
 * 出处：TradingView 的符号联动（帮助中心 Symbol syncing between tabs，2026-11-23 读：几个标签页设同一个颜色标签，就跟着其中任一个换代码；
 * 选股器也能联到图表）。只学交互，实现原创。
 * 包里不带数据源：哪些件进组、联动传什么值（品种代码，或 { symbol, interval } 这类，T 由调用方定）都由调用方决定；组色是 token link-a…d。
 * 进组与离组（帮助中心没写，我们定的）：进一个已有值的组，件改显示组的值；进一个还没值的组，组取这件当前的值；离开组（换组或不联动），件留着最后显示的值。
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

/** Link group name: panels in the same group follow the same value. */
export type LinkGroup = 'A' | 'B' | 'C' | 'D'
/** All link groups, in menu order. */
export const LINK_GROUPS: readonly LinkGroup[] = ['A', 'B', 'C', 'D']

// 变量名写全（不拼字符串）：theming.test 逐个核对引用的变量都在 tokens.css 里。
const LINK_COLOR: Record<LinkGroup, string> = {
  A: 'var(--link-a)',
  B: 'var(--link-b)',
  C: 'var(--link-c)',
  D: 'var(--link-d)',
}

/** CSS color of a link group, as a token variable (`var(--link-a)`). */
export const linkGroupColor = (group: LinkGroup): string => LINK_COLOR[group]

/** Current value of each group; a group nobody has set yet is absent. */
export type LinkGroupValues<T> = Readonly<Partial<Record<LinkGroup, T>>>

type Store = {
  values: LinkGroupValues<unknown>
  /** 设一组的值：组里的件都跟着换。 */
  set: (group: LinkGroup, value: unknown) => void
  /** 组还没有值时才设（件进空组时用）。 */
  seed: (group: LinkGroup, value: unknown) => void
}

const LinkStore = createContext<Store | null>(null)

export type LinkGroupProviderProps<T> = {
  /**
   * Controlled values of the groups (group to value).
   * 受控：每组当前的值；要存盘就接 usePersistedState。
   */
  value?: LinkGroupValues<T>
  /** Initial values of the groups when uncontrolled. */
  defaultValue?: LinkGroupValues<T>
  /** Called with every group's value after any group changes. */
  onValueChange?: (next: LinkGroupValues<T>) => void
  /** Panels that read their group through useLinkGroup. */
  children?: ReactNode
}

/** Holds the value of each link group for the panels below it; without a provider, useLinkGroup keeps each panel on its own. */
export function LinkGroupProvider<T>({ value, defaultValue, onValueChange, children }: LinkGroupProviderProps<T>) {
  const [own, setOwn] = useState<LinkGroupValues<T>>(defaultValue ?? {})
  const values = value ?? own
  const controlled = value !== undefined
  // 同一轮里连着几次写（两件同时进同一个空组）要读到上一次写的结果，所以写经 ref；每次提交后（子件的 effect 之前）对回 props 与 state。
  const latest = useRef<LinkGroupValues<T>>(values)
  const handlers = useRef({ controlled, onValueChange })
  useLayoutEffect(() => {
    latest.current = values
    handlers.current = { controlled, onValueChange }
  })
  const write = useCallback((group: LinkGroup, next: T, onlyIfEmpty: boolean) => {
    const current = latest.current
    if (onlyIfEmpty ? current[group] !== undefined : Object.is(current[group], next)) return
    const updated = { ...current, [group]: next }
    latest.current = updated
    if (!handlers.current.controlled) setOwn(updated)
    handlers.current.onValueChange?.(updated)
  }, [])
  const set = useCallback((group: LinkGroup, next: unknown) => write(group, next as T, false), [write])
  const seed = useCallback((group: LinkGroup, next: unknown) => write(group, next as T, true), [write])
  const store = useMemo<Store>(() => ({ values, set, seed }), [values, set, seed])
  return <LinkStore value={store}>{children}</LinkStore>
}

export type UseLinkGroupOptions<T> = {
  /**
   * This panel's own value: shown while unlinked, and taken by an empty group the panel joins.
   * 这件自己的值：不联动时显示它；进一个还没值的组时，组取它。
   */
  defaultValue: T
  /**
   * Controlled group of this panel; null is unlinked.
   * 受控：这件在哪一组，null 是不联动；一般接 LinkGroupPicker。
   */
  group?: LinkGroup | null
  /** Initial group when uncontrolled; defaults to null (unlinked). */
  defaultGroup?: LinkGroup | null
  /** Called when setGroup moves the panel to another group or unlinks it. */
  onGroupChange?: (group: LinkGroup | null) => void
}

export type LinkGroupMember<T> = {
  /** 这件现在该显示的值：在组里且组有值时是组的值，否则是自己的。 */
  value: T
  /** 换值：在组里就改整组（组里其余件跟着换），不联动只改自己。 */
  setValue: (next: T) => void
  /** 这件在哪一组；null 是不联动。 */
  group: LinkGroup | null
  /** 换组或不联动（接 LinkGroupPicker 的 onValueChange）。 */
  setGroup: (group: LinkGroup | null) => void
  /** 组色（`var(--link-a)` 这类）；不联动是 undefined。 */
  color: string | undefined
}

/** One panel's place in the link groups: the value to show, a setter that moves the whole group, and the group itself. */
export function useLinkGroup<T>({
  defaultValue,
  group: controlledGroup,
  defaultGroup = null,
  onGroupChange,
}: UseLinkGroupOptions<T>): LinkGroupMember<T> {
  const store = useContext(LinkStore)
  const [ownGroup, setOwnGroup] = useState<LinkGroup | null>(defaultGroup)
  const group = controlledGroup === undefined ? ownGroup : controlledGroup
  const [own, setOwn] = useState<T>(defaultValue)
  // 换组的那次渲染里，件留下离开的那组的值（React 的「渲染中按上一次的值调 state」写法，不等 effect，不闪一帧旧值）。
  const [previous, setPrevious] = useState(group)
  if (previous !== group) {
    setPrevious(group)
    const left = previous && store ? (store.values[previous] as T | undefined) : undefined
    if (left !== undefined) setOwn(left)
  }
  const shared = group && store ? (store.values[group] as T | undefined) : undefined
  const value = shared === undefined ? own : shared

  const seed = store?.seed
  useEffect(() => {
    if (group && seed) seed(group, own)
  }, [group, seed, own])

  const set = store?.set
  const setValue = useCallback(
    (next: T) => {
      setOwn(next)
      if (group && set) set(group, next)
    },
    [group, set],
  )
  const setGroup = useCallback(
    (next: LinkGroup | null) => {
      if (controlledGroup === undefined) setOwnGroup(next)
      onGroupChange?.(next)
    },
    [controlledGroup, onGroupChange],
  )
  return { value, setValue, group, setGroup, color: group ? linkGroupColor(group) : undefined }
}
