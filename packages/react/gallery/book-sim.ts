// SPDX-License-Identifier: MIT
// 盘口三件（订单簿、深度图、成交明细）演示的模拟器（只给 gallery 用）：全是编出来的演示数据，不是行情，也不连任何交易所。
// 价格用整数「分」、数量用整数「千分之一」记，换成件要的数时再除：模拟器自己也不做浮点累加。
import type { BookLevel, Trade } from '../src/blocks/index.ts'
import { makeRng, type Rng } from './live-sim'

/** 最优价上下各铺多少分的档位。 */
const SPAN = 400

export type BookSim = {
  /** 最优买价（分）；最优卖价是它加 1。 */
  bid: number
  /** 各价位（分）的挂单量（千分之一）。 */
  sizes: Record<number, number>
  /** 成交，从新到旧。 */
  trades: Trade[]
  /** 已经成交了几笔，也是下一个成交号。 */
  seq: number
  /** 最新价（分）与它相对上一笔的方向。 */
  last: number
  tone: 'up' | 'down' | undefined
}

const randInt = (rng: Rng, lo: number, hi: number) => lo + Math.floor(rng() * (hi - lo + 1))

function fill(sizes: Record<number, number>, bid: number, rng: Rng): Record<number, number> {
  const next: Record<number, number> = {}
  for (let cents = bid - SPAN; cents <= bid + 1 + SPAN; cents += 1)
    next[cents] = sizes[cents] ?? randInt(rng, 200, 6200)
  return next
}

/** 造一笔成交：四成概率沿用上一笔的价与方向（演示聚合），其余在最优买卖价上随机方向成交；一成是大单。 */
function nextTrade(state: Pick<BookSim, 'bid' | 'trades' | 'seq'>, rng: Rng): Trade {
  const prev = state.trades[0]
  const repeat = prev !== undefined && rng() < 0.4
  const side = repeat ? prev.side : rng() < 0.5 ? 'buy' : 'sell'
  const price = repeat ? prev.price : (side === 'buy' ? state.bid + 1 : state.bid) / 100
  const size = rng() < 0.1 ? randInt(rng, 5000, 20000) : randInt(rng, 10, 1500)
  return { id: state.seq, time: Date.UTC(2026, 10, 22, 9, 30, 0) + state.seq * 700, price, size: size / 1000, side }
}

export function initialBook(): BookSim {
  const rng = makeRng(7)
  let state: BookSim = { bid: 10000, sizes: fill({}, 10000, rng), trades: [], seq: 0, last: 10001, tone: undefined }
  for (let i = 0; i < 36; i += 1) {
    const trade = nextTrade(state, rng)
    state = { ...state, trades: [trade, ...state.trades], seq: state.seq + 1 }
  }
  const lastTrade = state.trades[0]!
  return { ...state, last: Math.round(lastTrade.price * 100) }
}

/** 一个节拍：几档的量变了，偶尔最优价挪一分，进来一到三笔成交。 */
export function stepBook(state: BookSim, rng: Rng): BookSim {
  const sizes = { ...state.sizes }
  for (let i = 0; i < 14; i += 1) {
    const cents = state.bid - SPAN + randInt(rng, 0, SPAN * 2 + 1)
    const before = sizes[cents]
    if (before !== undefined) sizes[cents] = Math.max(100, before + randInt(rng, -1200, 1500))
  }
  const bid = rng() < 0.3 ? state.bid + (rng() < 0.5 ? -1 : 1) : state.bid
  let next: BookSim = { ...state, bid, sizes: fill(sizes, bid, rng) }
  for (let i = randInt(rng, 1, 3); i > 0; i -= 1) {
    const trade = nextTrade(next, rng)
    next = { ...next, trades: [trade, ...next.trades].slice(0, 120), seq: next.seq + 1 }
  }
  const last = Math.round(next.trades[0]!.price * 100)
  return { ...next, last, tone: last > state.last ? 'up' : last < state.last ? 'down' : state.tone }
}

export const bookLevels = (state: BookSim): { bids: BookLevel[]; asks: BookLevel[] } => {
  const bids: BookLevel[] = []
  const asks: BookLevel[] = []
  for (const [key, size] of Object.entries(state.sizes)) {
    const cents = Number(key)
    ;(cents <= state.bid ? bids : asks).push({ price: cents / 100, size: size / 1000 })
  }
  return { bids, asks }
}
