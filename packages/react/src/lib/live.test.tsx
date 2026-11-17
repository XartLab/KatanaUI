// SPDX-License-Identifier: MIT
import { act, createElement, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import tokens from '../tokens-json.ts'
import {
  LIVE_ENTER_MS,
  LIVE_FLASH_GAP_MS,
  LIVE_FLASH_MS,
  LIVE_REORDER_MS,
  useEnterMarks,
  useFlipList,
  useStatusFlash,
  useValueFlash,
} from './live.ts'

// 单测在 node 里跑，没有 DOM：hook 挂在一个什么都不画的组件上（返回 null，React 不碰 DOM），用 act 推渲染与 effect，用假时钟推时间。
// useFlipList 要量位置，传一个假的容器（getBoundingClientRect / querySelectorAll / animate 都是替身）。
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

function mount<P, R>(hook: (props: P) => R, first: P) {
  const container = {
    nodeType: 1,
    nodeName: 'DIV',
    tagName: 'DIV',
    namespaceURI: 'http://www.w3.org/1999/xhtml',
    addEventListener() {},
    removeEventListener() {},
    ownerDocument: { nodeType: 9, addEventListener() {}, removeEventListener() {} },
  } as unknown as Element
  const root: Root = createRoot(container)
  const out: { current: R } = { current: undefined as R }
  const Probe = ({ props }: { props: P }): ReactNode => {
    out.current = hook(props)
    return null
  }
  const render = (props: P) => act(() => root.render(createElement(Probe, { props })))
  render(first)
  return { out, render, unmount: () => act(() => root.unmount()) }
}

beforeEach(() => {
  // React 读 window.event 定更新优先级；node 里没有 window，放一个空壳。
  vi.stubGlobal('window', { event: undefined, document: { activeElement: null }, HTMLIFrameElement: class {} })
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2026-11-17T09:30:00Z'))
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('时长常量与 token 一致', () => {
  it('JS 里的毫秒数等于 tokens.json 的 motion 组', () => {
    const ms = (name: string) =>
      parseFloat(
        (tokens as { motion: { tokens: { name: string; value: string }[] } }).motion.tokens.find(
          (t) => t.name === name,
        )!.value,
      )
    expect(LIVE_FLASH_MS).toBe(ms('dur-flash'))
    expect(LIVE_ENTER_MS).toBe(ms('dur-enter'))
    expect(LIVE_REORDER_MS).toBe(ms('dur-reorder'))
    expect(LIVE_FLASH_GAP_MS).toBe(1000)
  })
})

describe('useValueFlash', () => {
  it('首次渲染不闪', () => {
    const view = mount(useValueFlash, 10)
    expect(view.out.current).toEqual({ flash: null, key: 0 })
  })

  it('变大 up、变小 down，key 递增', () => {
    const view = mount(useValueFlash, 10)
    view.render(11)
    expect(view.out.current).toEqual({ flash: 'up', key: 1 })
    vi.advanceTimersByTime(LIVE_FLASH_GAP_MS)
    view.render(9)
    expect(view.out.current).toEqual({ flash: 'down', key: 2 })
  })

  it('闪完（LIVE_FLASH_MS 后）flash 回到 null，key 不动', () => {
    const view = mount(useValueFlash, 10)
    view.render(11)
    act(() => void vi.advanceTimersByTime(LIVE_FLASH_MS))
    expect(view.out.current).toEqual({ flash: null, key: 1 })
  })

  it('同一实例 1 秒内最多闪一次：窗口里的变化直接换值、不闪，窗口过后再变又闪', () => {
    const view = mount(useValueFlash, 10)
    view.render(11)
    vi.advanceTimersByTime(400)
    view.render(12)
    expect(view.out.current.key).toBe(1)
    vi.advanceTimersByTime(LIVE_FLASH_GAP_MS - 400)
    view.render(11) // 跟被节流掉的 12 比，变小
    expect(view.out.current).toEqual({ flash: 'down', key: 2 })
  })

  it('null、NaN 不闪；之后第一个有效值当作首次，也不闪', () => {
    const view = mount(useValueFlash, 10 as number | null)
    vi.advanceTimersByTime(LIVE_FLASH_GAP_MS)
    view.render(null)
    expect(view.out.current.key).toBe(0)
    view.render(Number.NaN)
    expect(view.out.current.key).toBe(0)
    view.render(12)
    expect(view.out.current).toEqual({ flash: null, key: 0 })
    vi.advanceTimersByTime(LIVE_FLASH_GAP_MS)
    view.render(13)
    expect(view.out.current).toEqual({ flash: 'up', key: 1 })
  })

  it('值没变不闪；enabled 为 false 时跟踪值但不闪', () => {
    const view = mount((p: { v: number; on: boolean }) => useValueFlash(p.v, { enabled: p.on }), { v: 5, on: true })
    view.render({ v: 5, on: true })
    expect(view.out.current.key).toBe(0)
    view.render({ v: 6, on: false })
    expect(view.out.current.key).toBe(0)
    vi.advanceTimersByTime(LIVE_FLASH_GAP_MS)
    view.render({ v: 7, on: true })
    expect(view.out.current).toEqual({ flash: 'up', key: 1 })
  })
})

describe('useEnterMarks', () => {
  it('首次渲染全部算旧的', () => {
    const view = mount(useEnterMarks, ['a', 'b'])
    expect([...view.out.current]).toEqual([])
  })

  it('新出现的 id 被标出，1200ms 后清掉；只在顺序上动的不算新', () => {
    const view = mount(useEnterMarks, ['a', 'b'])
    view.render(['c', 'a', 'b'])
    expect([...view.out.current]).toEqual(['c'])
    view.render(['b', 'c', 'a'])
    expect([...view.out.current]).toEqual(['c'])
    act(() => void vi.advanceTimersByTime(LIVE_ENTER_MS - 1))
    expect([...view.out.current]).toEqual(['c'])
    act(() => void vi.advanceTimersByTime(1))
    expect([...view.out.current]).toEqual([])
  })

  it('各批各自计时：后来的一批不会让前一批多留，也不会吃掉它的清除', () => {
    const view = mount(useEnterMarks, ['a'])
    view.render(['b', 'a'])
    act(() => void vi.advanceTimersByTime(700))
    view.render(['c', 'b', 'a'])
    expect([...view.out.current].sort()).toEqual(['b', 'c'])
    act(() => void vi.advanceTimersByTime(LIVE_ENTER_MS - 700))
    expect([...view.out.current]).toEqual(['c'])
    act(() => void vi.advanceTimersByTime(700))
    expect([...view.out.current]).toEqual([])
  })

  it('卸载后不再有 timer 挂着', () => {
    const view = mount(useEnterMarks, ['a'])
    view.render(['b', 'a'])
    view.unmount()
    expect(vi.getTimerCount()).toBe(0)
  })
})

describe('useStatusFlash', () => {
  it('首次不闪，状态变了闪一次，LIVE_ENTER_MS 后落回（警示要闪两下共 1200ms）；null 不算状态', () => {
    const view = mount(useStatusFlash, '涨停' as string | null)
    expect(view.out.current).toEqual({ flash: false, key: 0 })
    view.render('炸板')
    expect(view.out.current).toEqual({ flash: true, key: 1 })
    act(() => void vi.advanceTimersByTime(LIVE_FLASH_MS))
    expect(view.out.current).toEqual({ flash: true, key: 1 })
    act(() => void vi.advanceTimersByTime(LIVE_ENTER_MS - LIVE_FLASH_MS))
    expect(view.out.current).toEqual({ flash: false, key: 1 })
    view.render(null)
    expect(view.out.current.key).toBe(1)
    view.render('涨停')
    expect(view.out.current).toEqual({ flash: false, key: 1 })
  })

  it('同一个状态再来不闪；连着变两次 key 加两次', () => {
    const view = mount(useStatusFlash, 'a')
    view.render('a')
    expect(view.out.current.key).toBe(0)
    view.render('b')
    view.render('c')
    expect(view.out.current.key).toBe(2)
  })
})

describe('useFlipList', () => {
  // 假容器：行按当前顺序从上往下排，每行 20 高；animate 记下参数。
  function fakeList() {
    let order: string[] = []
    const calls: { id: string; keyframes: Keyframe[]; duration: number; easing: string }[] = []
    const rows = new Map<string, HTMLElement>()
    const rowOf = (id: string) => {
      let row = rows.get(id)
      if (!row) {
        row = {
          dataset: { liveId: id },
          getBoundingClientRect: () => ({ left: 0, top: order.indexOf(id) * 20, width: 100, height: 20 }) as DOMRect,
          animate: (keyframes: Keyframe[], options: { duration: number; easing: string }) => {
            calls.push({ id, keyframes, duration: options.duration, easing: options.easing })
            return { cancel() {}, addEventListener() {} } as unknown as Animation
          },
        } as unknown as HTMLElement
        rows.set(id, row)
      }
      return row
    }
    const container = {
      scrollLeft: 0,
      scrollTop: 0,
      getBoundingClientRect: () => ({ left: 0, top: 0 }) as DOMRect,
      querySelectorAll: () => order.map(rowOf),
    } as unknown as HTMLElement
    return {
      ref: { current: container },
      calls,
      setOrder: (next: string[]) => {
        order = next
      },
    }
  }

  beforeEach(() => {
    vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => ' linear(0, 1) ' }))
  })

  it('首次渲染不播；顺序变了，挪了位置的行从旧位置播到新位置，240ms，缓动取 --ease-snappy', () => {
    const list = fakeList()
    list.setOrder(['a', 'b', 'c'])
    const view = mount((p: { ids: string[] }) => useFlipList(list.ref, p.ids), { ids: ['a', 'b', 'c'] })
    expect(list.calls).toEqual([])
    list.setOrder(['c', 'a', 'b'])
    view.render({ ids: ['c', 'a', 'b'] })
    const byId = Object.fromEntries(list.calls.map((c) => [c.id, c]))
    expect(Object.keys(byId).sort()).toEqual(['a', 'b', 'c'])
    // c 从第 3 行（40）到第 1 行（0）：起点往下偏 40；a、b 各往上偏 20。
    expect(byId.c!.keyframes[0]).toEqual({ transform: 'translate(0px, 40px)' })
    expect(byId.a!.keyframes[0]).toEqual({ transform: 'translate(0px, -20px)' })
    expect(byId.b!.keyframes[0]).toEqual({ transform: 'translate(0px, -20px)' })
    expect(byId.c!.keyframes[1]).toEqual({ transform: 'translate(0, 0)' })
    expect(byId.c!.duration).toBe(LIVE_REORDER_MS)
    expect(byId.c!.easing).toBe('linear(0, 1)')
  })

  it('顺序没变不播；没挪的行不播；新来的行没有旧位置，跳过', () => {
    const list = fakeList()
    list.setOrder(['a', 'b'])
    const view = mount((p: { ids: string[] }) => useFlipList(list.ref, p.ids), { ids: ['a', 'b'] })
    view.render({ ids: ['a', 'b'] })
    expect(list.calls).toEqual([])
    list.setOrder(['a', 'b', 'n'])
    view.render({ ids: ['a', 'b', 'n'] })
    expect(list.calls).toEqual([])
  })

  it('没渲染的行（不在 DOM 里）跳过，不报错', () => {
    const list = fakeList()
    list.setOrder(['a', 'b', 'c'])
    const view = mount((p: { ids: string[] }) => useFlipList(list.ref, p.ids), { ids: ['a', 'b', 'c', 'z'] })
    list.setOrder(['b', 'a', 'c'])
    view.render({ ids: ['z', 'b', 'a', 'c'] })
    expect(list.calls.map((c) => c.id).sort()).toEqual(['a', 'b'])
  })
})
