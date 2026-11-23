// SPDX-License-Identifier: MIT
// 龙虎榜席位（SeatTable，#110）的纯函数：取前几名、算净额、算合计。金额单位是元，取不到是 null，不写 0。

export type Seat = {
  /** Seat name (a brokerage branch or the institutional seat). */
  name: string
  /**
   * Hot-money tag of the seat, written by the caller; leave it out for unknown seats.
   * 游资标签，由调用方给；不认识的席位不给。
   */
  tag?: string
  /** Amount bought in yuan; null when unavailable. */
  buy?: number | null
  /** Amount sold in yuan; null when unavailable. */
  sell?: number | null
}

export type SeatSide = 'buy' | 'sell'

const finite = (value: number | null | undefined): value is number =>
  typeof value === 'number' && Number.isFinite(value)

/**
 * 取某一侧金额最大的前 limit 个席位（默认 5）：买入侧按买入额从大到小，卖出侧按卖出额从大到小；
 * 该侧金额取不到的席位排在最后（不丢，不当 0）；同额保持传入次序。
 */
export function rankSeats(seats: readonly Seat[], side: SeatSide, limit = 5): Seat[] {
  const size = Math.max(0, Math.floor(limit))
  return seats
    .map((seat, index) => ({ seat, index, amount: seat[side] }))
    .sort((a, b) => {
      const known = Number(finite(b.amount)) - Number(finite(a.amount))
      if (known !== 0) return known
      if (finite(a.amount) && finite(b.amount) && a.amount !== b.amount) return b.amount - a.amount
      return a.index - b.index
    })
    .slice(0, size)
    .map((entry) => entry.seat)
}

/** 一个席位的净额 = 买入 − 卖出；任一方取不到就是 null（不拿 0 凑）。 */
export function seatNet(seat: Seat): number | null {
  return finite(seat.buy) && finite(seat.sell) ? seat.buy - seat.sell : null
}

/** 一侧席位某一列的合计：全部取不到是 null，部分取不到只加有的。 */
export function seatTotal(seats: readonly Seat[], field: SeatSide | 'net'): number | null {
  const values = seats.map((seat) => (field === 'net' ? seatNet(seat) : seat[field])).filter(finite)
  return values.length === 0 ? null : values.reduce((sum, value) => sum + value, 0)
}

/** 金额的方向：正涨、负跌、零或取不到是 flat。 */
export const amountTone = (value: number | null): 'up' | 'down' | 'flat' =>
  value === null || value === 0 ? 'flat' : value > 0 ? 'up' : 'down'
