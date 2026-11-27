// SPDX-License-Identifier: MIT
// 竞价量比条（AuctionBarCell，KatanaUI #11 第 5 项）的纯函数：量比、09:25 前未出结果、三段长度。金额都是元，取不到是 null，不当 0。

import { AUCTION_TO } from './auction-model.ts'
import { parseClock } from './session.ts'

const known = (value: number | null | undefined): value is number => typeof value === 'number' && Number.isFinite(value)

/** 竞价量比：今日竞价额 ÷ 昨日同期竞价额；任一方取不到、昨日不是正数返回 null。 */
export function auctionRatio(amount: number | null | undefined, previous: number | null | undefined): number | null {
  if (!known(amount) || !known(previous) || previous <= 0 || amount < 0) return null
  return amount / previous
}

/** 09:25 撮合之前（09:15–09:25 是虚拟匹配）结果还没出：时刻早于 09:25 返回 true；没给或写不对按已出结果。 */
export function auctionPending(time: string | null | undefined): boolean {
  const minutes = parseClock(time)
  return minutes !== null && minutes < AUCTION_TO
}

export type AuctionBarShares = {
  /** 今日竞价额占满刻度的比例（0 到 1）；取不到是 null。 */
  amount: number | null
  /** 昨日同期那根刻度的位置；取不到是 null。 */
  previous: number | null
  /** 涨停委买额那条细线的长度；没有是 null。 */
  limitBid: number | null
}

/**
 * 三段长度：满刻度是 max（一列共用一把，行与行可比）；不给 max 就取这一格里最大的那个（只看今日比昨日）。
 * 负数与取不到的不画；都取不到时三段都是 null。
 */
export function auctionBarShares(
  amount: number | null | undefined,
  previous: number | null | undefined,
  limitBid: number | null | undefined,
  max?: number,
): AuctionBarShares {
  const drawn = (value: number | null | undefined) => (known(value) && value >= 0 ? value : null)
  const [a, p, b] = [drawn(amount), drawn(previous), drawn(limitBid)]
  const scale = known(max) && max > 0 ? max : Math.max(0, a ?? 0, p ?? 0, b ?? 0)
  const share = (value: number | null) => (value === null || scale <= 0 ? null : Math.min(1, value / scale))
  return { amount: share(a), previous: share(p), limitBid: share(b) }
}
