// SPDX-License-Identifier: MIT
import { act, createElement, useEffect, useState, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  LinkGroupProvider,
  createLinkHub,
  useLinkGroup,
  type LinkGroupState,
  type LinkHub,
} from '../lib/link-group.tsx'
import type { LinkGroup } from './led.tsx'
import { LinkGroupPicker, joinLinkGroup } from './link-group-picker.tsx'

// #150：联动组选择件。结构（按钮名、灯色）用 react-dom/server 测；进组、离组走 #22 的联动表（useLinkGroup + joinLinkGroup）。
// 点开菜单、选组在组件截图测试（browser/link-group.browser.test.tsx）与功能地图（verify-katanaui 的 link-group 流程）里用真浏览器走。
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

describe('LinkGroupPicker', () => {
  const labels = { trigger: 'Link group', none: 'Unlinked', groups: { A: 'Group A' } }

  it('按钮名是「读屏名: 当前组」，灯是那一组的颜色；没给名字的组写字母', () => {
    const html = renderToStaticMarkup(<LinkGroupPicker value="A" onValueChange={() => {}} labels={labels} />)
    expect(html).toContain('aria-label="Link group: Group A"')
    expect(html).toContain('data-group="A"')
    expect(html).toContain('k-led link-a')
    expect(html).toContain('aria-haspopup="menu"')
    const other = renderToStaticMarkup(<LinkGroupPicker value="B" onValueChange={() => {}} labels={labels} />)
    expect(other).toContain('aria-label="Link group: B"')
  })

  it('不联动：名字是 none 的字，灯是一圈空环', () => {
    const html = renderToStaticMarkup(<LinkGroupPicker value={null} onValueChange={() => {}} labels={labels} />)
    expect(html).toContain('aria-label="Link group: Unlinked"')
    expect(html).toContain('data-group="none"')
    expect(html).toMatch(/class="k-led bare"/)
  })
})

type Slot = {
  state: LinkGroupState
  set: (patch: Partial<LinkGroupState>) => void
  group: LinkGroup | null
  setGroup: (group: LinkGroup | null) => void
}

/** 几件挂在同一张联动表上，各自记自己在哪一组（同文档站：组由调用方存）；单测在 node 里跑，容器是空壳。 */
function mount(hub: LinkHub, panels: { group: LinkGroup | null; initial: LinkGroupState }[]) {
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
  const slots = panels.map(() => ({ current: null as Slot | null }))
  const Panel = ({ index }: { index: number }): ReactNode => {
    const [group, setGroup] = useState(panels[index]!.group)
    const [state, set] = useLinkGroup(group, { initial: panels[index]!.initial })
    useEffect(() => {
      slots[index]!.current = { state, set, group, setGroup }
    }, [index, state, set, group, setGroup])
    return null
  }
  act(() =>
    root.render(
      createElement(
        LinkGroupProvider,
        { hub },
        panels.map((_, index) => createElement(Panel, { key: index, index })),
      ),
    ),
  )
  const out = slots.map((slot) => ({
    get state() {
      return slot.current!.state
    },
    get group() {
      return slot.current!.group
    },
    set: (patch: Partial<LinkGroupState>) => act(() => slot.current!.set(patch)),
    /** 照 LinkGroupPicker 选了一组：进组先 joinLinkGroup，再由调用方存组；不联动只存组。 */
    pick: (group: LinkGroup | null) =>
      act(() => {
        if (group !== null) joinLinkGroup(hub, group, slot.current!.state)
        slot.current!.setGroup(group)
      }),
  }))
  return { out, unmount: () => act(() => root.unmount()) }
}

describe('LinkGroupPicker 与联动表', () => {
  // React 读 window.event 定更新优先级；node 里没有 window，放一个空壳（同 lib/link-group.test.tsx）。
  beforeEach(() => {
    vi.stubGlobal('window', { event: undefined, document: { activeElement: null }, HTMLIFrameElement: class {} })
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('选进一个有值的组：件改看组的品种，之后同组谁换品种都跟着换', () => {
    const hub = createLinkHub({ A: { symbol: 'NVDA' } })
    const { out, unmount } = mount(hub, [
      { group: 'A', initial: { symbol: 'AAA' } },
      { group: null, initial: { symbol: 'QQQ' } },
    ])
    expect(out[1]!.state.symbol).toBe('QQQ')
    out[1]!.pick('A')
    expect(out[1]!.group).toBe('A')
    expect(out[1]!.state.symbol).toBe('NVDA')
    expect(hub.get('A').symbol).toBe('NVDA')
    out[0]!.set({ symbol: 'TSLA' })
    expect(out[1]!.state.symbol).toBe('TSLA')
    out[1]!.set({ symbol: 'AMD' })
    expect(out[0]!.state.symbol).toBe('AMD')
    unmount()
  })

  it('选进一个空组：组取件现在的品种与周期，件不跳回 initial；十字线不交', () => {
    const hub = createLinkHub()
    const { out, unmount } = mount(hub, [
      { group: 'A', initial: { symbol: 'AAA', interval: '5' } },
      { group: 'A', initial: { symbol: 'AAA', interval: '5' } },
    ])
    out[0]!.set({ symbol: 'NVDA', crosshairTime: 1000 })
    out[1]!.pick('B')
    expect(out[1]!.state.symbol).toBe('NVDA')
    expect(hub.get('B')).toEqual({ symbol: 'NVDA', interval: '5' })
    // 换到 B 以后，A 里换品种它不跟。
    out[0]!.set({ symbol: 'QQQ' })
    expect(out[1]!.state.symbol).toBe('NVDA')
    unmount()
  })

  it('离组（不联动）：组里再换品种它不跟，它自己换也不动组', () => {
    const hub = createLinkHub()
    const { out, unmount } = mount(hub, [
      { group: 'A', initial: { symbol: 'AAA' } },
      { group: 'A', initial: { symbol: 'AAA' } },
    ])
    out[0]!.set({ symbol: 'NVDA' })
    expect(out[1]!.state.symbol).toBe('NVDA')
    out[1]!.pick(null)
    expect(out[1]!.group).toBeNull()
    // 离组后件回到自己记的状态（#22 的 useLinkGroup：不联动时是件自己的，起头是 initial）。
    out[0]!.set({ symbol: 'TSLA' })
    expect(out[1]!.state.symbol).toBe('AAA')
    out[1]!.set({ symbol: 'XAUUSD' })
    expect(out[1]!.state.symbol).toBe('XAUUSD')
    expect(hub.get('A').symbol).toBe('TSLA')
    expect(out[0]!.state.symbol).toBe('TSLA')
    unmount()
  })
})
