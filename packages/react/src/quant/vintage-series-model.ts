// SPDX-License-Identifier: MIT
// VintageSeries 的纯逻辑：宏观序列按发布时间（point-in-time）整理，每个统计期有一串发布值（首次发布、之后每次修订），
// 「当时已知值」只用当时已经发布的，「最新修订值」是现在看到的。把后来修订的数当成当时已知，回测与判断都会偷看未来（look-ahead）。
// 约定：period 是统计期（毫秒时间戳，UTC，如当月月末）；release.at 是这个值发布的时刻；同一期的发布值按 at 从早到晚。

export type VintageRelease = {
  /** 发布时刻（毫秒时间戳，UTC）。 */
  at: number
  value: number
  /** 这次发布的说明（例「第二次修订」「基准年修订」）。 */
  note?: string
}

export type VintageObservation = {
  /** 统计期（毫秒时间戳，UTC）。 */
  period: number
  releases: readonly VintageRelease[]
}

export type VintageStep = VintageRelease & {
  /** 相对上一次发布的变化；首次发布是 null。 */
  delta: number | null
}

export type VintageRow = {
  period: number
  /** 发布值，按发布时刻从早到晚（同一时刻保留给的先后）。 */
  steps: VintageStep[]
  first: VintageRelease
  latest: VintageRelease
  /** 最新 − 首次；只有一次发布是 null（没修订过，不写成 0）。 */
  revision: number | null
}

const finite = (value: number) => typeof value === 'number' && Number.isFinite(value)

/** 整理：丢掉非有限数，发布值按时刻排，没有发布值的统计期不要，统计期从旧到新。同一统计期给了两次会合并。 */
export function normalizeVintages(observations: readonly VintageObservation[]): VintageRow[] {
  const merged = new Map<number, VintageRelease[]>()
  for (const observation of observations) {
    if (!finite(observation.period)) continue
    const list = merged.get(observation.period) ?? []
    for (const release of observation.releases) if (finite(release.at) && finite(release.value)) list.push(release)
    merged.set(observation.period, list)
  }
  const rows: VintageRow[] = []
  for (const [period, releases] of [...merged].sort((a, b) => a[0] - b[0])) {
    if (releases.length === 0) continue
    // 稳定排序：同一时刻的两次发布保持给的先后。
    const sorted = releases
      .map((release, index) => ({ release, index }))
      .sort((a, b) => a.release.at - b.release.at || a.index - b.index)
    const steps: VintageStep[] = sorted.map(({ release }, i) => ({
      ...release,
      delta: i === 0 ? null : release.value - sorted[i - 1]!.release.value,
    }))
    const first = steps[0]!
    const latest = steps[steps.length - 1]!
    rows.push({ period, steps, first, latest, revision: steps.length > 1 ? latest.value - first.value : null })
  }
  return rows
}

/** 截至 asOf 时已知的值：发布时刻不晚于 asOf 的最后一次发布；那时还没发布过就是 null（那一期当时还不存在）。 */
export function knownAt(row: VintageRow, asOf: number): VintageStep | null {
  let found: VintageStep | null = null
  for (const step of row.steps) if (step.at <= asOf) found = step
  return found
}

/**
 * 「当时已知值」按什么口径取：给了 asOf 就是截至那一刻已知的最后一次发布；不给就是每一期的首次发布值
 * （发布当天市场看到的数，修订值都不算）。
 */
export function knownValue(row: VintageRow, asOf?: number): VintageStep | null {
  return asOf === undefined ? row.steps[0]! : knownAt(row, asOf)
}

export type RevisionStats = {
  /** 修订过的期数（至少两次发布）。 */
  revised: number
  /** 平均绝对修订；没有修订过是 null。 */
  meanAbs: number | null
  /** 平均有符号修订（正 = 后来普遍上修）；没有修订过是 null。 */
  bias: number | null
  /** 绝对值最大的那次修订。 */
  largest: { period: number; revision: number } | null
}

export function revisionStats(rows: readonly VintageRow[]): RevisionStats {
  const revisions = rows.flatMap((row) =>
    row.revision === null ? [] : [{ period: row.period, revision: row.revision }],
  )
  if (revisions.length === 0) return { revised: 0, meanAbs: null, bias: null, largest: null }
  const sum = revisions.reduce((a, b) => a + b.revision, 0)
  const abs = revisions.reduce((a, b) => a + Math.abs(b.revision), 0)
  const largest = revisions.reduce((a, b) => (Math.abs(b.revision) > Math.abs(a.revision) ? b : a))
  return { revised: revisions.length, meanAbs: abs / revisions.length, bias: sum / revisions.length, largest }
}

/** 图的纵向范围：所有发布值（首次、中间、最新，不只是两条线）都要画得下。 */
export function vintageExtent(rows: readonly VintageRow[]): readonly [number, number] {
  let lo = Infinity
  let hi = -Infinity
  for (const row of rows)
    for (const step of row.steps) {
      lo = Math.min(lo, step.value)
      hi = Math.max(hi, step.value)
    }
  return lo <= hi ? [lo, hi] : [0, 1]
}
