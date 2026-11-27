// SPDX-License-Identifier: MIT
/**
 * Pure model of DerivativesBoard (OKX 「交易数据」): the six card kinds, their data shapes, empty-state test, dual-axis tick alignment, long / short shares and basis.
 * 交易数据看板的纯函数：六种卡的数据形状、空态判断、左右双轴刻度对齐、多空占比与比值、基差。不碰 DOM、不读时钟。
 * 功能参照 OKX 永续页「添加组件 → 交易数据」（2026-11-26 在用户的 Chrome 里读，XartLab/KatanaUI#245）：六张卡各带周期按钮；画法与数据由调用方给。
 */
import { toneOf, type Tone } from '../../lib/chart/format/index.ts'
import { niceTicks, type Domain } from '../../lib/chart/series-geometry.ts'

/** The six cards, in the order OKX lists them. */
export const DERIVATIVES_KINDS = [
  'openInterestVolume',
  'fundingRate',
  'takerVolume',
  'longShortRatio',
  'topTraderRatio',
  'basis',
] as const

export type DerivativesKind = (typeof DERIVATIVES_KINDS)[number]

/** A value that may be missing; a missing value leaves a gap, it is never drawn as zero. */
export type Maybe = number | null | undefined

/** Open interest (line) and traded volume (bars), per bucket. */
export type OpenInterestVolumePoint = {
  /** Bucket time in milliseconds. */
  time: number
  /** Open interest at the end of the bucket. */
  openInterest: Maybe
  /** Volume traded in the bucket. */
  volume: Maybe
}
/** Funding rate of one settlement, in percent (0.01 means 0.01%). */
export type FundingRatePoint = {
  /** Settlement time in milliseconds. */
  time: number
  /** Rate in percent (0.01 means 0.01%). */
  rate: Maybe
}
/** Taker buy and sell volume of one bucket (both non-negative; the card mirrors sell below zero). */
export type TakerVolumePoint = {
  /** Bucket time in milliseconds. */
  time: number
  /** Taker buy volume. */
  buy: Maybe
  /** Taker sell volume. */
  sell: Maybe
}
/** Long and short side of one bucket: accounts or positions, any unit; only their proportion is drawn. */
export type LongShortPoint = {
  /** Bucket time in milliseconds. */
  time: number
  /** Long side (accounts or positions). */
  long: Maybe
  /** Short side, in the same unit as the long side. */
  short: Maybe
}
/** Contract price and index price of one bucket; the basis is their difference. */
export type BasisPoint = {
  /** Bucket time in milliseconds. */
  time: number
  /** Contract price. */
  contract: Maybe
  /** Index price. */
  index: Maybe
}

/** The series each card takes, from old to new. */
export type DerivativesData = {
  openInterestVolume: readonly OpenInterestVolumePoint[]
  fundingRate: readonly FundingRatePoint[]
  takerVolume: readonly TakerVolumePoint[]
  longShortRatio: readonly LongShortPoint[]
  topTraderRatio: readonly LongShortPoint[]
  basis: readonly BasisPoint[]
}

/** Which fields of a point say that the point has something to draw. */
const FIELDS: { [K in DerivativesKind]: readonly string[] } = {
  openInterestVolume: ['openInterest', 'volume'],
  fundingRate: ['rate'],
  takerVolume: ['buy', 'sell'],
  longShortRatio: ['long', 'short'],
  topTraderRatio: ['long', 'short'],
  basis: ['contract', 'index'],
}

const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/** Whether a card has anything to draw: at least one point with a finite value in a field of its kind. Empty and all-missing both give the card's empty state. */
export function hasData(kind: DerivativesKind, points: readonly object[] | null | undefined): boolean {
  if (!points) return false
  const fields = FIELDS[kind]
  return points.some((point) => fields.some((field) => finite((point as Record<string, unknown>)[field])))
}

/** Points of a card with the missing ones kept (gaps) but a stable, finite-or-null value per field. */
export const orNull = (value: Maybe): number | null => (finite(value) ? value : null)

/** Last finite value of a list, for the accessible summary; null when there is none. */
export function lastFinite(values: readonly Maybe[]): number | null {
  for (let i = values.length - 1; i >= 0; i--) if (finite(values[i])) return values[i] as number
  return null
}

/** Periods a card offers by default (ids; the words come from labels.periods). 照 OKX 永续交易页「交易数据」各卡的周期按钮（2026-11-26 在 okx.com/trade-swap/btc-usdt-swap 读）。 */
export const DEFAULT_PERIODS: { [K in DerivativesKind]: readonly string[] } = {
  openInterestVolume: ['5m', '15m', '1h', '4h', '1d'],
  fundingRate: ['7d', '14d'],
  takerVolume: ['5m', '15m', '1h', '4h', '1d'],
  longShortRatio: ['5m', '15m', '1h', '4h', '1d'],
  topTraderRatio: ['5m', '1h', '1d'],
  basis: ['1m', '5m', '1h', '4h', '1d'],
}

/** The period a card starts on when uncontrolled and none is given: the first of the periods it offers. */
export const defaultPeriodOf = (periods: readonly string[]): string | null => periods[0] ?? null

export type AxisSpec = { domain: Domain; ticks: readonly number[] }

/**
 * Two value axes that share one set of grid lines: both get the same number of ticks, so the right axis labels sit on the left axis' grid.
 * The shorter tick list is extended upward by whole steps (stays nice). With `lockLeft` the left axis is kept as it is (the 100% axis of a stacked card must not grow past 100):
 * the right one is recomputed with fewer ticks until it fits, then extended. If even the coarsest nice step leaves more ticks than the left axis has
 * (only when the left axis has very few), the right ticks are spread evenly over the data range instead: not round numbers, but still on the left grid lines and never clipping the data.
 * 左右双轴共用一套网格：两边刻度个数相同，右轴的字落在左轴的网格线上；少的那边按整步往上补。lockLeft：左轴不许动（百分比轴不能长过 100），右轴放粗到放得下再补；
 * 粗到头还是比左轴多（左轴刻度很少时才会）就把右轴的刻度在数据范围里均分：不是整数，但仍在左轴的网格线上，也不会切掉数据。
 */
export function alignedAxes(left: Domain, right: Domain, count = 4, lockLeft = false): [AxisSpec, AxisSpec] {
  const a = niceTicks(left[0], left[1], count)
  let b = niceTicks(right[0], right[1], count)
  if (lockLeft) {
    for (let want = count - 1; b.ticks.length > a.ticks.length && want >= 2; want--) {
      b = niceTicks(right[0], right[1], want)
    }
  }
  const extend = (spec: ReturnType<typeof niceTicks>, to: number): AxisSpec => {
    const ticks = [...spec.ticks]
    while (ticks.length < to) ticks.push(+(ticks[ticks.length - 1]! + spec.step).toFixed(10))
    return { domain: [ticks[0]!, ticks[ticks.length - 1]!], ticks }
  }
  if (lockLeft && b.ticks.length > a.ticks.length) {
    const [lo, hi] = right[1] > right[0] ? right : ([right[0] - 1, right[1] + 1] as Domain)
    const last = a.ticks.length - 1
    const even = Array.from({ length: a.ticks.length }, (_, i) => +(lo + ((hi - lo) * i) / last).toFixed(10))
    return [extend(a, a.ticks.length), { domain: [lo, hi], ticks: even }]
  }
  const n = lockLeft ? a.ticks.length : Math.max(a.ticks.length, b.ticks.length)
  return [extend(a, n), extend(b, n)]
}

/** A symmetric axis around zero that covers the largest absolute value: for signed bars (funding rate, mirrored volume, basis). All-zero or empty gives ±1. */
export function symmetricAxis(values: readonly Maybe[], count = 5): AxisSpec {
  const peak = values.reduce<number>((max, value) => (finite(value) ? Math.max(max, Math.abs(value)) : max), 0)
  const { domain, ticks } = niceTicks(-peak, peak, count)
  return { domain, ticks }
}

/** An axis that starts at zero and covers the largest value, for volumes. */
export function zeroBasedAxis(values: readonly Maybe[], count = 4): AxisSpec {
  const peak = values.reduce<number>((max, value) => (finite(value) ? Math.max(max, value) : max), 0)
  const { domain, ticks } = niceTicks(0, peak, count)
  return { domain, ticks }
}

/** An axis that hugs the data (not forced to zero), for prices and open interest. */
export function dataAxis(values: readonly Maybe[], count = 4): AxisSpec {
  const clean = values.filter(finite)
  const lo = clean.length ? Math.min(...clean) : 0
  const hi = clean.length ? Math.max(...clean) : 1
  const { domain, ticks } = niceTicks(lo, hi, count)
  return { domain, ticks }
}

/** Share of the long side, 0 to 1; null when either side is missing or negative, or both are zero. */
export function longShare(point: Pick<LongShortPoint, 'long' | 'short'>): number | null {
  const { long, short } = point
  if (!finite(long) || !finite(short) || long < 0 || short < 0 || long + short === 0) return null
  return long / (long + short)
}

/** Long / short ratio; null when the short side is missing or not positive. */
export function longShortRatioOf(point: Pick<LongShortPoint, 'long' | 'short'>): number | null {
  const { long, short } = point
  if (!finite(long) || !finite(short) || long < 0 || !(short > 0)) return null
  return long / short
}

/** Basis of one point: contract price minus index price; null when either price is missing. */
export function basisOf(point: Pick<BasisPoint, 'contract' | 'index'>): number | null {
  const { contract, index } = point
  return finite(contract) && finite(index) ? contract - index : null
}

/** Direction of a signed bar: positive up (rate: longs pay; basis: contract over index), negative down, zero flat. Colors are decided in CSS from this, so red-up themes swap on their own. */
export const signTone = (value: number): Tone => toneOf(value, 8)

/** Bar of a signed series: value, tone and the side of the zero line it sits on. A missing value has no bar. */
export function signedBars(values: readonly Maybe[]): { index: number; value: number; tone: Tone }[] {
  return values.flatMap((value, index) => (finite(value) ? [{ index, value, tone: signTone(value) }] : []))
}

/** A default time label: UTC `MM-DD HH:mm`. Callers that need their own zone pass formatTime. */
export function formatClock(time: number): string {
  const iso = new Date(time).toISOString()
  return `${iso.slice(5, 10)} ${iso.slice(11, 16)}`
}

/** Funding rate (percent) for a tick or tooltip: the sign is kept, trailing zeros are trimmed after four places (`+0.01%`, `-0.0253%`, `0%`). */
export function formatPercentTick(value: number): string {
  const at = Number(value.toFixed(4))
  return `${at > 0 ? '+' : ''}${at}%`
}

/** Three label positions under a plot: first, middle and last index (deduplicated for short series). */
export function timeLabelIndexes(count: number): number[] {
  if (count <= 0) return []
  const last = count - 1
  return [...new Set([0, Math.floor(last / 2), last])]
}
