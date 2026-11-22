// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import {
  hypothesisSeverity,
  countByLayer,
  countByStatus,
  countEvidence,
  daysLeft,
  effectiveStatus,
  visibleHypotheses,
  type Hypothesis,
} from './hypothesis-ledger-model.ts'

const NOW = Date.UTC(2026, 10, 15)
const DAY = 86_400_000
const h = (id: string, over: Partial<Hypothesis> = {}): Hypothesis => ({
  id,
  claim: id,
  layer: 'strategy',
  status: 'pending',
  failure: 'f',
  deadline: NOW + 10 * DAY,
  evidence: [],
  ...over,
})

describe('hypothesis-ledger-model', () => {
  it('待验证过了期限自动算过期，已有结论的不变', () => {
    expect(effectiveStatus(h('a', { deadline: NOW - 1 }), NOW)).toBe('expired')
    expect(effectiveStatus(h('a', { deadline: NOW }), NOW)).toBe('expired')
    expect(effectiveStatus(h('a', { deadline: NOW - 1, status: 'supported' }), NOW)).toBe('supported')
    expect(effectiveStatus(h('a'), NOW)).toBe('pending')
  })
  it('倒计时整天向上取整，到期是 0', () => {
    expect(daysLeft(h('a', { deadline: NOW + 1 }), NOW)).toBe(1)
    expect(daysLeft(h('a', { deadline: NOW + 3 * DAY }), NOW)).toBe(3)
    expect(daysLeft(h('a', { deadline: NOW - DAY }), NOW)).toBe(0)
  })
  it('证据支持与反对分别计数', () => {
    const e = (id: string, stance: 'support' | 'oppose') => ({
      id,
      kind: 'data' as const,
      source: 's',
      href: 'x',
      publishedAt: NOW,
      summary: '',
      stance,
    })
    expect(countEvidence(h('a', { evidence: [e('1', 'support'), e('2', 'oppose'), e('3', 'oppose')] }))).toEqual({
      support: 1,
      oppose: 2,
    })
  })
  const items = [
    h('p-late', { deadline: NOW + 20 * DAY }),
    h('p-soon', { deadline: NOW + 2 * DAY, layer: 'credit' }),
    h('s', { status: 'supported', layer: 'credit' }),
    h('x', { deadline: NOW - DAY }),
  ]
  it('筛选：层与状态叠加，待验证快到期的在前', () => {
    expect(visibleHypotheses(items, { layers: [], status: 'pending' }, NOW).map((i) => i.id)).toEqual([
      'p-soon',
      'p-late',
    ])
    expect(visibleHypotheses(items, { layers: ['credit'], status: 'all' }, NOW).map((i) => i.id)).toEqual([
      'p-soon',
      's',
    ])
    expect(visibleHypotheses(items, { layers: [], status: 'expired' }, NOW).map((i) => i.id)).toEqual(['x'])
  })
  it('各状态与各层的计数互不串', () => {
    expect(countByStatus(items, ['credit'], NOW)).toMatchObject({ all: 2, pending: 1, supported: 1, expired: 0 })
    expect(countByLayer(items, 'pending', NOW)).toMatchObject({ strategy: 1, credit: 1, fiscal: 0 })
  })
})

describe('hypothesisSeverity', () => {
  it('待验证点亮强调色、支持绿、证伪红、过期琥珀（灯由 ledOf 取，G6）', async () => {
    const { ledOf } = await import('../../lib/severity.ts')
    expect(['pending', 'supported', 'refuted', 'expired'].map((s) => ledOf(hypothesisSeverity(s as never)))).toEqual([
      'on',
      'ok',
      'danger',
      'warn',
    ])
  })
})
