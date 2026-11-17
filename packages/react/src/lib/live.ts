// SPDX-License-Identifier: MIT
// 数据刷新的共用层（行情终端的通行做法：TradingView、Bloomberg、同花顺）：数值变了闪一下涨跌色、新条目高亮一阵、重排时行平滑换位、状态变了闪一次警示。
// 之前 RollingText、MarketHeatmap、Watchlist 各写一套闪烁，时长与写法都不一样，其余件数据变了就硬切；现在都从这里取，皮肤在 ../theme/live.css。
// 时长的源头是 @katana-ui/tokens 的 motion 组（--dur-flash / --dur-enter / --dur-reorder）；JS 要用毫秒数，这里镜像一份，live.test.ts 盯着两边一致。
// 同一格最短闪烁间隔只有 JS 用，不进 CSS，就定义在这里这一处。
// 状态都在渲染里按「上一次看到的」推导（照 React 文档的「渲染时调整状态」），不走 effect，避免先闪一帧旧样子；effect 只管到点清标记。

import { useEffect, useLayoutEffect, useRef, useState, type RefObject } from 'react'

/** 数值闪烁的时长；对应 --dur-flash。 */
export const LIVE_FLASH_MS = 600
/** 新条目高亮的时长；对应 --dur-enter。 */
export const LIVE_ENTER_MS = 1200
/** 重排位移的时长；对应 --dur-reorder。 */
export const LIVE_REORDER_MS = 240
/** 同一格两次闪烁之间至少隔多久：行情密的时候不晃眼（节流，只在 JS 里，不是 CSS 变量）。 */
export const LIVE_FLASH_GAP_MS = 1000

export type FlashDirection = 'up' | 'down'
export type ValueFlash = {
  /** 这一次变化的方向；没有变化、被节流、首次渲染、非数值时是 null；闪完（约 LIVE_FLASH_MS 后）自己回到 null。 */
  flash: FlashDirection | null
  /** 每闪一次加一；放在元素的 key 上，CSS 动画才会重放。 */
  key: number
}

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** 一段标记到点自己清掉：timer 不随依赖变化取消（前一批的清除不能被后一批吃掉），只在卸载时清。 */
function useExpiry(): (run: () => void, ms: number) => void {
  const timers = useRef(new Set<ReturnType<typeof setTimeout>>())
  useEffect(() => {
    const own = timers.current
    return () => {
      for (const timer of own) clearTimeout(timer)
      own.clear()
    }
  }, [])
  return (run, ms) => {
    const timer = setTimeout(() => {
      timers.current.delete(timer)
      run()
    }, ms)
    timers.current.add(timer)
  }
}

/**
 * 数值变大返回 'up'、变小返回 'down'，并给一个递增的 key。
 * 首次渲染不闪；null、undefined、NaN、Infinity 不闪（下一个有效值也当作「首次」，不拿它跟没有的东西比）；
 * 同一实例 gapMs（默认 1 秒）内最多触发一次：窗口里的变化直接换值、不补闪（行情密时补闪只会拖尾，Bloomberg 的做法也是丢掉）。
 * enabled 为 false 时照常跟踪值，只是不闪。
 */
export function useValueFlash(
  value: number | null | undefined,
  { enabled = true, gapMs = LIVE_FLASH_GAP_MS }: { enabled?: boolean; gapMs?: number } = {},
): ValueFlash {
  const [state, setState] = useState<{ seen: number | null; flash: FlashDirection | null; key: number; at: number }>({
    seen: finite(value) ? value : null,
    flash: null,
    key: 0,
    at: -Infinity,
  })
  const expire = useExpiry()
  const next = finite(value) ? value : null
  if (next !== state.seen) {
    // 节流要看真实时间；渲染被丢弃重来时最多多闪或少闪一次，看不出来。
    // oxlint-disable-next-line react/purity
    const now = Date.now()
    const flashes = enabled && next !== null && state.seen !== null && now - state.at >= gapMs
    setState(
      flashes
        ? { seen: next, flash: next > state.seen! ? 'up' : 'down', key: state.key + 1, at: now }
        : { ...state, seen: next },
    )
  }
  const { key, flash } = state
  useEffect(() => {
    if (flash === null) return
    // 动画播完就摘掉标记：虚拟列表里行滚回来重新挂载时，不会拿着旧标记再闪一遍。
    expire(() => setState((s) => (s.key === key ? { ...s, flash: null } : s)), LIVE_FLASH_MS)
  }, [key, flash, expire])
  return { flash, key }
}

const sameIds = (a: readonly string[], b: readonly string[]) => a.length === b.length && a.every((id, i) => id === b[i])

/**
 * 返回本次新出现的 id 集合：上一次渲染没有、这一次有的。
 * 首次渲染的全部算旧的，不高亮；高亮 LIVE_ENTER_MS（1200ms）后自动清掉；一个 id 走了又回来算新的。
 */
export function useEnterMarks(ids: readonly string[]): ReadonlySet<string> {
  const [state, setState] = useState<{ ids: readonly string[]; marks: ReadonlySet<string>; fresh: readonly string[] }>({
    ids,
    marks: new Set(),
    fresh: [],
  })
  const expire = useExpiry()
  if (!sameIds(ids, state.ids)) {
    const before = new Set(state.ids)
    const fresh = ids.filter((id) => !before.has(id))
    setState({
      ids,
      marks: fresh.length ? new Set([...state.marks, ...fresh]) : state.marks,
      fresh: fresh.length ? fresh : state.fresh,
    })
  }
  const { fresh } = state
  useEffect(() => {
    if (fresh.length === 0) return
    expire(() => {
      setState((s) => {
        const marks = new Set(s.marks)
        for (const id of fresh) marks.delete(id)
        return marks.size === s.marks.size ? s : { ...s, marks }
      })
    }, LIVE_ENTER_MS)
  }, [fresh, expire])
  return state.marks
}

/**
 * 状态（字符串）变了，给一次性的 flash：key 每变一次加一（放在元素的 key 上让 CSS 动画重放），flash 在 LIVE_FLASH_MS 内为 true。
 * 首次渲染不闪；null、undefined 不算状态，也不闪。不节流：状态变化本来就少，每一次都该看见。
 */
export function useStatusFlash(status: string | null | undefined): { flash: boolean; key: number } {
  const [state, setState] = useState<{ seen: string | null; flash: boolean; key: number }>({
    seen: status ?? null,
    flash: false,
    key: 0,
  })
  const expire = useExpiry()
  const next = status ?? null
  if (next !== state.seen)
    setState({
      seen: next,
      flash: next !== null && state.seen !== null,
      key: next !== null && state.seen !== null ? state.key + 1 : state.key,
    })
  const { key, flash } = state
  useEffect(() => {
    if (!flash) return
    // 持续 1200ms（不是 600）：状态闪可能挂 .k-live-alert，它要闪两下共 1200ms，摘早了第二下会被截断；普通的 .k-live-flash 600ms 播完就停，多挂一会儿无害。
    expire(() => setState((s) => (s.key === key ? { ...s, flash: false } : s)), LIVE_ENTER_MS)
  }, [key, flash, expire])
  return { flash, key }
}

/** 一行相对容器内容区的位置（含滚动量）：容器滚了不算行动了。 */
type Spot = { left: number; top: number }

function spotOf(el: Element, box: DOMRect, scroll: { left: number; top: number }): Spot {
  const rect = el.getBoundingClientRect()
  return { left: rect.left - box.left + scroll.left, top: rect.top - box.top + scroll.top }
}

/**
 * ids 的顺序变了，让行用 FLIP（First-Last-Invert-Play）从旧位置平滑移到新位置，LIVE_REORDER_MS（240ms），缓动 --ease-snappy。
 * 子元素用 data-live-id 标识；没渲染的行（虚拟列表之外的）没有元素，跳过；新出现的行没有旧位置，也跳过（它走 useEnterMarks）。
 * 用 Web Animations API 的 element.animate，只动 transform，不改 DOM 顺序，也不占用元素的 className / style。
 * 每次提交都记一次各行的位置（行高变了也要有最新的「旧位置」），但只有 ids 变了才播。动画播到一半又被重排时，从当前看到的位置接着走。
 */
export function useFlipList(containerRef: RefObject<HTMLElement | null>, ids: readonly string[]): void {
  const spots = useRef(new Map<string, Spot>())
  const animations = useRef(new Map<string, Animation>())
  const lastIds = useRef<readonly string[]>(ids)
  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const reordered = !sameIds(lastIds.current, ids)
    lastIds.current = ids
    const box = container.getBoundingClientRect()
    const scroll = { left: container.scrollLeft, top: container.scrollTop }
    const rows = [...container.querySelectorAll<HTMLElement>('[data-live-id]')]
    // 先量带着位移动画的位置，再取消动画量真正的新位置；两者之差就是还在播的那几行此刻的位移。
    const seen = new Map<string, Spot>()
    for (const row of rows) seen.set(row.dataset.liveId!, spotOf(row, box, scroll))
    const running = new Set(animations.current.keys())
    for (const animation of animations.current.values()) animation.cancel()
    animations.current.clear()
    const now = new Map<string, Spot>()
    for (const row of rows) now.set(row.dataset.liveId!, spotOf(row, box, scroll))
    if (reordered) {
      const easing = getComputedStyle(container).getPropertyValue('--ease-snappy').trim() || 'ease-out'
      for (const row of rows) {
        const id = row.dataset.liveId!
        const to = now.get(id)!
        const old = spots.current.get(id)
        if (!old) continue
        // 接着走：上一轮还没播完的行，起点是旧位置再加上它此刻的位移，看上去不跳。
        const shift = running.has(id) ? seen.get(id)! : to
        const dx = old.left - to.left + (shift.left - to.left)
        const dy = old.top - to.top + (shift.top - to.top)
        if (Math.abs(dx) < 0.5 && Math.abs(dy) < 0.5) continue
        if (typeof row.animate !== 'function') continue
        const animation = row.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'translate(0, 0)' }],
          { duration: LIVE_REORDER_MS, easing },
        )
        animation.addEventListener('finish', () => animations.current.delete(id))
        animations.current.set(id, animation)
      }
    }
    spots.current = now
  })
}
