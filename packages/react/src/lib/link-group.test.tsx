// SPDX-License-Identifier: MIT
import { act, createElement, useEffect, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import { LinkGroupProvider, createLinkHub, useLinkGroup, type LinkField, type LinkGroupState } from './link-group.tsx'

// 联动组（#22 G8）：同组共用品种、周期、十字线、区间；只订阅的字段变了才重画；null 不联动。
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('createLinkHub', () => {
  it('改了才通知，回调拿到改了哪些字段；值相同不通知', () => {
    const hub = createLinkHub()
    const seen: (readonly LinkField[])[] = []
    hub.subscribe('A', (changed) => seen.push(changed))
    hub.set('A', { symbol: 'BTCUSDT', interval: '5' })
    hub.set('A', { symbol: 'BTCUSDT' })
    hub.set('A', { range: { from: 1, to: 2 } })
    hub.set('A', { range: { from: 1, to: 2 } })
    expect(seen).toEqual([['symbol', 'interval'], ['range']])
    expect(hub.get('A')).toEqual({ symbol: 'BTCUSDT', interval: '5', range: { from: 1, to: 2 } })
    expect(hub.get('B')).toEqual({})
  })

  it('select：订阅的字段没变时是同一个对象，变了换新的', () => {
    const hub = createLinkHub({ A: { symbol: 'ETHUSDT' } })
    const first = hub.select('A', ['symbol'])
    hub.set('A', { crosshairTime: 10 })
    expect(hub.select('A', ['symbol'])).toBe(first)
    hub.set('A', { symbol: 'SOLUSDT' })
    expect(hub.select('A', ['symbol'])).toEqual({ symbol: 'SOLUSDT' })
    expect(hub.select('A', ['symbol'])).not.toBe(first)
  })
})

/** 在一个什么都不画的组件上挂几个钩子（单测在 node 里跑，没有 DOM）。 */
function mount(hub: ReturnType<typeof createLinkHub>, probes: { group: string | null; fields?: LinkField[] }[]) {
  const container = {
    nodeType: 1,
    nodeName: 'DIV',
    tagName: 'DIV',
    namespaceURI: 'http://www.w3.org/1999/xhtml',
    addEventListener() {},
    removeEventListener() {},
    ownerDocument: { nodeType: 9, addEventListener() {}, removeEventListener() {} },
  } as unknown as Element
  const root = createRoot(container)
  // 每个钩子的最新读数放在 { current } 里。
  const slots = probes.map(() => ({
    current: { state: {} as LinkGroupState, set: (() => {}) as (patch: Partial<LinkGroupState>) => void, renders: 0 },
  }))
  const Probe = ({ index }: { index: number }): ReactNode => {
    const { group, fields } = probes[index]!
    const [state, set] = useLinkGroup(group, { fields, initial: { interval: '1D' } })
    // 每次提交后记下读数与次数（effect 不带依赖：每次渲染提交都跑一次）。
    useEffect(() => {
      const slot = slots[index]!
      slot.current = { state, set, renders: slot.current.renders + 1 }
    })
    return null
  }
  act(() =>
    root.render(
      createElement(
        LinkGroupProvider,
        { hub },
        probes.map((_, index) => createElement(Probe, { key: index, index })),
      ),
    ),
  )
  const out = slots.map((slot) => ({
    get state() {
      return slot.current.state
    },
    get set() {
      return slot.current.set
    },
    get renders() {
      return slot.current.renders
    },
  }))
  return { out, unmount: () => act(() => root.unmount()) }
}

describe('useLinkGroup', () => {
  // React 读 window.event 定更新优先级；node 里没有 window，放一个空壳（同 live.test.tsx）。
  beforeEach(() => {
    vi.stubGlobal('window', { event: undefined, document: { activeElement: null }, HTMLIFrameElement: class {} })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })
  it('同组的两个件：一个改品种，另一个跟着换；没设过的字段取 initial', () => {
    const hub = createLinkHub()
    const { out, unmount } = mount(hub, [{ group: 'A' }, { group: 'A' }, { group: 'B' }])
    expect(out[1]!.state).toEqual({ interval: '1D' })
    act(() => out[0]!.set({ symbol: 'NVDA' }))
    expect(out[1]!.state.symbol).toBe('NVDA')
    expect(out[2]!.state.symbol).toBeUndefined()
    unmount()
  })

  it('只订阅品种的件，十字线变了不重画', () => {
    const hub = createLinkHub()
    const { out, unmount } = mount(hub, [{ group: 'A', fields: ['symbol'] }, { group: 'A' }])
    const before = out[0]!.renders
    act(() => out[1]!.set({ crosshairTime: 1000 }))
    act(() => out[1]!.set({ crosshairTime: 2000 }))
    expect(out[0]!.renders).toBe(before)
    expect(out[1]!.state.crosshairTime).toBe(2000)
    act(() => out[1]!.set({ symbol: 'QQQ' }))
    expect(out[0]!.renders).toBe(before + 1)
    expect(out[0]!.state.symbol).toBe('QQQ')
    unmount()
  })

  it('group 为 null 不联动：改的只是自己', () => {
    const hub = createLinkHub()
    const { out, unmount } = mount(hub, [{ group: null }, { group: 'A' }])
    act(() => out[0]!.set({ symbol: 'XAUUSD' }))
    expect(out[0]!.state).toEqual({ interval: '1D', symbol: 'XAUUSD' })
    expect(hub.get('A')).toEqual({})
    expect(out[1]!.state.symbol).toBeUndefined()
    unmount()
  })
})
