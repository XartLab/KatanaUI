// SPDX-License-Identifier: MIT
import { useCallback, useState } from 'react'

// 带版本的持久化状态（#27）：存成 { v, value } 的 JSON；版本不符、解析失败、validate 不过都当没存过（丢掉，不写迁移：存档版本变了就直接换）。
// 存储由调用方给（任何有 getItem / setItem / removeItem 的对象），默认 localStorage；读写都包 try/catch（隐私模式、配额满、没有 window 都不抛）。

export type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type PersistedStateOptions<T> = {
  /** 存档版本；改了就丢掉旧存档。 */
  version: number
  /** 存储；省略用 localStorage（拿不到时只在内存里）。 */
  storage?: StorageLike
  /** 读出来的值形状不对就返回 false，当没存过。 */
  validate?: (value: unknown) => value is T
}

const defaultStorage = (): StorageLike | undefined => {
  try {
    return globalThis.localStorage
  } catch {
    return undefined
  }
}

/** 读存档；没有、坏了、版本不符、形状不对都是 undefined。 */
export function readPersisted<T>(key: string, { version, storage, validate }: PersistedStateOptions<T>): T | undefined {
  try {
    const text = (storage ?? defaultStorage())?.getItem(key)
    if (text == null) return undefined
    const saved = JSON.parse(text) as { v?: unknown; value?: unknown } | null
    if (saved === null || typeof saved !== 'object' || saved.v !== version) return undefined
    if (validate && !validate(saved.value)) return undefined
    return saved.value as T
  } catch {
    return undefined
  }
}

function writePersisted<T>(key: string, version: number, storage: StorageLike | undefined, value: T) {
  try {
    ;(storage ?? defaultStorage())?.setItem(key, JSON.stringify({ v: version, value }))
  } catch {
    // 写不进去（配额、隐私模式）：状态照常在内存里。
  }
}

/** 像 useState，但值存进存储；第三项是回到初始值并清掉存档。 */
export function usePersistedState<T>(
  key: string,
  initial: T,
  options: PersistedStateOptions<T>,
): readonly [T, (next: T | ((previous: T) => T)) => void, () => void] {
  const { version, storage } = options
  const [value, setValue] = useState<T>(() => readPersisted(key, options) ?? initial)
  const set = useCallback(
    (next: T | ((previous: T) => T)) => {
      setValue((previous) => {
        const resolved = typeof next === 'function' ? (next as (previous: T) => T)(previous) : next
        writePersisted(key, version, storage, resolved)
        return resolved
      })
    },
    [key, version, storage],
  )
  const reset = useCallback(() => {
    try {
      ;(storage ?? defaultStorage())?.removeItem(key)
    } catch {
      // 同上
    }
    setValue(initial)
  }, [key, storage, initial])
  return [value, set, reset] as const
}
