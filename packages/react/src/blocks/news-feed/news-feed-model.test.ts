// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import { buildEntries, filterNews, sortNews, type NewsItem } from './news-feed-model.ts'

const items: NewsItem[] = [
  { id: 'a', time: 1, channel: 'flash', source: 's1', title: 'Alpha rises', symbols: [{ code: 'AAA', name: '甲' }] },
  { id: 'b', time: 3, channel: 'top', source: 's2', title: 'Beta falls', summary: 'about alpha' },
  { id: 'c', time: 3, channel: 'top', source: 's1', title: 'Gamma' },
]

describe('news feed model', () => {
  it('按频道、来源、关键词筛', () => {
    const f = { channel: '', sources: [], query: '' }
    expect(filterNews(items, f)).toHaveLength(3)
    expect(filterNews(items, { ...f, channel: 'top' }).map((i) => i.id)).toEqual(['b', 'c'])
    expect(filterNews(items, { ...f, sources: ['s1'] }).map((i) => i.id)).toEqual(['a', 'c'])
    expect(filterNews(items, { ...f, query: 'ALPHA' }).map((i) => i.id)).toEqual(['a', 'b'])
    expect(filterNews(items, { ...f, query: '甲' }).map((i) => i.id)).toEqual(['a'])
    expect(filterNews(items, { ...f, query: 'alpha falls' }).map((i) => i.id)).toEqual(['b'])
  })
  it('新的在前，同刻按 id', () => {
    expect(sortNews(items).map((i) => i.id)).toEqual(['b', 'c', 'a'])
  })
})

describe('filterNews 分面', () => {
  const base = { channel: 'c', source: 's', time: 0, title: 't' }
  const items = [
    { ...base, id: '1', facets: { market: ['stocks'], country: ['cn'] } },
    { ...base, id: '2', facets: { market: ['crypto'], country: ['cn'] } },
    { ...base, id: '3' },
  ]
  const f = (facets: Record<string, string[]>) =>
    filterNews(items, { channel: '', sources: [], query: '', facets }).map((i) => i.id)
  it('取值之间或、分面之间且、空数组不筛', () => {
    expect(f({ market: ['stocks', 'crypto'] })).toEqual(['1', '2'])
    expect(f({ market: ['stocks'], country: ['cn'] })).toEqual(['1'])
    expect(f({ market: [] })).toEqual(['1', '2', '3'])
  })
})

describe('buildEntries 分组小标题', () => {
  const base = { channel: 'c', source: 's', time: 0, title: 't' }
  const rows: NewsItem[] = ['a', 'b', 'c', 'd'].map((id, i) => ({ ...base, id, time: 10 - i }))
  const group = (item: NewsItem) => ({ key: item.id < 'c' ? 'x' : 'y', label: item.id < 'c' ? 'X' : 'Y', count: 2 })

  it('不分组就只有条目，index 是它在 items 里的位置', () => {
    const entries = buildEntries(rows)
    expect(entries.map((e) => e.kind)).toEqual(['item', 'item', 'item', 'item'])
    expect(entries.map((e) => (e.kind === 'item' ? e.index : -1))).toEqual([0, 1, 2, 3])
  })
  it('连续同组键的一段前面出一个小标题，条目的 index 不算小标题', () => {
    const entries = buildEntries(rows, group)
    expect(entries.map((e) => e.id)).toEqual(['g:x', 'i:a', 'i:b', 'g:y', 'i:c', 'i:d'])
    expect(entries.filter((e) => e.kind === 'item').map((e) => (e.kind === 'item' ? e.index : -1))).toEqual([
      0, 1, 2, 3,
    ])
  })
  it('组键隔开又回来：再出一个小标题，id 不重复（组序由调用方排好，不替他合并）', () => {
    const entries = buildEntries(rows, (item) => ({ key: item.id === 'b' || item.id === 'c' ? 'y' : 'x', label: 'L' }))
    expect(entries.filter((e) => e.kind === 'group').map((e) => e.id)).toEqual(['g:x', 'g:y', 'g:x#2'])
    expect(new Set(entries.map((e) => e.id)).size).toBe(entries.length)
  })
})
