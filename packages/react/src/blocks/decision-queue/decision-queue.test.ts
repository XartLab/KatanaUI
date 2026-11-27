// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest'
import {
  decisionSeverity,
  countByFilter,
  effectiveStatus,
  secondsLeft,
  visibleDecisions,
  type DecisionItem,
} from './decision-queue-model.ts'

const base = { action: 'a', target: 't', rationale: 'r', sources: [], createdAt: 0 }
const items: DecisionItem[] = [
  { ...base, id: 'a', status: 'pending', expiresAt: 5000 },
  { ...base, id: 'b', status: 'snoozed', expiresAt: 2000 },
  { ...base, id: 'c', status: 'pending', expiresAt: 500 },
  { ...base, id: 'd', status: 'accepted', expiresAt: 100, resolvedAt: 300 },
  { ...base, id: 'e', status: 'rejected', resolvedAt: 200 },
  { ...base, id: 'f', status: 'pending' },
]

describe('decision queue model', () => {
  it('过了有效期的待处理按已过期算，已处理的不变', () => {
    expect(effectiveStatus(items[2]!, 1000)).toBe('expired')
    expect(effectiveStatus(items[3]!, 1000)).toBe('accepted')
    expect(effectiveStatus(items[5]!, 1e12)).toBe('pending')
  })
  it('各页计数含过期折算，稍后算待处理', () => {
    expect(countByFilter(items, 1000)).toEqual({ pending: 3, accepted: 1, rejected: 1, expired: 1 })
  })
  it('待处理页快过期的在前', () => {
    expect(visibleDecisions(items, 'pending', 1000).map((i) => i.id)).toEqual(['b', 'a', 'f'])
  })
  it('剩余秒数', () => {
    expect(secondsLeft(items[0]!, 2000)).toBe(3)
    expect(secondsLeft(items[2]!, 2000)).toBe(0)
    expect(secondsLeft(items[5]!, 2000)).toBeNull()
  })
})

describe('decisionSeverity', () => {
  it('状态到语气只在模型里定一次，灯由 ledOf 取（G6）', async () => {
    const { ledOf } = await import('../../lib/severity.ts')
    expect(
      ['pending', 'snoozed', 'accepted', 'rejected', 'expired'].map((s) => ledOf(decisionSeverity(s as never))),
    ).toEqual(['on', 'warn', 'ok', 'danger', 'off'])
  })
})
