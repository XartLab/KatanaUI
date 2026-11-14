// SPDX-License-Identifier: MIT
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vite-plus/test'
import { hitNode, layoutGalaxy, stepNode, type GalaxyNode } from './galaxy-model'
import { SymbolGalaxy } from './symbol-galaxy'

const frame = { width: 800, height: 520, pad: 8, headroom: 20 }
const sectors = ['金融', '科技', '消费']
const nodes: GalaxyNode[] = Array.from({ length: 30 }, (_, i) => ({
  id: `n${i}`,
  label: `示例 ${i}`,
  size: 1 + ((i * 7) % 11),
  change: ((i % 7) - 3) / 100,
  groups: { sector: sectors[i % 3]!, market: i % 2 ? '主板' : '创业板' },
}))

describe('layoutGalaxy', () => {
  const layout = layoutGalaxy(nodes, 'sector', frame)
  it('同样的数据永远排出同样的位置，与输入顺序无关', () => {
    expect(layoutGalaxy(nodes, 'sector', frame)).toEqual(layout)
    expect(layoutGalaxy([...nodes].reverse(), 'sector', frame)).toEqual(layout)
  })
  it('团名的框不碰任何别的团的圈，也不出画面', () => {
    for (const mode of ['sector', 'market']) {
      const { groups } = layoutGalaxy(nodes, mode, frame)
      for (const group of groups) {
        const b = group.label
        expect(b.x0 >= 0 && b.y0 >= 0 && b.x1 <= frame.width && b.y1 <= frame.height, group.key).toBe(true)
        for (const other of groups) {
          if (other === group) continue
          const d = Math.hypot(
            Math.min(Math.max(other.x, b.x0), b.x1) - other.x,
            Math.min(Math.max(other.y, b.y0), b.y1) - other.y,
          )
          expect(d, `${group.key} 压着 ${other.key}`).toBeGreaterThanOrEqual(other.r)
        }
      }
    }
  })
  it('每个点都在自己那一团的圈里，团都在画面里，点与点不重叠', () => {
    const groups = new Map(layout.groups.map((group) => [group.key, group]))
    expect(layout.places.size).toBe(30)
    for (const [id, place] of layout.places) {
      const group = groups.get(place.group)!
      expect(Math.hypot(place.x - group.x, place.y - group.y) + place.r, id).toBeLessThanOrEqual(group.r + 1e-6)
    }
    for (const group of layout.groups) {
      expect(group.x - group.r).toBeGreaterThanOrEqual(-1e-6)
      expect(group.x + group.r).toBeLessThanOrEqual(800 + 1e-6)
      expect(group.y + group.r).toBeLessThanOrEqual(520 + 1e-6)
    }
    const all = [...layout.places.values()]
    for (let i = 0; i < all.length; i++)
      for (let j = i + 1; j < all.length; j++)
        expect(Math.hypot(all[i]!.x - all[j]!.x, all[i]!.y - all[j]!.y)).toBeGreaterThanOrEqual(
          all[i]!.r + all[j]!.r - 1e-6,
        )
  })
  it('面积跟大小成正比（半径平方之比等于大小之比），同一团里最大的排在前', () => {
    const big = layout.places.get('n1')! // size 8
    const small = layout.places.get('n7')! // size 6（同在 科技 那一团：1 与 7 都是 i % 3 === 1）
    expect((big.r * big.r) / (small.r * small.r)).toBeCloseTo(8 / 6, 6)
  })
  it('换分组方式团就变了，大小不是正的有限数的点不画', () => {
    expect(
      layoutGalaxy(nodes, 'market', frame)
        .groups.map((group) => group.key)
        .sort(),
    ).toEqual(['主板', '创业板'])
    const dirty = [
      ...nodes,
      { ...nodes[0]!, id: 'zero', size: 0 },
      { ...nodes[0]!, id: 'nan', size: NaN },
      { ...nodes[0]!, id: 'neg', size: -3 },
    ]
    expect(layoutGalaxy(dirty, 'sector', frame).places.size).toBe(30)
    expect(layoutGalaxy([], 'sector', frame).groups).toEqual([])
  })
})

describe('hitNode 与 stepNode', () => {
  const layout = layoutGalaxy(nodes, 'sector', frame)
  const [id, place] = [...layout.places][0]!
  it('点在圆心上命中那个点，点在空处是 null', () => {
    expect(hitNode(layout.places, place.x, place.y)).toBe(id)
    expect(hitNode(layout.places, -50, -50)).toBeNull()
  })
  it('方向键只往那一侧走：往右走到右边的点，那一侧没有点就留在原地，不是方向键 null', () => {
    const ids = [...layout.places].filter(([, p]) => p.group === place.group).map(([key]) => key)
    const rightmost = [...ids].sort((a, b) => layout.places.get(b)!.x - layout.places.get(a)!.x)[0]!
    expect(stepNode(layout.places, ids, rightmost, 'ArrowRight')).toBe(rightmost)
    const leftmost = [...ids].sort((a, b) => layout.places.get(a)!.x - layout.places.get(b)!.x)[0]!
    const next = stepNode(layout.places, ids, leftmost, 'ArrowRight')!
    expect(next).not.toBe(leftmost)
    expect(layout.places.get(next)!.x).toBeGreaterThan(layout.places.get(leftmost)!.x)
    expect(stepNode(layout.places, ids, leftmost, 'a')).toBeNull()
  })
})

describe('SymbolGalaxy', () => {
  const props = {
    nodes,
    groupings: [
      { id: 'sector', label: '行业' },
      { id: 'market', label: '市场' },
    ],
    label: '示例星系',
    groupingLabel: '分组方式',
    describe: (node: GalaxyNode) => `${node.label}：${node.size}`,
    groupText: (group: string, count: number) => `${group}，${count} 只`,
    legendText: (step: number) => String(step),
  }
  it('点不多画 SVG：每个点一个圆，每团一个 Tab 停靠点带整句名，分组开关标出当前', () => {
    const html = renderToStaticMarkup(<SymbolGalaxy {...props} />)
    expect(html).toContain('data-render="svg"')
    expect(html.match(/k-galaxy-node/g)).toHaveLength(30)
    expect(html.match(/tabindex="0"/g)).toHaveLength(3)
    expect(html).toContain('aria-label="金融，10 只"')
    expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(1)
    expect(html).toContain('行业')
    expect(html).not.toContain('<canvas')
  })
  it('点数达到 canvasFrom 改画 canvas，团与标记仍是 SVG', () => {
    const html = renderToStaticMarkup(<SymbolGalaxy {...props} canvasFrom={30} />)
    expect(html).toContain('data-render="canvas"')
    expect(html).toContain('<canvas')
    expect(html).not.toContain('k-galaxy-node')
    expect(html.match(/tabindex="0"/g)).toHaveLength(3)
  })
  it('受控的分组方式：groupBy 说了算', () => {
    const html = renderToStaticMarkup(<SymbolGalaxy {...props} groupBy="market" />)
    expect(html).toContain('aria-label="主板，15 只"')
    expect(html.match(/tabindex="0"/g)).toHaveLength(2)
  })
})
