// SPDX-License-Identifier: MIT
// SlopeChart 的纯逻辑：值或名次到纵坐标，两侧标签防重叠。功能参照 Arc Slope chart（uiarc.dev，2026-11-14 读），实现原创。

export type SlopeItem = { id: string; label: string; before: number; after: number }
export type SlopeMode = 'value' | 'rank'

export type SlopeRow = {
  id: string
  /** 两端点的纵坐标（0 在最上）。 */
  y0: number
  y1: number
  /** 两侧标签的纵坐标：从端点纵坐标挪开，互相之间至少隔 minGap。 */
  label0: number
  label1: number
  /** 涨跌三态：value 模式看 after − before；rank 模式看名次是否上升（名次数字变小）。 */
  tone: 'up' | 'down' | 'flat'
  /** value 模式是 after − before；rank 模式是名次升了几位（正数是升）。 */
  change: number
}

/** 名次：值大的排前，1 起；值相同按输入顺序（稳定）。 */
export function ranks(values: readonly number[]): number[] {
  const order = values
    .map((value, index) => ({ value, index }))
    .toSorted((a, b) => b.value - a.value || a.index - b.index)
  const out = Array.from({ length: values.length }, () => 0)
  order.forEach((entry, position) => {
    out[entry.index] = position + 1
  })
  return out
}

/**
 * 标签防重叠：ys 是各标签想去的纵坐标（任意顺序），返回同顺序的结果；
 * 保持上下次序，相邻至少隔 gap，整体落在 [lo, hi] 里。先自上而下推开，超出 hi 再自下而上拉回。装不下（gap 乘个数大于范围）时均匀铺满。
 */
export function spreadLabels(ys: readonly number[], gap: number, lo: number, hi: number): number[] {
  const n = ys.length
  if (n === 0) return []
  if (gap * (n - 1) > hi - lo)
    return ys.map((_, index, all) => (n === 1 ? (lo + hi) / 2 : lo + ((hi - lo) * rankOf(all, index)) / (n - 1)))
  const order = ys.map((y, index) => ({ y, index })).toSorted((a, b) => a.y - b.y || a.index - b.index)
  const out = order.map((entry) => Math.min(hi, Math.max(lo, entry.y)))
  for (let i = 1; i < n; i++) out[i] = Math.max(out[i]!, out[i - 1]! + gap)
  out[n - 1] = Math.min(out[n - 1]!, hi)
  for (let i = n - 2; i >= 0; i--) out[i] = Math.min(out[i]!, out[i + 1]! - gap)
  if (out[0]! < lo) {
    const shift = lo - out[0]!
    for (let i = 0; i < n; i++) out[i] = out[i]! + shift
  }
  const result = Array.from({ length: n }, () => 0)
  order.forEach((entry, position) => {
    result[entry.index] = out[position]!
  })
  return result
}

/** ys 里第 index 个的次序（0 起，值相同按顺序），铺满用。 */
const rankOf = (ys: readonly number[], index: number) =>
  ys.filter((y, i) => y < ys[index]! || (y === ys[index] && i < index)).length

/** 排版：纵轴在 [top, bottom]（SVG 坐标，top < bottom）。value 模式按全体值的最小到最大线性铺开，值大的在上；rank 模式名次按等距铺开，第 1 名在上。 */
export function slopeLayout(
  items: readonly SlopeItem[],
  options: { mode: SlopeMode; top: number; bottom: number; labelGap: number },
): SlopeRow[] {
  const { mode, top, bottom, labelGap } = options
  const before = items.map((item) => item.before)
  const after = items.map((item) => item.after)
  let y0: number[]
  let y1: number[]
  if (mode === 'rank') {
    const count = Math.max(items.length, 1)
    const at = (rank: number) => (count === 1 ? (top + bottom) / 2 : top + ((rank - 1) / (count - 1)) * (bottom - top))
    y0 = ranks(before).map(at)
    y1 = ranks(after).map(at)
  } else {
    const all = [...before, ...after].filter((value) => Number.isFinite(value))
    const lo = Math.min(...all)
    const hi = Math.max(...all)
    const at = (value: number) =>
      hi === lo ? (top + bottom) / 2 : bottom - ((value - lo) / (hi - lo)) * (bottom - top)
    y0 = before.map(at)
    y1 = after.map(at)
  }
  const label0 = spreadLabels(y0, labelGap, top, bottom)
  const label1 = spreadLabels(y1, labelGap, top, bottom)
  const rank0 = mode === 'rank' ? ranks(before) : []
  const rank1 = mode === 'rank' ? ranks(after) : []
  return items.map((item, i) => {
    const change = mode === 'rank' ? rank0[i]! - rank1[i]! : item.after - item.before
    return {
      id: item.id,
      y0: y0[i]!,
      y1: y1[i]!,
      label0: label0[i]!,
      label1: label1[i]!,
      tone: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
      change,
    }
  })
}
