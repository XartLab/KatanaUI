// SPDX-License-Identifier: MIT
import { describe, expect, test } from 'vite-plus/test'
import { catalogFromManifests, validateManifests, type ComponentManifest } from './component-manifest.ts'
import { emptyLinkState, joinLinkGroup, linkFollowers, linkValues, setLinkParam } from './link-groups.ts'

const categories = [
  { id: 'market', name: 'Market' },
  { id: 'orders', name: 'Orders' },
]
const manifests: ComponentManifest[] = [
  {
    id: 'chart',
    name: 'Chart',
    category: 'market',
    kind: 'chart',
    emits: ['symbol', 'interval', 'time'],
    consumes: ['symbol', 'interval', 'time'],
  },
  {
    id: 'book',
    name: 'Order book',
    category: 'market',
    kind: 'table',
    pairsWith: ['chart'],
    needs: ['l2'],
    consumes: ['symbol'],
  },
  { id: 'funding', name: 'Funding', category: 'market', kind: 'gauge', markets: ['crypto-perp'], consumes: ['symbol'] },
  {
    id: 'company',
    name: 'Company',
    category: 'market',
    kind: 'text',
    markets: ['us-stock', 'cn-stock'],
    consumes: ['symbol'],
  },
  { id: 'positions', name: 'Positions', category: 'orders', kind: 'table', needs: ['account'], emits: ['symbol'] },
]
const reasons = {
  market: (m: ComponentManifest, market: string) => `${m.name} has no ${market}`,
  needs: (_: ComponentManifest, capability: string) => `Needs ${capability}`,
}

describe('catalogFromManifests', () => {
  test('greys out by market and by missing capability, ticks what is in use', () => {
    const items = catalogFromManifests(
      manifests,
      { market: 'crypto-perp', capabilities: ['l2'], inUse: ['chart'] },
      reasons,
    )
    const by = Object.fromEntries(items.map((item) => [item.id, item]))
    expect(by.chart).toMatchObject({ inUse: true, unavailable: undefined })
    expect(by.book).toMatchObject({ inUse: false, unavailable: undefined, pairsWith: ['chart'] })
    expect(by.funding!.unavailable).toBeUndefined()
    expect(by.company!.unavailable).toBe('Company has no crypto-perp')
    expect(by.positions!.unavailable).toBe('Needs account')
  })

  test('with no market given nothing is ruled out by market', () => {
    const items = catalogFromManifests(manifests, { capabilities: ['l2', 'account'] }, reasons)
    expect(items.filter((item) => item.unavailable)).toEqual([])
  })
})

describe('validateManifests', () => {
  test('a clean set has no issues', () => {
    expect(validateManifests(manifests, categories)).toEqual([])
  })
  test('reports duplicate ids, unknown categories, empty names and bad sizes', () => {
    const bad: ComponentManifest[] = [
      ...manifests,
      { id: 'chart', name: ' ', category: 'nope', kind: 'chart', minSize: { width: 0, height: 100 } },
    ]
    expect(validateManifests(bad, categories).map((issue) => issue.problem)).toEqual([
      'duplicate-id',
      'unknown-category',
      'empty-name',
      'bad-min-size',
    ])
  })
})

describe('link groups', () => {
  const panels = { p1: manifests[0]!, p2: manifests[1]!, p3: manifests[2]!, p4: manifests[4]! }

  test('unlinked panels keep their own values', () => {
    let state = setLinkParam(emptyLinkState, 'p1', 'symbol', 'BTC')
    state = setLinkParam(state, 'p2', 'symbol', 'ETH')
    expect(linkValues(state, 'p1')).toEqual({ symbol: 'BTC' })
    expect(linkValues(state, 'p2')).toEqual({ symbol: 'ETH' })
    expect(linkFollowers(state, 'p1', 'symbol', panels)).toEqual([])
  })

  test('the first panel into an empty group seeds it; later ones follow the group', () => {
    let state = setLinkParam(emptyLinkState, 'p1', 'symbol', 'BTC')
    state = setLinkParam(state, 'p2', 'symbol', 'ETH')
    state = joinLinkGroup(state, 'p1', 'red')
    state = joinLinkGroup(state, 'p2', 'red')
    expect(linkValues(state, 'p2')).toEqual({ symbol: 'BTC' })
  })

  test('a change in the group reaches the members that consume that parameter, not the sender or outsiders', () => {
    let state = emptyLinkState
    for (const id of ['p1', 'p2', 'p4']) state = joinLinkGroup(state, id, 'red')
    state = joinLinkGroup(state, 'p3', 'blue')
    state = setLinkParam(state, 'p4', 'symbol', 'SOL')
    expect(linkValues(state, 'p1').symbol).toBe('SOL')
    expect(linkValues(state, 'p3').symbol).toBeUndefined()
    // p4（持仓）只发不收；p3 在另一个组。
    expect(linkFollowers(state, 'p4', 'symbol', panels)).toEqual(['p1', 'p2'])
    // 周期只有图表收：订单表不跟。
    expect(linkFollowers(state, 'p1', 'interval', panels)).toEqual([])
    expect(linkFollowers(state, 'p2', 'interval', panels)).toEqual(['p1'])
  })

  test('leaving a group keeps the values it had, so the panel does not jump', () => {
    let state = joinLinkGroup(emptyLinkState, 'p1', 'red')
    state = setLinkParam(state, 'p1', 'symbol', 'BTC')
    state = joinLinkGroup(state, 'p1', null)
    expect(linkValues(state, 'p1')).toEqual({ symbol: 'BTC' })
    state = setLinkParam(state, 'p1', 'symbol', 'ETH')
    expect(state.groups.red).toEqual({ symbol: 'BTC' })
  })
})
