// SPDX-License-Identifier: MIT
// 连板天梯演示的模拟器（只给 gallery 用）：每个节拍随机让某只封单量变、某只炸板、某只回封，偶尔一只升板换层、偶尔来一只新首板。
// 用 live-sim 的节拍器与带种子的随机数，所以同一个种子同一串；全是编出来的演示数据，不是行情。
import type { LadderItem, LadderLevel } from '../src/quant/index.ts'
import { chance, pick, randomInt, type Rng } from './live-sim'

/** 带板位的个股（拍平后好改；渲染前再按板位分层）。 */
export type LadderStock = LadderItem & { board: number }
export type LadderSim = {
  stocks: LadderStock[]
  /** 每个板位的晋级 [已晋级, 候选]。 */
  promoted: Record<number, [number, number]>
  /** 已经来过几只新首板，给新代码编号。 */
  arrivals: number
}

const MAX_BOARD = 7
const MAX_STOCKS = 14
const NAMES = [
  '云端科技',
  '蓝海能源',
  '启明半导体',
  '远山医药',
  '星河传媒',
  '北辰新材',
  '海潮航运',
  '听雨软件',
  '长风电力',
]
const INDUSTRIES = ['软件', '电力', '半导体', '医药', '传媒', '新材料', '交运']

export const ladderFrom = (levels: readonly LadderLevel[]): LadderSim => ({
  stocks: levels.flatMap((level) => level.items.map((item) => ({ ...item, board: level.board }))),
  promoted: Object.fromEntries(levels.filter((level) => level.promoted).map((level) => [level.board, level.promoted!])),
  arrivals: 0,
})

/** 拍平的个股按板位分层，层内保持原顺序；没有个股的层不出现。 */
export function ladderLevels(sim: LadderSim): LadderLevel[] {
  const boards = [...new Set(sim.stocks.map((stock) => stock.board))]
  return boards.map((board) => ({
    board,
    promoted: sim.promoted[board],
    items: sim.stocks.filter((stock) => stock.board === board).map(({ board: _board, ...item }) => item),
  }))
}

const round1 = (n: number) => Math.round(n * 10) / 10
const clock = (arrivals: number) =>
  `${String(9 + Math.floor((30 + arrivals * 7) / 60)).padStart(2, '0')}:${String((30 + arrivals * 7) % 60).padStart(2, '0')}`

/** 一个节拍：先让封住的几只封单量随机变，再按概率发生各种事件；每种事件都有概率，长跑下来都会碰到。 */
export function ladderStep(sim: LadderSim, rng: Rng): LadderSim {
  let stocks = sim.stocks.map((stock) =>
    stock.status === 'sealed' && chance(rng, 0.45)
      ? { ...stock, sealAmount: Math.round((stock.sealAmount ?? 1e8) * (0.7 + rng() * 0.7)) }
      : stock,
  )
  const promoted = { ...sim.promoted }
  let arrivals = sim.arrivals
  const indexes = (match: (stock: LadderStock) => boolean) => stocks.flatMap((stock, i) => (match(stock) ? [i] : []))
  const change = (i: number, patch: Partial<LadderStock>) => {
    stocks = stocks.map((stock, at) => (at === i ? { ...stock, ...patch } : stock))
  }

  // 炸板：某只封住的打开涨停，封单清零、涨幅回落、开板次数加一。
  if (chance(rng, 0.3)) {
    const sealed = indexes((stock) => stock.status === 'sealed')
    if (sealed.length > 1) {
      const i = pick(rng, sealed)
      const stock = stocks[i]!
      change(i, {
        status: 'broken',
        sealAmount: 0,
        opens: (stock.opens ?? 0) + 1,
        change: round1(stock.change - 2 - rng() * 4),
      })
    }
  }
  // 炸板的涨幅在游走；回封：涨幅回到涨停、给一笔新封单。
  stocks = stocks.map((stock) =>
    stock.status === 'broken' ? { ...stock, change: round1(stock.change + (rng() - 0.5) * 1.6) } : stock,
  )
  if (chance(rng, 0.35)) {
    const broken = indexes((stock) => stock.status === 'broken')
    if (broken.length > 0) {
      const i = pick(rng, broken)
      change(i, { status: 'sealed', change: 10, sealAmount: Math.round((0.5 + rng() * 2.5) * 1e8) })
    }
  }
  // 升板：某只封住的上一层；那一层的晋级数加一。
  if (chance(rng, 0.2)) {
    const climbers = indexes((stock) => stock.status === 'sealed' && stock.board < MAX_BOARD)
    if (climbers.length > 0) {
      const i = pick(rng, climbers)
      const board = stocks[i]!.board + 1
      change(i, { board })
      const [done, total] = promoted[board] ?? [0, 1]
      promoted[board] = [done + 1, Math.max(total, done + 1)]
    }
  }
  // 新首板：来一只刚封住的，满了先丢一只没涨停的或最低板里的。
  if (chance(rng, 0.2)) {
    arrivals += 1
    if (stocks.length >= MAX_STOCKS) {
      const drop = [...stocks.keys()].sort((a, b) => stocks[a]!.board - stocks[b]!.board).slice(0, 1)
      stocks = stocks.filter((_, i) => !drop.includes(i))
    }
    const name = NAMES[randomInt(rng, NAMES.length)]!
    stocks = [
      ...stocks,
      {
        code: String(603000 + arrivals * 7),
        name,
        change: 10,
        firstSeal: clock(arrivals),
        sealAmount: Math.round((0.3 + rng() * 1.2) * 1e8),
        opens: 0,
        industry: pick(rng, INDUSTRIES),
        status: 'sealed',
        board: 1,
      },
    ]
    const [done, total] = promoted[1] ?? [0, 0]
    promoted[1] = [done, total + 1]
  }
  return { stocks, promoted, arrivals }
}
