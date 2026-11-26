// SPDX-License-Identifier: MIT
/**
 * DerivativesBoard: the 「交易数据」 board, a grid of up to six derivatives cards (OKX perpetual page, XartLab/KatanaUI#245).
 * 交易数据看板：六张卡的网格（持仓量及成交量、资金费率、主动买卖量、多空账户比、精英多空趋向、合约基差），每张自己的周期按钮。
 * 数据按卡给：缺哪张就显示那张的空态，不画假数。一行放几张由容器宽决定（每张最窄 minCardWidth）。
 */
import type { CSSProperties } from 'react'
import { cn } from '../../lib/cn.ts'
import { DerivativesCard, type DerivativesCardCommon } from './derivatives-card.tsx'
import { derivativesLabelsZh } from './derivatives-labels.ts'
import { DERIVATIVES_KINDS, type DerivativesData, type DerivativesKind } from './derivatives-model.ts'

export type DerivativesBoardProps = Omit<DerivativesCardCommon, 'periods' | 'period' | 'defaultPeriod'> & {
  /** The series of each card; a card with no entry (or an empty one) shows its own empty state. */
  data?: { [K in DerivativesKind]?: DerivativesData[K] | null }
  /** Which cards to draw and in what order; all six by default. */
  kinds?: readonly DerivativesKind[]
  /** Period ids each card offers, by kind; the defaults of the card where a kind is missing. */
  periods?: Partial<Record<DerivativesKind, readonly string[]>>
  /** Selected period of each card (controlled), by kind; a kind left out is uncontrolled. */
  period?: Partial<Record<DerivativesKind, string>>
  /** Initial period of each card when uncontrolled, by kind. */
  defaultPeriod?: Partial<Record<DerivativesKind, string>>
  /** Narrowest a card gets before the grid drops a column, in px; 360 by default. */
  minCardWidth?: number
}

export function DerivativesBoard({
  data = {},
  kinds = DERIVATIVES_KINDS,
  periods,
  period,
  defaultPeriod,
  minCardWidth = 360,
  labels = derivativesLabelsZh,
  className,
  ...common
}: DerivativesBoardProps) {
  return (
    <section
      className={cn('k-deriv', className)}
      data-slot="derivatives-board"
      aria-label={labels.region}
      style={{ '--k-deriv-min': `${minCardWidth}px` } as CSSProperties}
    >
      {kinds.map((kind) => (
        <DerivativesCard
          key={kind}
          {...({
            ...common,
            kind,
            data: data[kind],
            labels,
            periods: periods?.[kind],
            period: period?.[kind],
            defaultPeriod: defaultPeriod?.[kind],
          } as Parameters<typeof DerivativesCard>[0])}
        />
      ))}
    </section>
  )
}
