// SPDX-License-Identifier: MIT
import { act, createElement, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vite-plus/test'
import {
  LINK_GROUPS,
  LinkGroupProvider,
  linkGroupColor,
  useLinkGroup,
  type LinkGroup,
  type LinkGroupMember,
  type LinkGroupProviderProps,
  type LinkGroupValues,
  type UseLinkGroupOptions,
} from './link-group.tsx'

// #150 G8：联动组。单测在 node 里跑，没有 DOM：几件挂在什么都不画的组件上（返回 null），用 act 推渲染与 effect（同 live.test.tsx 的做法）。
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

type Out = { current: LinkGroupMember<string> }
type Spec = UseLinkGroupOptions<string>
type ProviderSpec = Omit<LinkGroupProviderProps<string>, 'children'> | null
// 同 live.test.tsx：钩子经一个变量调，探针组件只把读数交出来，不画东西。
const probe: (options: Spec) => LinkGroupMember<string> = useLinkGroup

/** 在一个 Provider（或没有 Provider）下挂几件；返回每件的读数与重新渲染的函数。 */
function mount(specs: readonly Spec[], provider: ProviderSpec = {}) {
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
  const outs: Out[] = specs.map(() => ({ current: undefined as unknown as LinkGroupMember<string> }))
  const Member = ({ index, options }: { index: number; options: Spec }): ReactNode => {
    outs[index]!.current = probe(options)
    return null
  }
  const render = (nextSpecs: readonly Spec[] = specs, nextProvider: ProviderSpec = provider) => {
    const members = nextSpecs.map((options, index) => createElement(Member, { key: index, index, options }))
    act(() => root.render(nextProvider ? createElement(LinkGroupProvider<string>, nextProvider, ...members) : members))
  }
  render()
  const values = () => outs.map((out) => out.current.value)
  return { outs, values, render, unmount: () => act(() => root.unmount()) }
}

beforeEach(() => {
  // React 读 window.event 定更新优先级；node 里没有 window，放一个空壳。
  vi.stubGlobal('window', { event: undefined, document: { activeElement: null }, HTMLIFrameElement: class {} })
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useLinkGroup', () => {
  it('同组里换值，组里其余件跟着换；别的组与不联动的件不动', () => {
    const view = mount(
      [
        { defaultValue: 'AAA', defaultGroup: 'A' },
        { defaultValue: 'BBB', defaultGroup: 'A' },
        { defaultValue: 'CCC', defaultGroup: 'B' },
        { defaultValue: 'DDD' },
      ],
      { defaultValue: { A: 'BTCUSDT', B: 'ETHUSDT' } },
    )
    expect(view.values()).toEqual(['BTCUSDT', 'BTCUSDT', 'ETHUSDT', 'DDD'])
    act(() => view.outs[1]!.current.setValue('SOLUSDT'))
    expect(view.values()).toEqual(['SOLUSDT', 'SOLUSDT', 'ETHUSDT', 'DDD'])
    act(() => view.outs[3]!.current.setValue('XRPUSDT'))
    expect(view.values()).toEqual(['SOLUSDT', 'SOLUSDT', 'ETHUSDT', 'XRPUSDT'])
    view.unmount()
  })

  it('进还没值的组：组取先进去那件的值（同一轮里两件同时进，以树里靠前的为准）', () => {
    const view = mount([
      { defaultValue: 'AAA', defaultGroup: 'C' },
      { defaultValue: 'BBB', defaultGroup: 'C' },
    ])
    expect(view.values()).toEqual(['AAA', 'AAA'])
    view.unmount()
  })

  it('进已有值的组：件改看组的值', () => {
    const view = mount([{ defaultValue: 'AAA', defaultGroup: 'A' }, { defaultValue: 'ZZZ' }], {
      defaultValue: { A: 'BTCUSDT' },
    })
    expect(view.values()).toEqual(['BTCUSDT', 'ZZZ'])
    act(() => view.outs[1]!.current.setGroup('A'))
    expect(view.outs[1]!.current.group).toBe('A')
    expect(view.values()).toEqual(['BTCUSDT', 'BTCUSDT'])
    view.unmount()
  })

  it('离开组：件留着最后显示的值，之后组再换也不跟', () => {
    const view = mount(
      [
        { defaultValue: 'AAA', defaultGroup: 'A' },
        { defaultValue: 'BBB', defaultGroup: 'A' },
      ],
      { defaultValue: { A: 'BTCUSDT' } },
    )
    act(() => view.outs[1]!.current.setGroup(null))
    expect(view.values()).toEqual(['BTCUSDT', 'BTCUSDT'])
    act(() => view.outs[0]!.current.setValue('ETHUSDT'))
    expect(view.values()).toEqual(['ETHUSDT', 'BTCUSDT'])
    expect(view.outs[1]!.current.color).toBeUndefined()
    view.unmount()
  })

  it('从一组换到还没值的组：新组取这件正在显示的值', () => {
    const changes: LinkGroupValues<string>[] = []
    const view = mount([{ defaultValue: 'AAA', defaultGroup: 'A' }], {
      defaultValue: { A: 'BTCUSDT' },
      onValueChange: (next) => changes.push(next),
    })
    act(() => view.outs[0]!.current.setGroup('D'))
    expect(view.values()).toEqual(['BTCUSDT'])
    expect(changes.at(-1)).toEqual({ A: 'BTCUSDT', D: 'BTCUSDT' })
    view.unmount()
  })

  it('受控的 Provider：值由调用方给，onValueChange 报整张表', () => {
    const changes: LinkGroupValues<string>[] = []
    const specs: Spec[] = [
      { defaultValue: 'AAA', group: 'A' },
      { defaultValue: 'BBB', group: 'A' },
    ]
    const view = mount(specs, { value: { A: 'BTCUSDT' }, onValueChange: (next) => changes.push(next) })
    act(() => view.outs[0]!.current.setValue('ETHUSDT'))
    expect(changes).toEqual([{ A: 'ETHUSDT' }])
    // 调用方没接住：仍显示它给的值。
    expect(view.values()).toEqual(['BTCUSDT', 'BTCUSDT'])
    view.render(specs, { value: { A: 'ETHUSDT' }, onValueChange: (next) => changes.push(next) })
    expect(view.values()).toEqual(['ETHUSDT', 'ETHUSDT'])
    view.unmount()
  })

  it('受控的组：setGroup 只报给 onGroupChange，组由调用方改', () => {
    const asked: (LinkGroup | null)[] = []
    const view = mount([{ defaultValue: 'AAA', group: 'A', onGroupChange: (group) => asked.push(group) }])
    act(() => view.outs[0]!.current.setGroup('B'))
    expect(asked).toEqual(['B'])
    expect(view.outs[0]!.current.group).toBe('A')
    view.unmount()
  })

  it('没有 Provider：每件只管自己，组只是记着', () => {
    const view = mount(
      [
        { defaultValue: 'AAA', defaultGroup: 'A' },
        { defaultValue: 'BBB', defaultGroup: 'A' },
      ],
      null,
    )
    act(() => view.outs[0]!.current.setValue('ZZZ'))
    expect(view.values()).toEqual(['ZZZ', 'BBB'])
    expect(view.outs[0]!.current.color).toBe('var(--link-a)')
    view.unmount()
  })

  it('组色是 token link-a…d，四组按 A–D', () => {
    expect(LINK_GROUPS).toEqual(['A', 'B', 'C', 'D'])
    expect(LINK_GROUPS.map(linkGroupColor)).toEqual([
      'var(--link-a)',
      'var(--link-b)',
      'var(--link-c)',
      'var(--link-d)',
    ])
  })
})
