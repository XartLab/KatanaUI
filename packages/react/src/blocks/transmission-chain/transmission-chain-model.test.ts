// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import {
  evidenceCounts,
  fitView,
  layoutChain,
  statusTotals,
  validEdges,
  zoomAt,
  type ChainEdge,
  type ChainNode,
} from './transmission-chain-model.ts'

const nodes: ChainNode[] = ['a', 'b', 'c'].map((id) => ({ id, label: id }))
const edge = (id: string, from: string, to: string, extra: Partial<ChainEdge> = {}): ChainEdge => ({
  id,
  from,
  to,
  status: 'untested',
  ...extra,
})

describe('传导链模型', () => {
  it('丢掉悬空边、自环、重复 id', () => {
    const kept = validEdges(nodes, [edge('1', 'a', 'b'), edge('2', 'a', 'x'), edge('3', 'b', 'b'), edge('1', 'b', 'c')])
    expect(kept.map((e) => e.id)).toEqual(['1'])
  })

  it('证据计数从证据行数出来', () => {
    const e = edge('1', 'a', 'b', {
      evidence: [
        { id: 'x', text: '', stance: 'support' },
        { id: 'y', text: '', stance: 'support' },
        { id: 'z', text: '', stance: 'against' },
      ],
    })
    expect(evidenceCounts(e)).toEqual({ support: 2, against: 1, neutral: 0 })
    expect(statusTotals([e, edge('2', 'b', 'c', { status: 'partial' })]).partial).toBe(1)
  })

  it('有环也能布局：反馈边不让布局崩，所有节点都有位置，每条边有折点', () => {
    const laid = layoutChain(
      nodes,
      [edge('1', 'a', 'b'), edge('2', 'b', 'c'), edge('3', 'c', 'a', { feedback: true })],
      {
        direction: 'LR',
        labelWidth: () => 80,
      },
    )
    expect(laid.nodes).toHaveLength(3)
    expect(laid.edges).toHaveLength(3)
    expect(laid.edges.every((e) => e.points.length >= 2)).toBe(true)
    const x = (id: string) => laid.nodes.find((n) => n.id === id)!.x
    expect(x('a')).toBeLessThan(x('b'))
    expect(x('b')).toBeLessThan(x('c'))
  })

  it('以指针为中心缩放：指针下的图坐标不动；缩放有上下限', () => {
    const view = { x: 10, y: 20, k: 1 }
    const next = zoomAt(view, { x: 100, y: 80 }, 2)
    expect((100 - next.x) / next.k).toBeCloseTo((100 - view.x) / view.k)
    expect(zoomAt(view, { x: 0, y: 0 }, 1000).k).toBe(3)
  })

  it('适应视图把整张图放进视口并居中，小图不放大', () => {
    const fit = fitView({ width: 800, height: 400 }, { width: 1600, height: 400 })
    expect(fit.k).toBeLessThan(0.5)
    expect(fitView({ width: 800, height: 400 }, { width: 100, height: 100 }).k).toBe(1)
  })
})
