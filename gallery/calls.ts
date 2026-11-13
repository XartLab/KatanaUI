// SPDX-License-Identifier: MIT
// 每个菜单项的 onSelect 被调了几次：浏览器测试断言「选一次就是一次」（Radix 的 pointerup 选中加后到的 click 曾经会叫两次）。
// 下拉菜单与右键菜单各一页，计数放在模块里，两页共用同一份。
import { useSyncExternalStore } from 'react'

let calls: Readonly<Record<string, number>> = {}
const listeners = new Set<() => void>()

export const recordCall = (name: string) => () => {
  calls = { ...calls, [name]: (calls[name] ?? 0) + 1 }
  for (const listener of listeners) listener()
}

export const useCalls = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    () => calls,
    () => calls,
  )
