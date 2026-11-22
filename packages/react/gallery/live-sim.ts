// SPDX-License-Identifier: MIT
// 文档站里「数据在动」的模拟器（只给 gallery 用，不进包）：随机游走的价格、随机来的新闻、随机换位的排名与状态，都靠一个通用的节拍器 useLiveTicker 推。
// 要点：① 随机数带种子，同一个种子两次跑出同一串（?seed=7 注入，或每个节拍器传 seed）；② 提供手动步进 window.__liveStep?.(n)，e2e 不靠等待；
// ③ 全局「实时 / 暂停」一个开关（LiveToggle 用），暂停时手动步进照样走；④ 自动化浏览器（navigator.webdriver，e2e 与截图比对）默认暂停，免得图在动，?live=1 可强开。
// 用法：const { state, tick } = useLiveTicker(initial, (s, rng) => ({ ...s, price: randomWalk(s.price, rng, 0.004) }), { intervalMs: 1200 })

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

export type Rng = () => number

/** mulberry32：32 位种子，够快、够均匀，同一个种子永远同一串。 */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 随机游走一步：在 ±pct 之间均匀走，结果保留 2 位小数（价格用）。 */
export function randomWalk(value: number, rng: Rng, pct = 0.004): number {
  return Math.round(value * (1 + (rng() * 2 - 1) * pct) * 100) / 100
}
/** 以 probability 的概率返回 true：「偶尔来一条」「偶尔换状态」用。 */
export const chance = (rng: Rng, probability: number): boolean => rng() < probability
/** 从列表里随机取一个。 */
export const pick = <T>(rng: Rng, items: readonly T[]): T => items[Math.floor(rng() * items.length)]!
/** [0, max) 的随机整数。 */
export const randomInt = (rng: Rng, max: number): number => Math.floor(rng() * max)

const query = (name: string) =>
  typeof location === 'undefined' ? null : new URLSearchParams(location.search).get(name)

/** 全局种子：?seed=7；没传是固定的 1（截图与文档稳定）。 */
export const liveSeed = (): number => {
  const raw = Number(query('seed'))
  return Number.isFinite(raw) && query('seed') !== null ? raw : 1
}

// 全局「实时 / 暂停」：一个小外部 store，LiveToggle 写、所有节拍器读。
const initialLive = (): boolean => {
  const forced = query('live')
  if (forced === '1') return true
  if (forced === '0') return false
  return typeof navigator === 'undefined' || !navigator.webdriver
}
let liveOn: boolean | null = null
const listeners = new Set<() => void>()
const readLive = () => (liveOn ??= initialLive())
export function setLive(next: boolean): void {
  liveOn = next
  for (const listener of listeners) listener()
}
export function useLiveEnabled(): [boolean, (next: boolean) => void] {
  const on = useSyncExternalStore(
    (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    readLive,
    () => true,
  )
  return [on, setLive]
}

// 手动步进：所有挂着的节拍器各走 n 步；e2e 与调试用。
const steppers = new Set<() => void>()
declare global {
  interface Window {
    /** 仅文档站：让所有挂着的模拟器手动走 n 步（默认 1），不管开着实时还是暂停。 */
    __liveStep?: (count?: number) => void
  }
}
if (typeof window !== 'undefined') {
  window.__liveStep = (count = 1) => {
    for (let i = 0; i < count; i += 1) for (const advance of steppers) advance()
  }
}

export type LiveTickerOptions = {
  /** 自动走一步的间隔，默认 1500ms。 */
  intervalMs?: number
  /** 不传就跟全局开关；传了就以它为准（false 是这一个节拍器永远不自动走）。 */
  enabled?: boolean
  /** 随机种子；不传用全局种子（?seed=）。 */
  seed?: number
}
export type LiveTicker<S> = {
  state: S
  /** 已经走了几步。 */
  tick: number
  /** 此刻是不是在自动走。 */
  running: boolean
  /** 手动走一步（跟 window.__liveStep 一样的那一步）。 */
  advance: () => void
}

class Sim<S> {
  tick = 0
  state: S
  readonly rng: Rng
  constructor(state: S, seed: number) {
    this.state = state
    this.rng = makeRng(seed)
  }
  advance(step: (state: S, rng: Rng, tick: number) => S): void {
    this.state = step(this.state, this.rng, this.tick)
    this.tick += 1
  }
}

/**
 * 通用节拍器：每个节拍调一次 step(state, rng, tick) 得到新状态。step 要是纯的、只用传进来的 rng 取随机数，这样同一个种子同一串。
 * 状态放在 ref 里推进、再通知渲染，不放在 setState 的函数里：严格模式会把那种函数跑两遍，随机数就多取了一份。
 */
export function useLiveTicker<S>(
  initial: S | (() => S),
  step: (state: S, rng: Rng, tick: number) => S,
  { intervalMs = 1500, enabled, seed }: LiveTickerOptions = {},
): LiveTicker<S> {
  const [global] = useLiveEnabled()
  const running = enabled ?? global
  // 可变的模拟状态放在一个只建一次的 Sim 对象里（useState 的惰性初值），推进时改它再通知渲染。
  const [sim] = useState(
    () => new Sim(typeof initial === 'function' ? (initial as () => S)() : initial, seed ?? liveSeed()),
  )
  const [view, setView] = useState({ state: sim.state, tick: 0 })
  const stepRef = useRef(step)
  useEffect(() => {
    stepRef.current = step
  })
  const advance = useCallback(() => {
    sim.advance(stepRef.current)
    setView({ state: sim.state, tick: sim.tick })
  }, [sim])
  useEffect(() => {
    steppers.add(advance)
    return () => {
      steppers.delete(advance)
    }
  }, [advance])
  useEffect(() => {
    if (!running) return
    const timer = setInterval(advance, intervalMs)
    return () => clearInterval(timer)
  }, [running, intervalMs, advance])
  return { state: view.state, tick: view.tick, running, advance }
}
