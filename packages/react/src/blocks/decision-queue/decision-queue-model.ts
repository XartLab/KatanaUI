// SPDX-License-Identifier: MIT
import type { SeverityExt } from '../../lib/severity.ts'

/** pending 待处理；snoozed 稍后（仍算待处理，卡上带标记）；accepted / rejected 已处理；expired 过了有效期没人处理。 */
export type DecisionStatus = 'pending' | 'snoozed' | 'accepted' | 'rejected' | 'expired'

const STATUS_SEVERITY: Record<DecisionStatus, SeverityExt> = {
  pending: 'accent',
  snoozed: 'warn',
  accepted: 'ok',
  rejected: 'danger',
  expired: 'off',
}

/** 决定状态的语气：待决是点亮的强调色，搁置琥珀，接受绿，拒绝红，过期不亮（灯用 ledOf 取）。 */
export const decisionSeverity = (status: DecisionStatus): SeverityExt => STATUS_SEVERITY[status]

/** 队列上的筛选页：待处理页含「稍后」的。 */
export type DecisionFilter = 'pending' | 'accepted' | 'rejected' | 'expired'

export const DECISION_FILTERS: readonly DecisionFilter[] = ['pending', 'accepted', 'rejected', 'expired']

export type DecisionSource = { label: string; href: string }

export type DecisionItem = {
  id: string
  /** 建议动作的字（买入 / 调仓 / 停策略 / 调参数），调用方按界面语言写。 */
  action: string
  /** 对象：品种或策略的名字。 */
  target: string
  /** 对象旁的小标（如品种代码、「策略」），可省。 */
  targetTag?: string
  /** 理由摘要。 */
  rationale: string
  /** 置信，0 到 1；没有就不画。 */
  confidence?: number
  /** 依据的一句话（如「回测 2023-2026，夏普 1.4」）。 */
  basis?: string
  /** 来源链接：点得回出处。 */
  sources: readonly DecisionSource[]
  /** 生成时间、有效期截止（毫秒）；没有 expiresAt 就不过期。 */
  createdAt: number
  expiresAt?: number
  status: DecisionStatus
  /** 已处理（接受、拒绝）时：谁、何时。过期的没有。 */
  resolvedBy?: string
  resolvedAt?: number
}

/** 过了有效期的待处理项按「已过期」算：不靠调用方记得去改状态；已处理的不受影响。 */
export function effectiveStatus(item: DecisionItem, now: number): DecisionStatus {
  const open = item.status === 'pending' || item.status === 'snoozed'
  return open && item.expiresAt !== undefined && item.expiresAt <= now ? 'expired' : item.status
}

export function filterOf(status: DecisionStatus): DecisionFilter {
  return status === 'snoozed' ? 'pending' : status
}

/** 各页的条数（含过期折算）。 */
export function countByFilter(items: readonly DecisionItem[], now: number): Record<DecisionFilter, number> {
  const count: Record<DecisionFilter, number> = { pending: 0, accepted: 0, rejected: 0, expired: 0 }
  for (const item of items) count[filterOf(effectiveStatus(item, now))] += 1
  return count
}

/** 某页的条目：待处理页里快过期的在前（该先看），其余页新处理的在前，同时间按 id 定序。 */
export function visibleDecisions(items: readonly DecisionItem[], filter: DecisionFilter, now: number): DecisionItem[] {
  const rows = items.filter((item) => filterOf(effectiveStatus(item, now)) === filter)
  const key = (item: DecisionItem) =>
    filter === 'pending' ? (item.expiresAt ?? Infinity) : -(item.resolvedAt ?? item.createdAt)
  return rows.sort((a, b) => key(a) - key(b) || (a.id < b.id ? -1 : 1))
}

/** 剩余秒数；没有有效期是 null，已过期是 0。 */
export function secondsLeft(item: DecisionItem, now: number): number | null {
  return item.expiresAt === undefined ? null : Math.max(0, Math.floor((item.expiresAt - now) / 1000))
}
