// SPDX-License-Identifier: MIT
import { describe, expect, test } from 'vite-plus/test'
import { groupCatalog, type CatalogItem } from './component-catalog-model.ts'

const categories = [
  { id: 'market', name: 'Market' },
  { id: 'orders', name: 'Orders' },
]
const items: CatalogItem[] = [
  { id: 'chart', name: 'Chart', category: 'market', recommended: true },
  { id: 'company', name: 'Company', category: 'market', unavailable: 'No data' },
  { id: 'book', name: 'Order book', category: 'market', keywords: ['depth', '订单表'] },
  { id: 'positions', name: 'Positions', category: 'orders', recommended: true },
  { id: 'news', name: 'News', category: 'market', recommended: true, unavailable: 'No data' },
]
const ids = (groups: ReturnType<typeof groupCatalog>) => groups.map((g) => [g.id, g.items.map((i) => i.id)])

describe('groupCatalog', () => {
  test('recommended first, then categories in order, unavailable last, nothing listed twice', () => {
    expect(ids(groupCatalog(items, categories, { recommendedName: 'For this symbol' }))).toEqual([
      ['recommended', ['chart', 'positions']],
      ['market', ['book', 'company', 'news']],
    ])
  })

  test('without a recommended heading everything stays under its category', () => {
    expect(ids(groupCatalog(items, categories))).toEqual([
      ['market', ['chart', 'book', 'company', 'news']],
      ['orders', ['positions']],
    ])
  })

  test('a chosen category shows only that category and no recommended group', () => {
    expect(ids(groupCatalog(items, categories, { category: 'orders', recommendedName: 'x' }))).toEqual([
      ['orders', ['positions']],
    ])
  })

  test('search matches the name and keywords, ignoring case; empty groups are dropped', () => {
    expect(ids(groupCatalog(items, categories, { query: 'DEPTH' }))).toEqual([['market', ['book']]])
    expect(ids(groupCatalog(items, categories, { query: '订单' }))).toEqual([['market', ['book']]])
    expect(groupCatalog(items, categories, { query: 'zzz' })).toEqual([])
  })
})
