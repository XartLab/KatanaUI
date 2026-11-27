// SPDX-License-Identifier: MIT
import type { SeverityExt } from '../../lib/severity.ts'

/** 传导层：框架里「谁创造资金 → 谁先取得购买力 → 通道 → 用途 → 收入与利润 → 收益权 → 定价」落在哪一环。 */
export type HypothesisLayer =
  | 'strategy'
  | 'credit'
  | 'fiscal'
  | 'crossborder'
  | 'industry'
  | 'profit'
  | 'allocation'
  | 'haven'

export const HYPOTHESIS_LAYERS: readonly HypothesisLayer[] = [
  'strategy',
  'credit',
  'fiscal',
  'crossborder',
  'industry',
  'profit',
  'allocation',
  'haven',
]

/** pending 待验证；supported 有支持；refuted 被否定；expired 过了检验期限还没结论（由 effectiveStatus 自动算，不靠调用方去改）。 */
export type HypothesisStatus = 'pending' | 'supported' | 'refuted' | 'expired'

const STATUS_SEVERITY: Record<HypothesisStatus, SeverityExt> = {
  pending: 'accent',
  supported: 'ok',
  refuted: 'danger',
  expired: 'warn',
}

/** 假设状态的语气：待验证是点亮的强调色，支持绿，证伪红，过期琥珀（灯用 ledOf 取）。 */
export const hypothesisSeverity = (status: HypothesisStatus): SeverityExt => STATUS_SEVERITY[status]

export const HYPOTHESIS_STATUSES: readonly HypothesisStatus[] = ['pending', 'supported', 'refuted', 'expired']

/** 证据类型：把学者观点、已发生的政策与资金变化、数据、财报分开，不混成一团。 */
export type EvidenceKind = 'scholar' | 'policy' | 'data' | 'filing'

export type HypothesisEvidence = {
  id: string
  kind: EvidenceKind
  /** 来源名与链接：点得回出处。 */
  source: string
  href: string
  /** 发布时间（毫秒）。 */
  publishedAt: number
  /** 一句话说这条证据讲了什么。 */
  summary: string
  stance: 'support' | 'oppose'
}

export type HypothesisAsset = { label: string; tag?: string }

export type Hypothesis = {
  id: string
  /** 命题：一句话，写成能被证伪的样子。 */
  claim: string
  layer: HypothesisLayer
  status: HypothesisStatus
  /** 提前写好的失败条件：出现什么就认为命题不成立。 */
  failure: string
  /** 检验期限（毫秒）：到期倒计时；过了还是待验证的自动标「过期」。 */
  deadline: number
  evidence: readonly HypothesisEvidence[]
  /** 关联品种或资产。 */
  assets?: readonly HypothesisAsset[]
}

/** 观察表的一行：传导层 × 核心证据 × 最容易混淆的地方。 */
export type WatchRow = { layer: HypothesisLayer; evidence: string; confusion: string }

/** 待验证的假说过了期限就按「过期」算；已有结论的不受影响。 */
export function effectiveStatus(h: Hypothesis, now: number): HypothesisStatus {
  return h.status === 'pending' && h.deadline <= now ? 'expired' : h.status
}

/** 距检验期限的整天数（向上取整）；已到期是 0。 */
export function daysLeft(h: Hypothesis, now: number): number {
  return Math.max(0, Math.ceil((h.deadline - now) / 86_400_000))
}

export function countEvidence(h: Hypothesis): { support: number; oppose: number } {
  let support = 0
  for (const e of h.evidence) if (e.stance === 'support') support += 1
  return { support, oppose: h.evidence.length - support }
}

export type LedgerFilter = { layers: readonly HypothesisLayer[]; status: HypothesisStatus | 'all' }

/** 按层（空数组是全部层）与状态筛；待验证里快到期的在前，其余按期限新的在前，同期限按 id 定序。 */
export function visibleHypotheses(items: readonly Hypothesis[], filter: LedgerFilter, now: number): Hypothesis[] {
  const rows = items.filter(
    (h) =>
      (filter.layers.length === 0 || filter.layers.includes(h.layer)) &&
      (filter.status === 'all' || effectiveStatus(h, now) === filter.status),
  )
  const key = (h: Hypothesis) => (effectiveStatus(h, now) === 'pending' ? h.deadline : Infinity)
  return rows.sort((a, b) => key(a) - key(b) || b.deadline - a.deadline || (a.id < b.id ? -1 : 1))
}

/** 各状态条数（受层筛选影响，不受状态筛选影响）。 */
export function countByStatus(
  items: readonly Hypothesis[],
  layers: readonly HypothesisLayer[],
  now: number,
): Record<HypothesisStatus | 'all', number> {
  const count = { all: 0, pending: 0, supported: 0, refuted: 0, expired: 0 }
  for (const h of items) {
    if (layers.length > 0 && !layers.includes(h.layer)) continue
    count.all += 1
    count[effectiveStatus(h, now)] += 1
  }
  return count
}

/** 各层条数（受状态筛选影响，不受层筛选影响）。 */
export function countByLayer(
  items: readonly Hypothesis[],
  status: HypothesisStatus | 'all',
  now: number,
): Record<HypothesisLayer, number> {
  const count = Object.fromEntries(HYPOTHESIS_LAYERS.map((l) => [l, 0])) as Record<HypothesisLayer, number>
  for (const h of items) if (status === 'all' || effectiveStatus(h, now) === status) count[h.layer] += 1
  return count
}
