// SPDX-License-Identifier: MIT
// 成交明细的纯函数：聚合同价同方向的连续成交、大单判定、时间文字。数量求和与比大小走整数（共用 lib/scaled-decimal.ts）。
import { pad } from '../../lib/num.ts'
import { fromUnits, toUnits } from '../../lib/scaled-decimal.ts'

/** 成交的主动方向：buy 是主动买（吃卖盘），sell 是主动卖（吃买盘）。 */
export type TradeSide = 'buy' | 'sell'

export type Trade = {
  /** 稳定的唯一标识（交易所成交号）；新成交靠它认出来，从顶上进。 */
  id: string | number
  /** 成交时刻，毫秒时间戳。 */
  time: number
  price: number
  size: number
  side: TradeSide
}

export type TapeRow = {
  /** 行的标识：聚合行取组里最老那笔的 id（新成交并进这一行时标识不变，不会当作新行再进场一次）。 */
  key: string
  /** 行里最新那笔的时刻。 */
  time: number
  price: number
  /** 行里各笔的量之和。 */
  size: number
  side: TradeSide
  /** 行里有几笔；没聚合时恒为 1。 */
  count: number
  /** 量不小于 largeSize（聚合行按合计量比）。 */
  large: boolean
}

export type TapeOptions = {
  sizeDecimals: number
  /** 把同价同方向、紧挨着的成交并成一行。 */
  aggregate?: boolean
  /** 大单阈值：量不小于它的行高亮；省略就没有大单。 */
  largeSize?: number
  /** 最多留几行（聚合后算）；省略不截。 */
  maxRows?: number
}

/**
 * 把成交（从新到旧）整理成明细行。聚合只并「紧挨着、同价、同方向」的成交：中间夹了别的价或方向就断开，次序不变。
 * 量非正或非有限的成交丢掉。
 */
export function tapeRows(
  trades: readonly Trade[],
  { sizeDecimals, aggregate = false, largeSize, maxRows }: TapeOptions,
): TapeRow[] {
  const threshold = largeSize === undefined || !(largeSize > 0) ? null : toUnits(largeSize, sizeDecimals)
  const rows: { row: TapeRow; units: number }[] = []
  for (const trade of trades) {
    if (!Number.isFinite(trade.size) || trade.size <= 0 || !Number.isFinite(trade.price)) continue
    const units = toUnits(trade.size, sizeDecimals)
    const last = rows[rows.length - 1]
    if (aggregate && last && last.row.price === trade.price && last.row.side === trade.side) {
      last.units += units
      last.row.count += 1
      last.row.key = String(trade.id)
    } else {
      rows.push({
        units,
        row: {
          key: String(trade.id),
          time: trade.time,
          price: trade.price,
          size: 0,
          side: trade.side,
          count: 1,
          large: false,
        },
      })
    }
  }
  const out = rows.map(({ row, units }) => ({
    ...row,
    size: fromUnits(units, sizeDecimals),
    large: threshold !== null && units >= threshold,
  }))
  return maxRows === undefined ? out : out.slice(0, Math.max(0, maxRows))
}

/** 毫秒时间戳写成 UTC 的 HH:MM:SS；要本地时区或别的写法，调用方传 formatTime。 */
export function clockText(time: number): string {
  const d = new Date(time)
  return `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}`
}
