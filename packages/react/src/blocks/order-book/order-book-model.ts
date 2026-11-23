// SPDX-License-Identifier: MIT
// 订单簿的纯函数：档位合并、累计量、买卖占比、价差。全部走整数（共用 lib/scaled-decimal.ts）：
// 价格按「价格位数与合并档位里小数位更多的那个」乘成整数，数量按数量位数乘成整数，合并时只做整数加法与整除，不会出现 0.30000000000000004。
import { decimalsOf, fromUnits, toUnits } from '../../lib/scaled-decimal.ts'

export type BookSide = 'bid' | 'ask'
export type BookLevel = {
  price: number
  /** 这一档的挂单量；0 或负数当作这一档已经撤光，不进簿。 */
  size: number
}

export type BookRow = {
  price: number
  size: number
  /** 从最优价到这一档的累计量。 */
  total: number
}

export type BookPrecision = { priceDecimals: number; sizeDecimals: number }

/** 合并档位换成整数用的小数位：不少于价格位数，也不少于档位自己的小数位（0.005 需要 3 位）。 */
export const bookScale = (tick: number, priceDecimals: number): number => Math.max(priceDecimals, decimalsOf(tick))

/**
 * 把一侧的档位按 tick 合并：买盘向下取整到档位、卖盘向上取整（合并后买价不会高过原价、卖价不会低于原价），同档的量相加。
 * 返回从最优价往外排的行（买盘价从高到低，卖盘价从低到高），每行带累计量。tick 非正数或不是有限数时按价格最小位（不合并）。
 */
export function mergeLevels(
  levels: readonly BookLevel[],
  side: BookSide,
  tick: number,
  { priceDecimals, sizeDecimals }: BookPrecision,
): BookRow[] {
  const valid = Number.isFinite(tick) && tick > 0
  const scale = bookScale(valid ? tick : 0, priceDecimals)
  const tickUnits = valid ? Math.max(1, toUnits(tick, scale)) : 1
  const buckets = new Map<number, number>()
  for (const level of levels) {
    if (!Number.isFinite(level.price) || !Number.isFinite(level.size) || level.size <= 0) continue
    const units = toUnits(level.price, scale)
    const bucket = (side === 'bid' ? Math.floor(units / tickUnits) : Math.ceil(units / tickUnits)) * tickUnits
    buckets.set(bucket, (buckets.get(bucket) ?? 0) + toUnits(level.size, sizeDecimals))
  }
  const keys = [...buckets.keys()].toSorted((a, b) => (side === 'bid' ? b - a : a - b))
  let running = 0
  return keys.map((key) => {
    const size = buckets.get(key)!
    running += size
    return {
      price: fromUnits(key, scale),
      size: fromUnits(size, sizeDecimals),
      total: fromUnits(running, sizeDecimals),
    }
  })
}

export type OrderBookModel = {
  /** 卖盘，最优价（最低）在前。 */
  asks: BookRow[]
  /** 买盘，最优价（最高）在前。 */
  bids: BookRow[]
  /** 原始（没合并）的最优买价与卖价；那一侧没有档位时是 null。 */
  bestBid: number | null
  bestAsk: number | null
  /** 最优卖价减最优买价（用原始档位算，不受合并影响）；缺一侧时是 null。 */
  spread: number | null
  /** 价差占中间价的百分数。 */
  spreadPct: number | null
  /** 占比统计窗口内（每侧前 shareRows 行）的买量与卖量。 */
  bidVolume: number
  askVolume: number
  /** 买量占（买 + 卖）的百分数，保留一位小数；买卖都是 0 时是 null。卖占比是 100 减它，两个数加起来恰好 100。 */
  bidPct: number | null
  askPct: number | null
}

export type BuildBookOptions = BookPrecision & {
  /** 合并档位；省略按价格最小位。 */
  tick?: number
  /** 每侧最多留几行。 */
  rows: number
  /** 占比只数每侧前几行（不随单侧模式放大，条上的数才稳）；省略与 rows 一样。 */
  shareRows?: number
}

/** 一次算完订单簿显示用的全部数：两侧合并后的行、价差、买卖占比。 */
export function buildOrderBook(
  bids: readonly BookLevel[],
  asks: readonly BookLevel[],
  { tick, rows, shareRows = rows, priceDecimals, sizeDecimals }: BuildBookOptions,
): OrderBookModel {
  const precision = { priceDecimals, sizeDecimals }
  const mergeTick = tick ?? 10 ** -priceDecimals
  const bidRows = mergeLevels(bids, 'bid', mergeTick, precision).slice(0, rows)
  const askRows = mergeLevels(asks, 'ask', mergeTick, precision).slice(0, rows)

  const live = (levels: readonly BookLevel[]) => levels.filter((l) => Number.isFinite(l.price) && l.size > 0)
  const bidPrices = live(bids).map((l) => toUnits(l.price, priceDecimals))
  const askPrices = live(asks).map((l) => toUnits(l.price, priceDecimals))
  const bestBidUnits = bidPrices.length ? Math.max(...bidPrices) : null
  const bestAskUnits = askPrices.length ? Math.min(...askPrices) : null
  const spreadUnits = bestBidUnits !== null && bestAskUnits !== null ? bestAskUnits - bestBidUnits : null

  const sumUnits = (list: BookRow[]) =>
    list.slice(0, shareRows).reduce((acc, row) => acc + toUnits(row.size, sizeDecimals), 0)
  const bidUnits = sumUnits(bidRows)
  const askUnits = sumUnits(askRows)
  const all = bidUnits + askUnits
  // 买占比先取到 0.1%（整数十分位），卖占比用 1000 减它：两个数相加恒为 100，不会出现 50.1 + 49.8。
  const bidTenths = all > 0 ? Math.round((bidUnits * 1000) / all) : null

  return {
    asks: askRows,
    bids: bidRows,
    bestBid: bestBidUnits === null ? null : fromUnits(bestBidUnits, priceDecimals),
    bestAsk: bestAskUnits === null ? null : fromUnits(bestAskUnits, priceDecimals),
    spread: spreadUnits === null ? null : fromUnits(spreadUnits, priceDecimals),
    spreadPct:
      spreadUnits !== null && bestBidUnits !== null && bestAskUnits !== null
        ? (spreadUnits / ((bestBidUnits + bestAskUnits) / 2)) * 100
        : null,
    bidVolume: fromUnits(bidUnits, sizeDecimals),
    askVolume: fromUnits(askUnits, sizeDecimals),
    bidPct: bidTenths === null ? null : bidTenths / 10,
    askPct: bidTenths === null ? null : (1000 - bidTenths) / 10,
  }
}

/** 深度条宽度：这一行累计量占显示行里最大累计量的比例（0 到 1）。 */
export const depthRatio = (total: number, maxTotal: number): number =>
  maxTotal > 0 ? Math.min(1, Math.max(0, total / maxTotal)) : 0
