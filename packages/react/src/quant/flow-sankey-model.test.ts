// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import { layoutFlow, linkEnds, moveNode, neighborhood, type FlowLink, type FlowNode } from './flow-sankey-model.ts'

// 虚构的小例子：不对应任何真实机构。
const NODES: FlowNode[] = [
  { id: 'a', label: 'A', column: 0 },
  { id: 'b', label: 'B', column: 0 },
  { id: 'm', label: 'M', column: 1 },
  { id: 'x', label: 'X', column: 2 },
  { id: 'y', label: 'Y', column: 2 },
]
const LINKS: FlowLink[] = [
  { source: 'a', target: 'm', value: 60 },
  { source: 'b', target: 'm', value: 40 },
  { source: 'm', target: 'x', value: 70 },
  { source: 'm', target: 'y', value: 30 },
  { source: 'a', target: 'y', value: 20, kind: 'revaluation' },
]
const BOX = { width: 600, height: 300 }

describe('layoutFlow', () => {
  it('占比只算交易流量，重估不并进总量与占比', () => {
    const laid = layoutFlow(NODES, LINKS, BOX)
    if (!laid.ok) throw new Error('应当排得出来')
    expect(laid.total).toBe(100)
    const am = laid.links.find((l) => l.source === 'a' && l.target === 'm')!
    expect(am.shareOfSource).toBe(1)
    expect(am.shareOfTotal).toBeCloseTo(0.6)
    const reval = laid.links.find((l) => l.kind === 'revaluation')!
    expect(reval.shareOfSource).toBeNull()
    expect(reval.shareOfTotal).toBeNull()
    const a = laid.nodes.find((n) => n.id === 'a')!
    expect(a.flowOut).toBe(60)
    expect(a.revalOut).toBe(20)
    expect(laid.nodes.find((n) => n.id === 'y')!.share).toBeCloseTo(0.3)
  })
  it('关掉重估后它整条不进排布', () => {
    const laid = layoutFlow(NODES, LINKS, { ...BOX, showRevaluation: false })
    if (!laid.ok) throw new Error('应当排得出来')
    expect(laid.links.some((l) => l.kind === 'revaluation')).toBe(false)
    expect(laid.links).toHaveLength(4)
  })
  it('列由 column 定，带宽与值成正比，路径非空', () => {
    const laid = layoutFlow(NODES, LINKS, { ...BOX, showRevaluation: false })
    if (!laid.ok) throw new Error('应当排得出来')
    expect(laid.nodes.map((n) => n.layer)).toEqual([0, 0, 1, 2, 2])
    const w = (id: string) => laid.links.find((l) => l.target === id && l.source === 'm')!.width
    expect(w('x') / w('y')).toBeCloseTo(70 / 30)
    expect(laid.links.every((l) => l.d.startsWith('M'))).toBe(true)
  })
  it('丢掉值不是正数与指向不存在节点的链路并计数；没有可画的返回 empty', () => {
    const laid = layoutFlow(
      NODES,
      [
        ...LINKS,
        { source: 'a', target: 'zz', value: 5 },
        { source: 'a', target: 'm', value: 0 },
        { source: 'a', target: 'x', value: -1 },
      ],
      BOX,
    )
    if (!laid.ok) throw new Error('应当排得出来')
    expect(laid.dropped).toBe(3)
    expect(layoutFlow(NODES, [], BOX)).toEqual({ ok: false, reason: 'empty' })
  })
  it('有环返回 cycle，不抛', () => {
    const laid = layoutFlow(
      [
        { id: 'p', label: 'P' },
        { id: 'q', label: 'Q' },
      ],
      [
        { source: 'p', target: 'q', value: 1 },
        { source: 'q', target: 'p', value: 1 },
      ],
      BOX,
    )
    expect(laid).toEqual({ ok: false, reason: 'cycle' })
  })
})

describe('neighborhood / linkEnds / moveNode', () => {
  const laid = layoutFlow(NODES, LINKS, BOX)
  if (!laid.ok) throw new Error('应当排得出来')
  it('点中间节点亮上游与下游，点来源只亮它往下的', () => {
    const mid = neighborhood(laid.links, 'm')
    expect([...mid.nodes].sort()).toEqual(['a', 'b', 'm', 'x', 'y'])
    const a = neighborhood(laid.links, 'a')
    expect(a.nodes.has('b')).toBe(false)
    expect(a.nodes.has('x')).toBe(true)
  })
  it('悬停链路只亮它与两端', () => {
    const ends = linkEnds(laid.links[0]!)
    expect(ends.nodes.size).toBe(2)
    expect(ends.links.size).toBe(1)
  })
  it('键盘：上下在同一列走，左右去连着的节点，边上走不动是 null', () => {
    const down = moveNode(laid.nodes, laid.links, 'a', 'ArrowDown')
    expect(down).toBe('b')
    expect(moveNode(laid.nodes, laid.links, 'a', 'ArrowUp')).toBeNull()
    expect(moveNode(laid.nodes, laid.links, 'a', 'ArrowRight')).toBe('m')
    expect(moveNode(laid.nodes, laid.links, 'm', 'ArrowLeft')).not.toBeNull()
    expect(moveNode(laid.nodes, laid.links, 'x', 'ArrowRight')).toBeNull()
    expect(moveNode(laid.nodes, laid.links, 'a', 'Home')).toBe('a')
    expect(['x', 'y']).toContain(moveNode(laid.nodes, laid.links, 'a', 'End'))
    expect(moveNode(laid.nodes, laid.links, 'a', 'q')).toBeNull()
  })
})
