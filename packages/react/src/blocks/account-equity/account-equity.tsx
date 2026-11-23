// SPDX-License-Identifier: MIT
/**
 * Account equity overview: total equity, available balance, used margin, unrealized PnL, a margin-ratio risk bar (safe / warn / danger, thresholds from the caller)
 * and an optional mini equity curve.
 * 账户权益概览（#104 账户四件之一）：总权益、可用、已用保证金、未实现盈亏四个读数，保证金率风险条（安全 / 警告 / 危险三段，阈值由调用方传，
 * 指针标出当前位置，档位写成文字），可选的迷你权益曲线。读数复用 Lcd，曲线复用 Sparkline，档位词复用 Tag；件只吃数，不连账户。
 */
import { cn } from '../../lib/cn.ts'
import { toneOf } from '../../lib/chart/format/index.ts'
import { Lcd } from '../../katana/lcd.tsx'
import { Tag } from '../../katana/tag.tsx'
import { Sparkline } from '../../quotes/sparkline.tsx'
import {
  defaultScaleMax,
  marginLevel,
  marginRatioOf,
  riskBands,
  riskPosition,
  type MarginLevel,
  type MarginThresholds,
} from './account-equity-model.ts'

export type { MarginLevel, MarginThresholds } from './account-equity-model.ts'

/** Texts of AccountEquity (the package ships no text). */
export type AccountEquityLabels = {
  /** Accessible name of the whole overview. 概览的读屏名。 */
  region: string
  equity: string
  available: string
  usedMargin: string
  unrealizedPnl: string
  marginRatio: string
  /** Level words next to the margin ratio. 档位词。 */
  level: Record<MarginLevel, string>
  /** Text under the bar at a threshold (「警告 ≥ 50%」). 风险条下阈值处的字。 */
  threshold: (level: 'warn' | 'danger', value: number, direction: 'higher' | 'lower') => string
  /** Accessible name of the equity curve. 权益曲线的读屏名。 */
  curve: string
}

export type AccountEquityProps = {
  /** Total equity. */
  equity: number
  /** Balance that can open new positions. */
  available: number
  /** Margin held by open positions and orders. */
  usedMargin: number
  /** Unrealized PnL of all positions. */
  unrealizedPnl: number
  /** Margin ratio in percent; defaults to usedMargin over equity. Give it when the exchange quotes its own ratio. */
  marginRatio?: number | null
  /** Risk thresholds of the margin ratio, in percent: { warn, danger, direction }. */
  thresholds: MarginThresholds
  /** Top of the risk bar in percent; defaults to 1.5 times the outer threshold. */
  scaleMax?: number
  /** Equity samples from old to new for the mini curve; omit for no curve. */
  curve?: readonly number[]
  /** Settlement currency shown under the readings (USDT). */
  currency?: string
  /** How a money amount is written; defaults to two decimals with grouping. */
  formatAmount?: (value: number) => string
  /** How the margin ratio is written; defaults to two decimals and a percent sign. */
  formatRatio?: (value: number) => string
  /** Texts. */
  labels: AccountEquityLabels
  /** Extra class name on the root. */
  className?: string
}

const defaultAmount = (value: number) =>
  value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const defaultRatio = (value: number) => `${value.toFixed(2)}%`

const LEVEL_TAG: Record<MarginLevel, 'ok' | 'warn' | 'danger'> = { safe: 'ok', warn: 'warn', danger: 'danger' }

export function AccountEquity({
  equity,
  available,
  usedMargin,
  unrealizedPnl,
  marginRatio,
  thresholds,
  scaleMax,
  curve,
  currency,
  formatAmount = defaultAmount,
  formatRatio = defaultRatio,
  labels,
  className,
}: AccountEquityProps) {
  const ratio = marginRatio === undefined ? marginRatioOf(usedMargin, equity) : marginRatio
  const level = marginLevel(ratio, thresholds)
  const max = scaleMax ?? defaultScaleMax(thresholds)
  const direction = thresholds.direction ?? 'higher'
  const position = riskPosition(ratio, max)
  const pnlTone = toneOf(unrealizedPnl)
  return (
    <section className={cn('k-acct', className)} data-slot="account-equity" aria-label={labels.region}>
      <div className="k-acct-readouts">
        <div data-slot="account-total">
          <Lcd label={labels.equity} value={formatAmount(equity)} note={currency} tone="accent" fill />
        </div>
        <div data-slot="account-available">
          <Lcd label={labels.available} value={formatAmount(available)} note={currency} fill />
        </div>
        <div data-slot="account-used">
          <Lcd label={labels.usedMargin} value={formatAmount(usedMargin)} note={currency} fill />
        </div>
        <div data-slot="account-pnl" data-tone={pnlTone}>
          <Lcd
            label={labels.unrealizedPnl}
            value={`${unrealizedPnl > 0 ? '+' : ''}${formatAmount(unrealizedPnl)}`}
            note={currency}
            tone={pnlTone}
            fill
          />
        </div>
      </div>
      <div className="k-acct-risk" data-slot="account-risk" data-level={level ?? 'none'}>
        <div className="k-acct-risk-head">
          <span className="k-acct-risk-name">{labels.marginRatio}</span>
          <span className="k-acct-risk-value" data-slot="account-ratio">
            {ratio === null ? '—' : formatRatio(ratio)}
          </span>
          {level ? (
            <Tag tone={LEVEL_TAG[level]} size="sm" data-slot="account-level">
              {labels.level[level]}
            </Tag>
          ) : null}
        </div>
        <div
          className="k-acct-track"
          role="img"
          aria-label={`${labels.marginRatio} ${ratio === null ? '—' : formatRatio(ratio)}`}
        >
          {riskBands(thresholds, max).map((band) => (
            <i
              key={band.level}
              className="k-acct-band"
              data-band={band.level}
              style={{ width: `${((band.to - band.from) / max) * 100}%` }}
            />
          ))}
          {position === null ? null : (
            <b className="k-acct-marker" data-slot="account-marker" style={{ left: `${position * 100}%` }} />
          )}
        </div>
        <div className="k-acct-scale">
          <span>
            {labels.threshold(
              direction === 'lower' ? 'danger' : 'warn',
              direction === 'lower' ? thresholds.danger : thresholds.warn,
              direction,
            )}
          </span>
          <span>
            {labels.threshold(
              direction === 'lower' ? 'warn' : 'danger',
              direction === 'lower' ? thresholds.warn : thresholds.danger,
              direction,
            )}
          </span>
        </div>
      </div>
      {curve && curve.length > 1 ? (
        <Sparkline
          className="k-acct-curve"
          values={curve}
          label={labels.curve}
          variant="area"
          showLast={false}
          height={56}
        />
      ) : null}
    </section>
  )
}
