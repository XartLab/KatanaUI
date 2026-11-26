// SPDX-License-Identifier: MIT
/**
 * DerivativesCard: one card of the 「交易数据」 board (OKX perpetual page): title, info hint, its own period buttons and the plot of one `kind`.
 * 交易数据的一张卡：标题、信息提示、自己的周期按钮和一个 kind 的图。数据由调用方给（时间戳 + 数值的序列），没有数据显示这张卡自己的空态，不画假数。
 * 周期可受控（period + onPeriodChange）也可不受控（defaultPeriod）；切周期只回调，换数据是调用方的事。
 */
import { Info } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../../lib/cn.ts'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../primitives/tooltip.tsx'
import { ToggleGroup, ToggleGroupItem } from '../../primitives/toggle-group.tsx'
import { derivativesLabelsZh, type DerivativesLabels } from './derivatives-labels.ts'
import {
  DEFAULT_PERIODS,
  defaultPeriodOf,
  formatClock,
  hasData,
  type DerivativesData,
  type DerivativesKind,
} from './derivatives-model.ts'
import { buildSpec, defaultFormats, PlotArea, PlotLegend, type DerivativesFormats } from './derivatives-plots.tsx'

export type { DerivativesFormats } from './derivatives-plots.tsx'

/** Props every card shares, alone or inside the board. */
export type DerivativesCardCommon = {
  /** Period ids the buttons offer; defaults to 5m / 1h / 1d (7d / 14d for the funding rate). Words come from labels.periods. */
  periods?: readonly string[]
  /** Selected period (controlled). */
  period?: string
  /** Initial period when uncontrolled; the first of `periods` by default. */
  defaultPeriod?: string
  /** Called with the card's kind and the period just picked. */
  onPeriodChange?: (kind: DerivativesKind, period: string) => void
  /** Texts; the Simplified Chinese default is used when omitted. */
  labels?: DerivativesLabels
  /** Volumes and open interest; defaults to an English compact number. */
  formatAmount?: DerivativesFormats['formatAmount']
  /** Prices and basis; defaults to thousands separators and at most two decimals. */
  formatPrice?: DerivativesFormats['formatPrice']
  /** A bucket time in milliseconds; defaults to UTC `MM-DD HH:mm`. */
  formatTime?: DerivativesFormats['formatTime']
  /** Height of the plot area in px; 168 by default. */
  chartHeight?: number
  /** Extra class name on the card. */
  className?: string
}

export type DerivativesCardProps = {
  [K in DerivativesKind]: DerivativesCardCommon & {
    /** Which card to draw; it decides the shape of `data`. */
    kind: K
    /** The series of this card, old to new; missing, empty or all-missing shows the empty state. */
    data?: DerivativesData[K] | null
  }
}[DerivativesKind]

export function DerivativesCard(props: DerivativesCardProps) {
  const {
    kind,
    periods = DEFAULT_PERIODS[kind],
    period: periodProp,
    defaultPeriod,
    onPeriodChange,
    labels = derivativesLabelsZh,
    formatTime = formatClock,
    chartHeight = 168,
    className,
  } = props
  const formats = {
    ...defaultFormats(formatTime),
    ...(props.formatAmount && { formatAmount: props.formatAmount }),
    ...(props.formatPrice && { formatPrice: props.formatPrice }),
  }
  const [inner, setInner] = useState(defaultPeriod ?? defaultPeriodOf(periods))
  const period = periodProp ?? inner
  const { title, info } = labels.cards[kind]
  const data = props.data ?? []
  const filled = hasData(kind, data)
  // 判别联合在解构后收窄不住；这里 kind 与 data 同源，直接断言。
  const spec = filled
    ? buildSpec({ kind, data } as Parameters<typeof buildSpec>[0], labels, formats, chartHeight)
    : null

  return (
    <article
      className={cn('k-deriv-card', className)}
      data-slot="derivatives-card"
      data-kind={kind}
      data-empty={filled ? undefined : 'true'}
    >
      <TooltipProvider>
        <header className="k-deriv-head">
          <h3 className="k-deriv-title">{title}</h3>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="k-deriv-info"
                data-slot="derivatives-info"
                aria-label={labels.infoButton(title)}
              >
                <Info size={14} aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="k-deriv-info-tip">{info}</TooltipContent>
          </Tooltip>
          {periods.length > 0 && (
            <ToggleGroup
              size="sm"
              className="k-deriv-periods"
              data-slot="derivatives-periods"
              aria-label={labels.periodGroup(title)}
              value={period}
              onValueChange={(next) => {
                setInner(next)
                onPeriodChange?.(kind, next)
              }}
            >
              {periods.map((id) => (
                <ToggleGroupItem key={id} value={id}>
                  {labels.periods[id] ?? id}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          )}
        </header>
      </TooltipProvider>
      {spec ? (
        <>
          <PlotLegend legend={spec.legend} />
          <PlotArea spec={spec} title={title} labels={labels} formatTime={formats.formatTime} />
        </>
      ) : (
        <p className="k-deriv-empty" data-slot="derivatives-empty" role="status" style={{ minHeight: chartHeight }}>
          {labels.empty}
        </p>
      )}
    </article>
  )
}
