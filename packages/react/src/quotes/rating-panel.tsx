// SPDX-License-Identifier: MIT
// 技术评级三联（#150）：摆动指标、汇总、均线三个 RatingGauge 并排，汇总居中放大；上方周期切换，每个仪表下写卖出 / 中性 / 买入的个数，
// 悬停或键盘聚焦到一个仪表时浮出读数（分数与档位）。版式照 TradingView 品种页 Technicals 顶部的三个仪表（只取布局与交互，不嵌、不抄），
// 颜色走 Graphite 涨跌色与中性灰，不用 TradingView 蓝。只画不算：分数、个数、档位名、周期都由调用方传。
// 跟 TechnicalRating 的分工：那件是整页（明细表、枢轴点），这件只要三个仪表，放侧栏、报价头下面这种窄处。
import type { ReactNode } from 'react'
import { cn } from '../lib/cn.ts'
import { clamp, signed } from '../lib/num.ts'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group.tsx'
import { RatingGauge } from './rating-gauge.tsx'
import { ratingZone } from './rating-gauge-model.ts'

export type RatingPanelVerdict = 'sell' | 'neutral' | 'buy'

export type RatingPanelGauge = {
  /** Stable key of the gauge (DOM data-gauge), for example "oscillators", "summary" or "ma". */
  key: string
  /** Name above the gauge, for example "Oscillators"; also the accessible name. */
  label: string
  /** From -1 (strong sell) to +1 (strong buy); clamped, a non-finite number counts as 0 and reads as a dash. */
  score: number
  /** How many indicators say sell, neutral and buy. */
  counts: Readonly<Record<RatingPanelVerdict, number>>
}

export type RatingPanelTimeframe = {
  /** Value passed to onValueChange. */
  value: string
  /** Text on the switch, for example "1D". */
  label: string
}

export type RatingPanelLabels = {
  /** Names of the five zones from sell to buy (strong sell, sell, neutral, buy, strong buy). */
  zones: readonly [string, string, string, string, string]
  /** Words for the three counts under each gauge. */
  verdict: Readonly<Record<RatingPanelVerdict, string>>
  /** Accessible name of the whole panel, for example "Technical rating". */
  panel: string
  /** Accessible name of the timeframe switch, for example "Timeframe". */
  timeframe: string
}

export type RatingPanelProps = {
  /** The gauges from left to right, usually three: oscillators, summary and moving averages. */
  gauges: readonly RatingPanelGauge[]
  /** Zone names, count words and accessible names; the package has no built-in language. */
  labels: RatingPanelLabels
  /** Key of the gauge drawn larger; the middle one when omitted. */
  primary?: string
  /** Timeframe choices of the switch above the gauges; no switch when omitted or empty. */
  timeframes?: readonly RatingPanelTimeframe[]
  /** Selected timeframe value (controlled); the first one when omitted. */
  value?: string
  /** Called with the timeframe value when the switch changes. */
  onValueChange?: (value: string) => void
  /** How the hover readout writes a score; defaults to a signed number with two decimals ("+0.32"). */
  formatScore?: (score: number) => string
  /** Extra content under the gauges, for example a one-line disclaimer written by the caller. */
  footer?: ReactNode
  /** Extra class name on the root. */
  className?: string
}

const DASH = '—'
const VERDICTS = ['sell', 'neutral', 'buy'] as const

/** 读数里的分数：默认带正负号、两位小数；越界夹到 ±1，不是有限数写「—」。 */
export const ratingPanelScore = (score: number, format?: (score: number) => string): string =>
  Number.isFinite(score) ? (format ?? ((s) => signed(s, (abs) => abs.toFixed(2))))(clamp(score, -1, 1)) : DASH

/** 一个仪表给读屏的整句：「档位, 分数; 卖出 n, 中性 n, 买入 n」。 */
export function ratingPanelText(gauge: RatingPanelGauge, labels: RatingPanelLabels, score: string): string {
  const counts = VERDICTS.map((v) => `${labels.verdict[v]} ${gauge.counts[v]}`).join(', ')
  return `${labels.zones[ratingZone(gauge.score)]}, ${score}; ${counts}`
}

export function RatingPanel({
  gauges,
  labels,
  primary,
  timeframes,
  value,
  onValueChange,
  formatScore,
  footer,
  className,
}: RatingPanelProps) {
  const primaryKey =
    gauges.find((g) => g.key === primary)?.key ?? gauges[Math.floor((gauges.length - 1) / 2)]?.key ?? null
  return (
    <div className={cn('k-rpanel', className)} data-slot="rating-panel" role="group" aria-label={labels.panel}>
      {timeframes && timeframes.length > 0 ? (
        <div className="k-rpanel-bar" data-slot="rating-panel-timeframe">
          <ToggleGroup
            size="sm"
            aria-label={labels.timeframe}
            value={value ?? timeframes[0]!.value}
            onValueChange={(next) => next && onValueChange?.(next)}
          >
            {timeframes.map((tf) => (
              <ToggleGroupItem key={tf.value} value={tf.value}>
                {tf.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      ) : null}
      <div className="k-rpanel-gauges">
        {gauges.map((gauge) => {
          const zone = ratingZone(gauge.score)
          const score = ratingPanelScore(gauge.score, formatScore)
          return (
            // 一个仪表就是一个 meter：可聚焦，读屏读整句（档位、分数、三个个数）；里面的图与字对读屏是表现性的。
            <div
              key={gauge.key}
              className={cn('k-rpanel-cell', gauge.key === primaryKey && 'is-primary')}
              data-slot="rating-panel-gauge"
              data-gauge={gauge.key}
              data-zone={zone}
              role="meter"
              tabIndex={0}
              aria-label={gauge.label}
              aria-valuemin={-1}
              aria-valuemax={1}
              aria-valuenow={Number.isFinite(gauge.score) ? clamp(gauge.score, -1, 1) : 0}
              aria-valuetext={ratingPanelText(gauge, labels, score)}
            >
              <span className="k-rpanel-name">{gauge.label}</span>
              <RatingGauge score={gauge.score} zones={labels.zones} label={gauge.label}>
                {VERDICTS.map((v) => (
                  <span key={v} className="k-rpanel-count" data-verdict={v}>
                    <small>{labels.verdict[v]}</small>
                    <b>{gauge.counts[v]}</b>
                  </span>
                ))}
              </RatingGauge>
              <span className="k-rpanel-readout" data-slot="rating-panel-readout" aria-hidden="true">
                <b>{score}</b>
                <span>{labels.zones[zone]}</span>
              </span>
            </div>
          )
        })}
      </div>
      {footer ? <div className="k-rpanel-footer">{footer}</div> : null}
    </div>
  )
}
