// SPDX-License-Identifier: MIT
import { useCallback, useMemo } from 'react'
import { usePersistedState, type StorageLike } from './use-persisted-state.ts'

// 已存视图（#27）：一组命名的状态快照（列的摆法加排序之类，T 由调用方定）。保存 / 另存 / 设默认 / 最近用过的 N 个 / 导入导出 JSON。
// 件不认识里面是什么：值只当不透明的 JSON。存储与版本同 usePersistedState。出处：TradingView 筛选器的「保存屏幕」概念（只取功能，实现原创）。

export type SavedView<T> = { id: string; name: string; value: T }

type State<T> = { views: SavedView<T>[]; defaultId: string | null; recent: string[] }

export type UseSavedViewsOptions = {
  key: string
  version: number
  storage?: StorageLike
  /** 「最近」留几个，默认 5。 */
  recentLimit?: number
}

const EMPTY = { views: [], defaultId: null, recent: [] } satisfies State<never>

const isState = (value: unknown): value is State<unknown> =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as State<unknown>).views) &&
  Array.isArray((value as State<unknown>).recent)

export function useSavedViews<T>({ key, version, storage, recentLimit = 5 }: UseSavedViewsOptions) {
  const [state, setState] = usePersistedState<State<T>>(key, EMPTY, {
    version,
    storage,
    validate: isState as (value: unknown) => value is State<T>,
  })
  const newId = () => `v${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`
  const touch = useCallback(
    (recent: string[], id: string) => [id, ...recent.filter((other) => other !== id)].slice(0, recentLimit),
    [recentLimit],
  )

  /** 另存为新视图，返回它的 id。 */
  const saveAs = useCallback(
    (name: string, value: T): string => {
      const id = newId()
      setState((previous) => ({
        ...previous,
        views: [...previous.views, { id, name, value }],
        recent: touch(previous.recent, id),
      }))
      return id
    },
    [setState, touch],
  )
  /** 覆盖已有视图的值（名字可以一起改）；id 不在就什么也不做。 */
  const save = useCallback(
    (id: string, value: T, name?: string) =>
      setState((previous) => ({
        ...previous,
        views: previous.views.map((view) =>
          view.id === id ? { ...view, value, name: name ?? view.name } : view,
        ),
        recent: touch(previous.recent, id),
      })),
    [setState, touch],
  )
  const remove = useCallback(
    (id: string) =>
      setState((previous) => ({
        views: previous.views.filter((view) => view.id !== id),
        defaultId: previous.defaultId === id ? null : previous.defaultId,
        recent: previous.recent.filter((other) => other !== id),
      })),
    [setState],
  )
  const setDefault = useCallback(
    (id: string | null) => setState((previous) => ({ ...previous, defaultId: id })),
    [setState],
  )
  /** 用了某个视图：记进「最近」，返回它的值（调用方拿去设自己的状态）。 */
  const use = useCallback(
    (id: string): T | undefined => {
      const found = state.views.find((view) => view.id === id)
      if (found) setState((previous) => ({ ...previous, recent: touch(previous.recent, id) }))
      return found?.value
    },
    [state.views, setState, touch],
  )

  const recent = useMemo(
    () => state.recent.map((id) => state.views.find((view) => view.id === id)).filter((view) => view !== undefined),
    [state.recent, state.views],
  )
  const defaultView = state.views.find((view) => view.id === state.defaultId)

  /** 导出全部视图（含默认）的 JSON 文本。 */
  const exportJson = useCallback(
    () => JSON.stringify({ version, views: state.views, defaultId: state.defaultId }, null, 2),
    [version, state.views, state.defaultId],
  )
  /** 导入：版本不符或形状不对返回 null；成功返回导入了几个（按 id 覆盖同 id 的）。 */
  const importJson = useCallback(
    (text: string): number | null => {
      try {
        const parsed = JSON.parse(text) as { version?: unknown; views?: unknown; defaultId?: unknown }
        if (parsed.version !== version || !Array.isArray(parsed.views)) return null
        const views = parsed.views.filter(
          (view): view is SavedView<T> =>
            typeof view === 'object' && view !== null && typeof view.id === 'string' && typeof view.name === 'string',
        )
        setState((previous) => ({
          ...previous,
          views: [...previous.views.filter((old) => !views.some((view) => view.id === old.id)), ...views],
          defaultId: typeof parsed.defaultId === 'string' ? parsed.defaultId : previous.defaultId,
        }))
        return views.length
      } catch {
        return null
      }
    },
    [version, setState],
  )

  return { views: state.views, defaultView, defaultId: state.defaultId, recent, saveAs, save, remove, setDefault, use, exportJson, importJson }
}
