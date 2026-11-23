// SPDX-License-Identifier: MIT
/**
 * Pure model of FundingRate: countdown to the next settlement, direction of a rate and the scaling of the history bars.
 * 资金费率的纯函数：到下次结算的倒计时、费率方向、历史小柱的归一。时间由调用方传，这里不读时钟（件里的钟只在组件里，且可注入 now）。
 */
import { toneOf, type Tone } from '../../lib/chart/format/index.ts'
import { pad } from '../../lib/num.ts'

export type Countdown = {
  /** Milliseconds left, never negative. */
  remaining: number
  /** Whole hours left, not wrapped at 24. */
  hours: number
  /** Minutes left within the hour. */
  minutes: number
  /** Seconds left within the minute. */
  seconds: number
  /** The settlement time has been reached. */
  due: boolean
}

/** Time left from `now` to `target` (both milliseconds); passing the target gives zero and `due`. */
export function countdownTo(target: number, now: number): Countdown {
  const remaining = Number.isFinite(target) && Number.isFinite(now) ? Math.max(0, target - now) : 0
  const total = Math.floor(remaining / 1000)
  return {
    remaining,
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
    due: remaining === 0,
  }
}

/** HH:MM:SS; hours are not wrapped at 24, so a 100-hour wait reads 100:00:00. */
export function formatCountdown(countdown: Countdown): string {
  return `${pad(countdown.hours)}:${pad(countdown.minutes)}:${pad(countdown.seconds)}`
}

/** Direction of a rate: positive is up (longs pay shorts), negative is down; zero is flat. */
export const rateTone = (rate: number): Tone => toneOf(rate, 6)

export type FundingBar = {
  time: number
  rate: number
  /** Signed height, -1 to 1, of the largest absolute rate in the history. */
  ratio: number
  tone: Tone
}

/** History bars: each rate scaled by the largest absolute rate, so the biggest bar fills the half-height; non-finite values are dropped. */
export function fundingBars(history: readonly { time: number; rate: number }[]): FundingBar[] {
  const finite = history.filter((point) => Number.isFinite(point.rate))
  const peak = finite.reduce((max, point) => Math.max(max, Math.abs(point.rate)), 0)
  return finite.map((point) => ({
    time: point.time,
    rate: point.rate,
    ratio: peak > 0 ? point.rate / peak : 0,
    tone: rateTone(point.rate),
  }))
}

/** A rate in percent with a sign and fixed decimals: `+0.0100%`. */
export function formatRate(rate: number, digits = 4): string {
  const at = Number(rate.toFixed(digits))
  return `${at > 0 ? '+' : ''}${at === 0 ? (0).toFixed(digits) : at.toFixed(digits)}%`
}
