// SPDX-License-Identifier: MIT
// 深度图的纯函数：把两侧的档位算成累计量阶梯、定义域、悬停读数。累计量与价格比较一律走整数（共用 lib/scaled-decimal.ts）。
import { signed } from '../../lib/num.ts'
import { fromUnits, toUnits } from '../../lib/scaled-decimal.ts'
import { mergeLevels, type BookLevel, type BookPrecision, type BookRow } from '../order-book/order-book-model.ts'

export type DepthStep = BookRow

export type DepthModel = {
  /** 中间价（最优买卖价的中点）；只有一侧时是那一侧的最优价；两侧都空时是 null。 */
  mid: number | null
  /** 买盘阶梯，最优价（最高）在前；只含落在定义域内的档。 */
  bids: DepthStep[]
  /** 卖盘阶梯，最优价（最低）在前；只含落在定义域内的档。 */
  asks: DepthStep[]
  /** 横轴定义域 [最低价, 最高价]。 */
  domain: readonly [number, number]
  /** 纵轴最大累计量（两侧在定义域内各自的最大累计量里取大的）。 */
  maxTotal: number
}

export type BuildDepthOptions = BookPrecision & {
  /** 把横轴限制在中间价上下各多少个百分点；省略就取全部档位。 */
  rangePct?: number | null
}

/** 把两侧档位算成深度模型；档位不要求有序，量为 0 的档当作没有。 */
export function buildDepth(
  bids: readonly BookLevel[],
  asks: readonly BookLevel[],
  { rangePct, priceDecimals, sizeDecimals }: BuildDepthOptions,
): DepthModel {
  const precision = { priceDecimals, sizeDecimals }
  // tick 传 0：不合并，只借 mergeLevels 做去重、排序与累计。
  const allBids = mergeLevels(bids, 'bid', 0, precision)
  const allAsks = mergeLevels(asks, 'ask', 0, precision)
  const bestBid = allBids[0]?.price ?? null
  const bestAsk = allAsks[0]?.price ?? null
  const mid =
    bestBid !== null && bestAsk !== null
      ? fromUnits(toUnits(bestBid, priceDecimals) + toUnits(bestAsk, priceDecimals), priceDecimals) / 2
      : (bestBid ?? bestAsk)
  if (mid === null) return { mid: null, bids: [], asks: [], domain: [0, 1], maxTotal: 0 }

  let lo: number
  let hi: number
  if (rangePct && rangePct > 0) {
    lo = mid * (1 - rangePct / 100)
    hi = mid * (1 + rangePct / 100)
  } else {
    lo = allBids.length ? allBids[allBids.length - 1]!.price : mid
    hi = allAsks.length ? allAsks[allAsks.length - 1]!.price : mid
    // 一侧为空或只有一档时，给横轴留一点宽度，免得宽为 0。
    if (!(hi > lo)) {
      const pad = Math.max(mid * 0.001, 10 ** -priceDecimals)
      lo = Math.min(lo, mid) - pad
      hi = Math.max(hi, mid) + pad
    }
  }
  // 定义域边界是百分比乘出来的浮点数，比较时给半个最小价位的容差，免得 99.9 因为 99.89999999 被误踢。
  const eps = 10 ** -priceDecimals / 2
  const inBids = allBids.filter((row) => row.price >= lo - eps)
  const inAsks = allAsks.filter((row) => row.price <= hi + eps)
  const maxTotal = Math.max(inBids[inBids.length - 1]?.total ?? 0, inAsks[inAsks.length - 1]?.total ?? 0)
  return { mid, bids: inBids, asks: inAsks, domain: [lo, hi], maxTotal }
}

/**
 * 阶梯面积的 SVG 路径。x、y 由调用方给（价格与累计量到坐标）；baseY 是面积的底。
 * 买盘从最优价往低价走：在每一档的价位上累计量跳一级，档与档之间水平；最后水平走到定义域边缘再落回底。卖盘镜像。
 */
export function stepAreaPath(
  steps: readonly DepthStep[],
  edge: number,
  x: (price: number) => number,
  y: (total: number) => number,
  baseY: number,
): string {
  if (steps.length === 0) return ''
  const first = steps[0]!
  const parts = [`M${x(first.price)} ${baseY}`, `V${y(first.total)}`]
  for (let i = 1; i < steps.length; i += 1) {
    const step = steps[i]!
    parts.push(`H${x(step.price)}`, `V${y(step.total)}`)
  }
  parts.push(`H${x(edge)}`, `V${baseY}`, 'Z')
  return parts.join(' ')
}

/** 只有阶梯的轮廓线（不含底边与两侧竖线）：画面积的描边用。 */
export function stepLinePath(
  steps: readonly DepthStep[],
  edge: number,
  x: (price: number) => number,
  y: (total: number) => number,
): string {
  if (steps.length === 0) return ''
  const first = steps[0]!
  const parts = [`M${x(first.price)} ${y(first.total)}`]
  for (let i = 1; i < steps.length; i += 1) {
    const step = steps[i]!
    parts.push(`H${x(step.price)}`, `V${y(step.total)}`)
  }
  parts.push(`H${x(edge)}`)
  return parts.join(' ')
}

export type DepthReading = {
  side: 'bid' | 'ask'
  price: number
  /** 这个价位上的累计量：买盘是价格不低于它的所有买量，卖盘是价格不高于它的所有卖量。 */
  total: number
  /** 离中间价的百分数，带符号（买盘为负、卖盘为正）。 */
  offsetPct: number
}

export function formatDepthOffset(value: number): string {
  const magnitude = Math.abs(value)
  const rounded = magnitude.toFixed(2)
  // 恰好半个最小显示单位也按零展示。
  if (rounded === '0.00' || magnitude === 0.005) return '0.00%'
  return signed(value, () => `${rounded}%`)
}

/** 横轴某个价位上的读数；没有中间价时是 null。价位落在买卖价差里（两侧最优价之间）累计量是 0。 */
export function depthAt(model: DepthModel, price: number): DepthReading | null {
  if (model.mid === null || !Number.isFinite(price)) return null
  const side = price <= model.mid ? 'bid' : 'ask'
  const steps = side === 'bid' ? model.bids : model.asks
  // 阶梯里最后一个「还在这个价位以内」的档：买盘是价格仍不低于它的最低档，卖盘是价格仍不高于它的最高档。
  let total = 0
  for (const step of steps) {
    if (side === 'bid' ? step.price >= price : step.price <= price) total = step.total
    else break
  }
  return { side, price, total, offsetPct: ((price - model.mid) / model.mid) * 100 }
}

/** 键盘走读数：所有档位的价格从低到高（买盘在前、卖盘在后）。 */
export function depthPrices(model: DepthModel): number[] {
  return [...model.bids.map((r) => r.price).toReversed(), ...model.asks.map((r) => r.price)]
}
