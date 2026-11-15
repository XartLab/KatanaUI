// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import { filterNews, sortNews, type NewsItem } from './news-feed-model.ts'

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
