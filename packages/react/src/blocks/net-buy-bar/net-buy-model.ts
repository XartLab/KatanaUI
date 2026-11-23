// SPDX-License-Identifier: MIT
/**
 * Data types and bar geometry of NetBuyBar.
 * 龙虎榜净买居中条（#11）的数据形状与几何：刻度与零轴条照 AttributionBars 的模型（对称 ±max，max 取最大 |净买| 向上到一位有效数字），席位条按这只票的席位最大额。
 */
import { attributionBar, attributionRows, attributionScale } from '../attribution-bars/attribution-model.ts'

/** One trading seat on the list. 一个席位。 */
export type DragonSeat = {
  name: string
  /** Amount bought or sold by this seat (the side it is listed under). 这个席位在所在一边的金额。 */
  amount: number
  /** Institutional seat (机构专用), tagged in the list. 机构席位。 */
  institution?: boolean
}

/** One stock on the dragon-tiger list. 龙虎榜上的一只票。 */
export type DragonTigerItem = {
  code: string
  name: string
  /** Net buy = buy − sell, given by the caller. 净买额，调用方给。 */
  net: number
  buy?: number
  sell?: number
  /** Change, already a percentage. 涨跌幅，百分数。 */
  change?: number
  /** Why it is listed (「日涨幅偏离 7%」). 上榜原因。 */
  reason?: string
  /** Top buy and sell seats in the caller's order (usually top five each). 买卖前几席位。 */
  seats?: { buy: readonly DragonSeat[]; sell: readonly DragonSeat[] }
  logo?: string
}

/** Symmetric scale of the net bars, same rule as AttributionBars. 净买条的对称刻度。 */
export const netScale = (items: readonly DragonTigerItem[]): number =>
  attributionScale(
    attributionRows(
      items.map((item) => ({ key: item.code, label: item.name, value: item.net })),
      Number.POSITIVE_INFINITY,
    ),
  )

/** Left and width of a net bar as shares of the track (zero line at 0.5). 净买条的起点与宽度。 */
export const netBar = (value: number, scale: number) => attributionBar(value, scale)

/** Width share of a seat bar against the largest seat of the stock (0–1). 席位条的宽度比例。 */
export function seatShare(amount: number, seats: { buy: readonly DragonSeat[]; sell: readonly DragonSeat[] }): number {
  const max = [...seats.buy, ...seats.sell].reduce((m, seat) => Math.max(m, Math.abs(seat.amount)), 0)
  return max > 0 ? Math.min(1, Math.abs(amount) / max) : 0
}
