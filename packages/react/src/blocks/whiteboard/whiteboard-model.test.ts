// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import {
  copySelection,
  getDownstream,
  layoutWhiteboard,
  parentsFirst,
  pasteClip,
  pushHistory,
  redoHistory,
  removeItems,
  snapToGuides,
  undoHistory,
  type WhiteboardDoc,
} from './whiteboard-model.ts'

const note = (id: string, x = 0, y = 0, parentId?: string) => ({
  id,
  type: 'note' as const,
  position: { x, y },
  data: { text: id },
  ...(parentId ? { parentId } : {}),
})

const DOC: WhiteboardDoc = {
  nodes: [note('a'), note('b'), note('c'), note('d')],
  edges: [
    { id: 'ab', source: 'a', target: 'b' },
    { id: 'bc', source: 'b', target: 'c' },
    { id: 'ca', source: 'c', target: 'a', feedback: true },
  ],
}

describe('getDownstream', () => {
  it('沿边往下走，反馈边默认不走', () => {
    const down = getDownstream(DOC.edges, 'a')
    expect([...down.nodes]).toEqual(['b', 'c'])
    expect([...down.edges]).toEqual(['ab', 'bc'])
    expect(getDownstream(DOC.edges, 'd').nodes.size).toBe(0)
  })
  it('带上反馈边时环不会走死，起点不算下游', () => {
    const down = getDownstream(DOC.edges, 'a', { includeFeedback: true })
    expect([...down.nodes]).toEqual(['b', 'c'])
    expect(down.edges.has('ca')).toBe(true)
  })
})

describe('layoutWhiteboard', () => {
  it('TB 一层一层往下排，LR 往右排；分组框与组内节点不动', () => {
    const doc: WhiteboardDoc = {
      nodes: [
        { id: 'g', type: 'group', position: { x: 500, y: 500 }, width: 300, height: 200, data: { title: 'g' } },
        note('inside', 10, 10, 'g'),
        ...DOC.nodes,
      ],
      edges: DOC.edges,
    }
    const tb = layoutWhiteboard(doc, 'TB')
    const at = (d: WhiteboardDoc, id: string) => d.nodes.find((n) => n.id === id)!.position
    expect(at(tb, 'a').y).toBeLessThan(at(tb, 'b').y)
    expect(at(tb, 'b').y).toBeLessThan(at(tb, 'c').y)
    expect(at(tb, 'g')).toEqual({ x: 500, y: 500 })
    expect(at(tb, 'inside')).toEqual({ x: 10, y: 10 })
    const lr = layoutWhiteboard(doc, 'LR')
    expect(at(lr, 'a').x).toBeLessThan(at(lr, 'b').x)
    expect(tb.layout).toBe('TB')
    expect(lr.layout).toBe('LR')
  })
})

describe('snapToGuides', () => {
  it('差 6px 以内贴上并给辅助线，远了不动', () => {
    const other = { x: 100, y: 100, width: 100, height: 50 }
    expect(snapToGuides({ x: 104, y: 300, width: 80, height: 40 }, [other])).toEqual({ x: 100, y: 300, guideX: 100 })
    expect(snapToGuides({ x: 400, y: 400, width: 80, height: 40 }, [other])).toEqual({ x: 400, y: 400 })
  })
})

describe('复制粘贴与删除', () => {
  it('复制选中的节点与两端都在里面的边，粘贴换新 id 并错开', () => {
    const clip = copySelection(DOC, new Set(['a', 'b']))
    expect(clip.edges.map((e) => e.id)).toEqual(['ab'])
    const r = pasteClip(DOC, clip, { x: 32, y: 32 }, (id) => `${id}2`)
    expect(r.ids).toEqual(['a2', 'b2'])
    expect(r.doc.nodes.find((n) => n.id === 'a2')!.position).toEqual({ x: 32, y: 32 })
    expect(r.doc.edges.at(-1)).toEqual({ id: 'ab2', source: 'a2', target: 'b2' })
  })
  it('删节点连带挨着的边与组内节点', () => {
    const doc: WhiteboardDoc = { ...DOC, nodes: [...DOC.nodes, note('kid', 0, 0, 'b')] }
    const next = removeItems(doc, new Set(['b']), new Set())
    expect(next.nodes.map((n) => n.id)).toEqual(['a', 'c', 'd'])
    expect(next.edges.map((e) => e.id)).toEqual(['ca'])
  })
  it('分组框排在组内节点前', () => {
    expect(parentsFirst([note('kid', 0, 0, 'g'), note('g')]).map((n) => n.id)).toEqual(['g', 'kid'])
  })
})

describe('撤销重做', () => {
  it('记一步、撤销、重做', () => {
    const next: WhiteboardDoc = { ...DOC, nodes: DOC.nodes.slice(1) }
    const h = pushHistory({ past: [], future: [] }, DOC)
    const u = undoHistory(h, next)!
    expect(u.doc).toBe(DOC)
    const r = redoHistory(u.history, u.doc)!
    expect(r.doc).toBe(next)
    expect(undoHistory({ past: [], future: [] }, DOC)).toBeNull()
  })
})
