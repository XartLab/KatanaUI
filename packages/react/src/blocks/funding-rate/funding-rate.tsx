// SPDX-License-Identifier: MIT
/**
 * Funding rate: current rate (signed and colored), countdown to the next settlement, predicted rate and a small bar chart of past rates.
 * 资金费率（#104 账户四件之一）：当前费率（正负着色，并写出谁付谁的文字）、下次结算倒计时、预测费率、历史费率小柱状图。
 * 结算时间由调用方传（毫秒时间戳），件里只算倒计时；`now` 可注入（测试、回放、固定截图），不传就每秒走一次系统时钟。
 * 费率是百分数（0.01 就是 0.01%）。读数复用 Lcd；柱子按历史里最大的绝对值归一，零线居中，正的在线上、负的在线下。
 */
import { useEffect, useState, type CSSProperties } from 'react'
import { cn } from '../../lib/cn.ts'
import { Lcd } from '../../katana/lcd.tsx'
import {
  countdownTo,
  formatCountdown,
  formatRate as defaultFormatRate,
  fundingBars,
  rateTone,
} from './funding-model.ts'

export type { FundingBar } from './funding-model.ts'

/** One past settlement. */
export type FundingPoint = {
  /** Settlement time in milliseconds. */
  time: number
  /** Rate in percent. */
  rate: number
}

/** Texts of FundingRate (the package ships no text). */
export type FundingRateLabels = {
  /** Accessible name of the whole card. 卡的读屏名。 */
  region: string
  current: string
  predicted: string
  nextSettlement: string
  history: string
  /** Who pays whom at the current rate (「多头付空头」), so direction does not rely on color. 谁付谁，方向不只靠颜色。 */
  payer: { up: string; down: string; flat: string }
  /** Text of the countdown when the settlement time has passed. 到点后倒计时处的字。 */
  due: string
  /** Title of one history bar (「11-22 00:00 +0.0100%」). 一根历史柱的悬停提示。 */
  bar: (point: FundingPoint, rate: string) => string
}

export type FundingRateProps = {
  /** Current rate in percent (0.01 means 0.01%). */
  rate: number
  /** Predicted rate of the next settlement, in percent; omit when unknown. */
  predictedRate?: number | null
  /** Next settlement time in milliseconds. */
  nextSettlement: number
  /** Clock in milliseconds; omit to follow the system clock once a second. */
  now?: number
  /** Past rates from old to new. */
  history?: readonly FundingPoint[]
  /** How a rate is written; defaults to a sign and four decimals (`+0.0100%`). */
  formatRate?: (rate: number) => string
  /** Texts. */
  labels: FundingRateLabels
  /** Extra class name on the root. */
  className?: string
}

/** 每秒走一次的钟；传了 now 就用调用方的，不起定时器。 */
function useClock(now: number | undefined): number {
  const [tick, setTick] = useState(() => Date.now())
  useEffect(() => {
    if (now !== undefined) return
    const timer = setInterval(() => setTick(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [now])
  return now ?? tick
}

export function FundingRate({
  rate,
  predictedRate,
  nextSettlement,
  now,
  history,
  formatRate = defaultFormatRate,
  labels,
  className,
}: FundingRateProps) {
  const clock = useClock(now)
  const countdown = countdownTo(nextSettlement, clock)
  const tone = rateTone(rate)
  const bars = fundingBars(history ?? [])
  const points = (history ?? []).filter((point) => Number.isFinite(point.rate))
  return (
    <section className={cn('k-fund', className)} data-slot="funding-rate" aria-label={labels.region}>
      <div className="k-fund-readouts">
        <div data-slot="funding-current" data-tone={tone}>
          <Lcd label={labels.current} value={formatRate(rate)} note={labels.payer[tone]} tone={tone} fill />
        </div>
        <div data-slot="funding-predicted">
          <Lcd
            label={labels.predicted}
            value={predictedRate === null || predictedRate === undefined ? null : formatRate(predictedRate)}
            tone={predictedRate === null || predictedRate === undefined ? 'neutral' : rateTone(predictedRate)}
            fill
          />
        </div>
        <div data-slot="funding-countdown" data-due={countdown.due ? 'true' : undefined}>
          <Lcd
            label={labels.nextSettlement}
            value={formatCountdown(countdown)}
            note={countdown.due ? labels.due : undefined}
            tone={countdown.due ? 'warn' : 'neutral'}
            fill
          />
        </div>
      </div>
      {bars.length > 0 ? (
        <figure className="k-fund-history" data-slot="funding-history">
          <figcaption className="k-fund-history-name">{labels.history}</figcaption>
          <div
            className="k-fund-bars"
            role="img"
            aria-label={labels.history}
            style={{ '--k-fund-n': bars.length } as CSSProperties}
          >
            {bars.map((bar, index) => (
              <span
                key={bar.time}
                className="k-fund-bar"
                data-slot="funding-bar"
                data-tone={bar.tone}
                title={labels.bar(points[index]!, formatRate(bar.rate))}
              >
                <i style={{ height: `${Math.abs(bar.ratio) * 50}%` }} />
              </span>
            ))}
          </div>
        </figure>
      ) : null}
    </section>
  )
}
