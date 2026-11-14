// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vite-plus/test'
import { buildNodes, expandedToDepth, findMatches, splitHits, summary } from './json-viewer-model'

const sample = {
  symbol: 'BTCUSDT',
  orders: [
    { price: 101.5, side: 'buy' },
    { price: 99, side: 'sell' },
  ],
  ok: true,
  none: null,
}

describe('buildNodes', () => {
  it('类型与概要：对象 {n}、数组 [n]，叶子带引号的字符串', () => {
    const root = buildNodes(sample)
    expect(root.kind).toBe('object')
    expect(summary(root)).toBe('{4}')
    const [symbol, orders, ok, none] = root.children
    expect(symbol).toMatchObject({ key: 'symbol', kind: 'string', text: '"BTCUSDT"' })
    expect(orders).toMatchObject({ kind: 'array', size: 2 })
    expect(summary(orders!)).toBe('[2]')
    expect(ok).toMatchObject({ kind: 'boolean', text: 'true' })
    expect(none).toMatchObject({ kind: 'null', text: 'null' })
  })
  it('id 是路径，重建不变；键名里的 / 被转义', () => {
    expect(buildNodes(sample).children[1]!.children[0]!.children[0]!.id).toBe('$/orders/0/price')
    expect(buildNodes(sample).children[1]!.children[0]!.children[0]!.id).toBe(
      buildNodes(sample).children[1]!.children[0]!.children[0]!.id,
    )
    expect(buildNodes({ 'a/b': 1 }).children[0]!.id).toBe('$/a%2Fb')
  })
  it('子项超过上限：多出的折成一行 more，数量对', () => {
    const root = buildNodes(
      Array.from({ length: 7 }, (_, i) => i),
      3,
    )
    expect(root.size).toBe(7)
    expect(root.children).toHaveLength(4)
    expect(root.children[3]).toMatchObject({ kind: 'more', hidden: 4 })
  })
  it('非 JSON 的值不抛错；循环引用画成 [Circular]；根可以是叶子', () => {
    const loop: Record<string, unknown> = { a: 1 }
    loop.self = loop
    expect(buildNodes(loop).children[1]).toMatchObject({ kind: 'string', text: '[Circular]' })
    expect(buildNodes(undefined)).toMatchObject({ kind: 'null', text: 'undefined' })
    expect(buildNodes(10n)).toMatchObject({ kind: 'number', text: '10n' })
    expect(buildNodes(new Date('2026-11-14T00:00:00Z')).text).toBe('"2026-11-14T00:00:00.000Z"')
    expect(buildNodes(42)).toMatchObject({ kind: 'number', text: '42', children: [] })
  })
})

describe('expandedToDepth', () => {
  it('1 只开根，2 连根的子容器一起开，空容器不算', () => {
    const root = buildNodes(sample)
    expect([...expandedToDepth(root, 1)]).toEqual(['$'])
    expect([...expandedToDepth(root, 2)].sort()).toEqual(['$', '$/orders'])
    expect(expandedToDepth(root, 0).size).toBe(0)
    expect(expandedToDepth(buildNodes({ a: {} }), 3).has('$/a')).toBe(false)
  })
})

describe('findMatches', () => {
  it('键名与叶子的字都能命中，不分大小写；祖先都要展开', () => {
    const root = buildNodes(sample)
    const byKey = findMatches(root, 'PRICE')
    expect([...byKey.hits].sort()).toEqual(['$/orders/0/price', '$/orders/1/price'])
    expect([...byKey.ancestors].sort()).toEqual(['$', '$/orders', '$/orders/0', '$/orders/1'])
    const byValue = findMatches(root, 'sell')
    expect([...byValue.hits]).toEqual(['$/orders/1/side'])
  })
  it('空查询不命中；容器的字不参与（只看键名）', () => {
    expect(findMatches(buildNodes(sample), '  ').hits.size).toBe(0)
    expect(findMatches(buildNodes(sample), 'zzz').hits.size).toBe(0)
  })
})

describe('splitHits', () => {
  it('按命中切片，保留原字大小写', () => {
    expect(splitHits('BTCUSDT', 'usd')).toEqual([
      ['BTC', false],
      ['USD', true],
      ['T', false],
    ])
    expect(splitHits('abab', 'ab')).toEqual([
      ['ab', true],
      ['ab', true],
    ])
    expect(splitHits('abc', '')).toEqual([['abc', false]])
  })
})
