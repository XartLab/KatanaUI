// SPDX-License-Identifier: MIT
// 集合竞价台阶（AuctionStep，#110）的纯函数。09:15–09:25 的撮合价与匹配量按时刻排成台阶：价格在两个时刻之间保持不变，到下一个时刻才跳。
// 横轴只有这十分钟（时段表里的 auction 段），09:20 起不可撤单画一条分界。不带行情：点由调用方给。

import { CN_SESSIONS, parseClock } from './session.ts'

const AUCTION = CN_SESSIONS[0]!

/** 竞价开始 / 结束 / 起不可撤单（自 0 点起的分钟数）。 */
export const AUCTION_FROM = AUCTION.from
export const AUCTION_TO = AUCTION.to
export const AUCTION_CANCEL_CUTOFF = 9 * 60 + 20

export type AuctionPoint = {
  /** Clock time such as "09:15" or "09:21:30". */
  time: string
  /** Matched price; null drops the point. */
  price: number | null
  /** Matched volume (the unit is the caller's); null draws no bar. */
  volume?: number | null
}

export type AuctionStepPoint = { minutes: number; x: number; price: number; volume: number | null }

const clamp01 = (value: number) => Math.min(1, Math.max(0, value))

/** 时刻在竞价这十分钟里的位置，0 到 1。 */
export const auctionX = (minutes: number): number => clamp01((minutes - AUCTION_FROM) / (AUCTION_TO - AUCTION_FROM))

/**
 * 整理竞价点：丢掉时刻写不对、不在 09:15–09:25 内、价格取不到的点，按时刻排序（同一时刻后到的在后，台阶只认最后一个）。
 * 量取不到留 null，不写 0。
 */
export function auctionSteps(points: readonly AuctionPoint[] | null | undefined): AuctionStepPoint[] {
  if (!points) return []
  const steps: (AuctionStepPoint & { index: number })[] = []
  points.forEach((point, index) => {
    const minutes = parseClock(point.time)
    if (minutes === null || minutes < AUCTION_FROM || minutes > AUCTION_TO) return
    if (typeof point.price !== 'number' || !Number.isFinite(point.price)) return
    const volume = typeof point.volume === 'number' && Number.isFinite(point.volume) ? point.volume : null
    steps.push({ minutes, x: auctionX(minutes), price: point.price, volume, index })
  })
  steps.sort((a, b) => a.minutes - b.minutes || a.index - b.index)
  return steps.map(({ index: _index, ...step }) => step)
}

/** 价格区间：含昨收（给了就把参考线算进去）、上下各留一成；全平时给一个很窄的区间，台阶不贴边。 */
export function priceDomain(steps: readonly AuctionStepPoint[], prevClose?: number | null): [number, number] | null {
  const values = steps.map((step) => step.price)
  if (typeof prevClose === 'number' && Number.isFinite(prevClose)) values.push(prevClose)
  if (values.length === 0) return null
  const lo = Math.min(...values)
  const hi = Math.max(...values)
  const pad = (hi - lo) * 0.1 || Math.abs(hi) * 0.005 || 0.5
  return [lo - pad, hi + pad]
}

const fix = (n: number) => n.toFixed(2)

/**
 * 台阶折线：先横后竖（M x0 y0 H x1 V y1 …），价格在时刻之间不变，到下一个时刻才跳；最后一段停在最后一个点（不往右延伸，没到的时刻不画）。
 * 一个点也画一小段横线，免得整条线消失。
 */
export function stepPath(
  steps: readonly AuctionStepPoint[],
  domain: readonly [number, number],
  width: number,
  height: number,
): string {
  if (steps.length === 0) return ''
  const span = domain[1] - domain[0] || 1
  const y = (price: number) => height - ((price - domain[0]) / span) * height
  const x = (value: number) => value * width
  let d = `M${fix(x(steps[0]!.x))} ${fix(y(steps[0]!.price))}`
  for (let i = 1; i < steps.length; i++) {
    d += `H${fix(x(steps[i]!.x))}V${fix(y(steps[i]!.price))}`
  }
  const last = steps[steps.length - 1]!
  return steps.length === 1 ? `${d}H${fix(Math.min(width, x(last.x) + 4))}` : d
}

/** 一个点的价格纵坐标（给量柱以外的标记用）。 */
export const priceY = (price: number, domain: readonly [number, number], height: number): number =>
  height - ((price - domain[0]) / (domain[1] - domain[0] || 1)) * height

export type VolumeBar = { x: number; width: number; ratio: number }

/** 量柱：每个有量的点一根，宽度是到下一个点（或 09:25）的间隔，高度按最大量归一（0 到 1）。 */
export function volumeBars(steps: readonly AuctionStepPoint[]): VolumeBar[] {
  const max = Math.max(0, ...steps.map((step) => step.volume ?? 0))
  if (max <= 0) return []
  const bars: VolumeBar[] = []
  steps.forEach((step, index) => {
    if (step.volume === null) return
    const next = steps[index + 1]?.x ?? 1
    bars.push({ x: step.x, width: Math.max(0, next - step.x), ratio: step.volume / max })
  })
  return bars
}

export type AuctionSummary = {
  last: number | null
  /** 相对昨收的涨跌幅（百分数）；没有昨收或昨收为 0 是 null。 */
  change: number | null
  /** 最后一个点的匹配量；取不到是 null。 */
  volume: number | null
  tone: 'up' | 'down' | 'flat'
}

/** 读数：最新撮合价、相对昨收的涨跌幅、匹配量与方向（没有昨收就是 flat，不猜）。 */
export function auctionSummary(steps: readonly AuctionStepPoint[], prevClose?: number | null): AuctionSummary {
  const last = steps[steps.length - 1]
  if (!last) return { last: null, change: null, volume: null, tone: 'flat' }
  const base = typeof prevClose === 'number' && Number.isFinite(prevClose) && prevClose !== 0 ? prevClose : null
  const change = base === null ? null : ((last.price - base) / base) * 100
  const tone = change === null || change === 0 ? 'flat' : change > 0 ? 'up' : 'down'
  return { last: last.price, change, volume: last.volume, tone }
}
